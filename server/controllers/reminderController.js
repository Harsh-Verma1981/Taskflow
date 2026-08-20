const Reminder = require('../models/Reminder');

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

    let reminderDate = null;

    if (scheduledFor) {
      reminderDate = new Date(scheduledFor);
    } else if (onceDate) {
      const timeStr = time || "00:00";
      reminderDate = new Date(`${onceDate.split("T")[0]}T${timeStr}:00`);
    } else {
      reminderDate = new Date();
    }

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
    });

    res.status(201).json(reminder);
  } catch (err) {
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
      let targetDate = scheduledFor ? new Date(scheduledFor) : reminder.scheduledFor;

      if (typeof scheduledFor === 'string' && !scheduledFor.endsWith('Z') && targetTime) {
        const cleanDateStr = scheduledFor.split("T")[0];
        targetDate = new Date(`${cleanDateStr}T${targetTime}:00`);
      }

      reminder.time = targetTime;
      reminder.scheduledFor = targetDate;
      reminder.status = "PENDING";
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