import { Middleware } from '@reduxjs/toolkit';

/**
 * Request deduplication middleware
 * Prevents duplicate API calls for the same action within a short time window
 */
interface PendingRequest {
  timestamp: number;
  promise: Promise<any>;
}

const pendingRequests = new Map<string, PendingRequest>();
const DEDUPLICATION_WINDOW = 1000; // 1 second

/**
 * Request deduplication middleware for Redux Toolkit
 * Prevents duplicate API calls for the same action within a short time window
 * This reduces unnecessary backend requests and improves performance
 */
export const requestDeduplicationMiddleware: Middleware = () => (next) => (action: any) => {
  // Only handle async thunk pending actions
  if (!action.type || !action.type.includes('/pending')) {
    return next(action);
  }

  // Create a unique key for this request based on action type and arguments
  const requestKey = `${action.type}:${JSON.stringify(action.meta?.arg || {})}`;
  
  // Check if there's a pending request for this action
  const pending = pendingRequests.get(requestKey);
  
  if (pending) {
    const timeSinceRequest = Date.now() - pending.timestamp;
    
    // If request was made recently (within deduplication window), reuse it
    if (timeSinceRequest < DEDUPLICATION_WINDOW) {
      // Return the existing promise to prevent duplicate API calls
      return pending.promise;
    } else {
      // Request is too old, remove it
      pendingRequests.delete(requestKey);
    }
  }

  // Execute the action and track it
  const actionPromise = next(action);
  
  // Store the request with its promise
  pendingRequests.set(requestKey, {
    timestamp: Date.now(),
    promise: actionPromise,
  });

  // Clean up after action completes (fulfilled or rejected)
  if (actionPromise && typeof actionPromise.then === 'function') {
    actionPromise.finally(() => {
      // Remove after a short delay to allow for rapid successive calls
      setTimeout(() => {
        pendingRequests.delete(requestKey);
      }, DEDUPLICATION_WINDOW);
    });
  }

  return actionPromise;
};

