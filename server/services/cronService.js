const cron = require("node-cron");
const Reminder = require("../models/Reminder");
const Task = require("../models/Task");
const User = require("../models/User");
const { sendTaskReminderEmail, sendStandingReminderEmail } = require("./mailerService");

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns "HH:MM" string for the current time in UTC */
const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
};

/** Day of week: 0=Sun … 6=Sat */
const todayDOW = () => new Date().getUTCDay();

/** Is today a weekday? */
const isWeekday = () => { const d = todayDOW(); return d >= 1 && d <= 5; };

/** Is today a weekend? */
const isWeekend = () => { const d = todayDOW(); return d === 0 || d === 6; };

// ── Job 1 : Standing reminders (runs every minute) ───────────────────────────
const standingReminderJob = cron.schedule("* * * * *", async () => {
  try {
    const currentTime = nowHHMM();
    const dow = todayDOW();

    // Fetch all active, unfired reminders whose time matches current minute
    const candidates = await Reminder.find({
      isActive: true,
      fired: false,
      time: currentTime,
    }).populate("user", "name email emailNotifications");

    if (!candidates.length) return;

    for (const reminder of candidates) {
      const user = reminder.user;
      if (!user || !user.emailNotifications) continue;

      let shouldFire = false;

      switch (reminder.repeatType) {
        case "daily":
          shouldFire = true;
          break;
        case "weekly":
          shouldFire = reminder.repeatDayOfWeek === dow;
          break;
        case "weekdays":
          shouldFire = isWeekday();
          break;
        case "weekends":
          shouldFire = isWeekend();
          break;
        case "once":
          if (reminder.onceDate) {
            const today = new Date();
            const od = new Date(reminder.onceDate);
            shouldFire =
              od.getUTCFullYear() === today.getUTCFullYear() &&
              od.getUTCMonth() === today.getUTCMonth() &&
              od.getUTCDate() === today.getUTCDate();
          }
          break;
      }

      if (!shouldFire) continue;

      try {
        await sendStandingReminderEmail(user, reminder);
        reminder.lastFiredAt = new Date();
        // Mark once-reminders as done so they never repeat
        if (reminder.repeatType === "once") {
          reminder.fired = true;
        }
        await reminder.save();
      } catch (emailErr) {
        console.error(`❌  Failed to email ${user.email}:`, emailErr.message);
      }
    }
  } catch (err) {
    console.error("❌  Standing reminder job error:", err.message);
  }
}, { scheduled: false }); // started explicitly below


// ── Job 2 : Task due-date reminders (runs every minute) ──────────────────────
/*
  Finds tasks that are:
    - pending or in_progress
    - dueDate is within the next (remindBeforeMinutes) minutes
    - taskReminderSent === false
  Then sends an email and marks them as sent.
*/
const taskDueReminderJob = cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 31 * 60 * 1000); // look 31 min ahead

    const tasks = await Task.find({
      status: { $in: ["pending", "in_progress"] },
      taskReminderSent: false,
      dueDate: { $gte: now, $lte: windowEnd },
    }).populate("user", "name email emailNotifications");

    for (const task of tasks) {
      const user = task.user;
      if (!user || !user.emailNotifications) continue;

      // Fire when the dueDate is within remindBeforeMinutes from now
      const minutesUntilDue = (new Date(task.dueDate) - now) / 60000;
      if (minutesUntilDue > task.remindBeforeMinutes) continue;

      try {
        await sendTaskReminderEmail(user, task);
        task.taskReminderSent = true;
        await task.save();
      } catch (emailErr) {
        console.error(`❌  Task reminder email failed for "${task.title}":`, emailErr.message);
      }
    }
  } catch (err) {
    console.error("❌  Task due reminder job error:", err.message);
  }
}, { scheduled: false });


// ── Start both jobs ──────────────────────────────────────────────────────────
const startCronJobs = () => {
  standingReminderJob.start();
  taskDueReminderJob.start();
  console.log("⏰  Cron jobs started (running every minute)");
};

module.exports = { startCronJobs };
