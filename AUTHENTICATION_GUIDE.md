# NovaPulse Authentication & Authorization System - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Authentication Flow](#backend-authentication-flow)
4. [Frontend Authentication Flow](#frontend-authentication-flow)
5. [Token Management](#token-management)
6. [Role-Based Access Control](#role-based-access-control)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

NovaPulse uses a **cookie-based JWT authentication system** with automatic token refresh. This provides:
- **Security**: HttpOnly cookies prevent XSS attacks
- **Seamless UX**: Automatic token refresh without user interruption
- **Multi-tenancy**: Company-scoped data access
- **Role-based permissions**: Different dashboards and features per role

---

## Architecture

### Backend (NestJS)
- **JWT Strategy**: Extracts tokens from cookies (primary) or Authorization header (fallback)
- **Guards**: `JwtAuthGuard` for authentication, `RolesGuard` for authorization
- **Sessions**: Stores refresh token hashes in MongoDB for validation
- **Cookies**: HttpOnly, SameSite=Lax, Secure in production

### Frontend (Next.js)
- **Redux**: Manages authentication state
- **Axios Interceptor**: Handles automatic token refresh on 401 errors
- **Auth Guard Hook**: Protects routes and redirects unauthenticated users
- **Local State**: Forms use local `isSubmitting` to prevent blocking

---

## Backend Authentication Flow

### 1. Login Process

```typescript
POST /auth/login
Body: { email, password }
```

**Steps:**
1. User submits credentials
2. Backend validates email/password
3. Backend generates:
   - **Access Token** (15 minutes, contains: userId, email, role, companyId)
   - **Refresh Token** (7 days, same payload)
4. Backend stores refresh token hash in `sessions` collection
5. Backend sets cookies:
   - `access_token` (HttpOnly, 15min)
   - `refresh_token` (HttpOnly, 7 days)
6. Backend returns user object (password excluded)

**Code Location:**
- `backend/src/modules/auth/auth.controller.ts` - `login()` method
- `backend/src/modules/auth/auth.service.ts` - `login()` and `buildResponseTokens()` methods

### 2. Registration Process

```typescript
POST /auth/register
Body: { email, password, name, role? }
```

**Steps:**
1. User submits registration data
2. Backend checks if email exists
3. Backend hashes password
4. Backend creates user in database
5. Backend generates tokens (same as login)
6. Backend sets cookies
7. Backend returns user object

**Code Location:**
- `backend/src/modules/auth/auth.controller.ts` - `register()` method
- `backend/src/modules/auth/auth.service.ts` - `register()` method

### 3. Token Validation (Protected Routes)

When a protected route is accessed:

```typescript
@Get('/company/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
async getCompany(@Param('id') id: string, @Req() req) {
  // req.user is automatically populated by JwtStrategy
  return this.companyService.findById(id, req.user._id, req.user.role);
}
```

**Steps:**
1. `JwtAuthGuard` activates
2. `JwtStrategy` extracts token from:
   - **Primary**: `req.cookies.access_token`
   - **Fallback**: `Authorization: Bearer <token>` header
3. JWT is verified using secret key
4. Payload is extracted (userId, email, role, companyId)
5. User is fetched from database
6. User object (without password) is attached to `req.user`
7. Route handler executes with authenticated user

**Code Location:**
- `backend/src/modules/auth/strategies/jwt.strategy.ts` - `validate()` method
- `backend/src/modules/auth/guards/jwt-auth.guard.ts` - `handleRequest()` method

### 4. Token Refresh

```typescript
POST /auth/refresh
Cookies: refresh_token (automatically sent)
```

**Steps:**
1. Frontend interceptor detects 401 error
2. Frontend calls `/auth/refresh` (cookies sent automatically)
3. Backend extracts `refresh_token` from cookies
4. Backend decodes refresh token to get userId
5. Backend finds user's sessions in database
6. Backend compares refresh token hash with stored hash
7. If valid, backend generates new access token
8. Backend sets new `access_token` cookie
9. Frontend retries original request with new token

**Code Location:**
- `backend/src/modules/auth/auth.controller.ts` - `refresh()` method
- `backend/src/modules/auth/auth.service.ts` - `refresh()` method

### 5. Logout Process

```typescript
POST /auth/logout
Cookies: refresh_token (automatically sent)
```

**Steps:**
1. Backend extracts refresh token from cookies
2. Backend finds and deletes session from database
3. Backend clears cookies
4. Frontend clears Redux state

**Code Location:**
- `backend/src/modules/auth/auth.controller.ts` - `logout()` method
- `backend/src/modules/auth/auth.service.ts` - `logout()` method

---

## Frontend Authentication Flow

### 1. Login Flow

```typescript
// User submits form
handleSubmit() → dispatch(login(credentials))
  ↓
// Redux thunk calls API
authAPI.login() → POST /auth/login
  ↓
// Backend sets cookies, returns user
Response: { success: true, user: {...} }
  ↓
// Redux updates state
authSlice: { user, isAuthenticated: true }
  ↓
// Component redirects
router.replace("/dashboard")
  ↓
// Dashboard page checks role
useEffect() → router.replace("/dashboard/company-admin")
```

**Code Location:**
- `Frontend/app/login/page.tsx` - Login form
- `Frontend/app/store/authSlice.ts` - `login` thunk
- `Frontend/app/(dashboard)/dashboard/page.tsx` - Role-based routing

### 2. Registration Flow

**Create Company:**
```typescript
handleCreateCompany() → dispatch(registerCompany(data))
  ↓
// Backend creates company + admin user
// Backend sets cookies
  ↓
dispatch(fetchMe()) → GET /auth/me
  ↓
// Redux updates state
  ↓
router.replace("/dashboard")
```

**Join Company (via invite):**
```typescript
handleJoinCompany() → inviteAPI.acceptInvite(token, data)
  ↓
// Backend creates user, sets cookies
  ↓
dispatch(fetchMe())
  ↓
router.replace("/dashboard")
```

**Code Location:**
- `Frontend/app/register/page.tsx` - Registration forms
- `Frontend/app/store/companySlice.ts` - `registerCompany` thunk

### 3. Protected Route Access

```typescript
// User navigates to /dashboard/company-admin
  ↓
// DashboardLayout uses useAuthGuard()
useAuthGuard() → checks if user is authenticated
  ↓
// If not authenticated:
dispatch(fetchMe()) → GET /auth/me
  ↓
// If 401: redirect to /login
// If 200: allow access
```

**Code Location:**
- `Frontend/hooks/useAuthGuard.ts` - Auth guard hook
- `Frontend/app/(dashboard)/layout.tsx` - Dashboard layout

### 4. Automatic Token Refresh

```typescript
// API call fails with 401
api.get('/company/:id') → 401 Unauthorized
  ↓
// Axios interceptor catches error
api.interceptors.response.use(..., async (error) => {
  if (error.response?.status === 401) {
    // Call refresh endpoint
    await api.post('/auth/refresh')
    // Retry original request
    return api(originalRequest)
  }
})
```

**Code Location:**
- `Frontend/lib/api.ts` - Axios interceptor

### 5. State Management

**Redux Auth State:**
```typescript
{
  user: User | null,
  isAuthenticated: boolean,
  isLoading: boolean,        // For login/register actions
  isInitializing: boolean,    // For auth checks (fetchMe)
  error: string | null
}
```

**Key Actions:**
- `login(credentials)` - Login user
- `register(data)` - Register user
- `fetchMe()` - Get current user (auth check)
- `logout()` - Logout user
- `resetLoading()` - Reset stuck loading state

**Code Location:**
- `Frontend/app/store/authSlice.ts` - Redux slice

---

## Token Management

### Token Structure

**Access Token Payload:**
```json
{
  "sub": "userId",
  "email": "user@example.com",
  "role": "COMPANY_ADMIN",
  "companyId": "companyId",
  "orgId": "companyId",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Token Expiration:**
- **Access Token**: 15 minutes
- **Refresh Token**: 7 days

### Cookie Configuration

**Development:**
```typescript
{
  httpOnly: true,
  secure: false,        // HTTP allowed
  sameSite: 'lax',
  path: '/',
  maxAge: 15 * 60 * 1000  // 15 minutes
}
```

**Production:**
```typescript
{
  httpOnly: true,
  secure: true,         // HTTPS required
  sameSite: 'lax',
  path: '/',
  maxAge: 15 * 60 * 1000,
  domain: process.env.COOKIE_DOMAIN  // If specified
}
```

**Code Location:**
- `backend/src/modules/auth/auth.controller.ts` - `cookieConfig()` method

### Session Management

**Session Schema:**
```typescript
{
  userId: ObjectId,
  refreshTokenHash: string,  // Bcrypt hashed
  userAgent: string,
  ip: string,
  createdAt: Date
}
```

**Why Hash Refresh Tokens?**
- Security: If database is compromised, tokens can't be used
- Validation: Compare incoming token with stored hash
- Revocation: Delete session to logout user

**Code Location:**
- `backend/src/modules/auth/entities/session.entity.ts`

---

## Role-Based Access Control

### User Roles

```typescript
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',      // System admin
  COMPANY_ADMIN = 'COMPANY_ADMIN',  // Company owner
  MANAGER = 'MANAGER',              // Team manager
  USER = 'USER',                    // Regular user
  EDITOR = 'EDITOR',                // Content editor
  VIEWER = 'VIEWER'                 // Read-only access
}
```

### Role Hierarchy

```
SUPER_ADMIN
  └─ Can manage all companies
  
COMPANY_ADMIN
  └─ Can manage their company
  └─ Can create managers and users
  
MANAGER
  └─ Can manage their team
  └─ Can create projects and tasks
  
USER / EDITOR / VIEWER
  └─ Can view assigned tasks
  └─ Can update task status
```

### Backend Authorization

```typescript
@Get('/projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER)
async getProjects(@Req() req) {
  // Only COMPANY_ADMIN and MANAGER can access
  const user = req.user;
  return this.projectService.findAll(user.companyId);
}
```

**Code Location:**
- `backend/src/modules/auth/guards/roles.guard.ts`
- `backend/src/common/decorators/roles.decorator.ts`

### Frontend Authorization

```typescript
// Route protection
<RoleGuard allowedRoles={['company_admin', 'admin']}>
  <CompanyAdminDashboard />
</RoleGuard>

// Conditional rendering
{user?.role === 'COMPANY_ADMIN' && (
  <AdminPanel />
)}
```

**Code Location:**
- `Frontend/components/guards/RoleGuard.tsx`

### Dashboard Routing

```typescript
// Automatic routing based on role
if (role === 'super_admin') → /dashboard/super-admin
if (role === 'company_admin' || 'admin') → /dashboard/company-admin
if (role === 'manager') → /dashboard/manager
if (role === 'user' || 'editor' || 'viewer') → /dashboard/user
```

**Code Location:**
- `Frontend/app/(dashboard)/dashboard/page.tsx` - Role routing logic

---

## Error Handling

### Backend Error Responses

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Validation error",
  "error": "Bad Request"
}
```

### Frontend Error Handling

**API Interceptor:**
```typescript
// Automatic token refresh on 401
if (error.response?.status === 401) {
  // Try to refresh token
  await api.post('/auth/refresh')
  // Retry original request
  return api(originalRequest)
}

// If refresh fails, redirect to login
if (refreshError) {
  window.location.href = '/login'
}
```

**Component Error Handling:**
```typescript
try {
  const data = await companyAPI.getById(companyId);
} catch (error: any) {
  if (error.response?.status === 401) {
    // Interceptor will handle refresh
    // Don't manually redirect to avoid loops
    return;
  }
  // Handle other errors
  console.error('Error:', error);
}
```

**Code Location:**
- `Frontend/lib/api.ts` - Error interceptor
- `Frontend/app/(dashboard)/dashboard/company-admin/page.tsx` - Component error handling

---

## Best Practices

### Backend

1. **Always use guards for protected routes:**
   ```typescript
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles(UserRole.COMPANY_ADMIN)
   ```

2. **Validate company ownership:**
   ```typescript
   if (user.companyId.toString() !== resource.companyId.toString()) {
     throw new ForbiddenException('Access denied');
   }
   ```

3. **Use DTOs for validation:**
   ```typescript
   @IsString()
   @IsEmail()
   email: string;
   ```

4. **Hash sensitive data:**
   - Passwords: bcrypt (10 rounds)
   - Refresh tokens: bcrypt hash in database

5. **Set proper cookie options:**
   - `httpOnly: true` - Prevents JavaScript access
   - `secure: true` in production - HTTPS only
   - `sameSite: 'lax'` - CSRF protection

### Frontend

1. **Use local state for forms:**
   ```typescript
   const [isSubmitting, setIsSubmitting] = useState(false);
   // Don't rely on Redux isLoading for form submission
   ```

2. **Reset loading state on mount:**
   ```typescript
   useEffect(() => {
     dispatch(resetLoading());
   }, []);
   ```

3. **Let interceptor handle 401s:**
   ```typescript
   // Don't manually redirect on 401
   // Interceptor will refresh token and retry
   if (error.response?.status === 401) {
     return; // Let interceptor handle it
   }
   ```

4. **Check authentication before API calls:**
   ```typescript
   if (!user || !user.companyId) {
     return; // Don't make API call
   }
   ```

5. **Use role-based routing:**
   ```typescript
   // Automatically route users to correct dashboard
   useEffect(() => {
     if (user) {
       const role = user.role.toLowerCase();
       router.replace(`/dashboard/${getRolePath(role)}`);
     }
   }, [user]);
   ```

---

## Troubleshooting

### Issue: 401 Error on API Calls

**Symptoms:**
- API calls return 401 Unauthorized
- User is logged in but requests fail

**Debugging Steps:**
1. Check browser DevTools → Application → Cookies
   - Verify `access_token` and `refresh_token` exist
   - Check expiration dates

2. Check backend logs:
   ```
   🍪 Cookie extraction: { hasCookies: true, accessToken: "Found" }
   🔐 JWT Auth Guard: { hasUser: true }
   ```

3. Check token expiration:
   - Access token expires in 15 minutes
   - Interceptor should refresh automatically

4. Verify CORS settings:
   ```typescript
   // backend/src/main.ts
   app.enableCors({
     credentials: true,  // Required for cookies
     origin: ['http://localhost:3100']
   });
   ```

**Solutions:**
- Clear cookies and re-login
- Check backend cookie configuration
- Verify JWT secret matches
- Check CORS credentials setting

### Issue: Form Blocked / Won't Submit

**Symptoms:**
- Submit button disabled
- Form doesn't submit on click
- Console shows "Loading state stuck"

**Solutions:**
1. Use local `isSubmitting` state instead of Redux `isLoading`
2. Reset loading state on component mount:
   ```typescript
   useEffect(() => {
     dispatch(resetLoading());
   }, []);
   ```
3. Check if auth guard is interfering:
   ```typescript
   // Auth guard should skip public routes
   if (PUBLIC_ROUTES.includes(pathname)) {
     return; // Don't fetch user
   }
   ```

### Issue: Infinite Redirect Loop

**Symptoms:**
- Page keeps redirecting between login and dashboard
- Browser console shows multiple redirects

**Solutions:**
1. Check auth guard logic:
   ```typescript
   // Don't redirect if already on correct page
   if (currentPath === '/login' && !isAuthenticated) {
     return; // Stay on login
   }
   ```

2. Use `router.replace()` instead of `router.push()`:
   ```typescript
   router.replace('/dashboard'); // Prevents back button issues
   ```

3. Check Redux state:
   ```typescript
   // Ensure isAuthenticated matches user presence
   if (user && !isAuthenticated) {
     // State mismatch - fix it
   }
   ```

### Issue: Token Refresh Fails

**Symptoms:**
- 401 errors persist after refresh attempt
- User gets logged out frequently

**Debugging:**
1. Check refresh token in database:
   ```typescript
   // Verify session exists
   const session = await SessionModel.findOne({ userId });
   ```

2. Check token expiration:
   - Refresh token expires in 7 days
   - If expired, user must re-login

3. Verify cookie settings:
   ```typescript
   // Cookies must be set with same domain/path
   res.cookie('access_token', token, {
     path: '/',  // Must match
     sameSite: 'lax'
   });
   ```

**Solutions:**
- Clear all cookies and re-login
- Check backend session cleanup (old sessions might block)
- Verify refresh token hash comparison works

### Issue: Role-Based Routing Not Working

**Symptoms:**
- User redirected to wrong dashboard
- Role check fails

**Solutions:**
1. Verify role in JWT payload:
   ```typescript
   // Check token contains role
   const payload = jwt.decode(token);
   console.log('Role:', payload.role);
   ```

2. Normalize role comparison:
   ```typescript
   const role = (user.role || '').toLowerCase();
   if (role === 'company_admin' || role === 'admin') {
     // Handle company admin
   }
   ```

3. Check role in database:
   ```typescript
   // Ensure user has correct role
   const user = await UserModel.findById(userId);
   console.log('User role:', user.role);
   ```

---

## Security Considerations

### 1. Cookie Security
- ✅ **HttpOnly**: Prevents XSS attacks
- ✅ **Secure**: HTTPS only in production
- ✅ **SameSite**: CSRF protection
- ✅ **Path**: Restricts cookie scope

### 2. Token Security
- ✅ **Short expiration**: Access tokens expire in 15 minutes
- ✅ **Hashed refresh tokens**: Stored as bcrypt hashes
- ✅ **Session validation**: Refresh tokens validated against database

### 3. Password Security
- ✅ **Bcrypt hashing**: 10 rounds
- ✅ **Never returned**: Passwords excluded from responses
- ✅ **Validation**: Minimum 6 characters

### 4. CORS Security
- ✅ **Specific origins**: Only allowed origins
- ✅ **Credentials**: Required for cookies
- ✅ **Methods**: Limited to necessary HTTP methods

---

## API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login user |
| POST | `/auth/refresh` | No* | Refresh access token (*uses refresh token cookie) |
| GET | `/auth/me` | Yes | Get current user |
| POST | `/auth/logout` | Yes | Logout user |

### Protected Endpoints

All other endpoints require `JwtAuthGuard`:
- `GET /company/:id` - Get company (requires auth)
- `GET /projects` - Get projects (requires auth + role)
- `GET /tasks` - Get tasks (requires auth)
- etc.

---

## Development Workflow

### 1. Adding a New Protected Route

**Backend:**
```typescript
@Controller('resource')
export class ResourceController {
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  async findAll(@Req() req) {
    const user = req.user; // Automatically populated
    return this.resourceService.findAll(user.companyId);
  }
}
```

**Frontend:**
```typescript
// Component
const { user } = useSelector((state: RootState) => state.auth);

useEffect(() => {
  if (!user?.companyId) return;
  
  const fetchData = async () => {
    try {
      const res = await resourceAPI.findAll();
      setData(res.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Interceptor handles refresh
        return;
      }
      console.error('Error:', error);
    }
  };
  
  fetchData();
}, [user]);
```

### 2. Testing Authentication

**Manual Testing:**
1. Login → Check cookies set
2. Navigate to protected route → Should work
3. Wait 15+ minutes → Should auto-refresh
4. Clear cookies → Should redirect to login

**Backend Testing:**
```bash
# Test login
curl -X POST http://localhost:5500/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt

# Test protected route (cookies sent automatically)
curl -X GET http://localhost:5500/company/123 \
  -b cookies.txt
```

---

## Summary

### Key Points

1. **Cookie-based JWT**: Tokens stored in HttpOnly cookies for security
2. **Automatic Refresh**: Interceptor handles token refresh seamlessly
3. **Separate Loading States**: Forms use local state to prevent blocking
4. **Role-Based Routing**: Users automatically routed to correct dashboard
5. **Multi-tenancy**: All data scoped to user's company
6. **Session Management**: Refresh tokens validated against database

### Flow Diagram

```
Login → Backend validates → Sets cookies → Returns user
  ↓
Frontend stores user in Redux → Redirects to dashboard
  ↓
Dashboard checks role → Routes to role-specific dashboard
  ↓
API calls → JWT validated from cookies → Returns data
  ↓
If 401 → Interceptor refreshes token → Retries request
```

This system provides **production-ready authentication** with security, reliability, and excellent user experience.

