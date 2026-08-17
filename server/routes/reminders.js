const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { 
  createReminder, 
  getReminders, 
  updateReminder, 
  deleteReminder 
} = require("../controllers/reminderController");

// Protect all routes with authMiddleware
router.use(authMiddleware);

router.route("/")
  .get(getReminders)
  .post(createReminder);

router.route("/:id")
  .put(updateReminder)
  .patch(updateReminder)
  .delete(deleteReminder);

module.exports = router;