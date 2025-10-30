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
    if (PUBLIC_ROUTES.includes(pathname)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('AuthInit: on public page, skipping fetchMe');
      }
      return;
    }

    if (hasInitialized.current || user || isLoading) {
      return;
    }

    hasInitialized.current = true;

    if (process.env.NODE_ENV !== 'production') {
      console.log('AuthInit: calling fetchMe');
    }

    dispatch(fetchMe()).catch(() => {
      // The auth guard will handle redirects
    });
  }, [dispatch, user, isLoading, pathname]);

  return null;
}