const { Router } = require('express');
const multer = require('multer');
const publicTokenMiddleware = require('../../middlewares/publicTokenMiddleware');
const controller = require('./uploads.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

const { publicUploadLimiter } = require('../../middlewares/rateLimiter');

const router = Router();

async function show(req, res, next) {
  try {
    const data = await controller.showChecklist(req.docRequest);
    return res.json(data);
  } catch (e) {
    return next(e);
  }
}

async function uploadHandler(req, res, next) {
  try {
    const item = await controller.uploadFile(req.docRequest, req.params.itemId, req.file);
    return res.status(201).json(item);
  } catch (e) {
    return next(e);
  }
}

router.get('/requests/:token', publicTokenMiddleware, show);
router.post(
  '/requests/:token/items/:itemId/upload',
  publicUploadLimiter,
  publicTokenMiddleware,
  upload.single('file'),
  uploadHandler
);

module.exports = router;
