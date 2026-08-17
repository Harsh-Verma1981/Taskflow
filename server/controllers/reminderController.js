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

    if (!label || !time) {
      return res.status(400).json({ message: "label and time are required." });
    }

    // 1. Build a valid base JavaScript Date instance
    let reminderDate = scheduledFor 
      ? new Date(scheduledFor) 
      : (onceDate ? new Date(onceDate) : new Date());

    // 2. Set exact hours and minutes onto the Date object
    if (time) {
      const [hours, minutes] = time.split(":").map(Number);
      reminderDate.setHours(hours, minutes, 0, 0);
    }

    // 3. Save to database with status: "PENDING"
    const reminder = await Reminder.create({
      user: req.user._id,
      task: task || null,
      scheduledFor: reminderDate,
      label,
      time,
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

    // Recalculate scheduledFor Date if date or time were changed
    if (scheduledFor !== undefined || time !== undefined) {
      const targetTime = time !== undefined ? time : reminder.time;
      let targetDate = scheduledFor ? new Date(scheduledFor) : reminder.scheduledFor || new Date();

      if (targetTime) {
        const [hours, minutes] = targetTime.split(":").map(Number);
        targetDate = new Date(targetDate);
        targetDate.setHours(hours, minutes, 0, 0);
      }

      reminder.time = targetTime;
      reminder.scheduledFor = targetDate;
      // Reset status to PENDING if user rescheduled
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