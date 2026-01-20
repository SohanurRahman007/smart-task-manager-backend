import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Workflow } from "../models/Workflow";

// @desc    Create workflow
// @route   POST /api/workflows
// @access  Private (Admin/Manager)
export const createWorkflow = asyncHandler(async (req: any, res: Response) => {
  const { name, description, stages, projectId, isDefault } = req.body;

  // Validate stages
  if (!stages || stages.length === 0) {
    res.status(400);
    throw new Error("At least one stage is required");
  }

  // Ensure unique stage orders
  const stageOrders = stages.map((s: any) => s.order);
  const uniqueOrders = new Set(stageOrders);
  if (stageOrders.length !== uniqueOrders.size) {
    res.status(400);
    throw new Error("Stage orders must be unique");
  }

  const workflow = await Workflow.create({
    name,
    description,
    stages: stages.map((stage: any, index: number) => ({
      ...stage,
      order: stage.order || index,
    })),
    createdBy: req.user.id,
    projectId: projectId || "default",
    isDefault: isDefault || false,
  });

  res.status(201).json({
    success: true,
    workflow,
  });
});

// @desc    Get all workflows
// @route   GET /api/workflows
// @access  Private
export const getWorkflows = asyncHandler(async (req: any, res: Response) => {
  const { projectId } = req.query;

  const filter: any = {};
  if (projectId) filter.projectId = projectId;

  // Admin/Manager can see all, members see only default or assigned
  if (req.user.role === "member") {
    filter.$or = [{ isDefault: true }, { createdBy: req.user.id }];
  }

  const workflows = await Workflow.find(filter).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: workflows.length,
    workflows,
  });
});

// @desc    Get workflow by ID
// @route   GET /api/workflows/:id
// @access  Private
export const getWorkflowById = asyncHandler(async (req: any, res: Response) => {
  const workflow = await Workflow.findById(req.params.id);

  if (!workflow) {
    res.status(404);
    throw new Error("Workflow not found");
  }

  // Check permissions
  if (
    workflow.createdBy.toString() !== req.user.id &&
    req.user.role === "member" &&
    !workflow.isDefault
  ) {
    res.status(403);
    throw new Error("Not authorized to access this workflow");
  }

  res.json({
    success: true,
    workflow,
  });
});

// @desc    Update workflow
// @route   PUT /api/workflows/:id
// @access  Private (Admin/Manager)
export const updateWorkflow = asyncHandler(async (req: any, res: Response) => {
  const workflow = await Workflow.findById(req.params.id);

  if (!workflow) {
    res.status(404);
    throw new Error("Workflow not found");
  }

  // Check if user can update
  if (
    workflow.createdBy.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Not authorized to update this workflow");
  }

  // Prevent updating default workflows unless admin
  if (workflow.isDefault && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Cannot update default workflow");
  }

  const updatedWorkflow = await Workflow.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true },
  );

  res.json({
    success: true,
    workflow: updatedWorkflow,
  });
});

// @desc    Delete workflow
// @route   DELETE /api/workflows/:id
// @access  Private (Admin/Manager)
export const deleteWorkflow = asyncHandler(async (req: any, res: Response) => {
  const workflow = await Workflow.findById(req.params.id);

  if (!workflow) {
    res.status(404);
    throw new Error("Workflow not found");
  }

  // Check if user can delete
  if (
    workflow.createdBy.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Not authorized to delete this workflow");
  }

  // Prevent deleting default workflows unless admin
  if (workflow.isDefault && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Cannot delete default workflow");
  }

  await workflow.deleteOne();

  res.json({
    success: true,
    message: "Workflow removed",
  });
});
