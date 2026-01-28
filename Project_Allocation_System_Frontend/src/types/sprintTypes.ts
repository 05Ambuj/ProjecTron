export interface SprintDTO {
  sprintId: string;
  projectId: string;
  projectName: string;
  name: string;
  goals: string;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  totalStoryPoints: number;
  completedStoryPoints: number;
  progressPercentage: number;
  status: SprintStatus;
  statusDisplay: string;
  totalTasks: number;
  completedTasks: number;
  teamMemberCount: number;
  daysRemaining: number;
  durationInDays: number;
  notes?: string;
  createdDate: string;
  createdBy: string;
  members: SprintMemberDTO[];
  timeSummary?: SprintTimeSummaryDTO;
}

export const SprintStatus = {
  Planned: 0,
  Active: 1,
  Completed: 2,
  Cancelled: 3,
} as const;

export type SprintStatus = (typeof SprintStatus)[keyof typeof SprintStatus];

export interface SprintMemberDTO {
  sprintMemberId: string;
  userId: string;
  userName: string;
  email: string;
  role: number;
  availableHoursPerWeek: number;
  allocatedStoryPoints: number;
  completedStoryPoints: number;
  utilizationPercentage: number;
}

export interface SprintCreateRequest {
  projectId: string;
  name: string;
  goals: string;
  startDate: string;
  endDate: string;
  totalStoryPoints: number;
  notes?: string;
  members: SprintMemberCreateRequest[];
}

export interface SprintMemberCreateRequest {
  userId: string;
  availableHoursPerWeek: number;
  allocatedStoryPoints: number;
}

export interface SprintUpdateRequest {
  name?: string;
  goals?: string;
  startDate?: string;
  endDate?: string;
  totalStoryPoints?: number;
  status?: SprintStatus;
  notes?: string;
}

export interface SprintStatsDTO {
  sprintId: string;
  sprintName: string;
  totalStoryPoints: number;
  completedStoryPoints: number;
  remainingStoryPoints: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  teamVelocity: number;
  averageTaskCompletionTime: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  memberProgress: TeamMemberProgressDTO[];
}

export interface TeamMemberProgressDTO {
  userId: string;
  userName: string;
  assignedTasks: number;
  completedTasks: number;
  allocatedStoryPoints: number;
  completedStoryPoints: number;
  completionPercentage: number;
}

export interface SprintTimeSummaryDTO {
  durationDays: number;
  totalPlannedHours: number;
  loggedHours: number;
  remainingHours: number;
  timeUtilizationPercentage: number;
  isOverAllocated: boolean;
  actualStartDate?: string;
  actualEndDate?: string;
  elapsedTime?: string;
  remainingTime?: string;
}
