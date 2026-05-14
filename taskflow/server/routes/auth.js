const express = require("express");
const router = express.Router();
const { signup, login, googleAuth, getMe, updateMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/signup", authLimiter, signup);
router.post("/login",  authLimiter, login);
router.post("/google", authLimiter, googleAuth);
router.get("/me",    protect, getMe);
router.patch("/me",  protect, updateMe);

module.exports = router;
