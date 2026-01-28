import api from "../client";
import type { ApiResponse } from "../../types/types";
import type { ProjectDto, TaskDTO } from "../../types/adminTypes";

type CamelPaged<T> = { items: T[]; totalCount?: number; page?: number; pageSize?: number };
type PascalPaged<T> = { Items: T[]; TotalCount?: number; Page?: number; PageSize?: number };
type ListResponse<T> = T[] | CamelPaged<T> | PascalPaged<T>;

// Normalize list responses from either arrays or paged shapes
function normalizeList<T>(data: ListResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  if ("items" in data) return data.items;
  if ("Items" in data) return data.Items;
  return [];
}

/* ---------------- Dashboard Stats ---------------- */

export interface TMDashboardStats {
  myTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  hoursLogged: number;
  activeProjects: number;
}

export async function fetchTMDashboardStats(): Promise<TMDashboardStats> {
  const res = await api.get<ApiResponse<TMDashboardStats>>(
    "/team-member/dashboard",
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load dashboard stats");
  }

  return res.data.data;
}

/* ---------------- Tasks ---------------- */

export async function fetchTMMyTasks() {
  const res = await api.get<ApiResponse<ListResponse<TaskDTO>>>("/tasks/my-tasks");

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load my tasks");
  }

  return normalizeList<TaskDTO>(res.data.data);
}

export async function fetchTMTasks(params?: {
  projectId?: string;
  status?: number;
  pageNumber?: number;
  pageSize?: number;
}) {
  const res = await api.get<ApiResponse<ListResponse<TaskDTO>>>("/tasks", { params });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load tasks");
  }

  return normalizeList<TaskDTO>(res.data.data);
}

/* ---------------- Projects ---------------- */

export async function fetchTMProjects() {
  const res = await api.get<ApiResponse<ProjectDto[]>>("/projects/assigned");

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load projects");
  }

  return res.data.data;
}

export async function fetchTMProjectById(projectId: string): Promise<ProjectDto> {
  const res = await api.get<ApiResponse<ProjectDto>>(`/projects/${projectId}`);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load project");
  }

  return res.data.data;
}

export async function fetchTMTaskBoard(projectId: string) {
  const res = await api.get(`/tasks/board/${projectId}`);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load task board");
  }

  return res.data.data;
}

export async function fetchTMAllTasks(params?: {
  projectId?: string;
  status?: number;
  pageNumber?: number;
  pageSize?: number;
}) {
  const res = await api.get<ApiResponse<ListResponse<TaskDTO>>>("/tasks", { params });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load tasks");
  }

  return normalizeList<TaskDTO>(res.data.data);
}

export async function deleteTMTask(taskId: string): Promise<boolean> {
  const res = await api.delete<ApiResponse<boolean>>(`/tasks/${taskId}`);

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to delete task");
  }

  return true;
}
