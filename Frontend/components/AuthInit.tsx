"use client"

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "@/app/store/authSlice";
import { AppDispatch, RootState } from "@/app/store/store";

export function AuthInit() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current || user || isLoading) {
      return;
    }

    hasInitialized.current = true;

    dispatch(fetchMe()).catch(() => {
    });
  }, [dispatch, user, isLoading]);

  return null;
}