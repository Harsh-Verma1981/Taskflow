const nodemailer = require("nodemailer");

// ── Transporter ─────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter on startup (don't crash, just warn)
transporter.verify().then(() => {
  console.log("✅  Mailer ready");
}).catch((err) => {
  console.warn("⚠️   Mailer not configured:", err.message);
});

// ── HTML email template ──────────────────────────────────────────────────────
const buildEmailHTML = ({ userName, subject, body, ctaText, ctaUrl }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { margin:0; padding:0; background:#f4f4f8; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width:560px; margin:32px auto; }
    .card { background:#ffffff; border-radius:12px; overflow:hidden; }
    .header { background:#0e0f14; padding:28px 32px; display:flex; align-items:center; gap:12px; }
    .logo-box { width:36px; height:36px; background:#6C5CE7; border-radius:8px; display:flex; align-items:center; justify-content:center; }
    .logo-text { color:#ffffff; font-size:20px; font-weight:800; letter-spacing:-0.5px; }
    .brand { color:#ffffff; font-size:18px; font-weight:700; margin-left:4px; }
    .body { padding:28px 32px; }
    .greeting { font-size:15px; color:#3d3d3a; margin-bottom:16px; }
    .alert-box { background:#f8f7ff; border-left:4px solid #6C5CE7; border-radius:0 8px 8px 0; padding:16px 20px; margin:16px 0; }
    .alert-title { font-size:17px; font-weight:700; color:#3d3d3a; margin-bottom:4px; }
    .alert-meta { font-size:13px; color:#73726c; }
    .alert-time { display:inline-block; background:#6C5CE7; color:#fff; border-radius:6px; padding:3px 10px; font-size:12px; font-weight:600; margin-top:8px; }
    .message { font-size:14px; color:#555; line-height:1.7; margin:16px 0; }
    .cta { text-align:center; margin:24px 0; }
    .cta a { background:#6C5CE7; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-size:14px; font-weight:600; display:inline-block; }
    .footer { background:#f8f7ff; padding:18px 32px; text-align:center; }
    .footer p { font-size:11px; color:#9c9a92; margin:0; }
    .footer a { color:#6C5CE7; text-decoration:none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo-box"><span style="color:#fff;font-weight:900;font-size:16px">T</span></div>
        <span class="brand">TaskFlow</span>
      </div>
      <div class="body">
        <p class="greeting">Hey ${userName} 👋</p>
        <div class="alert-box">
          <div class="alert-title">${subject}</div>
          <div class="alert-meta">${body}</div>
        </div>
        <p class="message">Don't let this slip by — you set this reminder so you could stay on top of things stress-free. You've got this.</p>
        ${ctaText && ctaUrl ? `
        <div class="cta">
          <a href="${ctaUrl}">${ctaText}</a>
        </div>` : ""}
      </div>
      <div class="footer">
        <p>You're receiving this because you set a reminder on <a href="${process.env.CLIENT_URL}">TaskFlow</a>.</p>
        <p style="margin-top:4px"><a href="${process.env.CLIENT_URL}/settings">Manage notifications</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// ── Send functions ───────────────────────────────────────────────────────────

/**
 * Send a task-due reminder email
 * @param {Object} user  - { name, email }
 * @param {Object} task  - { title, dueDate, dueTime, category }
 */
const sendTaskReminderEmail = async (user, task) => {
  const dueLabel = task.dueTime
    ? `Due at ${task.dueTime}`
    : `Due ${new Date(task.dueDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}`;

  const html = buildEmailHTML({
    userName: user.name.split(" ")[0],
    subject: `⏰  Reminder: "${task.title}"`,
    body: dueLabel + (task.category ? ` · ${task.category}` : ""),
    ctaText: "Open TaskFlow",
    ctaUrl: `${process.env.CLIENT_URL}/tasks`,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: `⏰ TaskFlow Reminder: ${task.title}`,
    html,
  });

  console.log(`📧  Task reminder sent → ${user.email} | "${task.title}"`);
};

/**
 * Send a standing reminder (daily/weekly/once alerts)
 * @param {Object} user     - { name, email }
 * @param {Object} reminder - { label, time, repeatType }
 */
const sendStandingReminderEmail = async (user, reminder) => {
  const repeatLabel = {
    daily: "Daily reminder",
    weekly: "Weekly reminder",
    weekdays: "Weekday reminder",
    weekends: "Weekend reminder",
    once: "One-time reminder",
  }[reminder.repeatType] || "Reminder";

  const html = buildEmailHTML({
    userName: user.name.split(" ")[0],
    subject: `🔔  ${reminder.label}`,
    body: `${repeatLabel} · set for ${reminder.time}`,
    ctaText: "View your tasks",
    ctaUrl: `${process.env.CLIENT_URL}/tasks`,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: `🔔 TaskFlow: ${reminder.label}`,
    html,
  });

  console.log(`📧  Standing reminder sent → ${user.email} | "${reminder.label}"`);
};

/**
 * Send welcome email on signup
 */
const sendWelcomeEmail = async (user) => {
  const html = buildEmailHTML({
    userName: user.name.split(" ")[0],
    subject: "Welcome to TaskFlow 🎉",
    body: "Your account is all set. Start adding tasks and set reminders so you never miss a thing.",
    ctaText: "Go to dashboard",
    ctaUrl: `${process.env.CLIENT_URL}/dashboard`,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Welcome to TaskFlow — never miss a thing 🎉",
    html,
  });
};

module.exports = {
  sendTaskReminderEmail,
  sendStandingReminderEmail,
  sendWelcomeEmail,
};
