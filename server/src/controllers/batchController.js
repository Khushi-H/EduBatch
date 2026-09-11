const { z } = require('zod');
const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

const batchSchema = z.object({
  name: z.string().min(2),
  subject: z.string().min(1),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  schedule: z
    .object({
      days: z.array(z.string()).optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
    })
    .optional(),
  capacity: z.coerce.number().int().positive(),
  fee: z.coerce.number().nonnegative(),
  teacher: z.string().optional().nullable(),
});

// GET /batches
async function listBatches(req, res, next) {
  try {
    const { status, teacher } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (teacher) filter.teacher = teacher;

    // Teachers only see their own batches by default
    if (req.user.role === 'teacher' && !teacher) {
      filter.teacher = req.user._id;
    }

    const batches = await Batch.find(filter)
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    sendResponse(res, 200, true, { batches }, 'Batches fetched');
  } catch (err) {
    next(err);
  }
}

// GET /batches/:id
async function getBatch(req, res, next) {
  try {
    const batch = await Batch.findById(req.params.id).populate('teacher', 'name email');
    if (!batch) throw new AppError('Batch not found', 404);

    const enrolledCount = await Enrollment.countDocuments({
      batch: batch._id,
      isActive: true,
    });

    sendResponse(res, 200, true, { batch, enrolledCount }, 'Batch fetched');
  } catch (err) {
    next(err);
  }
}

// POST /batches (admin only)
async function createBatch(req, res, next) {
  try {
    const parsed = batchSchema.parse(req.body);
    if (parsed.endDate < parsed.startDate) {
      throw new AppError('endDate must be after startDate', 400);
    }
    const batch = await Batch.create({
      ...parsed,
      createdBy: req.user._id,
    });
    sendResponse(res, 201, true, { batch }, 'Batch created');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.issues.map((i) => i.message).join(', '), 400));
    }
    next(err);
  }
}

// PUT /batches/:id (admin only)
async function updateBatch(req, res, next) {
  try {
    const parsed = batchSchema.partial().parse(req.body);
    const batch = await Batch.findByIdAndUpdate(req.params.id, parsed, {
      new: true,
      runValidators: true,
    });
    if (!batch) throw new AppError('Batch not found', 404);
    sendResponse(res, 200, true, { batch }, 'Batch updated');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.issues.map((i) => i.message).join(', '), 400));
    }
    next(err);
  }
}

// PATCH /batches/:id/status (admin only)
async function changeStatus(req, res, next) {
  try {
    const schema = z.object({ status: z.enum(['upcoming', 'active', 'archived']) });
    const { status } = schema.parse(req.body);
    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!batch) throw new AppError('Batch not found', 404);
    sendResponse(res, 200, true, { batch }, 'Batch status updated');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.issues.map((i) => i.message).join(', '), 400));
    }
    next(err);
  }
}

// DELETE /batches/:id (admin only) - soft archive
async function archiveBatch(req, res, next) {
  try {
    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      { status: 'archived' },
      { new: true }
    );
    if (!batch) throw new AppError('Batch not found', 404);
    sendResponse(res, 200, true, { batch }, 'Batch archived');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listBatches,
  getBatch,
  createBatch,
  updateBatch,
  changeStatus,
  archiveBatch,
};
