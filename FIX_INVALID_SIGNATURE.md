# Fix: Invalid Signature Error

## Problem
You're getting `invalid signature` error because:
- Your token was signed with a **different secret key** than the one currently being used
- Backend is using secret: `'haha'` (from environment variable)
- Your token was likely signed with: `'supersecretkey'` (default) or another value

## Solution

### Option 1: Clear Cookies and Re-Login (Recommended)

1. **Clear browser cookies:**
   - Open DevTools (F12)
   - Go to **Application** → **Cookies** → `http://localhost:3100`
   - Delete `access_token` and `refresh_token`
   - Or use: `document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'`
   - `document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'`

2. **Re-login:**
   - Go to `/login`
   - Enter your credentials
   - New token will be signed with current secret `'haha'`

### Option 2: Set Consistent JWT Secret

1. **Create/Update `.env` file in `backend/` directory:**
   ```env
   JWT_SECRET=haha
   ```

2. **Or use the default:**
   - Remove `JWT_SECRET` from environment
   - Backend will use default: `'supersecretkey'`
   - Clear cookies and re-login

3. **Restart backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

## Why This Happens

- JWT tokens are **signed** with a secret key when created
- Tokens are **verified** with the same secret key when used
- If secrets don't match → `invalid signature` error
- This typically happens when:
  - Environment variable changed
  - Token created before secret was set
  - Different environments use different secrets

## Prevention

1. **Always set JWT_SECRET in environment:**
   ```env
   JWT_SECRET=your-secure-secret-key-here
   ```

2. **Use same secret across:**
   - Token signing (login/register)
   - Token verification (guards)
   - Token refresh

3. **Don't change secret after deployment:**
   - Changing secret invalidates all existing tokens
   - Users must re-login

## Quick Fix Script

Run this in browser console to clear cookies:

```javascript
// Clear all auth cookies
document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
localStorage.removeItem('persist:root');
sessionStorage.clear();
console.log('✅ Cookies cleared. Please re-login.');
```

Then navigate to `/login` and log in again.

