"use client";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "../app/store/store";

export const useAuthGuard = (requiredRoles?: string[]) => {
  const { user } = useSelector((s: RootState) => s.auth);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    if (requiredRoles && !requiredRoles.includes(user.role)) {
      router.replace("/unauthorized");
    }
  }, [user, router, requiredRoles]);
};
