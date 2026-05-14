const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // ── Core fields ─────────────────────────────────────
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [200, "Title too long"],
    },
    // Natural-language input the user typed e.g. "Meeting with client at 7pm today"
    rawInput: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes too long"],
    },
    category: {
      type: String,
      default: "other",
    },
    tags: [{
      type: String,
      default: [],
    }],
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "low",
    },

    // ── Scheduling ──────────────────────────────────────
    dueDate: {
      type: Date,
      index: true,
    },
    dueTime: {
      type: String, // "19:00" – stored separately for display convenience
    },

    // ── Status ──────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "archived"],
      default: "pending",
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    archivedAt: {
      type: Date,
      default: null,
    },

    // ── Reminder linked to this specific task ───────────
    // (separate Reminder docs handle recurring reminders)
    taskReminderSent: {
      type: Boolean,
      default: false,
    },
    // remind X minutes before dueDate (default 30 min before)
    remindBeforeMinutes: {
      type: Number,
      default: 30,
    },
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
