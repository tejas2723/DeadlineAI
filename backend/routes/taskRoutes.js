const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getStats,
  toggleSubtask,
  triggerEmail,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes under /api/tasks
router.use(protect);

// Stats route (MUST be placed before /:id parameter matching)
router.get('/stats', getStats);

// Main collection routes
router.route('/')
  .get(getTasks)
  .post(createTask);

// Individual task routes
router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

// Subtask specific routes
router.put('/:id/subtask/:subtaskId', toggleSubtask);

// Trigger email notification manually
router.post('/:id/trigger-email', triggerEmail);

module.exports = router;
