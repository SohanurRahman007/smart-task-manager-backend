import express from "express";
import {
  createWorkflow,
  getWorkflows,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
} from "../controllers/workflowController";
import { auth, requireRole } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Create workflow - Admin/Manager only
router.post("/", requireRole("admin", "manager"), createWorkflow);

// Get all workflows
router.get("/", getWorkflows);

// Get single workflow
router.get("/:id", getWorkflowById);

// Update workflow - Admin/Manager only
router.put("/:id", requireRole("admin", "manager"), updateWorkflow);

// Delete workflow - Admin/Manager only
router.delete("/:id", requireRole("admin", "manager"), deleteWorkflow);

export default router;
