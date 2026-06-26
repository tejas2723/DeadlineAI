const Task = require('../models/Task');
const { sendDeadlineEmail } = require('./emailService');

/**
 * Runs queries to find tasks due within 24 hours or overdue, and emails the users.
 */
const runNotificationChecks = async () => {
  console.log('[Scheduler] Running active task deadline checks...');
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    // 1. Process upcoming deadlines (due in next 24 hours)
    const upcomingTasks = await Task.find({
      status: { $ne: 'completed' },
      deadline: { $gt: now, $lte: twentyFourHoursFromNow },
      deadlineEmailSent: false,
    }).populate('user');

    if (upcomingTasks.length > 0) {
      console.log(`[Scheduler] Found ${upcomingTasks.length} tasks due within 24 hours. Processing...`);
      for (const task of upcomingTasks) {
        const user = task.user;
        if (user && user.preferences?.reminderEnabled !== false) {
          try {
            await sendDeadlineEmail(task, user, 'upcoming');
          } catch (err) {
            console.error(`[Scheduler] Failed to send upcoming email for task ID ${task._id}:`, err);
          }
        }
        // Always mark as sent so we don't attempt duplicate notifications
        task.deadlineEmailSent = true;
        await task.save();
      }
    }

    // 2. Process overdue tasks
    const overdueTasks = await Task.find({
      status: { $ne: 'completed' },
      deadline: { $lt: now },
      overdueEmailSent: false,
    }).populate('user');

    if (overdueTasks.length > 0) {
      console.log(`[Scheduler] Found ${overdueTasks.length} overdue tasks. Processing...`);
      for (const task of overdueTasks) {
        // Automatically sync task status to 'overdue' if it isn't set yet
        if (task.status !== 'overdue') {
          task.status = 'overdue';
        }

        const user = task.user;
        if (user && user.preferences?.reminderEnabled !== false) {
          try {
            await sendDeadlineEmail(task, user, 'overdue');
          } catch (err) {
            console.error(`[Scheduler] Failed to send overdue email for task ID ${task._id}:`, err);
          }
        }
        // Always mark as sent to avoid spamming
        task.overdueEmailSent = true;
        await task.save();
      }
    }

    console.log('[Scheduler] Finished active task deadline checks.');
  } catch (error) {
    console.error('[Scheduler] Error encountered during notification run:', error);
  }
};

/**
 * Initializes the background scheduler task.
 */
const initScheduler = () => {
  console.log('[Scheduler] Initializing DeadlineAI Notification Scheduler...');
  
  // Run checks 10 seconds after server boot to avoid interfering with initialization
  setTimeout(() => {
    runNotificationChecks();
  }, 10000);

  // Run checks every hour (3600000 ms)
  const intervalTime = 3600000;
  setInterval(runNotificationChecks, intervalTime);
};

module.exports = {
  initScheduler,
  runNotificationChecks, // Exported for manual triggers/tests
};
