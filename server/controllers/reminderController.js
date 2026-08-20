const Reminder = require('../models/Reminder');

/**
 * Helper function to parse Date + Time specifically in IST (+05:30)
 * Prevents UTC server offsets from triggering emails immediately.
 */
const parseISTDate = (dateStr, timeStr) => {
  if (!dateStr) return new Date();

  // Extract clean YYYY-MM-DD
  const cleanDate = typeof dateStr === 'string' ? dateStr.split('T')[0] : new Date(dateStr).toISOString().split('T')[0];
  const cleanTime = timeStr || '00:00';

  // Construct explicit ISO string with IST offset (+05:30)
  return new Date(`${cleanDate}T${cleanTime}:00+05:30`);
};

// @desc    Get all reminders for logged-in user
// @route   GET /api/reminders
// @access  Private
const getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a new standalone reminder
// @route   POST /api/reminders
// @access  Private
const createReminder = async (req, res) => {
  try {
    const { task, scheduledFor, label, time, repeatType, repeatDayOfWeek, onceDate } = req.body;

    if (!label) {
      return res.status(400).json({ message: "label is required." });
    }

    // Determine target date and convert using IST offset
    const baseDate = scheduledFor || onceDate || new Date().toISOString();
    const reminderDate = parseISTDate(baseDate, time);

    const reminder = await Reminder.create({
      user: req.user._id,
      task: task || null,
      scheduledFor: reminderDate,
      label,
      time: time || "",
      repeatType: repeatType || "once",
      repeatDayOfWeek: repeatDayOfWeek ?? null,
      onceDate: onceDate ? new Date(onceDate) : null,
      status: "PENDING",
      isNotified: false,
    });

    res.status(201).json(reminder);
  } catch (err) {
    console.error("[CREATE REMINDER ERROR]", err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update an existing reminder
// @route   PUT /api/reminders/:id
// @access  Private
const updateReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user._id });

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    const { label, time, scheduledFor, status, repeatType, repeatDayOfWeek, onceDate } = req.body;

    if (label !== undefined) reminder.label = label;
    if (status !== undefined) reminder.status = status;
    if (repeatType !== undefined) reminder.repeatType = repeatType;
    if (repeatDayOfWeek !== undefined) reminder.repeatDayOfWeek = repeatDayOfWeek;
    if (onceDate !== undefined) reminder.onceDate = onceDate;

    if (scheduledFor !== undefined || time !== undefined) {
      const targetTime = time !== undefined ? time : reminder.time;
      const targetDate = scheduledFor !== undefined ? scheduledFor : reminder.scheduledFor;

      reminder.time = targetTime;
      reminder.scheduledFor = parseISTDate(targetDate, targetTime);
      reminder.status = "PENDING";
      reminder.isNotified = false;
    }

    const updatedReminder = await reminder.save();
    res.json(updatedReminder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete a reminder
// @route   DELETE /api/reminders/:id
// @access  Private
const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    res.json({ message: "Reminder deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
};