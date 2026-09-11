const express = require('express');
const { markAttendance, batchAttendance, myAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.post('/', authorize('admin', 'teacher'), markAttendance);
router.get('/batch/:id', batchAttendance);
router.get('/my', authorize('student'), myAttendance);

module.exports = router;
