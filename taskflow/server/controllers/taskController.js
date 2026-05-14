const Task = require("../models/Task");

// ── Natural language date/time parser ────────────────────────────────────────
/*
  Parses phrases like:
    "Meeting with client at 7 pm today"
    "Exam at 3 pm tomorrow"
    "Submit report at 11:30 am on Friday"
    "Doctor appointment at 2pm next monday"
*/
const parseTaskInput = (input) => {
  const lower = input.toLowerCase().trim();
  const now = new Date();
  let dueDate = null;
  let dueTime = null;
  let title = input.trim();

  // ── Extract time ─────────────────────────────────────
  // Matches: 7pm, 7 pm, 7:30pm, 7:30 pm, 19:00
  const timeRegex = /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
  const time24Regex = /\bat\s+(\d{2}):(\d{2})\b/;

  let hours = null, minutes = 0;

  const t24 = lower.match(time24Regex);
  if (t24) {
    hours = parseInt(t24[1]);
    minutes = parseInt(t24[2]);
  } else {
    const t = lower.match(timeRegex);
    if (t) {
      hours = parseInt(t[1]);
      minutes = t[2] ? parseInt(t[2]) : 0;
      const meridiem = t[3];
      if (meridiem === "pm" && hours < 12) hours += 12;
      if (meridiem === "am" && hours === 12) hours = 0;
      // If no am/pm and hours <= 8, assume pm (people rarely schedule at 7am via "at 7")
      if (!meridiem && hours <= 8) hours += 12;
    }
  }

  if (hours !== null) {
    dueTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  // ── Extract date keyword ─────────────────────────────
  const base = new Date(now);
  base.setSeconds(0, 0);

  if (/\btoday\b/.test(lower)) {
    dueDate = new Date(base);
  } else if (/\btomorrow\b/.test(lower)) {
    dueDate = new Date(base);
    dueDate.setDate(dueDate.getDate() + 1);
  } else if (/\bnext\s+week\b/.test(lower)) {
    dueDate = new Date(base);
    dueDate.setDate(dueDate.getDate() + 7);
  } else {
    // Day of week: "on monday", "this friday", "next tuesday"
    const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    const dayMatch = lower.match(/\b(?:on\s+|next\s+|this\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (dayMatch) {
      const targetDow = days.indexOf(dayMatch[1]);
      const currentDow = base.getDay();
      let diff = targetDow - currentDow;
      if (diff <= 0) diff += 7; // always forward
      dueDate = new Date(base);
      dueDate.setDate(dueDate.getDate() + diff);
    }
  }

  // Apply time to date
  if (dueDate && hours !== null) {
    dueDate.setHours(hours, minutes, 0, 0);
  } else if (!dueDate && hours !== null) {
    // Time given but no date keyword → assume today
    dueDate = new Date(base);
    dueDate.setHours(hours, minutes, 0, 0);
    // If that time has already passed today, push to tomorrow
    if (dueDate < now) {
      dueDate.setDate(dueDate.getDate() + 1);
    }
  }

  // ── Clean title: strip time/date keywords ────────────
  title = input
    .replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, "")
    .replace(/\b(?:today|tomorrow|next week)\b/gi, "")
    .replace(/\b(?:on\s+|next\s+|this\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Capitalise first letter
  if (title) title = title.charAt(0).toUpperCase() + title.slice(1);

  // ── Auto-detect category ─────────────────────────────
  let category = "other";
  if (/\b(meeting|client|presentation|deploy|report|review|standup|work|office|call|interview)\b/.test(lower)) category = "work";
  else if (/\b(exam|test|assignment|lecture|class|study|homework|submission|college|university)\b/.test(lower)) category = "study";
  else if (/\b(gym|doctor|hospital|medicine|workout|run|walk|health)\b/.test(lower)) category = "health";
  else if (/\b(pay|bill|bank|rent|insurance|tax|finance)\b/.test(lower)) category = "finance";
  else if (/\b(grocery|family|birthday|party|dinner|trip|personal)\b/.test(lower)) category = "personal";

  // ── Auto-detect priority ─────────────────────────────
  let priority = "medium";
  if (/\b(urgent|asap|critical|immediately|emergency)\b/.test(lower)) priority = "urgent";
  else if (/\b(important|high|must)\b/.test(lower)) priority = "high";
  else if (/\b(low|sometime|whenever)\b/.test(lower)) priority = "low";

  return { title, dueDate, dueTime, category, priority };
};

// ── POST /api/tasks ──────────────────────────────────────────────────────────
const createTask = async (req, res) => {
  try {
    const { rawInput, notes, remindBeforeMinutes, tags, category, priority, dueDate, dueTime } = req.body;

    if (!rawInput && !dueDate) {
      return res.status(400).json({ message: "Please describe your task or set a date." });
    }

    let parsed = { title: "", dueDate: null, dueTime: null, category: "other", priority: "low" };
    if (rawInput) {
      parsed = parseTaskInput(rawInput);
    }

    // Build title: use manual title if provided? Keep using parsed.title or rawInput.
    const title = (parsed.title || rawInput || "Untitled Task").trim();

    // Build tags array: use provided tags, or auto-detect category as a tag
    let finalTags = [];
    if (tags && Array.isArray(tags) && tags.length > 0) {
      finalTags = tags;
    } else if (parsed.category && parsed.category !== "other") {
      finalTags = [parsed.category];
    }

    const task = await Task.create({
      user: req.user._id,
      rawInput: rawInput?.trim() || "",
      title,
      dueDate: dueDate || parsed.dueDate,
      dueTime: dueTime || parsed.dueTime,
      category: category || parsed.category || "other",
      tags: finalTags,
      priority: priority || parsed.priority || "low",
      notes: notes || "",
      remindBeforeMinutes: remindBeforeMinutes || (req.user.defaultReminderMinutes || 30),
    });

    res.status(201).json({ task, parsed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/tasks ───────────────────────────────────────────────────────────
const getTasks = async (req, res) => {
  try {
    const { status, category, priority, search, sort = "-createdAt", page = 1, limit = 20 } = req.query;

    const filter = { user: req.user._id };

    if (status) filter.status = status;
    else filter.status = { $in: ["pending", "in_progress"] }; // default: active tasks

    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (search) filter.title = { $regex: search, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
      Task.countDocuments(filter),
    ]);

    res.json({ tasks, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/tasks/dashboard ─────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const uid = req.user._id;
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0);
    const endOfDay   = new Date(now); endOfDay.setHours(23,59,59,999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, completed, pending, overdue, todayTasks, monthCompleted] = await Promise.all([
      Task.countDocuments({ user: uid }),
      Task.countDocuments({ user: uid, status: "completed" }),
      Task.countDocuments({ user: uid, status: { $in: ["pending", "in_progress"] } }),
      Task.countDocuments({ user: uid, status: { $in: ["pending","in_progress"] }, dueDate: { $lt: now } }),
      Task.find({ user: uid, status: { $in: ["pending","in_progress"] }, dueDate: { $gte: startOfDay, $lte: endOfDay } }).sort("dueDate"),
      Task.countDocuments({ user: uid, status: "completed", completedAt: { $gte: startOfMonth } }),
    ]);

    res.json({ total, completed, pending, overdue, todayTasks, monthCompleted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/tasks/:id ───────────────────────────────────────────────────────
const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/tasks/:id ─────────────────────────────────────────────────────
const updateTask = async (req, res) => {
  try {
    const allowed = ["title", "notes", "category", "tags", "priority", "status", "dueDate", "dueTime", "remindBeforeMinutes"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    // Auto-set completedAt when marking done
    if (updates.status === "completed") updates.completedAt = new Date();
    if (updates.status === "archived") updates.archivedAt = new Date();

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /api/tasks/:id ────────────────────────────────────────────────────
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json({ message: "Task deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/tasks/history ───────────────────────────────────────────────────
const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, month, year } = req.query;

    const filter = {
      user: req.user._id,
      status: { $in: ["completed", "archived"] },
    };

    if (month && year) {
      const from = new Date(parseInt(year), parseInt(month) - 1, 1);
      const to   = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      filter.completedAt = { $gte: from, $lte: to };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter).sort("-completedAt").skip(skip).limit(parseInt(limit)),
      Task.countDocuments(filter),
    ]);

    res.json({ tasks, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createTask, getTasks, getDashboardStats, getTask, updateTask, deleteTask, getHistory };
