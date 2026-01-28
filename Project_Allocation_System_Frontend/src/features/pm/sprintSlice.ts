import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import * as sprintApi from "../../api/sprint";
import type {
  SprintDTO,
  SprintStatsDTO,
  SprintCreateRequest,
  SprintUpdateRequest,
} from "../../types/sprintTypes";
import type { UserRole } from "../../constants/roles";

interface SprintState {
  sprints: SprintDTO[];
  activeSprint: SprintDTO | null;
  currentSprint: SprintDTO | null;
  sprintStats: SprintStatsDTO | null;
  loading: boolean;
  error: string | null;
}

const initialState: SprintState = {
  sprints: [],
  activeSprint: null,
  currentSprint: null,
  sprintStats: null,
  loading: false,
  error: null,
};

export const fetchSprintsByProject = createAsyncThunk(
  "sprint/fetchByProject",
  async (projectId: string) => {
    return await sprintApi.fetchSprintsByProject(projectId);
  },
);
export const fetchSprintTimeSummary = createAsyncThunk(
  "sprint/fetchTimeSummary",
  async (sprintId: string) => {
    return await sprintApi.fetchSprintTimeSummary(sprintId);
  },
);
export const createSprint = createAsyncThunk<
  SprintDTO,
  { payload: SprintCreateRequest; actorRole: UserRole }
>("sprint/create", async ({ payload, actorRole }) => {
  return await sprintApi.createSprint(payload, actorRole);
});

export const updateSprint = createAsyncThunk<
  SprintDTO,
  { sprintId: string; payload: SprintUpdateRequest; actorRole: UserRole }
>("sprint/update", async ({ sprintId, payload, actorRole }) => {
  return await sprintApi.updateSprint(sprintId, payload, actorRole);
});

export const startSprint = createAsyncThunk<
  void,
  { sprintId: string; projectId: string; actorRole: UserRole }
>("sprint/start", async ({ sprintId, projectId, actorRole }, { dispatch }) => {
  await sprintApi.startSprint(sprintId, actorRole);
  dispatch(fetchActiveSprint(projectId));
});

export const completeSprint = createAsyncThunk<
  void,
  { sprintId: string; projectId: string; actorRole: UserRole }
>(
  "sprint/complete",
  async ({ sprintId, projectId, actorRole }, { dispatch }) => {
    await sprintApi.completeSprint(sprintId, actorRole);
    dispatch(fetchActiveSprint(projectId));
  },
);

export const fetchActiveSprint = createAsyncThunk<SprintDTO | null, string>(
  "sprint/fetchActive",
  async (projectId: string) => {
    return await sprintApi.fetchActiveSprint(projectId);
  },
);

export const fetchSprintStats = createAsyncThunk(
  "sprint/fetchStats",
  async (sprintId: string) => {
    return await sprintApi.fetchSprintStats(sprintId);
  },
);

const sprintSlice = createSlice({
  name: "sprint",
  initialState,
  reducers: {
    clearSprintError: (state) => {
      state.error = null;
    },
    resetSprintState: (state) => {
      state.sprints = [];
      state.activeSprint = null;
      state.currentSprint = null;
      state.sprintStats = null;
      state.loading = false;
      state.error = null;
    },
    setCurrentSprint: (state, action: PayloadAction<SprintDTO | null>) => {
      state.currentSprint = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      /* ---------------- Fetch Sprints By Project ---------------- */
      .addCase(fetchSprintsByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSprintsByProject.fulfilled,
        (state, action: PayloadAction<SprintDTO[]>) => {
          state.loading = false;
          state.sprints = action.payload;

          // IMPORTANT: clear stale active sprint if project changed
          if (action.payload.length === 0) {
            state.activeSprint = null;
          }
        },
      )
      .addCase(fetchSprintsByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load sprints";
      })
      .addCase(createSprint.fulfilled, (state, action) => {
        state.sprints.unshift(action.payload);
        state.currentSprint = action.payload;
      })
      .addCase(updateSprint.fulfilled, (state, action) => {
        const index = state.sprints.findIndex(
          (s) => s.sprintId === action.payload.sprintId,
        );

        if (index !== -1) {
          state.sprints[index] = action.payload;
        }

        if (state.currentSprint?.sprintId === action.payload.sprintId) {
          state.currentSprint = action.payload;
        }

        if (state.activeSprint?.sprintId === action.payload.sprintId) {
          state.activeSprint = action.payload;
        }
      })
      /* ---------------- Fetch Active Sprint ---------------- */
      .addCase(fetchActiveSprint.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchActiveSprint.fulfilled,
        (state, action: PayloadAction<SprintDTO | null>) => {
          state.loading = false;
          state.activeSprint = action.payload;
        },
      )
      .addCase(fetchActiveSprint.rejected, (state) => {
        state.loading = false;
        state.activeSprint = null; // IMPORTANT: expected case
      })

      /* ---------------- Fetch Sprint Stats ---------------- */
      .addCase(fetchSprintStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchSprintStats.fulfilled,
        (state, action: PayloadAction<SprintStatsDTO>) => {
          state.loading = false;
          state.sprintStats = action.payload;
        },
      )
      .addCase(fetchSprintStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load sprint stats";
      })
      .addCase(startSprint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to start sprint";
      })
      .addCase(completeSprint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to complete sprint";
      })
      .addCase(fetchSprintTimeSummary.fulfilled, (state, action) => {
        if (state.currentSprint) {
          state.currentSprint.timeSummary = action.payload;
        }

        if (
          state.activeSprint &&
          state.currentSprint?.sprintId === state.activeSprint.sprintId
        ) {
          state.activeSprint.timeSummary = action.payload;
        }
      });
  },
});

export const { clearSprintError, resetSprintState, setCurrentSprint } =
  sprintSlice.actions;
export default sprintSlice.reducer;
