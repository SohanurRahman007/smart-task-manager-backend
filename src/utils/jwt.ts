// Method 1: Import as namespace
import jwt = require("jsonwebtoken");
import { IUser } from "../types";

export const generateTokens = (user: IUser) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  // Get secrets with proper checks
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret || !refreshSecret) {
    throw new Error("JWT secrets not configured");
  }

  const accessToken = jwt.sign(payload, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRE || "1d",
  } as jwt.SignOptions);

  const refreshToken = jwt.sign({ id: user._id }, refreshSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return jwt.verify(token, secret);
};

export const verifyRefreshToken = (token: string) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET not configured");
  return jwt.verify(token, secret);
};
