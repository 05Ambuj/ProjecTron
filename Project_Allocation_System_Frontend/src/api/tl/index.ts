import api from "../client";
import type { ApiResponse } from "../../types/types";
import type { ProjectDto, TaskDTO } from "../../types/adminTypes";
import type { UserDto, PagedResponse } from "../../types/userTypes";
import type { SprintDTO } from "../../types/sprintTypes";
import type { ProjectAllocationDTO } from "../../types/pmTypes";

type CamelPaged<T> = {
  items: T[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
};

type PascalPaged<T> = {
  Items: T[];
  TotalCount?: number;
  Page?: number;
  PageSize?: number;
};

type ListResponse<T> = T[] | CamelPaged<T> | PascalPaged<T>;

function normalizeList<T>(data?: ListResponse<T>): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if ("items" in data && Array.isArray(data.items)) return data.items;
  if ("Items" in data && Array.isArray(data.Items)) return data.Items;
  return [];
}

/* ---------------- Dashboard Stats ---------------- */

export interface TLDashboardStats {
  assignedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  activeSprints: number;
  teamMembers: number;
}

export async function fetchTLDashboardStats(): Promise<TLDashboardStats> {
  const res = await api.get<ApiResponse<TLDashboardStats>>(
    "/team-lead/dashboard",
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load dashboard stats");
  }

  return res.data.data;
}

/* ---------------- Tasks ---------------- */

export async function fetchTLTasks(params?: {
  projectId?: string;
  status?: number;
  priority?: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<TaskDTO[]> {
  const res = await api.get<ApiResponse<ListResponse<TaskDTO>>>("/tasks", { params });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load tasks");
  }

  return normalizeList<TaskDTO>(res.data.data);
}

export async function fetchTLMyTasks(): Promise<TaskDTO[]> {
  const res = await api.get<ApiResponse<ListResponse<TaskDTO>>>("/tasks/my-tasks");

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load my tasks");
  }

  return normalizeList<TaskDTO>(res.data.data);
}

export async function fetchTLOverdueTasks(projectId?: string) {
  const res = await api.get<ApiResponse<ListResponse<TaskDTO>>>("/tasks/overdue", {
    params: { projectId },
  });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load overdue tasks");
  }

  return normalizeList<TaskDTO>(res.data.data);
}

/* ---------------- Projects ---------------- */

export async function fetchTLProjects(): Promise<ProjectDto[]> {
  const res = await api.get<ApiResponse<ProjectDto[]>>("/projects/assigned");

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load projects");
  }

  return res.data.data;
}

/* ---------------- Assignable Users (for TL task assignment) ---------------- */

export async function fetchTLAssignableUsers(params?: {
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  projectId?: string;
}): Promise<PagedResponse<UserDto>> {
  const { projectId } = params || {};

  // If projectId is provided, fetch project allocations (team members assigned to the project)
  if (projectId) {
    try {
      const res = await api.get<ApiResponse<ProjectAllocationDTO[]>>(
        `/projects/${projectId}/allocations`
      );

      if (!res.data.success) {
        // If 403, provide more helpful error message
        if (res.status === 403) {
          throw new Error("You don't have access to view team members for this project. Please ensure you are allocated to this project.");
        }
        throw new Error(res.data.message || "Failed to load project allocations");
      }

      if (!res.data.data) {
        // Return empty list if no data
        return {
          items: [],
          totalCount: 0,
          page: 1,
          pageSize: 0,
        };
      }

      // Convert allocations to UserDto format
      const items: UserDto[] = res.data.data.map((allocation) => ({
        userId: allocation.userId,
        email: allocation.email,
        displayName: allocation.userName,
        firstName: "",
        lastName: "",
        department: "",
        role: allocation.role,
        isActive: true,
        createdDate: allocation.createdDate,
      }));

      // Filter by search term if provided
      const searchTerm = params?.searchTerm?.toLowerCase() || "";
      const filteredItems = searchTerm
        ? items.filter(
            (u) =>
              u.displayName?.toLowerCase().includes(searchTerm) ||
              u.email?.toLowerCase().includes(searchTerm)
          )
        : items;

      return {
        items: filteredItems,
        totalCount: filteredItems.length,
        page: 1,
        pageSize: filteredItems.length,
      };
    } catch {
      // Fallback to empty list if project allocations fail
      return {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 0,
      };
    }
  }

  // Fallback: return empty list if no projectId
  return {
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 0,
  };
}

export async function createTLTask(payload: {
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
  dueDate?: string;
}): Promise<TaskDTO> {
  const res = await api.post<ApiResponse<TaskDTO>>("/tasks", payload);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to create task");
  }

  return res.data.data;
}

export async function fetchTLSprintsByProject(
  projectId: string,
): Promise<SprintDTO[]> {
  const res = await api.get<ApiResponse<SprintDTO[]>>(
    `/sprints/project/${projectId}`,
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load sprints");
  }

  return res.data.data;
}

export async function fetchTLAllTasks(params?: {
  projectId?: string;
  status?: number;
  priority?: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<TaskDTO[]> {
  const res = await api.get<ApiResponse<ListResponse<TaskDTO>>>("/tasks", { params });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load tasks");
  }

  return normalizeList<TaskDTO>(res.data.data);
}

export async function fetchTLTaskBoard(projectId: string) {
  const res = await api.get(`/tasks/board/${projectId}`);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load task board");
  }

  return res.data.data;
}

export async function fetchTLNotStartedTasks(projectId?: string, daysUntilDue = 2): Promise<TaskDTO[]> {
  const res = await api.get<ApiResponse<ListResponse<TaskDTO>>>("/tasks/not-started", {
    params: { projectId, daysUntilDue },
  });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load not started tasks");
  }

  return normalizeList<TaskDTO>(res.data.data);
}

export async function deleteTLTask(taskId: string): Promise<boolean> {
  const res = await api.delete<ApiResponse<boolean>>(`/tasks/${taskId}`);

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to delete task");
  }

  return true;
}

export async function updateTLTask(
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
