const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    rawInput: { type: String, trim: true },
    notes: { type: String, trim: true },
    dueDate: { type: Date, index: true },
    dueTime: { type: String },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"], // Added "urgent" to fix validation error
      default: "medium",
    },
    category: { type: String, default: "General" },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ["pending", "in-progress", "in_progress", "completed", "archived"], // Supports both hyphenated & underscored statuses
      default: "pending",
      index: true,
    },
    reminderOffset: { type: String, default: "exact" },
    isNotified: { type: Boolean, default: false },
    taskReminderSent: { type: Boolean, default: false },
    remindBeforeMinutes: { type: Number, default: 30 },
    completedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Virtual: is this task overdue?
taskSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate || this.status === "completed") return false;
  return new Date() > this.dueDate;
});

taskSchema.set("toJSON", { virtuals: true });
taskSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Task", taskSchema);