const { z } = require('zod');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
});

// PUT /profile
async function updateProfile(req, res, next) {
  try {
    const parsed = updateSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(req.user._id, parsed, {
      new: true,
      runValidators: true,
    });
    sendResponse(res, 200, true, { user: user.toSafeObject() }, 'Profile updated');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.issues.map((i) => i.message).join(', '), 400));
    }
    next(err);
  }
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

// PUT /profile/password
async function changePassword(req, res, next) {
  try {
    const parsed = passwordSchema.parse(req.body);
    const user = await User.findById(req.user._id).select('+password');
    const match = await user.comparePassword(parsed.currentPassword);
    if (!match) throw new AppError('Current password is incorrect', 401);

    user.password = parsed.newPassword;
    await user.save();

    sendResponse(res, 200, true, null, 'Password changed successfully');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.issues.map((i) => i.message).join(', '), 400));
    }
    next(err);
  }
}

module.exports = { updateProfile, changePassword };
