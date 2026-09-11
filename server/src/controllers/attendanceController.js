const { z } = require('zod');
const Attendance = require('../models/Attendance');
const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const markSchema = z.object({
  batchId: z.string().min(1),
  date: z.coerce.date(),
  records: z.array(
    z.object({
      student: z.string().min(1),
      status: z.enum(['present', 'absent', 'late']),
    })
  ).min(1),
});

// POST /attendance (teacher/admin) - upsert attendance for a batch+date
async function markAttendance(req, res, next) {
  try {
    const parsed = markSchema.parse(req.body);
    const batch = await Batch.findById(parsed.batchId);
    if (!batch) throw new AppError('Batch not found', 404);

    if (req.user.role === 'teacher' && String(batch.teacher) !== String(req.user._id)) {
      throw new AppError('You can only mark attendance for your own batch', 403);
    }

    const date = normalizeDate(parsed.date);

    const attendance = await Attendance.findOneAndUpdate(
      { batch: parsed.batchId, date },
      { records: parsed.records, markedBy: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );

    sendResponse(res, 200, true, { attendance }, 'Attendance saved');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.issues.map((i) => i.message).join(', '), 400));
    }
    next(err);
  }
}

// GET /attendance/batch/:id - all attendance records for a batch
async function batchAttendance(req, res, next) {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) throw new AppError('Batch not found', 404);

    if (req.user.role === 'teacher' && String(batch.teacher) !== String(req.user._id)) {
      throw new AppError('You can only view attendance for your own batch', 403);
    }

    const records = await Attendance.find({ batch: req.params.id })
      .populate('records.student', 'name email')
      .sort({ date: -1 });

    sendResponse(res, 200, true, { records }, 'Batch attendance');
  } catch (err) {
    next(err);
  }
}

// GET /attendance/my - student's own attendance percentage across all batches
async function myAttendance(req, res, next) {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id, isActive: true });
    const batchIds = enrollments.map((e) => e.batch);

    const attendanceRecords = await Attendance.find({ batch: { $in: batchIds } }).populate(
      'batch',
      'name subject'
    );

    const summary = {};
    for (const record of attendanceRecords) {
      const batchId = String(record.batch._id);
      if (!summary[batchId]) {
        summary[batchId] = { batchName: record.batch.name, present: 0, total: 0 };
      }
      const own = record.records.find((r) => String(r.student) === String(req.user._id));
      if (own) {
        summary[batchId].total += 1;
        if (own.status === 'present' || own.status === 'late') {
          summary[batchId].present += 1;
        }
      }
    }

    const result = Object.entries(summary).map(([batchId, s]) => ({
      batchId,
      batchName: s.batchName,
      present: s.present,
      total: s.total,
      percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    }));

    sendResponse(res, 200, true, { attendance: result }, 'Your attendance summary');
  } catch (err) {
    next(err);
  }
}

module.exports = { markAttendance, batchAttendance, myAttendance };
