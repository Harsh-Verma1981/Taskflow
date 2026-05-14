const rateLimit = require("express-rate-limit");

// General API limiter — suitable for a personal project
// 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests from this IP — please try again in 15 minutes.",
  },
});

// Stricter limiter for auth routes to prevent brute-force
// 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts — please try again in 15 minutes.",
  },
});

module.exports = { apiLimiter, authLimiter };
