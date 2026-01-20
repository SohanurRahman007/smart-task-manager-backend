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
  _id: string;
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
  _id: string;
  name: string;
  description?: string;
  stages: IWorkflowStage[];
  createdBy: string;
  isDefault: boolean;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Add to existing ITask interface
export interface ITask {
  _id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  currentStage: string; // Stage ID
  assignedTo: string[]; // User IDs
  dueDate?: Date;
  completedAt?: Date;
  workflowId: string;
  projectId?: string;
  createdBy: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivityLog {
  _id: string;
  taskId: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  previousStage?: string;
  newStage?: string;
  createdAt: Date;
}

export interface INotification {
  _id: string;
  userId: string;
  message: string;
  taskId?: string;
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
