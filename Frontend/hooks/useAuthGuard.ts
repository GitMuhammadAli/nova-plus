"use client"

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from '@/app/store/authSlice';
import { AppDispatch, RootState } from '@/app/store/store';

const PUBLIC_ROUTES = ['/login', '/register', '/'];

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isInitializing, user } = useSelector((state: RootState) => state.auth);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Skip auth check for public routes - completely ignore these pages
    if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/invite/')) {
      hasFetched.current = false;
      return;
    }

    // If already authenticated with user, allow access
    if (isAuthenticated && user) {
      return;
    }

    // Wait for initial check to complete
    if (isInitializing) {
      return;
    }

    // Fetch user if not already fetched
    if (!hasFetched.current) {
      hasFetched.current = true;
      dispatch(fetchMe()).catch(() => {
        // Silent fail - will redirect below if not authenticated
      });
      return;
    }

    // If not authenticated after fetch, redirect to login
    if (!isAuthenticated && !isInitializing) {
      router.replace('/login');
    }
  }, [isAuthenticated, isInitializing, user, pathname, dispatch, router]);

  return { 
    isAuthenticated, 
    isLoading: isInitializing, 
    user 
  };
}
