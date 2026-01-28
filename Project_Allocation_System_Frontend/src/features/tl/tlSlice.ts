import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import * as tlApi from "../../api/tl";
import type { TLDashboardStats } from "../../types/tlTypes";
import type { TaskDTO } from "../../types/adminTypes";

interface TLState {
  dashboardStats: TLDashboardStats | null;
  tasks: TaskDTO[];
  loading: boolean;
  error: string | null;
}

const initialState: TLState = {
  dashboardStats: null,
  tasks: [],
  loading: false,
  error: null,
};

export const fetchTLDashboard = createAsyncThunk(
  "tl/fetchDashboard",
  async () => {
    const myTasks = await tlApi.fetchTLMyTasks();
    const overdueTasks = await tlApi.fetchTLOverdueTasks();

    return {
      assignedTasks: myTasks.length,
      inProgressTasks: myTasks.filter((t: TaskDTO) => t.status === 2).length,
      completedTasks: myTasks.filter((t: TaskDTO) => t.status === 6).length,
      overdueTasks: overdueTasks.length,
      activeSprints: 0,
      teamMembers: 0,
    } as TLDashboardStats;
  },
);

export const fetchTLMyTasks = createAsyncThunk(
  "tl/fetchMyTasks",
  async () => {
    return await tlApi.fetchTLMyTasks();
  },
);

const tlSlice = createSlice({
  name: "tl",
  initialState,
  reducers: {
    clearTLError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTLDashboard.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchTLDashboard.fulfilled,
        (state, action: PayloadAction<TLDashboardStats>) => {
          state.loading = false;
          state.dashboardStats = action.payload;
        },
      )
      .addCase(fetchTLDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load dashboard";
      })
      .addCase(
        fetchTLMyTasks.fulfilled,
        (state, action: PayloadAction<TaskDTO[]>) => {
          state.tasks = action.payload;
        },
      );
  },
});

export const { clearTLError } = tlSlice.actions;
export default tlSlice.reducer;
