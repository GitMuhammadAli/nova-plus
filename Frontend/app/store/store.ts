import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import authReducer from "./authSlice";
import usersReducer from "./usersSlice";
import companyReducer from "./companySlice";
import invitesReducer from "./invitesSlice";
import departmentsReducer from "./departmentsSlice";
import projectsReducer from "./projectsSlice";
import tasksReducer from "./tasksSlice";
import analyticsReducer from "./analyticsSlice";
import auditReducer from "./auditSlice";
import workflowReducer from "./workflowSlice";
import dashboardReducer from "./dashboardSlice";

const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

const storage = typeof window !== "undefined" 
  ? createWebStorage("local") 
  : createNoopStorage();

const rootReducer = combineReducers({
  auth: authReducer,
  users: usersReducer,
  company: companyReducer,
  invites: invitesReducer,
  departments: departmentsReducer,
  projects: projectsReducer,
  tasks: tasksReducer,
  analytics: analyticsReducer,
  audit: auditReducer,
  workflow: workflowReducer,
  dashboard: dashboardReducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"], // Only persist auth (user data, not tokens)
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;