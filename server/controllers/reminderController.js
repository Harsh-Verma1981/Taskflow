const Reminder = require("../models/Reminder");

// ── POST /api/reminders ──────────────────────────────────────────────────────
const createReminder = async (req, res) => {
  try {
    const { label, time, repeatType, repeatDayOfWeek, onceDate } = req.body;

    if (!label || !time) {
      return res.status(400).json({ message: "label and time are required." });
    }

    const reminder = await Reminder.create({
      user: req.user._id,
      label,
      time,
      repeatType: repeatType || "once",
      repeatDayOfWeek: repeatDayOfWeek ?? null,
      onceDate: onceDate ? new Date(onceDate) : null,
    });

    res.status(201).json(reminder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/reminders ───────────────────────────────────────────────────────
const getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id }).sort("-createdAt");
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/reminders/:id ─────────────────────────────────────────────────
const updateReminder = async (req, res) => {
  try {
    const allowed = ["label", "time", "repeatType", "repeatDayOfWeek", "onceDate", "isActive"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!reminder) return res.status(404).json({ message: "Reminder not found." });
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /api/reminders/:id ────────────────────────────────────────────────
const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!reminder) return res.status(404).json({ message: "Reminder not found." });
    res.json({ message: "Reminder deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createReminder, getReminders, updateReminder, deleteReminder };
