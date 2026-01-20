import mongoose, { Schema } from "mongoose";
import { IWorkflow, IWorkflowStage } from "../types";

const workflowStageSchema = new Schema<IWorkflowStage>({
  id: {
    type: String,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  order: {
    type: Number,
    required: true,
    min: 0,
  },
  color: {
    type: String,
    default: "#6B7280",
  },
});

const workflowSchema = new Schema<IWorkflow>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    stages: [workflowStageSchema],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    projectId: {
      type: String,
      default: "default",
    },
  },
  {
    timestamps: true,
  },
);

// Ensure stage orders are unique within a workflow
workflowSchema.index({ "stages.order": 1 }, { unique: true, sparse: true });
workflowSchema.index({ createdBy: 1 });
workflowSchema.index({ isDefault: 1 });
workflowSchema.index({ projectId: 1 });

export const Workflow = mongoose.model<IWorkflow>("Workflow", workflowSchema);
