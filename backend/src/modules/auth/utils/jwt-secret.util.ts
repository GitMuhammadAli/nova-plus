/**
 * Utility to get JWT secret consistently across the application
 * This ensures tokens are signed and verified with the same secret
 */
export function getJwtSecret(): string {
  // Use the same logic everywhere for consistency
  // Priority: JWT_SECRET > JWT_ACCESS_SECRET > default
  return (
    process.env.JWT_SECRET || 
    process.env.JWT_ACCESS_SECRET || 
    'haha'
  );
}

export function getJwtRefreshSecret(): string {
  // For refresh tokens, use separate secret if available
  // Otherwise fall back to access secret for consistency
  return (
    process.env.JWT_REFRESH_SECRET || 
    process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_SECRET ||
    'haha'
  );
}

