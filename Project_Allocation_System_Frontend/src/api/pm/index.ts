import api from "../client";
import type {
  PMDashboardStats,
  ProjectAllocationDTO,
  AssignUserRequest,
  TeamDTO,
  ProjectTeamsDTO,
  CreateTeamRequest,
  UpdateTeamRequest,
  AddTeamMemberRequest,
  TeamMemberDTO,
} from "../../types/pmTypes";
import type { UserDto, PagedResponse } from "../../types/userTypes";
import type { ProjectDto, TaskDTO } from "../../types/adminTypes";
import { canManageProjects } from "../../utils/permission";
import { UserRole } from "../../constants/roles";
import type { ApiResponse } from "../../types/types";

type CamelPaged<T> = { items: T[]; totalCount?: number; page?: number; pageSize?: number };
type PascalPaged<T> = { Items: T[]; TotalCount?: number; Page?: number; PageSize?: number };
type ListResponse<T> = T[] | CamelPaged<T> | PascalPaged<T>;

// Normalizes list responses from either array or paged shapes
function normalizeList<T>(data: ListResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  if ("items" in data) return data.items;
  if ("Items" in data) return data.Items;
  return [];
}

/* ---------------- Dashboard ---------------- */
function assertCanManageAllocations(role: UserRole) {
  if (role !== UserRole.Admin && role !== UserRole.ProjectManager) {
    throw new Error("Forbidden: insufficient permissions");
  }
}

export async function fetchPMDashboardStats(): Promise<PMDashboardStats> {
  const res = await api.get<ApiResponse<PMDashboardStats>>(
    "/project-manager/dashboard",
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load dashboard stats");
  }

  return res.data.data;
}

/* ---------------- Projects ---------------- */

export async function fetchPMProjects(
  pageNumber = 1,
  pageSize = 10,
  actorRole: UserRole,
): Promise<ProjectDto[]> {
  if (!canManageProjects(actorRole)) {
    throw new Error("Forbidden");
  }
  const res = await api.get<
    ApiResponse<ListResponse<ProjectDto>>
  >("/projects", {
    params: { pageNumber, pageSize },
  });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load projects");
  }

  return normalizeList<ProjectDto>(res.data.data);
}

export async function fetchPMProjectById(
  projectId: string,
  actorRole: UserRole,
): Promise<ProjectDto> {
  if (!canManageProjects(actorRole)) {
    throw new Error("Forbidden");
  }
  const res = await api.get<ApiResponse<ProjectDto>>(`/projects/${projectId}`);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load project");
  }

  return res.data.data;
}

export async function updatePMProject(
  projectId: string,
  payload: {
    name?: string;
    description?: string;
    status: number;
    priority: number;
    startDate: string;
    endDate: string;
    budget: number;
    maxAllocations?: number;
  },
  actorRole: UserRole,
): Promise<ProjectDto> {
  if (!canManageProjects(actorRole)) {
    throw new Error("Forbidden");
  }
  const res = await api.put<ApiResponse<ProjectDto>>(
    `/projects/${projectId}`,
    payload,
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to update project");
  }

  return res.data.data;
}

/* ---------------- Project Allocations ---------------- */

export async function fetchProjectAllocations(
  projectId: string,
): Promise<ProjectAllocationDTO[]> {
  console.log('Fetching allocations for project:', projectId);
  const res = await api.get<ApiResponse<ProjectAllocationDTO[]>>(
    `/projects/${projectId}/allocations`,
  );

  console.log('Allocations API response:', res.data);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load allocations");
  }

  return res.data.data;
}

export async function assignUserToProject(
  projectId: string,
  payload: AssignUserRequest,
  actorRole: UserRole,
): Promise<boolean> {
  assertCanManageAllocations(actorRole);

  const res = await api.post<ApiResponse<boolean>>(
    `/projects/${projectId}/allocations`,
    payload,
  );

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to assign user");
  }

  return true;
}

export async function fetchAssignableUsers(
  params: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    role?: number;
  } = {},
): Promise<PagedResponse<UserDto>> {
  const { page = 1, pageSize = 20, searchTerm, role } = params;
  const res = await api.get<ApiResponse<PagedResponse<UserDto>>>("/users", {
    params: {
      page,
      pageSize,
      searchTerm,
      role,
    },
  });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load users");
  }

  return res.data.data;
}

export async function removeUserFromProject(
  projectId: string,
  userId: string,
  actorRole: UserRole,
): Promise<boolean> {
  assertCanManageAllocations(actorRole);
  const res = await api.delete<ApiResponse<boolean>>(
    `/projects/${projectId}/allocations/${userId}`,
  );

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to remove user");
  }

  return true;
}

/* ---------------- Tasks ---------------- */

export async function fetchPMTasks(params: {
  projectId: string; // REQUIRED
  status?: number;
  priority?: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<TaskDTO[]> {
  if (!params.projectId) {
    throw new Error("ProjectId is required for PM task queries");
  }

  const res = await api.get<ApiResponse<PagedResponse<TaskDTO>>>("/tasks", { params });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load tasks");
  }

  // Try both PascalCase (Items) and camelCase (items) for compatibility
  const data = res.data.data;
  const items = (data as any).items || (data as any).Items || [];
  return items;
}

export async function createPMTask(payload: {
  projectId: string;
  sprintId: string;
  title: string;
  description: string;
  taskType: number;
  priority: number;
  complexity: number;
  riskLevel: number;
  storyPoints: number;
  estimatedHours: number;
  acceptanceCriteria?: string;
  effortCategory?: string;
  assignedToUserId?: string;
  reviewerId?: string;
  dueDate?: string;
}): Promise<TaskDTO> {
  const res = await api.post<ApiResponse<TaskDTO>>("/tasks", payload);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to create task");
  }

  return res.data.data;
}

export async function updatePMTask(
  taskId: string,
  payload: {
    title?: string;
    description?: string;
    taskType?: number;
    priority?: number;
    complexity?: number;
    riskLevel?: number;
    storyPoints?: number;
    estimatedHours?: number;
    actualHours?: number;
    assignedToUserId?: string;
    reviewerId?: string;
    startDate?: string;
    dueDate?: string;
    acceptanceCriteria?: string;
    effortCategory?: string;
  },
): Promise<TaskDTO> {
  const res = await api.put<ApiResponse<TaskDTO>>(`/tasks/${taskId}`, payload);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to update task");
  }

  return res.data.data;
}

export async function deletePMTask(taskId: string): Promise<boolean> {
  const res = await api.delete<ApiResponse<boolean>>(`/tasks/${taskId}`);

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to delete task");
  }

  return true;
}

export async function assignPMTask(
  taskId: string,
  payload: {
    assignedToUserId: string;
    reviewerId?: string;
    assignmentNote?: string;
  },
): Promise<TaskDTO> {
  const res = await api.post<ApiResponse<TaskDTO>>(`/tasks/${taskId}/assign`, payload);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to assign task");
  }

  return res.data.data;
}

export async function addPMTaskComment(
  taskId: string,
  payload: {
    text: string;
    commentType?: number;
    isBlocking?: boolean;
    taggedUserId?: string;
    codeSnippet?: string;
  },
): Promise<unknown> {
  const res = await api.post<ApiResponse<unknown>>(`/tasks/${taskId}/comments`, payload);

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to add comment");
  }

  return res.data.data;
}

export async function fetchPMSprintsByProject(projectId: string) {
  const res = await api.get<ApiResponse<unknown[]>>(`/sprints/project/${projectId}`);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load sprints");
  }

  return res.data.data;
}

export async function fetchPMOverdueTasks(projectId?: string): Promise<TaskDTO[]> {
  const res = await api.get<ApiResponse<ListResponse<TaskDTO>>>("/tasks/overdue", {
    params: { projectId },
  });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load overdue tasks");
  }

  return normalizeList<TaskDTO>(res.data.data);
}

export async function fetchPMNotStartedTasks(
  projectId?: string,
  daysUntilDue = 2,
): Promise<TaskDTO[]> {
  const res = await api.get<ApiResponse<ListResponse<TaskDTO>>>("/tasks/not-started", {
    params: { projectId, daysUntilDue },
  });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load not started tasks");
  }

  return normalizeList<TaskDTO>(res.data.data);
}

export async function fetchPMTaskBoard(projectId: string, assignedToUserId?: string) {
  const res = await api.get(`/tasks/board/${projectId}`, {
    params: assignedToUserId ? { assignedToUserId } : undefined,
  });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load task board");
  }

  // board is an object, return as-is
  return res.data.data;
}

/* ---------------- Team Management ---------------- */

export async function searchProjectsWithTeams(
  searchTerm?: string,
): Promise<ProjectTeamsDTO[]> {
  const res = await api.get<ApiResponse<ProjectTeamsDTO[]>>("/teams/search", {
    params: { searchTerm },
  });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to search projects");
  }

  return res.data.data;
}

export async function getProjectTeams(projectId: string): Promise<ProjectTeamsDTO> {
  const res = await api.get<ApiResponse<ProjectTeamsDTO>>(
    `/teams/project/${projectId}`,
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load project teams");
  }

  return res.data.data;
}

export async function getTeamById(teamId: string): Promise<TeamDTO> {
  const res = await api.get<ApiResponse<TeamDTO>>(`/teams/${teamId}`);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load team");
  }

  return res.data.data;
}

export async function createTeam(request: CreateTeamRequest): Promise<TeamDTO> {
  const res = await api.post<ApiResponse<TeamDTO>>("/teams", request);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to create team");
  }

  return res.data.data;
}

export async function updateTeam(
  teamId: string,
  request: UpdateTeamRequest,
): Promise<TeamDTO> {
  const res = await api.put<ApiResponse<TeamDTO>>(`/teams/${teamId}`, request);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to update team");
  }

  return res.data.data;
}

export async function deleteTeam(teamId: string): Promise<boolean> {
  const res = await api.delete<ApiResponse<boolean>>(`/teams/${teamId}`);

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to delete team");
  }

  return true;
}

export async function addTeamMember(
  teamId: string,
  request: AddTeamMemberRequest,
): Promise<TeamMemberDTO> {
  const res = await api.post<ApiResponse<TeamMemberDTO>>(
    `/teams/${teamId}/members`,
    request,
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to add team member");
  }

  return res.data.data;
}

export async function removeTeamMember(
  teamId: string,
  userId: string,
): Promise<boolean> {
  const res = await api.delete<ApiResponse<boolean>>(
    `/teams/${teamId}/members/${userId}`,
  );

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to remove team member");
  }

  return true;
}
