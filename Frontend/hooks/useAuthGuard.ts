"use client"

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from '@/app/store/authSlice';
import { AppDispatch, RootState } from '@/app/store/store';

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading, user } = useSelector((state: RootState) => state.auth);
  const hasFetched = useRef(false);
  const isRedirecting = useRef(false);

  useEffect(() => {
    // Skip auth check for public routes
    const publicRoutes = ['/login', '/register', '/'];
    if (publicRoutes.includes(pathname)) {
      return;
    }

    // If already authenticated with user data, allow access
    if (isAuthenticated && user) {
      return;
    }

    // Wait for loading to complete
    if (isLoading) {
      return;
    }

    // If already fetched and we're not authenticated, redirect once
    if (hasFetched.current && !isAuthenticated && !user && !isRedirecting.current) {
      isRedirecting.current = true;
      router.replace('/login');
      return;
    }

    // Don't fetch again if already fetched
    if (hasFetched.current) {
      return;
    }

    // Mark as fetched and fetch user
    hasFetched.current = true;
    
    dispatch(fetchMe())
      .unwrap()
      .then(() => {
        isRedirecting.current = false;
      })
      .catch(() => {
        // Failed to authenticate - will be handled by the check above
        isRedirecting.current = false;
      });
  }, [isAuthenticated, isLoading, user, pathname, dispatch, router]);

  return { isAuthenticated, isLoading, user };
}
