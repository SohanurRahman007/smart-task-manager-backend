import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import { Task } from "../models/Task";
import { Workflow } from "../models/Workflow";
import { ActivityLog } from "../models/ActivityLog";
import { TaskPriority } from "../types";
import { Notification } from "../models/Notification";

// Helper: Create activity log
const createActivityLog = async (
  taskId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  action: string,
  details: any = {},
) => {
  await ActivityLog.create({
    taskId,
    userId,
    action,
    details,
  });
};

// Helper: Create notification
const createNotification = async (
  userId: mongoose.Types.ObjectId,
  message: string,
  taskId?: mongoose.Types.ObjectId,
  type = "task_assigned",
) => {
  await Notification.create({
    userId,
    message,
    taskId,
    type,
  });
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
export const createTask = asyncHandler(async (req: any, res: Response) => {
  const {
    title,
    description,
    priority,
    workflowId,
    assignedTo,
    dueDate,
    tags,
    projectId,
  } = req.body;

  // Get workflow to validate and get first stage
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    res.status(404);
    throw new Error("Workflow not found");
  }

  // Get first stage from workflow
  const firstStage = workflow.stages.sort((a, b) => a.order - b.order)[0];
  if (!firstStage) {
    res.status(400);
    throw new Error("Workflow has no stages");
  }

  // Create task
  const task = await Task.create({
    title,
    description,
    priority: priority || TaskPriority.MEDIUM,
    workflowId,
    currentStage: firstStage.id,
    assignedTo: assignedTo || [],
    dueDate,
    tags,
    projectId: projectId || workflow.projectId || "default",
    createdBy: req.user._id,
  });

  // Log activity
  await createActivityLog(task._id, req.user._id, "TASK_CREATED", {
    title,
    priority: task.priority,
  });

  // Notify assigned users
  if (assignedTo && assignedTo.length > 0) {
    for (const userId of assignedTo) {
      await createNotification(
        userId,
        `New task assigned: "${title}"`,
        task._id,
        "task_assigned",
      );
    }
  }

  // Populate relationships
  const populatedTask = await Task.findById(task._id)
    .populate("workflow", "name stages")
    .populate("assignees", "name email")
    .populate("creator", "name email");

  res.status(201).json({
    success: true,
    data: populatedTask,
  });
});

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
export const getTasks = asyncHandler(async (req: any, res: Response) => {
  const {
    workflowId,
    projectId,
    stage,
    priority,
    assignedTo,
    search,
    page = 1,
    limit = 10,
  } = req.query;

  const filter: any = {};
  const user = req.user;

  // Role-based filtering
  if (user.role === "member") {
    // Members can only see tasks assigned to them
    filter.assignedTo = user._id;
  }

  // Apply filters
  if (workflowId) filter.workflowId = workflowId;
  if (projectId) filter.projectId = projectId;
  if (stage) filter.currentStage = stage;
  if (priority) filter.priority = priority;
  if (assignedTo && user.role !== "member") {
    filter.assignedTo = assignedTo;
  }

  // Search
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  // Pagination
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate("workflow", "name stages")
      .populate("assignees", "name email")
      .populate("creator", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string)),
    Task.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: tasks.length,
    total,
    pages: Math.ceil(total / parseInt(limit as string)),
    currentPage: parseInt(page as string),
    data: tasks,
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = asyncHandler(async (req: any, res: Response) => {
  const task = await Task.findById(req.params.id)
    .populate("workflow", "name stages")
    .populate("assignees", "name email role")
    .populate("creator", "name email");

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  // Check permissions
  if (
    req.user.role === "member" &&
    !task.assignedTo.some((id: any) => id.equals(req.user._id))
  ) {
    res.status(403);
    throw new Error("Not authorized to access this task");
  }

  // Get activity logs
  const activityLogs = await ActivityLog.find({ taskId: task._id })
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    success: true,
    data: {
      ...task.toObject(),
      activityLogs,
    },
  });
});

// @desc    Update task stage (Workflow progression)
// @route   PATCH /api/tasks/:id/stage
// @access  Private
export const updateTaskStage = asyncHandler(async (req: any, res: Response) => {
  const { stageId } = req.body;
  const taskId = req.params.id;

  const task = await Task.findById(taskId).populate("workflow");
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  // Check permissions
  if (
    req.user.role === "member" &&
    !task.assignedTo.some((id: any) => id.equals(req.user._id))
  ) {
    res.status(403);
    throw new Error("Not authorized to update this task");
  }

  // Get workflow
  const workflow = await Workflow.findById(task.workflowId);
  if (!workflow) {
    res.status(404);
    throw new Error("Workflow not found");
  }

  // Find current and new stage
  const currentStage = workflow.stages.find((s) => s.id === task.currentStage);
  const newStage = workflow.stages.find((s) => s.id === stageId);

  if (!newStage) {
    res.status(400);
    throw new Error("Invalid stage");
  }

  // Validate workflow order (can't jump stages unless admin/manager)
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    if (currentStage && newStage.order < currentStage.order) {
      res.status(400);
      throw new Error("Cannot move task to previous stage");
    }
  }

  const previousStage = task.currentStage;
  task.currentStage = stageId;

  // If moving to "Done" stage, set completedAt
  if (newStage.name.toLowerCase() === "done" && !task.completedAt) {
    task.completedAt = new Date();

    // Notify assigned users
    for (const userId of task.assignedTo) {
      await createNotification(
        userId,
        `Task completed: "${task.title}"`,
        task._id,
        "completed",
      );
    }
  }

  await task.save();

  // Log activity
  await createActivityLog(task._id, req.user._id, "STAGE_CHANGED", {
    previousStage,
    newStage: stageId,
    stageName: newStage.name,
  });

  // Notify assigned users
  for (const userId of task.assignedTo) {
    if (!userId.equals(req.user._id)) {
      await createNotification(
        userId,
        `Task "${task.title}" moved to ${newStage.name}`,
        task._id,
        "stage_changed",
      );
    }
  }

  const populatedTask = await Task.findById(task._id)
    .populate("workflow", "name stages")
    .populate("assignees", "name email");

  res.json({
    success: true,
    data: populatedTask,
    message: `Task moved to ${newStage.name}`,
  });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = asyncHandler(async (req: any, res: Response) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  // Check permissions
  if (
    req.user.role === "member" &&
    !task.assignedTo.some((id: any) => id.equals(req.user._id))
  ) {
    res.status(403);
    throw new Error("Not authorized to update this task");
  }

  const oldAssignedTo = [...task.assignedTo];

  // Update task
  Object.assign(task, req.body);
  await task.save();

  // Log activity
  await createActivityLog(task._id, req.user._id, "TASK_UPDATED", {
    fields: Object.keys(req.body),
  });

  // Check for new assignees and notify them
  const newAssignees = task.assignedTo.filter(
    (id: any) => !oldAssignedTo.some((oldId) => oldId.equals(id)),
  );

  for (const userId of newAssignees) {
    await createNotification(
      userId,
      `You've been assigned to task: "${task.title}"`,
      task._id,
      "task_assigned",
    );
  }

  const populatedTask = await Task.findById(task._id)
    .populate("workflow", "name stages")
    .populate("assignees", "name email");

  res.json({
    success: true,
    data: populatedTask,
  });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin/Manager only)
export const deleteTask = asyncHandler(async (req: any, res: Response) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  // Only admin/manager can delete
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    res.status(403);
    throw new Error("Not authorized to delete tasks");
  }

  // Also delete associated activity logs
  await ActivityLog.deleteMany({ taskId: task._id });

  await task.deleteOne();

  res.json({
    success: true,
    data: {},
    message: "Task deleted successfully",
  });
});

// @desc    Get task analytics
// @route   GET /api/tasks/analytics/overview
// @access  Private
export const getTaskAnalytics = asyncHandler(
  async (req: any, res: Response) => {
    const { projectId, startDate, endDate } = req.query;

    const filter: any = {};
    const user = req.user;

    // Role-based filtering
    if (user.role === "member") {
      filter.assignedTo = user._id;
    }
    if (projectId) filter.projectId = projectId;

    // Date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Aggregation pipeline for analytics
    const analytics = await Task.aggregate([
      { $match: filter },
      {
        $facet: {
          // Tasks by stage
          byStage: [
            {
              $group: {
                _id: "$currentStage",
                count: { $sum: 1 },
              },
            },
          ],
          // Tasks by priority
          byPriority: [
            {
              $group: {
                _id: "$priority",
                count: { $sum: 1 },
              },
            },
          ],
          // Tasks by completion
          byCompletion: [
            {
              $group: {
                _id: {
                  $cond: [
                    { $ne: ["$completedAt", null] },
                    "completed",
                    "pending",
                  ],
                },
                count: { $sum: 1 },
              },
            },
          ],
          // Overdue tasks
          overdue: [
            {
              $match: {
                dueDate: { $lt: new Date() },
                completedAt: null,
              },
            },
            { $count: "count" },
          ],
          // Average completion time (for completed tasks)
          avgCompletionTime: [
            {
              $match: {
                completedAt: { $ne: null },
                createdAt: { $ne: null },
              },
            },
            {
              $addFields: {
                completionTime: {
                  $divide: [
                    { $subtract: ["$completedAt", "$createdAt"] },
                    1000 * 60 * 60 * 24, // Convert to days
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                avgDays: { $avg: "$completionTime" },
              },
            },
          ],
        },
      },
    ]);

    res.json({
      success: true,
      data: analytics[0],
    });
  },
);
