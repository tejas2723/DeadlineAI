const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');

/**
 * @desc    Get all tasks for the logged-in user with filtering, sorting, and pagination
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, sort = '-createdAt', page = 1, limit = 20 } = req.query;

  // Always scope queries to the logged-in user
  const query = { user: req.user._id };

  // Apply optional status and priority filters
  if (status) {
    query.status = status;
  }
  if (priority) {
    query.priority = priority;
  }

  // Calculate pagination parameters
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Fetch tasks
  const tasks = await Task.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  // Get total count for pagination headers/meta
  const total = await Task.countDocuments(query);

  // Check and update overdue status on the fly
  const now = new Date();
  for (let task of tasks) {
    if (task.status !== 'completed' && task.deadline < now && task.status !== 'overdue') {
      task.status = 'overdue';
      await task.save();
    }
  }

  res.status(200).json({
    tasks,
    total,
    page: pageNum,
  });
});

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = asyncHandler(async (req, res) => {
  const taskData = {
    ...req.body,
    user: req.user._id, // Inject user ID
  };

  const task = await Task.create(taskData);

  res.status(201).json({
    task,
  });
});

/**
 * @desc    Get a single task by ID (with ownership check)
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

  if (!task) {
    res.status(404);
    throw new Error('Resource not found');
  }

  res.status(200).json({
    task,
  });
});

/**
 * @desc    Update a task (with ownership check)
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = asyncHandler(async (req, res) => {
  const updateFields = { ...req.body };

  // Set completedAt date if status is transitioning to completed
  if (req.body.status === 'completed') {
    updateFields.completedAt = new Date();
  } else if (req.body.status && req.body.status !== 'completed') {
    // If transitioning back from completed, clear the timestamp
    updateFields.completedAt = null;
  }

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!task) {
    res.status(404);
    throw new Error('Resource not found');
  }

  res.status(200).json({
    task,
  });
});

/**
 * @desc    Delete a task (with ownership check)
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!task) {
    res.status(404);
    throw new Error('Resource not found');
  }

  res.status(200).json({
    message: 'Task deleted',
  });
});

/**
 * @desc    Get user task statistics and weekly completion aggregates
 * @route   GET /api/tasks/stats
 * @access  Private
 */
const getStats = asyncHandler(async (req, res) => {
  const now = new Date();

  // Run all count queries in parallel
  const [total, completed, inProgress, overdue, urgent] = await Promise.all([
    Task.countDocuments({ user: req.user._id }),
    Task.countDocuments({ user: req.user._id, status: 'completed' }),
    Task.countDocuments({ user: req.user._id, status: 'in-progress' }),
    Task.countDocuments({
      user: req.user._id,
      $or: [
        { status: 'overdue' },
        { status: { $ne: 'completed' }, deadline: { $lt: now } },
      ],
    }),
    Task.countDocuments({
      user: req.user._id,
      priority: 'urgent',
      status: { $ne: 'completed' },
    }),
  ]);

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // MongoDB Aggregation: Group completed tasks by day of the week (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rawWeeklyData = await Task.aggregate([
    {
      $match: {
        user: req.user._id,
        status: 'completed',
        completedAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dayOfWeek: '$completedAt' }, // 1 (Sun) to 7 (Sat)
        count: { $sum: 1 },
      },
    },
  ]);

  // Format weekly stats for Recharts (ensuring all days are present, Mon-Sun)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyMap = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

  rawWeeklyData.forEach((item) => {
    const dayName = dayNames[item._id - 1];
    if (dayName) {
      weeklyMap[dayName] = item.count;
    }
  });

  // Re-order starting with Monday through Sunday
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyData = order.map((day) => ({
    day,
    count: weeklyMap[day],
  }));

  res.status(200).json({
    total,
    completed,
    inProgress,
    overdue,
    urgent,
    completionRate,
    weeklyData,
  });
});

/**
 * @desc    Toggle the completed status of a subtask
 * @route   PUT /api/tasks/:id/subtask/:subtaskId
 * @access  Private
 */
const toggleSubtask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

  if (!task) {
    res.status(404);
    throw new Error('Resource not found');
  }

  // Find subtask by ID from Mongoose DocumentArray
  const subtask = task.subtasks.id(req.params.subtaskId);

  if (!subtask) {
    res.status(404);
    throw new Error('Resource not found');
  }

  // Toggle completed boolean flag
  subtask.completed = !subtask.completed;

  await task.save();

  res.status(200).json({
    task,
  });
});

/**
 * @desc    Manually trigger a deadline test email notification for a task
 * @route   POST /api/tasks/:id/trigger-email
 * @access  Private
 */
const triggerEmail = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id }).populate('user');

  if (!task) {
    res.status(404);
    throw new Error('Resource not found');
  }

  const { sendDeadlineEmail } = require('../services/emailService');
  const now = new Date();
  const type = task.deadline < now ? 'overdue' : 'upcoming';

  const info = await sendDeadlineEmail(task, req.user, type);

  res.status(200).json({
    message: 'Test notification email successfully sent.',
    info: {
      messageId: info.messageId,
      previewUrl: require('nodemailer').getTestMessageUrl(info) || null
    }
  });
});

module.exports = {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getStats,
  toggleSubtask,
  triggerEmail,
};
