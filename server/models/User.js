const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [60, "Name too long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      // null for OAuth users
    },
    googleId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null, // URL from Google or null
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata", // sensible default for your users
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    defaultReminderMinutes: {
      type: Number,
      default: 30,
    },
  },
  { timestamps: true }
);

// Hash password before saving (only when password field is modified)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare plain password with stored hash
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Never expose password hash in API responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
