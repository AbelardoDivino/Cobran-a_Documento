const service = require('./workspace.service');

async function overview(req, res, next) {
  try {
    return res.json(await service.getWorkspaceView(req.user.id));
  } catch (e) {
    return next(e);
  }
}

async function invite(req, res, next) {
  try {
    const member = await service.inviteMember(req.user.id, req.body);
    return res.status(201).json(member);
  } catch (e) {
    return next(e);
  }
}

async function removeMember(req, res, next) {
  try {
    return res.json(await service.removeMember(req.user.id, req.params.membershipId));
  } catch (e) {
    return next(e);
  }
}

async function setTier(req, res, next) {
  try {
    return res.json(await service.setTier(req.user.id, req.body.tier));
  } catch (e) {
    return next(e);
  }
}

module.exports = { overview, invite, removeMember, setTier };
