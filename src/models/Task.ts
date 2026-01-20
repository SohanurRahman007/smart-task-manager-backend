import mongoose, { Schema } from "mongoose";
import { ITask, TaskPriority } from "../types";

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    currentStage: {
      type: String,
      required: true,
    },
    assignedTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
    },
    projectId: {
      type: String,
      default: "default",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ currentStage: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ workflowId: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ projectId: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ completedAt: 1 });

export const Task = mongoose.model<ITask>("Task", taskSchema);
