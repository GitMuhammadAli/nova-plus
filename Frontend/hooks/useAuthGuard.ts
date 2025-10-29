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

  useEffect(() => {
    if (isAuthenticated || user) {
      return;
    }

    if (isLoading || hasFetched.current) {
      return;
    }

    hasFetched.current = true;

    dispatch(fetchMe())
      .unwrap()
      .catch(() => {
        router.push('/');
      });
  }, [isAuthenticated, isLoading, user, dispatch, router]);

  return { isAuthenticated, isLoading, user };
}