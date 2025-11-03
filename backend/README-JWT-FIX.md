# JWT Secret Configuration Fix

## The Problem
Your tokens are signed with one secret but verified with another, causing "invalid signature" errors.

## The Solution

### Step 1: Check your `.env` file
Open `backend/.env` and look for:
```env
JWT_ACCESS_SECRET=haha
```

### Step 2: Set a proper secret
Change it to a secure value (use the same value for consistency):
```env
JWT_ACCESS_SECRET=your-secure-secret-key-change-this
JWT_REFRESH_SECRET=your-secure-secret-key-change-this
```

**Important**: 
- Use the SAME secret value in both variables
- Use a strong, random string (not 'haha' or simple words)
- DON'T change it again once set (or all users will need to re-login)

### Step 3: Restart backend
After updating `.env`, restart your backend:
```bash
# Stop the backend (Ctrl+C)
# Then restart:
npm run start:dev
```

### Step 4: Clear cookies and login again
1. Open browser DevTools (F12)
2. Go to Application/Storage → Cookies
3. Delete `access_token` and `refresh_token` cookies
4. Or simply log out and log back in

### Alternative: Quick Cookie Clear Script
Run this in browser console:
```javascript
document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
location.reload();
```

## After Fix
- You won't need to login repeatedly
- Tokens will work correctly
- User creation/editing will work

