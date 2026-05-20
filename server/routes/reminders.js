const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { createReminder, getReminders, updateReminder, deleteReminder } = require("../controllers/reminderController");

router.use(protect);
router.route("/").get(getReminders).post(createReminder);
router.route("/:id").patch(updateReminder).delete(deleteReminder);

module.exports = router;
