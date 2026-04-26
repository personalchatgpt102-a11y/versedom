import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const fixOldPhpHash = (hash) => {
  if (!hash) return "";
  return hash.startsWith("$2y$") ? hash.replace("$2y$", "$2a$") : hash;
};

const checkPassword = async (user, password) => {
  const hash = fixOldPhpHash(user.passwordHash);

  const normalMatch = await bcrypt.compare(password, hash);

  if (normalMatch) {
    return {
      matched: true,
      type: "normal",
    };
  }

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

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const sanitizeUser = (user) => {
  return {
    id: user._id,
    email: user.email,
    mode: user.mode,
    provider: user.provider,
    profile: user.profile || {},
  };
};

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordResult = await checkPassword(user, password);

    if (!passwordResult.matched) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (passwordResult.type === "legacy") {
      user.passwordHash = await bcrypt.hash(password, 10);
      user.passwordMigrated = true;
      await user.save();
    }

    const token = createToken(user);

    return res.json({
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  return res.json({
    user: sanitizeUser(req.user),
  });
});

/*
  DEV ONLY.
  Delete this route before production.
*/
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
      {
        email: email.toLowerCase().trim(),
      },
      {
        passwordHash,
        passwordMigrated: true,
      },
      {
        returnDocument: "after",
      }
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