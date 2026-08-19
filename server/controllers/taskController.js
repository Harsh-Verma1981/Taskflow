const Task = require('../models/Task');

// Helper to parse raw input strings
const parseTaskInput = (raw) => {
  if (!raw) return { title: "", category: "other", priority: "low" };
  
  let category = "other";
  let priority = "low";
  let title = raw;

  const lower = raw.toLowerCase();
  if (lower.includes("urgent") || lower.includes("important")) {
    priority = "high";
  } else if (lower.includes("medium")) {
    priority = "medium";
  }

  if (lower.includes("work") || lower.includes("job")) {
    category = "work";
  } else if (lower.includes("personal")) {
    category = "personal";
  }

  return { title, category, priority };
};

// @desc    Get all tasks for logged-in user
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = { user: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get task dashboard statistics
// @route   GET /api/tasks/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalTasks = await Task.countDocuments({ user: userId });
    const pendingTasks = await Task.countDocuments({ user: userId, status: 'pending' });
    const completedTasks = await Task.countDocuments({ user: userId, status: 'completed' });

    const recentTasks = await Task.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalTasks,
      pendingTasks,
      completedTasks,
      recentTasks
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
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

    const title = (parsed.title || rawInput || "Untitled Task").trim();

    let finalTags = [];
    if (tags && Array.isArray(tags) && tags.length > 0) {
      finalTags = tags;
    } else if (parsed.category && parsed.category !== "other") {
      finalTags = [parsed.category];
    }

    // 1. Convert incoming date string safely into a valid JavaScript Date Object
    let finalDueDate = dueDate ? new Date(dueDate) : (parsed.dueDate ? new Date(parsed.dueDate) : null);
    const finalDueTime = dueTime || parsed.dueTime;

    // 2. Set exact hours & minutes on the Date object
    if (finalDueDate && finalDueTime) {
      const [hours, minutes] = finalDueTime.split(":").map(Number);
      finalDueDate.setHours(hours, minutes, 0, 0);
    }

    const leadMinutes = remindBeforeMinutes !== undefined 
      ? Number(remindBeforeMinutes) 
      : (req.user?.defaultReminderMinutes || 0);

    // FIX: Preserved exact target `dueDate` without subtracting leadMinutes directly onto `dueDate`.

    const task = await Task.create({
      user: req.user._id,
      rawInput: rawInput?.trim() || "",
      title,
      dueDate: finalDueDate, // Saved as an authentic BSON Date object
      dueTime: finalDueTime,
      category: category || parsed.category || "other",
      tags: finalTags,
      priority: priority || parsed.priority || "low",
      notes: notes || "",
      remindBeforeMinutes: leadMinutes,
      isNotified: false,
      taskReminderSent: false
    });

    res.status(201).json({ task, parsed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update an existing task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { title, notes, category, priority, status, dueDate, dueTime, remindBeforeMinutes, tags } = req.body;

    if (title !== undefined) task.title = title.trim();
    if (notes !== undefined) task.notes = notes;
    if (category !== undefined) task.category = category;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (tags !== undefined) task.tags = tags;

    if (dueDate !== undefined || dueTime !== undefined) {
      const updatedDate = dueDate ? new Date(dueDate) : task.dueDate;
      const updatedTime = dueTime !== undefined ? dueTime : task.dueTime;

      if (updatedDate) {
        let finalDueDate = new Date(updatedDate);
        if (updatedTime) {
          const [hours, minutes] = updatedTime.split(":").map(Number);
          finalDueDate.setHours(hours, minutes, 0, 0);
        }

        task.dueDate = finalDueDate; // Preserved raw target Date
        task.dueTime = updatedTime;
        task.isNotified = false;
        task.taskReminderSent = false;
      }
    }

    if (remindBeforeMinutes !== undefined) {
      task.remindBeforeMinutes = Number(remindBeforeMinutes);
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getTasks,
  getDashboardStats,
  createTask,
  updateTask,
  deleteTask,
};