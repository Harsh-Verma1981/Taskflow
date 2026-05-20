const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createTask, getTasks, getDashboardStats,
  getTask, updateTask, deleteTask, getHistory,
} = require("../controllers/taskController");

// All routes require auth
router.use(protect);

router.get("/dashboard", getDashboardStats);
router.get("/history",   getHistory);
router.route("/").get(getTasks).post(createTask);
router.route("/:id").get(getTask).patch(updateTask).delete(deleteTask);

module.exports = router;
