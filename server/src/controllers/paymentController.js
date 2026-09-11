const crypto = require('crypto');
const { z } = require('zod');
const getRazorpay = require('../config/razorpay');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const Batch = require('../models/Batch');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const sendEmail = require('../utils/sendEmail');
const { streamReceiptPdf } = require('../utils/pdfReceipt');

const createOrderSchema = z.object({
  enrollmentId: z.string().min(1),
});

// POST /payments/create-order (student)
async function createOrder(req, res, next) {
  try {
    const { enrollmentId } = createOrderSchema.parse(req.body);

    const enrollment = await Enrollment.findById(enrollmentId).populate('batch');
    if (!enrollment) throw new AppError('Enrollment not found', 404);
    if (String(enrollment.student) !== String(req.user._id)) {
      throw new AppError('This enrollment does not belong to you', 403);
    }
    if (enrollment.paymentStatus === 'paid') {
      throw new AppError('This enrollment is already paid', 400);
    }

    const amountInPaise = Math.round(enrollment.batch.fee * 100);
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_enr_${enrollment._id}`,
    });

    const payment = await Payment.create({
      enrollment: enrollment._id,
      student: req.user._id,
      amount: amountInPaise,
      currency: 'INR',
      razorpayOrderId: order.id,
      status: 'created',
    });

    enrollment.payment = payment._id;
    await enrollment.save();

    sendResponse(
      res,
      201,
      true,
      {
        orderId: order.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        paymentId: payment._id,
      },
      'Razorpay order created'
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.issues.map((i) => i.message).join(', '), 400));
    }
    next(err);
  }
}

const verifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  enrollmentId: z.string().min(1),
});

// POST /payments/verify (student)
async function verifyPayment(req, res, next) {
  try {
    const parsed = verifySchema.parse(req.body);

    const payment = await Payment.findOne({ razorpayOrderId: parsed.razorpayOrderId });
    if (!payment) throw new AppError('Payment record not found', 404);
    if (String(payment.student) !== String(req.user._id)) {
      throw new AppError('This payment does not belong to you', 403);
    }

    // Server-side signature verification - source of truth
    const body = `${parsed.razorpayOrderId}|${parsed.razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== parsed.razorpaySignature) {
      payment.status = 'failed';
      await payment.save();
      throw new AppError('Payment signature verification failed', 400);
    }

    payment.razorpayPaymentId = parsed.razorpayPaymentId;
    payment.razorpaySignature = parsed.razorpaySignature;
    payment.status = 'paid';
    payment.paidAt = new Date();
    await payment.save();

    const enrollment = await Enrollment.findById(parsed.enrollmentId).populate('student batch');
    if (!enrollment) throw new AppError('Enrollment not found', 404);
    enrollment.paymentStatus = 'paid';
    await enrollment.save();

    await sendEmail({
      to: enrollment.student.email,
      subject: 'EduBatch - Payment Receipt',
      html: `<p>Hi ${enrollment.student.name},</p>
             <p>We have received your payment of ₹${payment.amount / 100} for batch "${enrollment.batch.name}".</p>
             <p>Payment ID: ${payment.razorpayPaymentId}</p>
             <p>Thank you!</p>`,
    });

    sendResponse(res, 200, true, { payment, enrollment }, 'Payment verified and enrollment marked as paid');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.issues.map((i) => i.message).join(', '), 400));
    }
    next(err);
  }
}

// GET /payments/history (role-filtered)
async function paymentHistory(req, res, next) {
  try {
    const filter = req.user.role === 'student' ? { student: req.user._id } : {};
    const payments = await Payment.find(filter)
      .populate('student', 'name email')
      .populate({ path: 'enrollment', populate: { path: 'batch', select: 'name subject' } })
      .sort({ createdAt: -1 });
    sendResponse(res, 200, true, { payments }, 'Payment history');
  } catch (err) {
    next(err);
  }
}

// GET /payments/:id/receipt - download a PDF receipt for a paid payment
async function downloadReceipt(req, res, next) {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student', 'name email')
      .populate({ path: 'enrollment', populate: { path: 'batch', select: 'name subject' } });

    if (!payment) throw new AppError('Payment not found', 404);

    // Students can only download their own receipt; admin/teacher can download any
    if (req.user.role === 'student' && String(payment.student._id) !== String(req.user._id)) {
      throw new AppError('This payment does not belong to you', 403);
    }
    if (payment.status !== 'paid') {
      throw new AppError('Receipt is only available for successful payments', 400);
    }

    streamReceiptPdf(res, {
      payment,
      enrollment: payment.enrollment,
      student: payment.student,
      batch: payment.enrollment.batch,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, verifyPayment, paymentHistory, downloadReceipt };