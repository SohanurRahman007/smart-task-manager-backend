import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { User } from "../models/User";

// Helper function for JWT sign
const signToken = (payload: object, secret: string, expiresIn?: string) => {
  if (expiresIn) {
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }
  return jwt.sign(payload, secret);
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill all fields");
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: role || "member",
  });

  // Generate tokens
  const accessToken = signToken(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    process.env.JWT_EXPIRE || "1d",
  );

  const refreshToken = signToken(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET!,
    process.env.JWT_REFRESH_EXPIRE || "7d",
  );

  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const accessToken = signToken(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    process.env.JWT_EXPIRE || "1d",
  );

  const refreshToken = signToken(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET!,
    process.env.JWT_REFRESH_EXPIRE || "7d",
  );

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = asyncHandler(async (req: any, res: Response) => {
  const user = await User.findById(req.user.id).select("-password");

  res.json({
    success: true,
    user,
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400);
      throw new Error("Refresh token required");
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!,
      ) as { id: string };
      const user = await User.findById(decoded.id);

      if (!user) {
        res.status(401);
        throw new Error("User not found");
      }

      const newAccessToken = signToken(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        process.env.JWT_EXPIRE || "1d",
      );

      res.json({
        success: true,
        accessToken: newAccessToken,
      });
    } catch (error) {
      res.status(401);
      throw new Error("Invalid refresh token");
    }
  },
);
