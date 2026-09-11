/**
 * Seed script - creates demo admin/teacher/student users and a sample batch
 * with one enrollment, so the evaluator/reviewer can log in immediately.
 *
 * Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Batch = require('./src/models/Batch');
const Enrollment = require('./src/models/Enrollment');

const DEMO_PASSWORD = 'Password@123';

async function seed() {
  await connectDB();

  console.log('Clearing existing demo data...');
  await Promise.all([
    User.deleteMany({ email: { $in: ['admin@edubatch.local', 'teacher@edubatch.local', 'student@edubatch.local'] } }),
    Batch.deleteMany({ name: 'JEE 2027 Morning Batch' }),
  ]);

  console.log('Creating demo users...');
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@edubatch.local',
    password: DEMO_PASSWORD,
    role: 'admin',
    phone: '9999900000',
  });

  const teacher = await User.create({
    name: 'Teacher User',
    email: 'teacher@edubatch.local',
    password: DEMO_PASSWORD,
    role: 'teacher',
    phone: '9999900001',
  });

  const student = await User.create({
    name: 'Student User',
    email: 'student@edubatch.local',
    password: DEMO_PASSWORD,
    role: 'student',
    phone: '9999900002',
  });

  console.log('Creating a sample batch...');
  const batch = await Batch.create({
    name: 'JEE 2027 Morning Batch',
    subject: 'Physics + Math',
    description: 'Foundation batch for JEE 2027 aspirants',
    startDate: new Date(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
    schedule: { days: ['Mon', 'Wed', 'Fri'], startTime: '07:00', endTime: '09:00' },
    capacity: 30,
    fee: 15000,
    teacher: teacher._id,
    status: 'active',
    createdBy: admin._id,
  });

  console.log('Enrolling the demo student...');
  await Enrollment.create({
    student: student._id,
    batch: batch._id,
    paymentStatus: 'pending',
  });

  console.log('\nSeed complete! Demo credentials:');
  console.log('-----------------------------------');
  console.log(`Admin    -> email: admin@edubatch.local    password: ${DEMO_PASSWORD}`);
  console.log(`Teacher  -> email: teacher@edubatch.local  password: ${DEMO_PASSWORD}`);
  console.log(`Student  -> email: student@edubatch.local  password: ${DEMO_PASSWORD}`);
  console.log('-----------------------------------');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
