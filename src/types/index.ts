import { Types } from "mongoose";

export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  MEMBER = "member",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkflowStage {
  id: string;
  name: string;
  order: number;
  color?: string;
}

export interface IWorkflow {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  stages: IWorkflowStage[];
  createdBy: Types.ObjectId;
  isDefault: boolean;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  _id: Types.ObjectId;
  title: string;
  description: string;
  priority: TaskPriority;
  currentStage: string; // Stage ID
  assignedTo: Types.ObjectId[];
  dueDate?: Date;
  completedAt?: Date;
  workflowId: Types.ObjectId;
  projectId?: string;
  createdBy: Types.ObjectId;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivityLog {
  _id: Types.ObjectId;
  taskId: Types.ObjectId;
  userId: Types.ObjectId;
  action: string;
  details: Record<string, any>;
  previousStage?: string;
  newStage?: string;
  createdAt: Date;
}

export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  taskId?: Types.ObjectId;
  type:
    | "task_assigned"
    | "stage_changed"
    | "due_date"
    | "completed"
    | "mention";
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
