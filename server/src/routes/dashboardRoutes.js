const express = require('express');
const { adminDashboard, teacherDashboard, studentDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.get('/admin', authorize('admin'), adminDashboard);
router.get('/teacher', authorize('teacher'), teacherDashboard);
router.get('/student', authorize('student'), studentDashboard);

module.exports = router;
