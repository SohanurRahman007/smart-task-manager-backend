import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStage,
  deleteTask,
  getTaskAnalytics,
} from "../controllers/taskController";
import { auth, requireRole } from "../middleware/auth";

const router = express.Router();

router.use(auth);

router.route("/").post(createTask).get(getTasks);

router.route("/analytics/overview").get(getTaskAnalytics);

router
  .route("/:id")
  .get(getTaskById)
  .put(updateTask)
  .delete(requireRole("admin", "manager"), deleteTask);

router.patch("/:id/stage", updateTaskStage);

export default router;
