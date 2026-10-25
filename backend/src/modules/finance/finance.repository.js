const Account = require('../../models/Account');
const Transaction = require('../../models/Transaction');

async function listAccounts(workspaceId, { includeArchived = false } = {}) {
  const filter = { workspaceId };
  if (!includeArchived) filter.archived = false;
  return Account.find(filter).sort({ createdAt: 1 });
}

async function getAccount(workspaceId, accountId) {
  const account = await Account.findOne({ _id: accountId, workspaceId });
  if (!account) {
    const err = new Error('Conta não encontrada');
    err.status = 404;
    throw err;
  }
  return account;
}

async function createAccount(workspaceId, data) {
  return Account.create({ ...data, workspaceId });
}

async function updateAccount(workspaceId, accountId, data) {
  const account = await getAccount(workspaceId, accountId);
  Object.assign(account, data);
  await account.save();
  return account;
}

async function archiveAccount(workspaceId, accountId) {
  const account = await getAccount(workspaceId, accountId);
  account.archived = true;
  await account.save();
  return { archived: true };
}

async function insertTransactions(docs) {
  if (!docs.length) return { inserted: 0, duplicates: 0 };
  try {
    const created = await Transaction.insertMany(docs, { ordered: false });
    return { inserted: created.length, duplicates: 0 };
  } catch (e) {
    const writeErrors = e?.writeErrors || [];
    const duplicates = writeErrors.filter((w) => w?.code === 11000 || w?.err?.code === 11000).length;
    if (!writeErrors.length) throw e;
    if (duplicates !== writeErrors.length) throw e;
    return { inserted: docs.length - duplicates, duplicates };
  }
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFilter(workspaceId, query = {}) {
  const filter = { workspaceId };
  if (query.accountId) filter.accountId = query.accountId;
  if (query.category) filter.category = query.category;
  if (query.type) filter.type = query.type;
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = query.from;
    if (query.to) filter.date.$lte = query.to;
  }
  if (query.q) filter.description = { $regex: escapeRegex(query.q), $options: 'i' };
  return filter;
}

async function listTransactions(workspaceId, query = {}) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(query.limit || '50', 10)));
  const filter = buildFilter(workspaceId, query);
  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('accountId', 'name bank'),
    Transaction.countDocuments(filter),
  ]);
  return {
    items,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function deleteTransaction(workspaceId, id) {
  const result = await Transaction.deleteOne({ _id: id, workspaceId });
  if (!result.deletedCount) {
    const err = new Error('Lançamento não encontrado');
    err.status = 404;
    throw err;
  }
  return { deleted: true };
}

async function summary(workspaceId, { from, to }) {
  const match = { workspaceId, date: { $gte: from, $lte: to } };

  const [totals, byCategory, byAccount, monthly, accountBalances] = await Promise.all([
    Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { ...match, type: 'out' } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]),
    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$accountId',
          in: { $sum: { $cond: [{ $eq: ['$type', 'in'] }, '$amount', 0] } },
          out: { $sum: { $cond: [{ $eq: ['$type', 'out'] }, '$amount', 0] } },
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { workspaceId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          in: { $sum: { $cond: [{ $eq: ['$type', 'in'] }, '$amount', 0] } },
          out: { $sum: { $cond: [{ $eq: ['$type', 'out'] }, '$amount', 0] } },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 6 },
    ]),
    Transaction.aggregate([
      { $match: { workspaceId } },
      {
        $group: {
          _id: '$accountId',
          in: { $sum: { $cond: [{ $eq: ['$type', 'in'] }, '$amount', 0] } },
          out: { $sum: { $cond: [{ $eq: ['$type', 'out'] }, '$amount', 0] } },
        },
      },
    ]),
  ]);

  const income = totals.find((t) => t._id === 'in')?.total || 0;
  const expense = totals.find((t) => t._id === 'out')?.total || 0;

  const accounts = await Account.find({ workspaceId, archived: false }).sort({ createdAt: 1 });
  const balanceMap = new Map(accountBalances.map((b) => [String(b._id), b]));
  const accountView = accounts.map((a) => {
    const agg = balanceMap.get(String(a._id)) || { in: 0, out: 0 };
    return {
      id: a._id,
      name: a.name,
      bank: a.bank,
      type: a.type,
      initialBalance: a.initialBalance,
      in: agg.in,
      out: agg.out,
      balance: a.initialBalance + agg.in - agg.out,
      period: (byAccount.find((b) => String(b._id) === String(a._id)) || { in: 0, out: 0 }),
    };
  });

  return {
    period: { from, to },
    totals: {
      income,
      expense,
      net: income - expense,
      balance: accountView.reduce((acc, a) => acc + a.balance, 0),
    },
    byCategory: byCategory.map((c) => ({ category: c._id, total: c.total, count: c.count })),
    byAccount: accountView.map((a) => ({
      id: a.id,
      name: a.name,
      in: a.period.in,
      out: a.period.out,
    })),
    monthly: monthly
      .slice()
      .sort((a, b) => (a._id < b._id ? -1 : 1))
      .map((m) => ({ month: m._id, in: m.in, out: m.out })),
    accounts: accountView.map((a) => ({
      id: a.id,
      name: a.name,
      bank: a.bank,
      type: a.type,
      balance: a.balance,
    })),
  };
}

module.exports = {
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  archiveAccount,
  insertTransactions,
  listTransactions,
  deleteTransaction,
  summary,
};
