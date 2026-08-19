// // mailer code 
// require('dotenv').config();
// const cron = require('node-cron');
// const nodemailer = require('nodemailer');
// const Task = require('../models/Task');
// const Reminder = require('../models/Reminder');

// /**
//  * Creates a fresh Nodemailer transporter per send call
//  * to avoid socket timeout / ECONNRESET errors on idle connections.
//  */
// const createTransporter = () => {
//   const port = Number(process.env.SMTP_PORT) || 587;
  
//   return nodemailer.createTransport({
//     host: process.env.SMTP_HOST || "smtp.gmail.com",
//     port: port,
//     secure: port === 465, // false for 587 STARTTLS
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//     tls: {
//       rejectUnauthorized: false,
//       // Removed ciphers: 'SSLv3'
//     },
//     connectionTimeout: 15000,
//     greetingTimeout: 15000,
//     socketTimeout: 15000,
//   });
// };

// // checking mail logs
// const transporter = createTransporter();

// transporter.verify((error, success) => {
//   if (error) {
//     console.error("❌ SMTP Connection Error:", error);
//   } else {
//     console.log("✅ SMTP Transporter is ready to send emails");
//   }
// });

// /**
//  * Helper function to send notification emails cleanly
//  */
// const sendNotificationEmail = async (to, name, title, date) => {
//   const transporter = createTransporter();
  
//   const formattedDate = date ? new Date(date).toLocaleString() : 'Scheduled Time';

//   const mailOptions = {
//     from: `"TaskFlow" <${process.env.SMTP_USER}>`,
//     to,
//     subject: `TaskFlow Reminder: ${title}`,
//     text: `Hello ${name || 'User'},\n\nThis is your scheduled notification for: "${title}".\nScheduled Time: ${formattedDate}\n\nBest regards,\nTaskFlow Team`,
//     html: `
//       <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
//         <h2 style="color: #4F46E5;">TaskFlow Reminder</h2>
//         <p>Hello <strong>${name || 'User'}</strong>,</p>
//         <p>This is a reminder for your item: <strong>${title}</strong></p>
//         <p><strong>Scheduled Time:</strong> ${formattedDate}</p>
//         <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
//         <p style="font-size: 12px; color: #666;">You received this because an automated reminder was set on TaskFlow.</p>
//       </div>
//     `,
//   };

//   return await transporter.sendMail(mailOptions);
// };

// /**
//  * Core Cron Service Routine
//  * Runs every minute to check for pending Tasks and Reminders
//  */
// const checkAndSendReminders = async () => {
//   try {
//     const now = new Date();
//     // 15-min past window stops old legacy tasks from bulk sending
//     const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
//     // 2-min future buffer absorbs local clock skew
//     const searchUntil = new Date(now.getTime() + 2 * 60 * 1000);

//     // ==========================================
//     // 1. PROCESS PENDING TASKS
//     // ==========================================
//     const pendingTasks = await Task.find({
//       dueDate: { $gte: fifteenMinutesAgo, $lte: searchUntil },
//       status: { $nin: ['completed', 'archived'] },
//       isNotified: { $ne: true },
//     }).populate('user', 'email name');

//     for (const task of pendingTasks) {
//       if (task.user && task.user.email) {
//         console.log(`[CRON] Sending task email to: ${task.user.email} for "${task.title}"`);
        
//         try {
//           await sendNotificationEmail(
//             task.user.email,
//             task.user.name,
//             task.title,
//             task.dueDate
//           );

//           // Atomic update prevents full schema re-validation errors
//           await Task.updateOne(
//             { _id: task._id },
//             { $set: { isNotified: true, taskReminderSent: true } }
//           );
//           console.log(`[CRON] Task ${task._id} marked as notified.`);
//         } catch (mailErr) {
//           console.error(`[CRON ERROR] Failed sending email for task ${task._id}:`, mailErr.message);
//         }
//       } else {
//         console.warn(`[CRON WARNING] Task ${task._id} has no valid user email.`);
//       }
//     }

//     // ==========================================
//     // 2. PROCESS STANDALONE REMINDERS
//     // ==========================================
//     const pendingReminders = await Reminder.find({
//       $and: [
//         {
//           $or: [
//             { scheduledFor: { $gte: fifteenMinutesAgo, $lte: searchUntil } },
//             { dueDate: { $gte: fifteenMinutesAgo, $lte: searchUntil } },
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

//     for (const reminder of pendingReminders) {
//       const recipientEmail = reminder.user?.email;
//       const recipientName = reminder.user?.name;
//       const title = reminder.label || reminder.title || 'Scheduled Reminder';
//       const targetTime = reminder.scheduledFor || reminder.dueDate;

//       if (recipientEmail) {
//         console.log(`[CRON] Sending reminder email to: ${recipientEmail} for "${title}"`);

//         try {
//           await sendNotificationEmail(
//             recipientEmail,
//             recipientName,
//             title,
//             targetTime
//           );

//           await Reminder.updateOne(
//             { _id: reminder._id },
//             { $set: { status: 'COMPLETED', isNotified: true } }
//           );
//           console.log(`[CRON] Reminder ${reminder._id} marked as COMPLETED.`);
//         } catch (mailErr) {
//           console.error(`[CRON ERROR] Failed sending email for reminder ${reminder._id}:`, mailErr.message);
//         }
//       } else {
//         console.warn(`[CRON WARNING] Reminder ${reminder._id} has no valid user email.`);
//       }
//     }
//   } catch (error) {
//     console.error('[CRON CRITICAL ERROR]', error);
//   }
// };

// /**
//  * Initializes the Node-Cron schedule (Runs every 1 minute)
//  */
// const initCronJobs = () => {
//   console.log('⏰ Initializing Cron Service (Runs every minute)...');
//   cron.schedule('* * * * *', () => {
//     checkAndSendReminders();
//   });
// };

// module.exports = {
//   initCronJobs,
//   checkAndSendReminders,
// };

// resend code 
require('dotenv').config();
const cron = require('node-cron');
const { Resend } = require('resend');
const Task = require('../models/Task');
const Reminder = require('../models/Reminder');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = process.env.EMAIL_FROM || "TaskFlow <onboarding@resend.dev>";

/**
 * Helper function to send notification emails via Resend HTTP API
 */
const sendNotificationEmail = async (to, name, title, date) => {
  const formattedDate = date ? new Date(date).toLocaleString() : 'Scheduled Time';

  const { data, error } = await resend.emails.send({
    from: SENDER_EMAIL,
    to: [to],
    subject: `TaskFlow Reminder: ${title}`,
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
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
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