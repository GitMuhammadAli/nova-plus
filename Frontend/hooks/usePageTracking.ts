"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import { analyticsAPI } from '@/app/services';

let pageStartTime = Date.now();

export function usePageTracking() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    pageStartTime = Date.now();

    // Track page visit
    const trackPage = async () => {
      try {
        await analyticsAPI.trackVisit({
          page: pathname,
          referrer: document.referrer || undefined,
          userAgent: navigator.userAgent,
          device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 
                 /Tablet|iPad/.test(navigator.userAgent) ? 'tablet' : 'desktop',
        });
      } catch (error) {
        // Silent fail - analytics tracking should never interrupt user experience
      }
    };

    trackPage();

    // Track page exit (duration)
    return () => {
      const duration = Math.round((Date.now() - pageStartTime) / 1000);
      if (duration > 0) {
        analyticsAPI.trackVisit({
          page: pathname,
          duration,
        }).catch(() => {
          // Silent fail
        });
      }
    };
  }, [pathname, user, isAuthenticated]);
}

