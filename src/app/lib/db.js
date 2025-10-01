// lib/db.js

import connectToMongoose from "./mongoose";
import User from "@/models/User";
import {
  hashPassword,
  generateEmailVerificationToken,
  generateEmailVerificationCode,
} from "./auth";

// Connect to MongoDB using Mongoose
export async function connectToMongoDB() {
  try {
    await connectToMongoose();
    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// Create a new user
export async function createUser({
  firstName,
  lastName,
  email,
  password,
  role = "student",
}) {
  try {
    await connectToMongoDB();

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Generate email verification code (6 digits)
    const emailVerificationToken = generateEmailVerificationCode();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password, // Will be hashed by pre-save middleware
      role,
      status: "pending", // User needs to verify email
      emailVerificationToken,
      emailVerificationExpires,
    });

    const savedUser = await user.save();
    return savedUser;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

// Find user by email
export async function findUserByEmail(email) {
  try {
    await connectToMongoDB();
    return await User.findByEmail(email);
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
}

// Find user by ID
export async function findUserById(id) {
  try {
    await connectToMongoDB();
    return await User.findById(id);
  } catch (error) {
    console.error("Error finding user by ID:", error);
    throw error;
  }
}

// Update user
export async function updateUser(id, updateData) {
  try {
    await connectToMongoDB();
    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    return user;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

// Delete user
export async function deleteUser(id) {
  try {
    await connectToMongoDB();
    return await User.findByIdAndDelete(id);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

// Verify email
export async function verifyEmail(token) {
  try {
    await connectToMongoDB();
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error("Invalid or expired verification token");
    }

    user.emailVerified = true;
    user.status = "active";
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();
    return user;
  } catch (error) {
    console.error("Error verifying email:", error);
    throw error;
  }
}

// Set password reset code
export async function setPasswordResetCode(email) {
  try {
    await connectToMongoDB();
    const { generatePasswordResetCode } = await import("./auth");

    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    const resetCode = generatePasswordResetCode();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    console.log("Setting reset code for email:", email, "code:", resetCode, "expires:", resetExpires);

    user.passwordResetCode = resetCode;
    user.passwordResetExpires = resetExpires;
    await user.save();

    return resetCode;
  } catch (error) {
    console.error("Error setting password reset code:", error);
    throw error;
  }
}

// Verify reset code
export async function verifyResetCode(email, code) {
  try {
    await connectToMongoDB();
    console.log("Verifying reset code for email:", email, "code:", code);

    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetCode: code,
      passwordResetExpires: { $gt: Date.now() },
    });

    console.log("User found:", !!user);
    if (user) {
      console.log("User reset code:", user.passwordResetCode, "expires:", user.passwordResetExpires);
    }

    if (!user) {
      throw new Error("Invalid or expired reset code");
    }

    return user;
  } catch (error) {
    console.error("Error verifying reset code:", error);
    throw error;
  }
}

// Reset password with code
export async function resetPasswordWithCode(email, code, newPassword) {
  try {
    await connectToMongoDB();
    const user = await User.findOne({
      email: email,
      passwordResetCode: code,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error("Invalid or expired reset code");
    }

    user.password = newPassword; // Will be hashed by pre-save middleware
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.status = "active"; // Activate account after successful password reset

    await user.save();
    return user;
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
}

// Add refresh token
export async function addRefreshToken(userId, token) {
  try {
    await connectToMongoDB();
    await User.findByIdAndUpdate(userId, {
      $push: {
        refreshTokens: { token },
      },
    });
  } catch (error) {
    console.error("Error adding refresh token:", error);
    throw error;
  }
}

// Remove refresh token
export async function removeRefreshToken(userId, token) {
  try {
    await connectToMongoDB();
    await User.findByIdAndUpdate(userId, {
      $pull: {
        refreshTokens: { token },
      },
    });
  } catch (error) {
    console.error("Error removing refresh token:", error);
    throw error;
  }
}

// Remove all refresh tokens
export async function removeAllRefreshTokens(userId) {
  try {
    await connectToMongoDB();
    await User.findByIdAndUpdate(userId, {
      $set: {
        refreshTokens: [],
      },
    });
  } catch (error) {
    console.error("Error removing all refresh tokens:", error);
    throw error;
  }
}

// Update last login
export async function updateLastLogin(userId) {
  try {
    await connectToMongoDB();
    await User.findByIdAndUpdate(userId, {
      lastLogin: new Date(),
    });
  } catch (error) {
    console.error("Error updating last login:", error);
    throw error;
  }
}

// Get all users (admin only)
export async function getAllUsers(page = 1, limit = 10, status = null) {
  try {
    await connectToMongoDB();
    const query = status ? { status } : {};
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select("-password -refreshTokens")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
}
