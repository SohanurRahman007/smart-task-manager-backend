import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database";
import authRoutes from "./routes/auth";
import { errorHandler } from "./middleware/errorHandler";
import workflowRoutes from "./routes/workflow";
import taskRoutes from "./routes/task";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/tasks", taskRoutes);

// Health check
app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose");
  res.json({
    status: "OK",
    service: "Smart Task Manager API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// Error handler (MUST be after routes)
app.use(errorHandler);

// 404 handler (MUST be last)
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    availableRoutes: [
      "GET  /api/health",
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET  /api/auth/profile",
      "POST /api/auth/refresh",
    ],
  });
});

app.listen(PORT, () => {
  console.log("\n🚀 Smart Task Manager Backend");
  console.log("=============================");
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth API ready!`);
});
