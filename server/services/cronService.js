// require('dotenv').config();
// const cron = require('node-cron');
// const nodemailer = require('nodemailer');
// const Task = require('../models/Task');
// const Reminder = require('../models/Reminder');

// // Transporter configuration
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || 'smtp.gmail.com',
//   port: Number(process.env.SMTP_PORT) || 465,
//   secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
//   tls: {
//     rejectUnauthorized: false,
//     ciphers: 'SSLv3', // Helps prevent connection resets on local networks
//   },
//   connectionTimeout: 10000, // 10 seconds timeout
// });

// const sendNotificationEmail = async (toEmail, userName, title, scheduledTime) => {
//   const mailOptions = {
//     from: `"Taskflow Notifications" <${process.env.EMAIL_USER}>`,
//     to: toEmail,
//     subject: `⏰ Taskflow Reminder: ${title}`,
//     html: `
//       <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
//         <h2>Hello ${userName || 'there'},</h2>
//         <p>This is a reminder for your scheduled item:</p>
//         <blockquote style="background: #f9f9f9; padding: 12px; border-left: 4px solid #4F46E5; font-size: 16px;">
//           <strong>${title}</strong>
//         </blockquote>
//         <p><strong>Scheduled Time:</strong> ${new Date(scheduledTime).toLocaleString()}</p>
//         <p>Stay productive!</p>
//       </div>
//     `,
//   };

//   return await transporter.sendMail(mailOptions);
// };

// const checkAndSendReminders = async () => {
//   try {
//     const now = new Date();
//     // Only check items due within the last 15 minutes up to current time
//     // This stops old historical tasks from triggering bulk emails!
//     const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

//     // 1. Check Tasks
//     const pendingTasks = await Task.find({
//       dueDate: { $gte: fifteenMinutesAgo, $lte: now },
//       status: { $nin: ['completed', 'archived'] }, // Skip completed or archived tasks
//       isNotified: { $ne: true },
//     }).populate('user', 'email name');

//     for (const task of pendingTasks) {
//       if (task.user && task.user.email) {
//         console.log(`[CRON] Sending task email to: ${task.user.email} for "${task.title}"`);
        
//         await sendNotificationEmail(
//           task.user.email,
//           task.user.name,
//           task.title,
//           task.dueDate
//         );

//         await Task.updateOne(
//           { _id: task._id },
//           { $set: { isNotified: true, taskReminderSent: true } }
//         );
//       }
//     }

    
//     // 2. Check Standalone Reminders
//     const pendingReminders = await Reminder.find({
//       $and: [
//         {
//           $or: [
//             { scheduledFor: { $gte: fifteenMinutesAgo, $lte: now } },
//             { dueDate: { $gte: fifteenMinutesAgo, $lte: now } },
//           ],
//         },
//         {
//           $or: [
//             { status: 'PENDING' },
//             { status: 'pending' },
//             { status: { $exists: false } },
//           ],
//         },
//         { isNotified: { $ne: true } },
//       ],
//     }).populate('user', 'email name');

//     console.log(`[CRON DEBUG] Found ${pendingReminders.length} pending reminders at ${now.toISOString()}`);

//     for (const reminder of pendingReminders) {
//       const recipientEmail = reminder.user?.email;
//       const recipientName = reminder.user?.name;
//       const title = reminder.label || reminder.title || 'Scheduled Reminder';
//       const targetTime = reminder.scheduledFor || reminder.dueDate;

//       if (recipientEmail) {
//         console.log(`[CRON] Sending reminder email to: ${recipientEmail} for "${title}"`);

//         await sendNotificationEmail(recipientEmail, recipientName, title, targetTime);

//         // Update status and flags to prevent duplicate sends
//         await Reminder.updateOne(
//           { _id: reminder._id },
//           { $set: { status: 'COMPLETED', isNotified: true } }
//         );
//         console.log(`[CRON] Reminder ${reminder._id} marked as COMPLETED.`);
//       } else {
//         console.warn(`[CRON WARNING] Reminder ${reminder._id} has no valid user email attached.`);
//       }
//     }
//   } catch (error) {
//     console.error('[CRON ERROR]', error);
//   }
// };

// const initCronJobs = () => {
//   // Runs every minute
//   cron.schedule('* * * * *', () => {
//     checkAndSendReminders();
//   });
//   console.log('⏰ Notification Cron Job Initialized');
// };

// module.exports = { initCronJobs };
// upper one is working but has some bugs ready for task page not reminders

require('dotenv').config();
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Task = require('../models/Task');
const Reminder = require('../models/Reminder');

/**
 * Creates a fresh Nodemailer transporter per send call
 * to avoid socket timeout / ECONNRESET errors on idle connections.
 */
const createTransporter = () => {
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: port === 465, // true for port 465, false for 587 / other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3',
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

/**
 * Helper function to send notification emails cleanly
 */
const sendNotificationEmail = async (to, name, title, date) => {
  const transporter = createTransporter();
  
  const formattedDate = date ? new Date(date).toLocaleString() : 'Scheduled Time';

  const mailOptions = {
    from: `"TaskFlow" <${process.env.SMTP_USER}>`,
    to,
    subject: `TaskFlow Reminder: ${title}`,
    text: `Hello ${name || 'User'},\n\nThis is your scheduled notification for: "${title}".\nScheduled Time: ${formattedDate}\n\nBest regards,\nTaskFlow Team`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">TaskFlow Reminder</h2>
        <p>Hello <strong>${name || 'User'}</strong>,</p>
        <p>This is a reminder for your item: <strong>${title}</strong></p>
        <p><strong>Scheduled Time:</strong> ${formattedDate}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">You received this because an automated reminder was set on TaskFlow.</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Core Cron Service Routine
 * Runs every minute to check for pending Tasks and Reminders
 */
const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    // 15-min past window stops old legacy tasks from bulk sending
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    // 2-min future buffer absorbs local clock skew
    const searchUntil = new Date(now.getTime() + 2 * 60 * 1000);

    // ==========================================
    // 1. PROCESS PENDING TASKS
    // ==========================================
    const pendingTasks = await Task.find({
      dueDate: { $gte: fifteenMinutesAgo, $lte: searchUntil },
      status: { $nin: ['completed', 'archived'] },
      isNotified: { $ne: true },
    }).populate('user', 'email name');

    for (const task of pendingTasks) {
      if (task.user && task.user.email) {
        console.log(`[CRON] Sending task email to: ${task.user.email} for "${task.title}"`);
        
        try {
          await sendNotificationEmail(
            task.user.email,
            task.user.name,
            task.title,
            task.dueDate
          );

          // Atomic update prevents full schema re-validation errors
          await Task.updateOne(
            { _id: task._id },
            { $set: { isNotified: true, taskReminderSent: true } }
          );
          console.log(`[CRON] Task ${task._id} marked as notified.`);
        } catch (mailErr) {
          console.error(`[CRON ERROR] Failed sending email for task ${task._id}:`, mailErr.message);
        }
      } else {
        console.warn(`[CRON WARNING] Task ${task._id} has no valid user email.`);
      }
    }

    // ==========================================
    // 2. PROCESS STANDALONE REMINDERS
    // ==========================================
    const pendingReminders = await Reminder.find({
      $and: [
        {
          $or: [
            { scheduledFor: { $gte: fifteenMinutesAgo, $lte: searchUntil } },
            { dueDate: { $gte: fifteenMinutesAgo, $lte: searchUntil } },
          ],
        },
        {
          $or: [
            { status: 'PENDING' },
            { status: 'pending' },
            { status: { $exists: false } },
          ],
        },
        { isNotified: { $ne: true } },
      ],
    }).populate('user', 'email name');

    for (const reminder of pendingReminders) {
      const recipientEmail = reminder.user?.email;
      const recipientName = reminder.user?.name;
      const title = reminder.label || reminder.title || 'Scheduled Reminder';
      const targetTime = reminder.scheduledFor || reminder.dueDate;

      if (recipientEmail) {
        console.log(`[CRON] Sending reminder email to: ${recipientEmail} for "${title}"`);

        try {
          await sendNotificationEmail(
            recipientEmail,
            recipientName,
            title,
            targetTime
          );

          await Reminder.updateOne(
            { _id: reminder._id },
            { $set: { status: 'COMPLETED', isNotified: true } }
          );
          console.log(`[CRON] Reminder ${reminder._id} marked as COMPLETED.`);
        } catch (mailErr) {
          console.error(`[CRON ERROR] Failed sending email for reminder ${reminder._id}:`, mailErr.message);
        }
      } else {
        console.warn(`[CRON WARNING] Reminder ${reminder._id} has no valid user email.`);
      }
    }
  } catch (error) {
    console.error('[CRON CRITICAL ERROR]', error);
  }
};

/**
 * Initializes the Node-Cron schedule (Runs every 1 minute)
 */
const initCronJobs = () => {
  console.log('⏰ Initializing Cron Service (Runs every minute)...');
  cron.schedule('* * * * *', () => {
    checkAndSendReminders();
  });
};

module.exports = {
  initCronJobs,
  checkAndSendReminders,
};