import api from "../client";
import type {
  SprintDTO,
  SprintCreateRequest,
  SprintUpdateRequest,
  SprintStatsDTO,
  SprintMemberCreateRequest,
  SprintTimeSummaryDTO,
} from "../../types/sprintTypes";
import type { ApiResponse } from "../../types/types";
import { canManageProjects } from "../../utils/permission";
import type { UserRole } from "../../constants/roles";
import { UserRole as UserRoleEnum } from "../../constants/roles";

export async function fetchSprintsByProject(
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

export async function fetchActiveSprint(
  projectId: string,
): Promise<SprintDTO | null> {
  try {
    const res = await api.get<ApiResponse<SprintDTO>>(
      `/sprints/project/${projectId}/active`,
    );

    if (!res.data.success || !res.data.data) {
      return null;
    }

    return res.data.data;
  } catch {
    return null;
  }
}

export async function fetchSprintById(sprintId: string): Promise<SprintDTO> {
  const res = await api.get<ApiResponse<SprintDTO>>(`/sprints/${sprintId}`);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load sprint");
  }

  return res.data.data;
}

export async function createSprint(
  payload: SprintCreateRequest,
  actorRole: UserRole,
): Promise<SprintDTO> {
  if (!canManageProjects(actorRole)) {
    throw new Error("Forbidden: Only Project Managers and Admins can create sprints");
  }
  const res = await api.post<ApiResponse<SprintDTO>>("/sprints", payload);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to create sprint");
  }

  return res.data.data;
}

export async function updateSprint(
  sprintId: string,
  payload: SprintUpdateRequest,
  actorRole: UserRole,
): Promise<SprintDTO> {
  if (!canManageProjects(actorRole)) {
    throw new Error("Forbidden: Only Project Managers and Admins can update sprints");
  }
  const res = await api.put<ApiResponse<SprintDTO>>(
    `/sprints/${sprintId}`,
    payload,
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to update sprint");
  }

  return res.data.data;
}

export async function startSprint(
  sprintId: string,
  actorRole: UserRole,
): Promise<void> {
  if (actorRole !== UserRoleEnum.ProjectManager) {
    throw new Error("Forbidden: Only Project Managers can start sprints");
  }
  const res = await api.post<ApiResponse<boolean>>(
    `/sprints/${sprintId}/start`,
  );
  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to start sprint");
  }
}

export async function completeSprint(
  sprintId: string,
  actorRole: UserRole,
): Promise<void> {
  if (!canManageProjects(actorRole)) {
    throw new Error("Forbidden: Only Project Managers and Admins can complete sprints");
  }
  const res = await api.post<ApiResponse<boolean>>(
    `/sprints/${sprintId}/complete`,
  );

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to complete sprint");
  }
}

export async function deleteSprint(
  sprintId: string,
  actorRole: UserRole,
): Promise<void> {
  if (!canManageProjects(actorRole)) {
    throw new Error("Forbidden: Only Project Managers and Admins can delete sprints");
  }
  const res = await api.delete<ApiResponse<boolean>>(`/sprints/${sprintId}`);

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to delete sprint");
  }
}

export async function fetchSprintStats(
  sprintId: string,
): Promise<SprintStatsDTO> {
  const res = await api.get<ApiResponse<SprintStatsDTO>>(
    `/sprints/${sprintId}/stats`,
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load sprint stats");
  }

  return res.data.data;
}

export async function addSprintMember(
  sprintId: string,
  payload: SprintMemberCreateRequest,
  actorRole: UserRole,
): Promise<void> {
  if (!canManageProjects(actorRole)) {
    throw new Error("Forbidden: Only Project Managers and Admins can add sprint members");
  }
  const res = await api.post<ApiResponse<boolean>>(
    `/sprints/${sprintId}/members`,
    payload,
  );

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to add member");
  }
}
export async function fetchSprintTimeSummary(
  sprintId: string,
): Promise<SprintTimeSummaryDTO> {
  const res = await api.get<ApiResponse<SprintTimeSummaryDTO>>(
    `/sprints/${sprintId}/time-summary`,
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load sprint time summary");
  }

  return res.data.data;
}
export async function removeSprintMember(
  sprintId: string,
  userId: string,
  actorRole: UserRole,
): Promise<void> {
  if (!canManageProjects(actorRole)) {
    throw new Error("Forbidden: Only Project Managers and Admins can remove sprint members");
  }
  const res = await api.delete<ApiResponse<boolean>>(
    `/sprints/${sprintId}/members/${userId}`,
  );

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to remove member");
  }
}
