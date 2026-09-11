const { z } = require('zod');
const Notice = require('../models/Notice');
const Enrollment = require('../models/Enrollment');
const Batch = require('../models/Batch');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

const noticeSchema = z.object({
  batchId: z.string().optional().nullable(),
  title: z.string().min(2),
  body: z.string().min(1),
  pinned: z.boolean().optional(),
});

// POST /notices (teacher/admin)
async function createNotice(req, res, next) {
  try {
    const parsed = noticeSchema.parse(req.body);

    if (parsed.batchId) {
      const batch = await Batch.findById(parsed.batchId);
      if (!batch) throw new AppError('Batch not found', 404);
      if (req.user.role === 'teacher' && String(batch.teacher) !== String(req.user._id)) {
        throw new AppError('You can only post notices for your own batch', 403);
      }
    } else if (req.user.role !== 'admin') {
      throw new AppError('Only admin can post global notices', 403);
    }

    const notice = await Notice.create({
      batch: parsed.batchId || null,
      title: parsed.title,
      body: parsed.body,
      pinned: parsed.pinned || false,
      createdBy: req.user._id,
    });

    sendResponse(res, 201, true, { notice }, 'Notice created');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.issues.map((i) => i.message).join(', '), 400));
    }
    next(err);
  }
}

// GET /notices (filter by batch, role-aware)
async function listNotices(req, res, next) {
  try {
    const { batchId } = req.query;
    let filter = {};

    if (batchId) {
      filter = { batch: batchId };
    } else if (req.user.role === 'student') {
      const enrollments = await Enrollment.find({ student: req.user._id, isActive: true });
      const batchIds = enrollments.map((e) => e.batch);
      filter = { $or: [{ batch: { $in: batchIds } }, { batch: null }] };
    } else if (req.user.role === 'teacher') {
      const batches = await Batch.find({ teacher: req.user._id });
      const batchIds = batches.map((b) => b._id);
      filter = { $or: [{ batch: { $in: batchIds } }, { batch: null }] };
    }

    const notices = await Notice.find(filter)
      .populate('createdBy', 'name role')
      .populate('batch', 'name')
      .sort({ pinned: -1, createdAt: -1 });

    sendResponse(res, 200, true, { notices }, 'Notices fetched');
  } catch (err) {
    next(err);
  }
}

module.exports = { createNotice, listNotices };
