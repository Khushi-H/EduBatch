const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    schedule: {
      days: [{ type: String }], // e.g. ["Mon","Wed","Fri"]
      startTime: { type: String, default: '' }, // "09:00"
      endTime: { type: String, default: '' }, // "10:30"
    },
    capacity: { type: Number, required: true, min: 1 },
    fee: { type: Number, required: true, min: 0 }, // in INR (rupees)
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'archived'],
      default: 'upcoming',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Batch', batchSchema);
