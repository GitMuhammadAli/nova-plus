import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import authReducer from "./authSlice";
import usersReducer from "./usersSlice";
import companyReducer from "./companySlice";
import invitesReducer from "./invitesSlice";

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
  // Add more reducers here as needed
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