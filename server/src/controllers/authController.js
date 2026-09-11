const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  // Only an already-authenticated admin can set role via /auth/register-staff.
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// POST /auth/register - always creates a student (public self-signup)
async function register(req, res, next) {
  try {
    const parsed = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: parsed.email });
    if (existing) throw new AppError('Email is already registered', 409);

    const user = await User.create({
      name: parsed.name,
      email: parsed.email,
      password: parsed.password,
      phone: parsed.phone || '',
      role: 'student',
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    sendResponse(res, 201, true, {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    }, 'Registered successfully');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.issues.map((i) => i.message).join(', '), 400));
    }
    next(err);
  }
}

// POST /auth/register-staff - admin only, can create teacher/admin accounts
async function registerStaff(req, res, next) {
  try {
    const schema = registerSchema.extend({
      role: z.enum(['admin', 'teacher', 'student']),
    });
    const parsed = schema.parse(req.body);
    const existing = await User.findOne({ email: parsed.email });
    if (existing) throw new AppError('Email is already registered', 409);

    const user = await User.create({
      name: parsed.name,
      email: parsed.email,
      password: parsed.password,
      phone: parsed.phone || '',
      role: parsed.role,
    });

    sendResponse(res, 201, true, { user: user.toSafeObject() }, 'Staff user created');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.issues.map((i) => i.message).join(', '), 400));
    }
    next(err);
  }
}

// POST /auth/login
async function login(req, res, next) {
  try {
    const parsed = loginSchema.parse(req.body);
    const user = await User.findOne({ email: parsed.email }).select('+password');
    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', 401);
    }
    const match = await user.comparePassword(parsed.password);
    if (!match) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    sendResponse(res, 200, true, {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    }, 'Login successful');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.issues.map((i) => i.message).join(', '), 400));
    }
    next(err);
  }
}

// POST /auth/refresh
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Refresh token is required', 400);

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) throw new AppError('User not found or inactive', 401);

    const accessToken = generateAccessToken(user);
    sendResponse(res, 200, true, { accessToken }, 'Token refreshed');
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired refresh token', 401));
    }
    next(err);
  }
}

// POST /auth/forgot-password
async function forgotPassword(req, res, next) {
  try {
    const parsed = forgotSchema.parse(req.body);
    const user = await User.findOne({ email: parsed.email });
    // Do not reveal whether the email exists
    if (!user) {
      return sendResponse(res, 200, true, null, 'If that email exists, a reset link has been sent');
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'EduBatch - Password Reset',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });

    sendResponse(res, 200, true, null, 'If that email exists, a reset link has been sent');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.issues.map((i) => i.message).join(', '), 400));
    }
    next(err);
  }
}

// POST /auth/reset-password
async function resetPassword(req, res, next) {
  try {
    const parsed = resetSchema.parse(req.body);
    const hashed = crypto.createHash('sha256').update(parsed.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) throw new AppError('Invalid or expired reset token', 400);

    user.password = parsed.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    sendResponse(res, 200, true, null, 'Password reset successful');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.issues.map((i) => i.message).join(', '), 400));
    }
    next(err);
  }
}

// GET /auth/me
async function getMe(req, res) {
  sendResponse(res, 200, true, { user: req.user.toSafeObject() }, 'Current user');
}

// GET /auth/teachers - admin only, used to populate the teacher-assignment
// dropdown when creating/editing a batch (docs: "Teacher assignment")
async function listTeachers(req, res, next) {
  try {
    const teachers = await User.find({ role: 'teacher', isActive: true }).select('name email');
    sendResponse(res, 200, true, { teachers }, 'Teachers fetched');
  } catch (err) {
    next(err);
  }
}

// GET /auth/students - admin/teacher only, used to populate the student
// picker on the "Enroll Student" form (replaces manual Mongo _id paste)
async function listStudents(req, res, next) {
  try {
    const students = await User.find({ role: 'student', isActive: true })
      .select('name email phone')
      .sort({ name: 1 });
    sendResponse(res, 200, true, { students }, 'Students fetched');
  } catch (err) {
    next(err);
  }
}

// GET /auth/staff - admin only, lists all teacher + admin accounts for the
// "Manage Staff" screen (docs Section 4: "Admin: manage users")
async function listStaff(req, res, next) {
  try {
    const staff = await User.find({ role: { $in: ['admin', 'teacher'] } })
      .select('name email role phone isActive createdAt')
      .sort({ createdAt: -1 });
    sendResponse(res, 200, true, { staff }, 'Staff fetched');
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};