"use client"

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "@/app/store/authSlice";
import { AppDispatch, RootState } from "@/app/store/store";
import { PUBLIC_ROUTES } from "@/lib/constants";

export function AuthInit() {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Skip on public routes
    if (PUBLIC_ROUTES.includes(pathname)) {
      return;
    }

    // Skip if already initialized, has user, or is loading
    if (hasInitialized.current || user || isLoading) {
      return;
    }

    // Mark as initialized and fetch user
    hasInitialized.current = true;
    dispatch(fetchMe()).catch(() => {
      // Auth guard will handle redirects - silent fail here
    });
  }, [dispatch, user, isLoading, pathname]);

  return null;
}