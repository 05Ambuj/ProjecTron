export interface AdminDashboardStats {
  totalOrganizations: number;
  totalUsers: number;
  totalProjects: number;
  openTasks: number;
}

/* ================== PROJECTS ================== */

export interface ProjectDto {
  projectId: string;

  code: string;
  name: string;
  description?: string;

  organizationId: string;
  organizationName?: string;

  projectManagerId: string;
  projectManagerName?: string;

  status: number;
  priority: number;

  startDate: string;
  endDate: string;

  progressPercentage: number;
  budget: number;
  maxAllocations: number;

  createdDate?: string;
}

export interface CreateProjectRequest {
  organizationId: string;
  code: string;
  name: string;
  description?: string;

  projectManagerId: string;

  status: number;
  priority: number;

  startDate: string;
  endDate: string;

  budget: number;
  maxAllocations: number;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;

  projectManagerId?: string; // ✅ OPTIONAL

  status: number;
  priority: number;

  startDate: string;
  endDate: string;
 
  budget: number;
  maxAllocations?: number;
}

/* ================== ORGANIZATIONS ================== */

export interface OrganizationDto {
  organizationId: string;
  name: string;
  location: string;
  isActive: boolean;
  userCount: number;
  projectCount: number;
}

export interface CreateOrganizationRequest {
  name: string;
  location: string;
}

/* ================== TASKS ================== */

export interface TaskDTO {
  taskId: string;
  projectId: string;
  projectName: string;
  sprintId?: string;
  sprintName?: string;

  taskCode: string;
  title: string;
  description: string;  // ✅ ADD THIS

  taskType: number;
  taskTypeDisplay: string;
  priority: number;  // ✅ ADD THIS
  priorityDisplay: string;
  status: number;  // ✅ ADD THIS
  statusDisplay: string;
  complexity: number;
  riskLevel: number;

  storyPoints: number;  // ✅ ADD THIS
  estimatedHours: number;
  actualHours: number;
  progressPercentage: number;

  assignedToUserId?: string;
  assignedToUserName?: string;
  assignedByUserId: string;
  assignedByUserName?: string;
  reviewerId?: string;
  reviewerName?: string;

  startDate?: string;
  dueDate?: string;
  actualStartDate?: string;
  completedDate?: string;

  blockedReason?: string;

  acceptanceCriteria?: string;
  effortCategory?: string;
  skillsRequired?: string;

  commentCount: number;

  isOverdue: boolean;
  daysUntilDue: number;

  createdDate: string;
  updatedDate?: string;
  createdBy: string;
}

/* ================== TASK FILTER ================== */

export interface TaskFilter {
  projectId?: string;
  sprintId?: string;
  assignedToUserId?: string;

  status?: number;
  priority?: number;
  isOverdue?: boolean;

  searchTerm?: string;

  pageNumber?: number;
  pageSize?: number;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/* ================== AUDIT LOGS ================== */

export interface AuditLogDto {
  auditLogId: string;
  entityType: string;
  entityId: string;
  action: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  userId: string;
  userEmail: string;
  description?: string;
  createdDate: string;
  ipAddress?: string;
}

export interface AuditLogFilter {
  entityType?: string;
  action?: string;
  userEmail?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
} 
