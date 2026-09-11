const express = require('express');
const { createNotice, listNotices } = require('../controllers/noticeController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.post('/', authorize('admin', 'teacher'), createNotice);
router.get('/', listNotices);

module.exports = router;
