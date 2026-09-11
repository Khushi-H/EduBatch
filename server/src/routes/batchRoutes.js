const express = require('express');
const {
  listBatches,
  getBatch,
  createBatch,
  updateBatch,
  changeStatus,
  archiveBatch,
} = require('../controllers/batchController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.get('/', listBatches);
router.get('/:id', getBatch);
router.post('/', authorize('admin'), createBatch);
router.put('/:id', authorize('admin'), updateBatch);
router.patch('/:id/status', authorize('admin'), changeStatus);
router.delete('/:id', authorize('admin'), archiveBatch);

module.exports = router;
