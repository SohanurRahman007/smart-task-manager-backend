import mongoose, { Schema } from "mongoose";
import { IWorkflow } from "../types";

const workflowStageSchema = new Schema({
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
});

const workflowSchema = new Schema<IWorkflow>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
  },
  {
    timestamps: true,
  },
);

// Ensure stage orders are unique within a workflow
workflowSchema.index({ "stages.order": 1 }, { unique: true, sparse: true });
workflowSchema.index({ createdBy: 1 });
workflowSchema.index({ isDefault: 1 });

export const Workflow = mongoose.model<IWorkflow>("Workflow", workflowSchema);
