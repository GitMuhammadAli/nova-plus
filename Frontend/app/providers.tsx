"use client"

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store/store";
import { QueryProvider } from "@/providers/query-provider";
import { AuthInit } from "@/components/AuthInit";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <AuthInit />
          {children}
          <Toaster />
        </PersistGate>
      </Provider>
    </QueryProvider>
  );
}