import api from "../client";
import type {
  AdminDashboardStats,
  ProjectDto,
  OrganizationDto,
  TaskDTO,
  TaskFilter,
  CreateOrganizationRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  AuditLogDto,
  AuditLogFilter,
} from "../../types/adminTypes";
import type { ProjectAllocationDTO } from "../../types/pmTypes";
import type { UserDto, PagedResponse } from "../../types/userTypes";
import { canCreateProject, canManageProjects } from "../../utils/permission";
import type { UserRole } from "../../constants/roles";
import type { ApiResponse } from "../../types/types";

/* ---------------- Dashboard ---------------- */

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const res = await api.get<ApiResponse<AdminDashboardStats>>(
    "/admin/dashboard-stats",
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load dashboard stats");
  }

  return res.data.data;
}

/* ---------------- Users ---------------- */

export async function fetchAdminUsers(
  page = 1,
  pageSize = 20,
  filters?: {
    searchTerm?: string;
    role?: number;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
): Promise<PagedResponse<UserDto>> {
  const params: Record<string, string | number | boolean> = {
    page,
    pageSize,
  };

  if (filters?.searchTerm) params.searchTerm = filters.searchTerm;
  if (filters?.role !== undefined && filters.role !== null) params.role = filters.role;
  if (filters?.isActive !== undefined) params.isActive = filters.isActive;
  if (filters?.sortBy) params.sortBy = filters.sortBy;
  if (filters?.sortOrder) params.sortOrder = filters.sortOrder;

  const res = await api.get<ApiResponse<PagedResponse<UserDto>>>("/users", {
    params,
  });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load users");
  }

  return res.data.data;
}

export async function deleteUser(userId: string): Promise<void> {
  const res = await api.delete<ApiResponse<void>>(`/users/${userId}`);

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to delete user");
  }
}

/* ---------------- Projects ---------------- */

export async function fetchProjectManagersPaged(
  page: number,
  pageSize: number,
  searchTerm?: string,
): Promise<PagedResponse<UserDto>> {
  const res = await api.get<ApiResponse<PagedResponse<UserDto>>>("/users", {
    params: {
      page,
      pageSize,
      searchTerm,
    },
  });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load project managers");
  }

  return res.data.data;
}

export async function fetchAdminProjects(
  page = 1,
  pageSize = 20,
  filters?: {
    searchTerm?: string;
    status?: number;
    priority?: number;
    projectManagerId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
): Promise<PagedResponse<ProjectDto>> {
  const params: Record<string, string | number> = {
    pageNumber: page,
    pageSize,
  };

  if (filters?.searchTerm) params.searchTerm = filters.searchTerm;
  if (filters?.status !== undefined) params.status = filters.status;
  if (filters?.priority !== undefined) params.priority = filters.priority;
  if (filters?.projectManagerId) params.projectManagerId = filters.projectManagerId;
  if (filters?.sortBy) params.sortBy = filters.sortBy;
  if (filters?.sortOrder) params.sortOrder = filters.sortOrder;

  const res = await api.get<ApiResponse<PagedResponse<ProjectDto> | ProjectDto[]>>(
    "/projects",
    {
      params,
    },
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load projects");
  }

  // Handle both legacy array response and new paged response
  const data = res.data.data;
  if (Array.isArray(data)) {
    return {
      items: data,
      totalCount: data.length,
      page,
      pageSize,
    };
  }

  return data;
}

export async function updateAdminProject(
  projectId: string,
  payload: UpdateProjectRequest,
  actorRole: UserRole,
): Promise<ProjectDto> {
  if (!canManageProjects(actorRole)) {
    throw new Error("Forbidden: insufficient permissions");
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

export async function reassignProjectManager(
  projectId: string,
  projectManagerId: string,
  actorRole: UserRole,
): Promise<ProjectDto> {
  if (!canCreateProject(actorRole)) {
    throw new Error("Forbidden: only Admin can reassign Project Manager");
  }

  const res = await api.put<ApiResponse<ProjectDto>>(`/projects/${projectId}`, {
    projectManagerId,
  });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to reassign Project Manager");
  }

  return res.data.data;
}

export async function deleteAdminProject(
  projectId: string,
  actorRole: UserRole,
): Promise<void> {
  if (!canCreateProject(actorRole)) {
    throw new Error("Forbidden: only Admin can delete projects");
  }
  const res = await api.delete<ApiResponse<void>>(`/projects/${projectId}`);

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to delete project");
  }
}

export async function createProject(
  payload: CreateProjectRequest,
  actorRole: UserRole,
): Promise<ProjectDto> {
  if (!canCreateProject(actorRole)) {
    throw new Error("Forbidden: only Admin can create projects");
  }
  if (!payload.projectManagerId) {
    throw new Error("Project Manager is required");
  }

  const res = await api.post<ApiResponse<ProjectDto>>("/projects", payload);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to create project");
  }

  return res.data.data;
}

export async function fetchAdminProjectById(
  projectId: string,
  actorRole: UserRole,
): Promise<ProjectDto> {
  if (!canManageProjects(actorRole)) {
    throw new Error("Forbidden");
  }
  const res = await api.get<ApiResponse<ProjectDto>>(`/projects/${projectId}`);

  if (!res.data.success || !res.data.data) {
    throw new Error("Failed to load project");
  }
  return res.data.data;
}

export async function fetchAdminProjectAllocations(
  projectId: string,
): Promise<ProjectAllocationDTO[]> {
  console.log('Admin fetching allocations for project:', projectId);
  const res = await api.get<ApiResponse<ProjectAllocationDTO[]>>(
    `/projects/${projectId}/allocations`,
  );

  console.log('Admin Allocations API response:', res.data);

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load allocations");
  }

  return res.data.data;
}

export async function fetchProjectManagers(): Promise<UserDto[]> {
  const res = await api.get<ApiResponse<PagedResponse<UserDto>>>("/users", {
    params: {
      page: 1,
      pageSize: 100,
    },
  });

  if (!res.data.success || !res.data.data) {
    throw new Error("Failed to load users");
  }

  return res.data.data.items.filter(
    (u) => u.role === 2 && u.isActive, // ProjectManager
  );
}

export async function fetchProjectTasks(): Promise<
  ApiResponse<PagedResponse<TaskDTO>>
> {
  const res = await api.get<ApiResponse<PagedResponse<TaskDTO>>>("/tasks", {
    params: { pageNumber: 1, pageSize: 100 },
  });
  return res.data;
}

/* ---------------- Organizations ---------------- */

export async function getOrganizations(
  page = 1,
  pageSize = 100,
  filters?: {
    searchTerm?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
): Promise<PagedResponse<OrganizationDto>> {
  const params: Record<string, string | number> = {
    pageNumber: page,
    pageSize,
  };

  if (filters?.searchTerm) params.searchTerm = filters.searchTerm;
  if (filters?.isActive !== undefined) params.isActive = filters.isActive ? "true" : "false";
  if (filters?.sortBy) params.sortBy = filters.sortBy;
  if (filters?.sortOrder) params.sortOrder = filters.sortOrder;

  const res = await api.get<ApiResponse<PagedResponse<OrganizationDto> | OrganizationDto[]>>(
    "/organizations",
    {
      params,
    },
  );

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to load organizations");
  }

  // Handle both legacy array response and new paged response
  const data = res.data.data;
  if (Array.isArray(data)) {
    return {
      items: data.map((o: { organizationId: string; name: string; location: string; isActive: boolean; userCount?: number; projectCount?: number }) => ({
        organizationId: o.organizationId,
        name: o.name,
        location: o.location,
        isActive: o.isActive,
        userCount: o.userCount ?? 0,
        projectCount: o.projectCount ?? 0,
      })),
      totalCount: data.length,
      page,
      pageSize,
    };
  }

  // Map the paged response items (handle both PascalCase and camelCase)
  if (data && typeof data === "object") {
    const isPascalPaged = (
      value: unknown,
    ): value is {
      Items: Array<{
        organizationId: string;
        name: string;
        location: string;
        isActive: boolean;
        userCount?: number;
        projectCount?: number;
      }>;
      TotalCount: number;
      Page: number;
      PageSize: number;
    } =>
      !!value &&
      typeof value === "object" &&
      Array.isArray((value as { Items?: unknown }).Items);

    const isCamelPaged = (
      value: unknown,
    ): value is {
      items: Array<{
        organizationId: string;
        name: string;
        location: string;
        isActive: boolean;
        userCount?: number;
        projectCount?: number;
      }>;
      totalCount: number;
      page: number;
      pageSize: number;
    } =>
      !!value &&
      typeof value === "object" &&
      Array.isArray((value as { items?: unknown }).items);

    if (isPascalPaged(data)) {
      return {
        items: data.Items.map((o) => ({
          organizationId: o.organizationId,
          name: o.name,
          location: o.location,
          isActive: o.isActive,
          userCount: o.userCount ?? 0,
          projectCount: o.projectCount ?? 0,
        })),
        totalCount: data.TotalCount,
        page: data.Page,
        pageSize: data.PageSize,
      };
    }

    if (isCamelPaged(data)) {
      return {
        items: data.items.map((o) => ({
          organizationId: o.organizationId,
          name: o.name,
          location: o.location,
          isActive: o.isActive,
          userCount: o.userCount ?? 0,
          projectCount: o.projectCount ?? 0,
        })),
        totalCount: data.totalCount,
        page: data.page,
        pageSize: data.pageSize,
      };
    }
  }

  return {
    items: [],
    totalCount: 0,
    page,
    pageSize,
  };
}

export async function createOrganization(
  payload: CreateOrganizationRequest,
): Promise<void> {
  const res = await api.post<ApiResponse<void>>("/organizations", payload);

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to create organization");
  }
}

export async function deleteOrganization(
  organizationId: string,
): Promise<void> {
  const res = await api.delete<ApiResponse<void>>(
    `/organizations/${organizationId}`,
  );

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to delete organization");
  }
}

/* ---------------- Tasks ---------------- */

export async function fetchAdminTasks(filter: TaskFilter) {
  const res = await api.get<
    ApiResponse<{
      items: TaskDTO[];
      totalCount: number;
      page: number;
      pageSize: number;
    }>
  >("/tasks", {
    params: {
      ...filter,
      pageNumber: filter.pageNumber ?? 1,
      pageSize: filter.pageSize ?? 20,
    },
  });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load tasks");
  }

  return res.data.data;
}

/* ---------------- Audit Logs ---------------- */

export async function fetchAuditLogs(
  filter?: AuditLogFilter,
): Promise<PagedResponse<AuditLogDto>> {
  const pageNumber = filter?.pageNumber ?? 1;
  const pageSize = filter?.pageSize ?? 20;

  const res = await api.get<ApiResponse<PagedResponse<AuditLogDto>>>(
    "/admin/audit-logs",
    {
      params: {
        ...filter,
        pageNumber,
        pageSize,
      },
    },
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load audit logs");
  }

  return res.data.data;
}

export async function fetchRecentAuditLogs(
  limit = 5,
): Promise<AuditLogDto[]> {
  const res = await api.get<ApiResponse<AuditLogDto[]>>(
    "/admin/audit-logs/recent",
    {
      params: { limit },
    },
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to load recent audit logs");
  }

  return res.data.data;
}
