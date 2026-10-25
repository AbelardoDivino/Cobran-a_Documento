const Workspace = require('../../models/Workspace');
const Membership = require('../../models/Membership');
const User = require('../../models/User');
const Subscription = require('../../models/Subscription');

const LIMITS = {
  begin: { members: 1 },
  pro: { members: 10 },
};

// Pro só vale com assinatura ativa dentro do período pago.
async function enforceExpiry(workspace) {
  if (!workspace || workspace.tier !== 'pro') return workspace;
  const sub = await Subscription.findOne({
    contadorId: workspace.ownerId,
    status: 'active',
  }).sort({ createdAt: -1 });
  const valid = sub?.currentPeriodEnd && sub.currentPeriodEnd.getTime() > Date.now();
  if (valid) return workspace;
  if (sub) {
    sub.status = 'canceled';
    await sub.save();
  }
  workspace.tier = 'begin';
  await workspace.save();
  return workspace;
}

async function findActiveMembership(userId) {
  return Membership.findOne({ userId, status: 'active' }).sort({ createdAt: 1 });
}

async function findWorkspaceById(id) {
  const workspace = await Workspace.findById(id);
  if (!workspace) {
    const err = new Error('Workspace não encontrado');
    err.status = 404;
    throw err;
  }
  return workspace;
}

async function createForOwner(user) {
  const workspace = await Workspace.create({
    name: user.officeName || `Finanças de ${user.name.split(' ')[0]}`,
    ownerId: user._id,
    tier: 'begin',
  });
  await Membership.create({
    workspaceId: workspace._id,
    userId: user._id,
    email: user.email,
    name: user.name,
    role: 'owner',
    status: 'active',
  });
  return workspace;
}

// Aceita convites pendentes pelo e-mail e garante que todo usuário tenha um workspace.
async function ensureUserContext(user) {
  const invited = await Membership.find({
    email: user.email,
    status: 'invited',
    userId: null,
  }).sort({ createdAt: 1 });

  // Só aceita convite de e-mail confirmado (evita tomar conta de e-mail alheio).
  for (const invite of user.emailVerified ? invited : []) {
    invite.userId = user._id;
    invite.status = 'active';
    if (!invite.name) invite.name = user.name;
    // eslint-disable-next-line no-await-in-loop
    await invite.save();
  }

  let membership = await findActiveMembership(user._id);
  if (!membership) {
    const workspace = await createForOwner(user);
    membership = await Membership.findOne({ workspaceId: workspace._id, userId: user._id });
  }
  return { membership, workspace: await findWorkspaceById(membership.workspaceId) };
}

async function getContext(userId) {
  const membership = await findActiveMembership(userId);
  if (!membership) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('Usuário não encontrado');
      err.status = 404;
      throw err;
    }
    const context = await ensureUserContext(user);
    return { membership: context.membership, workspace: await enforceExpiry(context.workspace) };
  }
  const workspace = await findWorkspaceById(membership.workspaceId);
  return { membership, workspace: await enforceExpiry(workspace) };
}

async function listMembers(workspaceId) {
  return Membership.find({ workspaceId }).sort({ role: 1, createdAt: 1 });
}

async function getWorkspaceView(userId) {
  const { membership, workspace } = await getContext(userId);
  const members = await listMembers(workspace._id);
  const limit = LIMITS[workspace.tier]?.members ?? LIMITS.begin.members;
  return {
    workspace: {
      id: workspace._id,
      name: workspace.name,
      tier: workspace.tier,
      ownerId: workspace.ownerId,
    },
    me: { role: membership.role, membershipId: membership._id },
    limits: { members: limit, banks: null },
    members: members.map((m) => ({
      id: m._id,
      name: m.name,
      email: m.email,
      role: m.role,
      status: m.status,
    })),
  };
}

function assertOwner(membership) {
  if (membership.role !== 'owner') {
    const err = new Error('Somente o dono do workspace pode fazer isso');
    err.status = 403;
    throw err;
  }
}

async function inviteMember(userId, { email, name }) {
  const { membership, workspace } = await getContext(userId);
  assertOwner(membership);

  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    const err = new Error('E-mail inválido');
    err.status = 400;
    throw err;
  }

  const limit = LIMITS[workspace.tier]?.members ?? LIMITS.begin.members;
  const current = await Membership.countDocuments({ workspaceId: workspace._id });
  if (current >= limit) {
    const err = new Error(
      workspace.tier === 'begin'
        ? 'O plano Begin permite apenas 1 pessoa. Faça upgrade para o Pro (até 10).'
        : `O plano Pro permite até ${limit} pessoas.`
    );
    err.status = 403;
    throw err;
  }

  const existing = await Membership.findOne({ workspaceId: workspace._id, email: normalized });
  if (existing) {
    const err = new Error('Essa pessoa já está no workspace');
    err.status = 409;
    throw err;
  }

  const account = await User.findOne({ email: normalized });
  const verified = Boolean(account && account.emailVerified);
  return Membership.create({
    workspaceId: workspace._id,
    userId: verified ? account._id : null,
    email: normalized,
    name: name || (account ? account.name : ''),
    role: 'member',
    status: verified ? 'active' : 'invited',
  });
}

async function removeMember(userId, membershipId) {
  const { membership, workspace } = await getContext(userId);
  assertOwner(membership);

  const target = await Membership.findOne({ _id: membershipId, workspaceId: workspace._id });
  if (!target) {
    const err = new Error('Membro não encontrado');
    err.status = 404;
    throw err;
  }
  if (target.role === 'owner') {
    const err = new Error('Não é possível remover o dono do workspace');
    err.status = 400;
    throw err;
  }
  await target.deleteOne();
  return { removed: true };
}

async function setTier(userId, tier) {
  const { membership, workspace } = await getContext(userId);
  assertOwner(membership);
  if (!LIMITS[tier]) {
    const err = new Error('Plano inválido');
    err.status = 400;
    throw err;
  }
  if (tier === 'begin') {
    const current = await Membership.countDocuments({ workspaceId: workspace._id });
    if (current > LIMITS.begin.members) {
      const err = new Error('Remova os membros extras antes de voltar para o Begin');
      err.status = 409;
      throw err;
    }
  }
  workspace.tier = tier;
  await workspace.save();
  return getWorkspaceView(userId);
}

// Muda o plano do workspace do dono. Usado pelo fluxo de pagamento (webhook/checkout).
async function setTierForUser(userId, tier) {
  if (!LIMITS[tier]) {
    const err = new Error('Plano inválido');
    err.status = 400;
    throw err;
  }
  const workspace = await Workspace.findOne({ ownerId: userId });
  if (!workspace) return null;
  workspace.tier = tier;
  await workspace.save();
  return workspace;
}

module.exports = {
  LIMITS,
  setTierForUser,
  ensureUserContext,
  getContext,
  getWorkspaceView,
  inviteMember,
  removeMember,
  setTier,
  assertOwner,
};
