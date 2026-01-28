import api from "../client";
import type { CreateProjectRequest, ProjectDto } from "../../types/adminTypes";
import type { ApiResponse } from "../../types/types";

export const getProjects = (pageNumber = 1, pageSize = 10) =>
  api.get("/projects", {
    params: { pageNumber, pageSize },
  });

export const createProject = (data: CreateProjectRequest) =>
  api.post<ApiResponse<ProjectDto>>("/projects", data);
