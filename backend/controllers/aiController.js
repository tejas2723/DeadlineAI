const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const geminiService = require('../services/geminiService');

/**
 * Custom AI Error handler helper.
 * Maps API key or quota issues into clean, readable HTTP responses.
 */
const handleAIError = (error, res) => {
  console.error('Gemini API Integration Error:', error);
  res.status(502); // Bad Gateway - standard for upstream API failures

  const errorMsg = error.message || '';
  if (errorMsg.includes('API key') || errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('key not valid')) {
    throw new Error('AI Service error: Invalid or missing GEMINI_API_KEY. Please verify your environment configuration.');
  } else if (errorMsg.includes('quota') || errorMsg.includes('ResourceExhausted') || errorMsg.includes('429') || errorMsg.includes('LimitExceeded')) {
    throw new Error('AI Service error: Gemini API quota exceeded. Please try again in a few moments.');
  } else {
    throw new Error(`AI Service error: ${errorMsg || 'Failed to communicate with Gemini AI model'}`);
  }
};

/**
 * @desc    Fetch and analyze all active tasks for prioritization advice
 * @route   POST /api/ai/prioritize
 * @access  Private
 */
const prioritizeTasks = asyncHandler(async (req, res) => {
  // Fetch user's non-completed tasks, sorted by deadline
  const tasks = await Task.find({ user: req.user._id, status: { $ne: 'completed' } })
    .sort('deadline');

  if (tasks.length === 0) {
    return res.status(200).json({
      advice: 'No active tasks to prioritize! Add some tasks first.',
      taskCount: 0,
    });
  }

  try {
    const advice = await geminiService.prioritizeTasks(tasks, req.user);
    res.status(200).json({
      advice,
      taskCount: tasks.length,
    });
  } catch (error) {
    handleAIError(error, res);
  }
});

/**
 * @desc    Chat conversation with task list context
 * @route   POST /api/ai/chat
 * @access  Private
 */
const chat = asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) {
    res.status(400);
    throw new Error('Please provide a message');
  }

  // Fetch user's 10 most urgent non-completed tasks for context injection
  const tasks = await Task.find({ user: req.user._id, status: { $ne: 'completed' } })
    .sort('deadline')
    .limit(10);

  try {
    const response = await geminiService.chat(message, history, tasks, req.user);
    res.status(200).json({
      response,
      timestamp: new Date(),
    });
  } catch (error) {
    handleAIError(error, res);
  }
});

/**
 * @desc    Generate action suggestions for a single task
 * @route   POST /api/ai/suggest/:taskId
 * @access  Private
 */
const suggestForTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, user: req.user._id });

  if (!task) {
    res.status(404);
    throw new Error('Resource not found');
  }

  try {
    const suggestion = await geminiService.suggestForTask(task, req.user);
    
    // Save AI suggestion on the task
    task.aiSuggestion = suggestion;
    await task.save();

    res.status(200).json({
      suggestion,
      task,
    });
  } catch (error) {
    handleAIError(error, res);
  }
});

/**
 * @desc    Breakdown a task into concrete subtasks list
 * @route   POST /api/ai/breakdown/:taskId
 * @access  Private
 */
const breakdownTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, user: req.user._id });

  if (!task) {
    res.status(404);
    throw new Error('Resource not found');
  }

  try {
    const subtaskTitles = await geminiService.breakdownTask(task);

    // Map title array to Mongoose Subtask Schema structure
    const newSubtasks = subtaskTitles.map((title) => ({
      title,
      completed: false,
    }));

    // Replace existing subtasks with AI-generated subtasks
    task.subtasks = newSubtasks;
    await task.save();

    res.status(200).json({
      task,
      subtasksCreated: task.subtasks.length,
    });
  } catch (error) {
    handleAIError(error, res);
  }
});

/**
 * @desc    Scan and detect career opportunities using AI
 * @route   POST /api/ai/detect-opportunities
 * @access  Private
 */
const detectOpportunities = asyncHandler(async (req, res) => {
  const user = req.user;
  const tasks = await Task.find({ user: user._id, status: { $ne: 'completed' } });

  try {
    const results = await geminiService.detectOpportunities(user, tasks);
    res.status(200).json(results);
  } catch (error) {
    handleAIError(error, res);
  }
});

module.exports = {
  prioritizeTasks,
  chat,
  suggestForTask,
  breakdownTask,
  detectOpportunities,
};
