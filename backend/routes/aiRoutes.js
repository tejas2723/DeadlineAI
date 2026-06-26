const express = require('express');
const router = express.Router();
const {
  prioritizeTasks,
  chat,
  suggestForTask,
  breakdownTask,
  detectOpportunities,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes under /api/ai
router.use(protect);

router.post('/prioritize', prioritizeTasks);
router.post('/chat', chat);
router.post('/suggest/:taskId', suggestForTask);
router.post('/breakdown/:taskId', breakdownTask);
router.post('/detect-opportunities', detectOpportunities);

module.exports = router;
