require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/db");
const { apiLimiter } = require("./middleware/rateLimiter");
const { initCronJobs } = require("./services/cronService");

const authRoutes     = require("./routes/auth");
const taskRoutes     = require("./routes/tasks");
const reminderRoutes = require("./routes/reminders");
const Task = require("./models/Task");
const Reminder = require("./models/Reminder");

const app = express();

// ── Security & logging ───────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ────────────────────────────────────────────────────────────
app.use("/api", apiLimiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/tasks",     taskRoutes);
app.use("/api/reminders", reminderRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ message: "Route not found" }));

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

// ── Boot ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  // 🧹 ONE-TIME CLEANUP: Mark old legacy tasks as notified
  try {
    await Task.updateMany(
      { dueDate: { $lt: new Date() } },
      { $set: { isNotified: true, taskReminderSent: true } }
    );
    await Reminder.updateMany(
      { scheduledFor: { $lt: new Date() } },
      { $set: { status: 'COMPLETED' } }
    );
    console.log("✅ Cleanup complete: Old tasks marked as notified.");
  } catch (err) {
    console.error("Cleanup error:", err);
  }

  app.listen(PORT, () => {
    console.log(`🚀  Server running on port ${PORT}`);
    initCronJobs();
  });
});
