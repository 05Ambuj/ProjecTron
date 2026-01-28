import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import * as pmApi from "../../api/pm";
import type {
  PMDashboardStats,
  ProjectAllocationDTO,
} from "../../types/pmTypes";
import type { ProjectDto } from "../../types/adminTypes";
import type { UserRole } from "../../constants/roles";

interface PMState {
  dashboardStats: PMDashboardStats | null;
  projects: ProjectDto[];
  currentProject: ProjectDto | null;
  allocations: ProjectAllocationDTO[];
  loading: boolean;
  error: string | null;
}

const initialState: PMState = {
  dashboardStats: null,
  projects: [],
  currentProject: null,
  allocations: [],
  loading: false,
  error: null,
};

export const fetchPMDashboard = createAsyncThunk(
  "pm/fetchDashboard",
  async () => {
    return await pmApi.fetchPMDashboardStats();
  },
);

export const fetchPMProjects = createAsyncThunk(
  "pm/fetchProjects",
  async (
    { page, pageSize, actorRole }:
    { page: number; pageSize: number; actorRole: UserRole }
  ) => {
    return await pmApi.fetchPMProjects(page, pageSize, actorRole);
  }
);

export const fetchPMProjectById = createAsyncThunk(
  "pm/fetchProjectById",
  async (
    { projectId, actorRole }:
    { projectId: string; actorRole: UserRole }
  ) => {
    return await pmApi.fetchPMProjectById(projectId, actorRole);
  }
);

export const fetchProjectAllocations = createAsyncThunk(
  "pm/fetchAllocations",
  async (projectId: string) => {
    return await pmApi.fetchProjectAllocations(projectId);
  },
);

const pmSlice = createSlice({
  name: "pm",
  initialState,
  reducers: {
    clearPMError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(fetchPMDashboard.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchPMDashboard.fulfilled,
        (state, action: PayloadAction<PMDashboardStats>) => {
          state.loading = false;
          state.dashboardStats = action.payload;
        },
      )
      .addCase(fetchPMDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load dashboard";
      })
      // Projects
      .addCase(
        fetchPMProjects.fulfilled,
        (state, action: PayloadAction<ProjectDto[]>) => {
          state.projects = action.payload;
        },
      )

      // Project Details
      .addCase(
        fetchPMProjectById.fulfilled,
        (state, action: PayloadAction<ProjectDto>) => {
          state.currentProject = action.payload;
        },
      )

      // Allocations
      .addCase(
        fetchProjectAllocations.fulfilled,
        (state, action: PayloadAction<ProjectAllocationDTO[]>) => {
          state.allocations = action.payload;
        },
      );
  },
});
export const { clearPMError } = pmSlice.actions;
export default pmSlice.reducer;
