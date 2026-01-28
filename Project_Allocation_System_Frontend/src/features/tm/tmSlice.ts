import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import * as tmApi from "../../api/tm";
import type { TMDashboardStats } from "../../types/tmTypes";
import type { TaskDTO } from "../../types/adminTypes";

interface TMState {
  dashboardStats: TMDashboardStats | null;
  myTasks: TaskDTO[];
  loading: boolean;
  error: string | null;
}

const initialState: TMState = {
  dashboardStats: null,
  myTasks: [],
  loading: false,
  error: null,
};

export const fetchTMDashboard = createAsyncThunk(
  "tm/fetchDashboard",
  async () => {
    // Since backend endpoint might not exist, calculate stats from tasks
    try {
      return await tmApi.fetchTMDashboardStats();
    } catch (error) {
      // Fallback: calculate from my tasks
      const myTasks = await tmApi.fetchTMMyTasks();
      
      return {
        myTasks: myTasks.length,
        inProgressTasks: myTasks.filter(t => t.status === 2).length,
        completedTasks: myTasks.filter(t => t.status === 6).length,
        overdueTasks: myTasks.filter(t => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate) < new Date() && t.status !== 6;
        }).length,
        hoursLogged: 0,
        activeProjects: new Set(myTasks.map(t => t.projectId)).size,
      };
    }
  },
);

export const fetchTMMyTasks = createAsyncThunk(
  "tm/fetchMyTasks",
  async () => {
    return await tmApi.fetchTMMyTasks();
  },
);

const tmSlice = createSlice({
  name: "tm",
  initialState,
  reducers: {
    clearTMError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTMDashboard.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchTMDashboard.fulfilled,
        (state, action: PayloadAction<TMDashboardStats>) => {
          state.loading = false;
          state.dashboardStats = action.payload;
        },
      )
      .addCase(fetchTMDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load dashboard";
      })
      .addCase(
        fetchTMMyTasks.fulfilled,
        (state, action: PayloadAction<TaskDTO[]>) => {
          state.myTasks = action.payload;
        },
      );
  },
});

export const { clearTMError } = tmSlice.actions;
export default tmSlice.reducer;
