const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendResponse } = require('../utils/response');

// GET /dashboard/admin
async function adminDashboard(req, res, next) {
  try {
    const [totalStudents, activeBatches, revenueAgg, pendingFees, monthlyRevenueAgg] =
      await Promise.all([
        User.countDocuments({ role: 'student', isActive: true }),
        Batch.countDocuments({ status: 'active' }),
        Payment.aggregate([
          { $match: { status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Enrollment.countDocuments({ paymentStatus: 'pending', isActive: true }),
        // Revenue grouped by month for the last 6 months (for the simple
        // revenue chart on the admin dashboard - docs Section 3: "Dashboards:
        // revenue charts (simple)")
        Payment.aggregate([
          {
            $match: {
              status: 'paid',
              paidAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 5, 1)) },
            },
          },
          {
            $group: {
              _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
              total: { $sum: '$amount' },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]),
      ]);

    const revenue = revenueAgg.length ? revenueAgg[0].total / 100 : 0;

    // Build a stable 6-month series (oldest -> newest), filling in months
    // with no paid payments as 0 so the chart always has a consistent shape.
    const monthLabels = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const revenueByMonthMap = new Map(
      monthlyRevenueAgg.map((r) => [`${r._id.year}-${r._id.month}`, r.total / 100])
    );
    const monthlyRevenue = [];
    const cursor = new Date();
    cursor.setDate(1);
    cursor.setMonth(cursor.getMonth() - 5);
    for (let i = 0; i < 6; i += 1) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth() + 1;
      monthlyRevenue.push({
        month: `${monthLabels[cursor.getMonth()]} ${year}`,
        revenue: revenueByMonthMap.get(`${year}-${month}`) || 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    sendResponse(
      res,
      200,
      true,
      { totalStudents, activeBatches, revenue, pendingFees, monthlyRevenue },
      'Admin dashboard data'
    );
  } catch (err) {
    next(err);
  }
}

// GET /dashboard/teacher
async function teacherDashboard(req, res, next) {
  try {
    const batches = await Batch.find({ teacher: req.user._id });
    const batchIds = batches.map((b) => b._id);

    const totalStudents = await Enrollment.countDocuments({
      batch: { $in: batchIds },
      isActive: true,
    });

    const upcomingClasses = batches.filter((b) => b.status === 'active' || b.status === 'upcoming');

    sendResponse(
      res,
      200,
      true,
      {
        totalBatches: batches.length,
        totalStudents,
        batches,
        upcomingClasses,
      },
      'Teacher dashboard data'
    );
  } catch (err) {
    next(err);
  }
}

// GET /dashboard/student
async function studentDashboard(req, res, next) {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id, isActive: true }).populate(
      'batch'
    );

    const pendingFees = enrollments.filter((e) => e.paymentStatus === 'pending').length;
    const upcomingClasses = enrollments
      .map((e) => e.batch)
      .filter((b) => b && (b.status === 'active' || b.status === 'upcoming'));

    sendResponse(
      res,
      200,
      true,
      {
        enrolledBatches: enrollments.length,
        pendingFees,
        upcomingClasses,
        enrollments,
      },
      'Student dashboard data'
    );
  } catch (err) {
    next(err);
  }
}

module.exports = { adminDashboard, teacherDashboard, studentDashboard };