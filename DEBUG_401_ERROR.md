# Debugging 401 Error on Company Admin Dashboard

## Issue
Getting `AxiosError: Request failed with status code 401` when calling `companyAPI.getById(companyId)` in the company admin dashboard.

## Step-by-Step Debugging

### 1. Check Backend Logs

When you make the request, check your backend console. You should see:

**If token is missing:**
```
❌ JWT Auth Guard Failed: { hasToken: false, ... }
```

**If token is invalid:**
```
❌ JWT Auth Guard Failed: { error: "jwt expired", ... }
```

**If token is valid but user validation fails:**
```
❌ JWT validation failed: User not found
```

**If everything works:**
```
🍪 Cookie extraction: { hasCookies: true, accessToken: "Found (length: ...)" }
🔐 JWT Auth Guard: { hasUser: true }
🔵 Company Controller - getCompany: { companyId: "...", userId: "...", userRole: "..." }
🔵 Company Service - findById: { companyId: "...", requestUserId: "...", requestUserRole: "..." }
✅ Company access granted
```

### 2. Check Browser Cookies

1. Open DevTools (F12)
2. Go to **Application** → **Cookies** → `http://localhost:3100`
3. Look for:
   - `access_token` - Should exist and not be expired
   - `refresh_token` - Should exist

**If cookies are missing:**
- Re-login
- Check backend cookie settings in `auth.controller.ts`

### 3. Check Network Request

1. Open DevTools → **Network** tab
2. Find the request: `GET /company/:id`
3. Check **Request Headers**:
   - Should include: `Cookie: access_token=...; refresh_token=...`
4. Check **Response**:
   - Status: 401
   - Body: Error message

**If cookies not in headers:**
- Check `withCredentials: true` in `Frontend/lib/api.ts`
- Check CORS `credentials: true` in `backend/src/main.ts`

### 4. Test Token Refresh

The interceptor should automatically refresh expired tokens. To test:

1. Wait 15+ minutes after login (access token expires)
2. Navigate to company admin dashboard
3. Check Network tab:
   - Should see `POST /auth/refresh` call
   - Should see original request retried
4. Check cookies:
   - `access_token` should be updated

**If refresh fails:**
- Check `refresh_token` cookie exists
- Check backend session exists in database
- Check refresh token hasn't expired (7 days)

### 5. Verify User State

In the frontend component, add logging:

```typescript
useEffect(() => {
  console.log('🔵 User state:', {
    user: user,
    companyId: user?.companyId,
    role: user?.role,
  });
  
  if (!user?.companyId) {
    console.error('❌ User missing companyId');
    return;
  }
  
  // ... rest of code
}, [user]);
```

### 6. Common Issues & Fixes

#### Issue: Token Not Being Sent
**Symptoms:** Backend logs show `hasToken: false`

**Fix:**
1. Verify `withCredentials: true` in axios config
2. Verify CORS `credentials: true` in backend
3. Clear cookies and re-login

#### Issue: Token Expired
**Symptoms:** Backend logs show `jwt expired`

**Fix:**
1. Interceptor should auto-refresh
2. If refresh fails, check refresh token exists
3. Re-login if refresh token expired

#### Issue: User Not Found
**Symptoms:** Backend logs show `User not found`

**Fix:**
1. Check user exists in database
2. Check user ID in token matches database
3. Verify user `isActive` is `true`

#### Issue: Company Access Denied
**Symptoms:** Backend logs show `You can only access your own company`

**Fix:**
1. Check user's `companyId` matches requested company
2. Verify company exists in database
3. Check user's role allows access

## Quick Test

Run this in browser console after logging in:

```javascript
// Check cookies
console.log('Cookies:', document.cookie);

// Check Redux state (if Redux DevTools installed)
// Or check localStorage
console.log('Auth state:', localStorage.getItem('persist:root'));

// Test API call manually
fetch('http://localhost:5500/company/YOUR_COMPANY_ID', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then(res => res.json())
  .then(data => console.log('✅ Success:', data))
  .catch(err => console.error('❌ Error:', err));
```

## Expected Backend Logs (Success)

```
🍪 Cookie extraction: {
  hasCookies: true,
  cookieKeys: [ 'access_token', 'refresh_token' ],
  accessToken: 'Found (length: 200)'
}
🔐 JWT Auth Guard: { hasUser: true }
🔵 Company Controller - getCompany: {
  companyId: '...',
  userId: '...',
  userRole: 'COMPANY_ADMIN',
  hasUser: true
}
🔵 Company Service - findById: {
  companyId: '...',
  requestUserId: '...',
  requestUserRole: 'COMPANY_ADMIN'
}
🔵 Company access check: {
  userCompanyId: '...',
  targetCompanyId: '...',
  match: true
}
✅ Company access granted
```

## If Still Failing

1. **Check backend is running** on port 5500
2. **Check frontend is running** on port 3100
3. **Check CORS origins** match in `backend/src/main.ts`
4. **Clear everything**:
   - Clear browser cookies
   - Clear localStorage
   - Clear sessionStorage
   - Re-login
5. **Check database**:
   - User exists
   - User has `companyId`
   - Company exists
   - User `isActive` is `true`

