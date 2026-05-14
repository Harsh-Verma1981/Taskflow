const mongoose = require("mongoose");

/*
  A Reminder is a STANDING ALERT — separate from task-specific due-date reminders.
  Examples:
    • "Remind me every day at 7:00 PM"
    • "Remind me every weekday at 9:00 AM"
    • "Remind me every Monday at 10:00 AM"
    • "Remind me once on 25 March at 3:00 PM for exam"

  The cron job runs every minute and fires any reminder whose next fire time ≤ now.
*/

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: [true, "Reminder label is required"],
      trim: true,
      maxlength: [150, "Label too long"],
    },

    // ── Timing ──────────────────────────────────────────
    // "HH:MM" in 24-hour format, e.g. "19:00"
    time: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, "Time must be HH:MM"],
    },

    // ── Repeat type ─────────────────────────────────────
    repeatType: {
      type: String,
      enum: ["once", "daily", "weekly", "weekdays", "weekends"],
      default: "once",
    },
    // For weekly repeat: 0=Sun,1=Mon,...,6=Sat
    repeatDayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      default: null,
    },
    // For "once" — the specific date
    onceDate: {
      type: Date,
      default: null,
    },

    // ── State ───────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
    // Timestamp of the last time this reminder was fired
    lastFiredAt: {
      type: Date,
      default: null,
    },
    // For "once" reminders — mark as done after firing
    fired: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index so the cron query is fast
reminderSchema.index({ isActive: 1, fired: 1 });

module.exports = mongoose.model("Reminder", reminderSchema);
