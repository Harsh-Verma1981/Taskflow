const express = require('express');
const router = express.Router();
const {
  getTasks,
  getDashboardStats,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/', getTasks);

// Dedicated history endpoint for completed tasks
router.get('/history', async (req, res) => {
  try {
    const Task = require('../models/Task');
    const tasks = await Task.find({
      user: req.user._id,
      status: 'completed',
    }).sort({ updatedAt: -1 });

    res.json({ tasks, total: tasks.length });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history' });
  }
});

router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;