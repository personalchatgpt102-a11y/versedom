import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

const fixOldPhpHash = (hash) => {
  if (!hash) return "";
  return hash.startsWith("$2y$") ? hash.replace("$2y$", "$2a$") : hash;
};

const checkPassword = async (user, password) => {
  const hash = fixOldPhpHash(user.passwordHash);

  // New Mongo password check
  const normalMatch = await bcrypt.compare(password, hash);

  if (normalMatch) {
    return {
      matched: true,
      type: "normal",
    };
  }

  // Old PHP password check
  // Old PHP hashed: time + password
  if (user.oldCreatedTime) {
    const legacyValue = `${user.oldCreatedTime}${password}`;
    const legacyMatch = await bcrypt.compare(legacyValue, hash);

    if (legacyMatch) {
      return {
        matched: true,
        type: "legacy",
      };
    }
  }

  return {
    matched: false,
    type: null,
  };
};

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login request email:", email);

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    console.log("User found:", user ? user.email : null);

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordResult = await checkPassword(user, password);

    console.log("Password matched:", passwordResult.matched);
    console.log("Password type:", passwordResult.type);

    if (!passwordResult.matched) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Optional but smart:
    // If old legacy password worked, convert it to normal Mongo bcrypt password.
    if (passwordResult.type === "legacy") {
      user.passwordHash = await bcrypt.hash(password, 10);
      await user.save();

      console.log("Legacy password upgraded to normal bcrypt hash");
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        mode: user.mode,
        profile: user.profile || {},
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

router.post("/reset-test-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        message: "Email and new password are required",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      {
        passwordHash,
        passwordMigrated: true,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json({
      message: "Password updated successfully",
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Password reset failed",
      error: error.message,
    });
  }
});

export default router;
