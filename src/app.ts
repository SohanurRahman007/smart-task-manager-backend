import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database";

// Load environment variables FIRST
dotenv.config();

console.log("🔧 Environment check:");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- PORT:", process.env.PORT);
console.log("- MONGO_URI:", process.env.MONGO_URI ? "Set ✓" : "Not set ✗");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// Basic route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Smart Task API is running",
    timestamp: new Date().toISOString(),
    mongoConnected: mongoose.connection.readyState === 1,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Import mongoose for connection check
import mongoose from "mongoose";

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
