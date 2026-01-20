import mongoose, { Schema } from "mongoose";
import { IActivityLog } from "../types";

const activityLogSchema = new Schema<IActivityLog>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    previousStage: {
      type: String,
    },
    newStage: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

activityLogSchema.index({ taskId: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ action: 1 });

export const ActivityLog = mongoose.model<IActivityLog>(
  "ActivityLog",
  activityLogSchema,
);
