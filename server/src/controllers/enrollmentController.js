const { z } = require('zod');
const Enrollment = require('../models/Enrollment');
const Batch = require('../models/Batch');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

const enrollSchema = z.object({
  studentId: z.string().min(1),
  batchId: z.string().min(1),
});

// POST /enrollments (admin, or teacher for their own assigned batch)
async function enrollStudent(req, res, next) {
  try {
    const { studentId, batchId } = enrollSchema.parse(req.body);

    const [student, batch] = await Promise.all([
      User.findById(studentId),
      Batch.findById(batchId),
    ]);
    if (!student || student.role !== 'student') {
      throw new AppError('Student not found', 404);
    }
    if (!batch) throw new AppError('Batch not found', 404);
    if (req.user.role === 'teacher' && String(batch.teacher) !== String(req.user._id)) {
      throw new AppError('You are not assigned to this batch', 403);
    }
    if (batch.status === 'archived') {
      throw new AppError('Cannot enroll into an archived batch', 400);
    }

    const existing = await Enrollment.findOne({ student: studentId, batch: batchId });
    if (existing && existing.isActive) {
      throw new AppError('Student is already enrolled in this batch', 409);
    }

    const activeCount = await Enrollment.countDocuments({ batch: batchId, isActive: true });
    if (activeCount >= batch.capacity) {
      throw new AppError('Batch capacity is full', 400);
    }

    let enrollment;
    if (existing) {
      existing.isActive = true;
      existing.enrolledAt = new Date();
      existing.paymentStatus = 'pending';
      enrollment = await existing.save();
    } else {
      enrollment = await Enrollment.create({ student: studentId, batch: batchId });
    }

    sendResponse(res, 201, true, { enrollment }, 'Student enrolled successfully');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.issues.map((i) => i.message).join(', '), 400));
    }
    if (err.code === 11000) {
      return next(new AppError('Student is already enrolled in this batch', 409));
    }
    next(err);
  }
}

// DELETE /enrollments/:id (admin, or teacher for their own assigned batch) - deactivate/remove
async function removeEnrollment(req, res, next) {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate('batch');
    if (!enrollment) throw new AppError('Enrollment not found', 404);

    if (
      req.user.role === 'teacher' &&
      String(enrollment.batch.teacher) !== String(req.user._id)
    ) {
      throw new AppError('You are not assigned to this batch', 403);
    }

    enrollment.isActive = false;
    await enrollment.save();
    sendResponse(res, 200, true, { enrollment }, 'Enrollment removed');
  } catch (err) {
    next(err);
  }
}

// GET /enrollments/my (student)
async function myEnrollments(req, res, next) {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id, isActive: true })
      .populate('batch')
      .sort({ createdAt: -1 });
    sendResponse(res, 200, true, { enrollments }, 'Your enrollments');
  } catch (err) {
    next(err);
  }
}

// GET /enrollments/batch/:batchId (admin/teacher) - list students in a batch
async function batchEnrollments(req, res, next) {
  try {
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) throw new AppError('Batch not found', 404);

    if (req.user.role === 'teacher' && String(batch.teacher) !== String(req.user._id)) {
      throw new AppError('You are not assigned to this batch', 403);
    }

    const enrollments = await Enrollment.find({ batch: req.params.batchId, isActive: true })
      .populate('student', 'name email phone');
    sendResponse(res, 200, true, { enrollments }, 'Batch enrollments');
  } catch (err) {
    next(err);
  }
}

module.exports = { enrollStudent, removeEnrollment, myEnrollments, batchEnrollments };