const express = require('express');
const {
  enrollStudent,
  removeEnrollment,
  myEnrollments,
  batchEnrollments,
} = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.post('/', authorize('admin', 'teacher'), enrollStudent);
router.delete('/:id', authorize('admin', 'teacher'), removeEnrollment);
router.get('/my', authorize('student'), myEnrollments);
router.get('/batch/:batchId', authorize('admin', 'teacher'), batchEnrollments);

module.exports = router;