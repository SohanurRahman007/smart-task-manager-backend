import mongoose, { Schema } from "mongoose";
import { INotification } from "../types";

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
    type: {
      type: String,
      enum: [
        "task_assigned",
        "stage_changed",
        "due_date",
        "completed",
        "mention",
      ],
      default: "task_assigned",
    },
    read: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtuals
notificationSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

notificationSchema.virtual("task", {
  ref: "Task",
  localField: "taskId",
  foreignField: "_id",
  justOne: true,
});

// Indexes
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
