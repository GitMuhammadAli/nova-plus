"use client"

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from '@/app/store/authSlice';
import { AppDispatch, RootState } from '@/app/store/store';

export function useAuthGuard() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading, user } = useSelector((state: RootState) => state.auth);
  const hasFetched = useRef(false);

  console.log('🟡 useAuthGuard - isAuth:', isAuthenticated, 'isLoading:', isLoading, 'user:', user?.email);

  useEffect(() => {
    console.log('🟡 useAuthGuard effect - isAuth:', isAuthenticated, 'user:', user?.email, 'hasFetched:', hasFetched.current);
    
    // If already authenticated, no need to fetch
    if (isAuthenticated || user) {
      console.log('✅ useAuthGuard - Already authenticated');
      return;
    }

    // If currently loading or already fetched, don't fetch again
    if (isLoading || hasFetched.current) {
      console.log('🟡 useAuthGuard - Loading or already fetched');
      return;
    }

    // Mark as fetched to prevent duplicate calls
    hasFetched.current = true;

    console.log('🔵 useAuthGuard - Fetching user...');
    
    // Try to fetch user from cookie
    dispatch(fetchMe())
      .unwrap()
      .then((user) => {
        console.log('✅ useAuthGuard - User fetched:', user.email);
      })
      .catch((error) => {
        console.log('❌ useAuthGuard - Fetch failed, redirecting to /');
        // If fetch fails, redirect to landing page
        router.push('/');
      });
  }, [isAuthenticated, isLoading, user, dispatch, router]);

  return { isAuthenticated, isLoading, user };
}