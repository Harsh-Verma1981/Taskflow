const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    label: { type: String, required: true },
    time: { type: String },
    scheduledFor: { type: Date, required: true },
    repeatType: {
      type: String,
      enum: ['once', 'everyday', 'weekly', 'monthly'],
      default: 'once',
    },
    repeatDayOfWeek: { type: Number, default: null },
    onceDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['PENDING', 'pending', 'COMPLETED', 'completed', 'CANCELLED'],
      default: 'PENDING',
    },
    isNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reminder', reminderSchema);