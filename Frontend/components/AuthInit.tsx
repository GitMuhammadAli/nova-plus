"use client"

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../app/store/store";
import { fetchMe } from "../app/store/authSlice";

export function AuthInit() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return null;
}