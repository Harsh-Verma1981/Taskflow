const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { sendWelcomeEmail } = require("../services/mailerService");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Helper: sign JWT ─────────────────────────────────────────────────────────
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// ── POST /api/auth/signup ────────────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({ name, email, password });

    // Fire-and-forget welcome email
    sendWelcomeEmail(user).catch((e) => console.warn("Welcome email failed:", e.message));

    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      // No password = OAuth-only account
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/auth/google ────────────────────────────────────────────────────
// Client sends the Google ID token obtained from Google Sign-In button
const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "idToken required" });

    // Verify with Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    let isNew = false;

    if (!user) {
      user = await User.create({ name, email, googleId, avatar: picture });
      isNew = true;
    } else if (!user.googleId) {
      // Existing email-only account — link Google ID
      user.googleId = googleId;
      user.avatar = user.avatar || picture;
      await user.save();
    }

    if (isNew) {
      sendWelcomeEmail(user).catch((e) => console.warn("Welcome email failed:", e.message));
    }

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    console.error("Google auth error:", err.message);
    res.status(401).json({ message: "Google authentication failed." });
  }
};

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  res.json(req.user);
};

// ── PATCH /api/auth/me ───────────────────────────────────────────────────────
const updateMe = async (req, res) => {
  try {
    const allowed = ["name", "timezone", "emailNotifications", "theme", "defaultReminderMinutes"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { signup, login, googleAuth, getMe, updateMe };
