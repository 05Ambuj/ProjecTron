import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchPMProjects } from "../../api/pm";
import type { UserRole } from "../../constants/roles";
import type { ProjectDto } from "../../types/adminTypes";


interface ProjectState {
  items: ProjectDto[];
  loading: boolean;
}

export const fetchProjects = createAsyncThunk(
  "projects/fetch",
  async (
    { page, pageSize, actorRole }:
    { page: number; pageSize: number; actorRole: UserRole }
  ) => {
    return await fetchPMProjects(page, pageSize, actorRole);
  }
);

const initialState: ProjectState = {
  items: [],
  loading: false,
};

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchProjects.fulfilled, (s, a) => {
        s.items = a.payload;
        s.loading = false;
      });
  },
});

export default projectSlice.reducer;
