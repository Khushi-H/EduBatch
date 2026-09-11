const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register,
  registerStaff,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  getMe,
  listTeachers,
  listStudents,
  listStaff,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: (Number(process.env.AUTH_RATE_LIMIT_WINDOW_MIN) || 15) * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  message: {
    success: false,
    data: null,
    message: 'Too many attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, register);
router.post('/register-staff', protect, authorize('admin'), registerStaff);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', protect, getMe);
router.get('/teachers', protect, authorize('admin'), listTeachers);
router.get('/students', protect, authorize('admin', 'teacher'), listStudents);
router.get('/staff', protect, authorize('admin'), listStaff);

module.exports = router;