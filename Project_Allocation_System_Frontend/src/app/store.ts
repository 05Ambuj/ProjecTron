import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import projectReducer from "../features/project/projectSlice";
import pmReducer from "../features/pm/pmSlice";
import sprintReducer from "../features/pm/sprintSlice";
import tlReducer from "../features/tl/tlSlice";
import tmReducer from "../features/tm/tmSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    pm: pmReducer,
    sprint: sprintReducer,
    tl: tlReducer,
    tm: tmReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
