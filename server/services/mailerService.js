// Nodemailer code: failed in prod
// const nodemailer = require("nodemailer");

// // ── Transporter ─────────────────────────────────────────────────────────────
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || "smtp.gmail.com",
//   port: parseInt(process.env.SMTP_PORT, 10) || 587,
//   secure: process.env.SMTP_SECURE === "true",
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
//   pool: true,
//   maxConnections: 5,
// });

// // Verify transporter on startup (doesn't crash app if misconfigured)
// transporter.verify().then(() => {
//   console.log("✅ Mailer ready");
// }).catch((err) => {
//   console.warn("⚠️ Mailer configuration warning:", err.message);
// });

// // ── HTML Template Builder ───────────────────────────────────────────────────
// const buildEmailHTML = ({ userName, subject, body, ctaText, ctaUrl }) => `
// <!DOCTYPE html>
// <html>
// <head>
//   <meta charset="UTF-8"/>
//   <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
//   <style>
//     body { margin:0; padding:0; background:#f4f4f8; font-family: 'Segoe UI', Arial, sans-serif; }
//     .wrapper { max-width:560px; margin:32px auto; }
//     .card { background:#ffffff; border-radius:12px; overflow:hidden; }
//     .header { background:#0e0f14; padding:28px 32px; display:flex; align-items:center; gap:12px; }
//     .logo-box { width:36px; height:36px; background:#6C5CE7; border-radius:8px; display:flex; align-items:center; justify-content:center; }
//     .brand { color:#ffffff; font-size:18px; font-weight:700; margin-left:4px; }
//     .body { padding:28px 32px; }
//     .greeting { font-size:15px; color:#3d3d3a; margin-bottom:16px; }
//     .alert-box { background:#f8f7ff; border-left:4px solid #6C5CE7; border-radius:0 8px 8px 0; padding:16px 20px; margin:16px 0; }
//     .alert-title { font-size:17px; font-weight:700; color:#3d3d3a; margin-bottom:4px; }
//     .alert-meta { font-size:13px; color:#73726c; }
//     .cta { text-align:center; margin:24px 0; }
//     .cta a { background:#6C5CE7; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-size:14px; font-weight:600; display:inline-block; }
//     .footer { background:#f8f7ff; padding:18px 32px; text-align:center; }
//     .footer p { font-size:11px; color:#9c9a92; margin:0; }
//     .footer a { color:#6C5CE7; text-decoration:none; }
//   </style>
// </head>
// <body>
//   <div class="wrapper">
//     <div class="card">
//       <div class="header">
//         <div class="logo-box"><span style="color:#fff;font-weight:900;font-size:16px">T</span></div>
//         <span class="brand">TaskFlow</span>
//       </div>
//       <div class="body">
//         <p class="greeting">Hey ${userName || "there"} 👋</p>
//         <div class="alert-box">
//           <div class="alert-title">${subject}</div>
//           <div class="alert-meta">${body}</div>
//         </div>
//         ${ctaText && ctaUrl ? `
//         <div class="cta">
//           <a href="${ctaUrl}">${ctaText}</a>
//         </div>` : ""}
//       </div>
//       <div class="footer">
//         <p>You're receiving this from <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}">TaskFlow</a>.</p>
//       </div>
//     </div>
//   </div>
// </body>
// </html>
// `;

// // ── Email Methods ────────────────────────────────────────────────────────────

// /**
//  * Send welcome email on signup
//  * Supports passing either user object ({ name, email }) or direct email string
//  */
// const sendWelcomeEmail = async (userOrEmail, name) => {
//   try {
//     const email = typeof userOrEmail === "object" ? userOrEmail.email : userOrEmail;
//     const userName = typeof userOrEmail === "object" ? userOrEmail.name : (name || "User");
//     const firstName = userName ? userName.split(" ")[0] : "User";

//     const html = buildEmailHTML({
//       userName: firstName,
//       subject: "Welcome to TaskFlow 🎉",
//       body: "Your account is all set. Start organizing your tasks and set automated reminders.",
//       ctaText: "Go to Dashboard",
//       ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`,
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_FROM || `"TaskFlow" <${process.env.SMTP_USER}>`,
//       to: email,
//       subject: "Welcome to TaskFlow — Never miss a deadline 🎉",
//       html,
//     });

//     console.log(`📧 Welcome email sent → ${email}`);
//   } catch (error) {
//     console.error(`⚠️ Failed to send welcome email to ${userOrEmail}:`, error.message);
//   }
// };

// /**
//  * Send reminder email
//  * Flexible signature accepting both object parameter formats used across your cron/tasks
//  */
// const sendReminderEmail = async (payload) => {
//   try {
//     const toEmail = payload.toEmail || payload.email || (payload.user && payload.user.email);
//     const taskTitle = payload.taskTitle || (payload.task && payload.task.title) || "Task Reminder";
//     const taskDescription = payload.taskDescription || (payload.task && payload.task.description) || "";
//     const userName = payload.userName || (payload.user && payload.user.name) || "User";

//     const html = buildEmailHTML({
//       userName: userName.split(" ")[0],
//       subject: `⏰ Reminder: "${taskTitle}"`,
//       body: taskDescription || "Don't let this slip by — stay on top of your schedule!",
//       ctaText: "Open TaskFlow",
//       ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/tasks`,
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_FROM || `"TaskFlow" <${process.env.SMTP_USER}>`,
//       to: toEmail,
//       subject: `⏰ TaskFlow Reminder: ${taskTitle}`,
//       html,
//     });

//     console.log(`📧 Reminder email sent → ${toEmail} | "${taskTitle}"`);
//   } catch (error) {
//     console.error(`⚠️ Failed to send reminder email:`, error.message);
//   }
// };

// module.exports = {
//   sendWelcomeEmail,
//   sendReminderEmail,
// };

// using resend dependency
const { Resend } = require("resend");

// ── Initialize Resend ────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

// ── HTML Template Builder ───────────────────────────────────────────────────
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
    .brand { color:#ffffff; font-size:18px; font-weight:700; margin-left:4px; }
    .body { padding:28px 32px; }
    .greeting { font-size:15px; color:#3d3d3a; margin-bottom:16px; }
    .alert-box { background:#f8f7ff; border-left:4px solid #6C5CE7; border-radius:0 8px 8px 0; padding:16px 20px; margin:16px 0; }
    .alert-title { font-size:17px; font-weight:700; color:#3d3d3a; margin-bottom:4px; }
    .alert-meta { font-size:13px; color:#73726c; }
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
        <p class="greeting">Hey ${userName || "there"} 👋</p>
        <div class="alert-box">
          <div class="alert-title">${subject}</div>
          <div class="alert-meta">${body}</div>
        </div>
        ${ctaText && ctaUrl ? `
        <div class="cta">
          <a href="${ctaUrl}">${ctaText}</a>
        </div>` : ""}
      </div>
      <div class="footer">
        <p>You're receiving this from <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}">TaskFlow</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Default sender address provided by Resend testing domain
const SENDER_EMAIL = process.env.EMAIL_FROM || "TaskFlow <onboarding@resend.dev>";

// ── Email Methods ────────────────────────────────────────────────────────────

/**
 * Send welcome email on signup
 * Supports passing either user object ({ name, email }) or direct email string
 */
const sendWelcomeEmail = async (userOrEmail, name) => {
  try {
    const email = typeof userOrEmail === "object" ? userOrEmail.email : userOrEmail;
    const userName = typeof userOrEmail === "object" ? userOrEmail.name : (name || "User");
    const firstName = userName ? userName.split(" ")[0] : "User";

    const html = buildEmailHTML({
      userName: firstName,
      subject: "Welcome to TaskFlow 🎉",
      body: "Your account is all set. Start organizing your tasks and set automated reminders.",
      ctaText: "Go to Dashboard",
      ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`,
    });

    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [email],
      subject: "Welcome to TaskFlow — Never miss a deadline 🎉",
      html,
    });

    if (error) {
      console.error(`⚠️ Resend error sending welcome email to ${email}:`, error.message);
      return;
    }

    console.log(`📧 Welcome email sent → ${email} (ID: ${data.id})`);
  } catch (error) {
    console.error(`⚠️ Failed to send welcome email:`, error.message);
  }
};

/**
 * Send reminder email
 * Flexible signature accepting both object parameter formats used across your cron/tasks
 */
const sendReminderEmail = async (payload) => {
  try {
    const toEmail = payload.toEmail || payload.email || (payload.user && payload.user.email);
    const taskTitle = payload.taskTitle || (payload.task && payload.task.title) || "Task Reminder";
    const taskDescription = payload.taskDescription || (payload.task && payload.task.description) || "";
    const userName = payload.userName || (payload.user && payload.user.name) || "User";

    const html = buildEmailHTML({
      userName: userName.split(" ")[0],
      subject: `⏰ Reminder: "${taskTitle}"`,
      body: taskDescription || "Don't let this slip by — stay on top of your schedule!",
      ctaText: "Open TaskFlow",
      ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/tasks`,
    });

    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [toEmail],
      subject: `⏰ TaskFlow Reminder: ${taskTitle}`,
      html,
    });

    if (error) {
      console.error(`⚠️ Resend error sending reminder email to ${toEmail}:`, error.message);
      return;
    }

    console.log(`📧 Reminder email sent → ${toEmail} | "${taskTitle}" (ID: ${data.id})`);
  } catch (error) {
    console.error(`⚠️ Failed to send reminder email:`, error.message);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendReminderEmail,
};