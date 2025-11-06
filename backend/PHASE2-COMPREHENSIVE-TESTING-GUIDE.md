# Phase 2 Comprehensive Testing Guide

## 🎯 Goal of Testing

Ensure that:
- ✅ Each company is isolated (no data leaks between tenants)
- ✅ Each role only accesses allowed endpoints and dashboards
- ✅ Auth tokens include correct `companyId` + `role`
- ✅ Company registration, login, and invitation/join flows work end-to-end
- ✅ UI dashboards route and render correctly for every role

---

## 📋 Table of Contents

1. [Setup & Prerequisites](#setup--prerequisites)
2. [Section 1: Postman / Backend API Testing](#section-1--postman--backend-api-testing)
3. [Section 2: Frontend UI Testing](#section-2--frontend-ui-testing-nextjs)
4. [Section 3: Database Validation](#section-3--database-validation-mongodb)
5. [Section 4: Automation (Jest Tests)](#section-4--automation-optional-but-recommended)
6. [Summary Table](#-summary-table)

---

## Setup & Prerequisites

### 1. Seed Test Data

First, seed your database with test data:

```bash
# Option 1: Use the test seed service programmatically
cd backend
npm run start:dev
# The TestDataSeed service will run automatically (or call it manually)

# Option 2: Import the seed in your app module and call it
```

**Test Data Created:**
- **1 Super Admin**: `super.admin@test.com` / `super123`
- **AcmeCorp**:
  - Admin: `acme.admin@acme.com` / `acme123`
  - Manager: `acme.manager@acme.com` / `acme123`
  - User 1: `acme.user1@acme.com` / `acme123`
  - User 2: `acme.user2@acme.com` / `acme123`
- **TechVerse**:
  - Admin: `tech.admin@techverse.com` / `tech123`
  - Manager: `tech.manager@techverse.com` / `tech123`
  - User 1: `tech.user1@techverse.com` / `tech123`
  - User 2: `tech.user2@techverse.com` / `tech123`

### 2. Import Postman Collection

1. Open Postman
2. Import the collection: `backend/postman/Novapulse-Phase2-Testing.postman_collection.json`
3. Import all 4 environments:
   - `SuperAdmin.postman_environment.json`
   - `AcmeCorp_Admin.postman_environment.json`
   - `AcmeCorp_User.postman_environment.json`
   - `TechVerse_Admin.postman_environment.json`
4. Set `baseUrl` in each environment to your backend URL (default: `http://localhost:3000`)

---

## 🔹 SECTION 1 — Postman / Backend API Testing

### Step 1 – Setup

✅ **Verify test data exists:**
- Run login requests for each user to confirm they exist
- Note the `companyId` values returned (save them in Postman environment variables)

### Step 2 – Auth & JWT Verification

**Endpoints:**
- `POST /auth/login` → get token
- `GET /auth/me` → get profile

**✅ Checks:**

1. **JWT Payload Verification:**
   - Login as `acme.admin@acme.com`
   - Extract token from cookies
   - Decode JWT (use [jwt.io](https://jwt.io) or Postman script)
   - Verify payload contains:
     ```json
     {
       "sub": "<userId>",
       "email": "acme.admin@acme.com",
       "role": "company_admin",
       "companyId": "<acmeCompanyId>"
     }
     ```

2. **Refresh Token:**
   - Test `POST /auth/refresh` with refresh token from cookies
   - Should return new access token

3. **Tokens Differ Per Company:**
   - Login as Acme Admin → note `companyId` in token
   - Login as TechVerse Admin → note `companyId` in token
   - Verify they are different

### Step 3 – Company Isolation

**Endpoints:**
- `GET /company/:id`
- `GET /company/:id/users`
- `GET /user/company`

**✅ Checks:**

1. **Cross-Company Access Blocked:**
   - Login as `acme.admin@acme.com`
   - Try to access `GET /company/{techCompanyId}` → **Should return 403**
   - Try to access `GET /company/{techCompanyId}/users` → **Should return 403**

2. **Own Company Access Allowed:**
   - Login as `acme.admin@acme.com`
   - Access `GET /company/{acmeCompanyId}` → **Should return 200**
   - Access `GET /company/{acmeCompanyId}/users` → **Should return 200**
   - Verify all returned users have `companyId === acmeCompanyId`

3. **Negative Test - Modified JWT:**
   - Manually modify JWT payload to change `companyId` to another company
   - Try to access that company's data → **Should be rejected** (guard checks user document, not just token)

### Step 4 – RBAC (Role Guard)

Test each endpoint with every role:

| Endpoint | Expected Access | Test User | Expected Result |
|----------|----------------|-----------|-----------------|
| `POST /company/register` | Public (no auth) | - | ✅ 201 |
| `POST /company/create` | SuperAdmin | AcmeAdmin | ❌ 403 |
| `GET /company/all` | SuperAdmin | AcmeAdmin | ❌ 403 |
| `POST /user/create` | CompanyAdmin ✅ / Manager ✅ | User | ❌ 403 |
| `GET /user/company` | CompanyAdmin | Manager / User | ❌ 403 |
| `GET /tasks` | All roles ✅ (scoped by companyId) | All | ✅ 200 |

**✅ Checks:**

1. **403 Errors for Unauthorized Roles:**
   - Test each endpoint with wrong role
   - Verify error message contains role restriction info

2. **Success for Permitted Roles:**
   - Test each endpoint with correct role
   - Verify data is returned correctly

3. **Logs Confirm Guard Messages:**
   - Check backend logs for messages like "Access Denied – Role: user"

### Step 5 – Company Registration Flow

**Endpoint:** `POST /company/register`

**Body:**
```json
{
  "companyName": "Acme Corp",
  "adminName": "John Doe",
  "email": "john@acme.com",
  "password": "****"
}
```

**✅ Checks:**

1. **Creates New Company:**
   - Verify company is created in DB
   - Company has `name`, `domain` (if provided), `isActive: true`

2. **Creates Admin User:**
   - User is created with `role: company_admin`
   - User has `companyId === company._id`
   - User is added to `company.managers` and `company.users` arrays

3. **Returns Token + Company Info:**
   - Response includes `company` object
   - Response includes `admin` user object (password excluded)
   - Cookies are set with `access_token` and `refresh_token`

4. **Database Verification:**
   ```javascript
   // In MongoDB
   db.companies.findOne({ name: "Acme Corp" })
   db.users.findOne({ email: "john@acme.com" })
   // Verify: user.companyId === company._id
   ```

### Step 6 – Join Company / Invite Flow

#### 1️⃣ Generate Invite

**Endpoint:** `POST /invite/company/:companyId` (Company Admin)

**Body:**
```json
{
  "email": "invited@acme.com",
  "role": "user",
  "expiresInDays": 7
}
```

**✅ Checks:**

1. **Generates Token:**
   - Response includes `invite.token`
   - Token is stored in DB (`invites` collection)
   - Token has `expiresAt` field (7 days from now)

2. **Invite Contains Company Info:**
   - `invite.companyId` matches the company
   - `invite.role` matches requested role
   - `invite.createdBy` matches the admin who created it

#### 2️⃣ Register via Invite

**Endpoint:** `POST /invite/:token/accept` (Public)

**Body:**
```json
{
  "email": "invited@acme.com",
  "name": "Invited User",
  "password": "invited123"
}
```

**✅ Checks:**

1. **Token Resolves to Correct Company:**
   - User is created with `companyId === invite.companyId`
   - User has `role === invite.role`

2. **Token Invalid After Use:**
   - Try to accept the same token again → **Should return 404/400**

3. **User Created Correctly:**
   - User has `companyId` matching the invite
   - User is added to `company.users` array
   - If role is `manager`, user is also added to `company.managers`

#### 3️⃣ Negative Cases

- **Expired Token:** Modify `expiresAt` to past date → Try to accept → **Should return 400**
- **Wrong Token:** Use invalid token → **Should return 404**
- **Email Mismatch:** If invite has specific email, use different email → **Should return 400**

### Step 7 – Company Guard

**Endpoint:** `GET /company/:id/users`

**✅ Checks:**

1. **Only Own Company Access:**
   - Login as Acme Admin
   - Access `GET /company/{acmeCompanyId}/users` → **Should succeed**
   - Access `GET /company/{techCompanyId}/users` → **Should return 403**

2. **Super Admin Can Access All:**
   - Login as Super Admin
   - Access any company's users → **Should succeed**

### Step 8 – Audit / Activity (If Implemented)

- Verify audit logs record correct `companyId` + `userId`
- Check `lastUpdated` fields are set correctly
- Verify activity logs show correct company context

---

## 🔹 SECTION 2 — Frontend UI Testing (Next.js)

Use separate browser sessions or incognito tabs to simulate different roles.

### Login / Registration

**✅ Checks:**

1. **Company Registration:**
   - Navigate to `/register-company`
   - Fill form and submit
   - Should create company + auto-login
   - Should redirect to `/dashboard/company-admin`

2. **Join Company Flow:**
   - Navigate to `/register?token={inviteToken}`
   - Fill form and submit
   - Should create user with correct `companyId`
   - Should redirect to role-specific dashboard

3. **Redirects Based on Role:**
   - Super Admin → `/dashboard/super-admin`
   - Company Admin → `/dashboard/company-admin`
   - Manager → `/dashboard/manager`
   - User → `/dashboard/user`

### Dashboard Routing & Guards

**✅ Checks:**

1. **Unauthorized Access Blocked:**
   - Login as regular user
   - Try to visit `/dashboard/super-admin` → **Should redirect / 403**
   - Try to visit `/dashboard/company-admin` → **Should redirect / 403**

2. **Role-Specific Sidebar:**
   - Login as Company Admin → Should see "Manage Users", "Company Settings"
   - Login as User → Should NOT see admin-only items
   - Login as Manager → Should see manager-specific items

### Data Isolation

**✅ Checks:**

1. **Company-Scoped Data:**
   - Login as Acme user
   - View tasks/users → Should only see Acme data
   - Switch to TechVerse user → Should see completely different data

2. **No Cross-Company Leaks:**
   - Verify API calls include correct `companyId` in headers/query
   - Verify no data from other companies appears

### Company Admin Workflow

**✅ Checks:**

1. **Can Invite/Create Users:**
   - Navigate to "Invite User"
   - Create invite → Copy link
   - Verify invite link works

2. **Can Update Company Info:**
   - Navigate to "Company Settings"
   - Update company name/domain
   - Verify changes persist

3. **Cannot View Other Companies:**
   - Try to access other company's data → **Should be blocked**

### User Workflow

**✅ Checks:**

1. **Can View Own Tasks:**
   - Login as user
   - View tasks assigned to them
   - Update task status

2. **Cannot Access Admin Features:**
   - Try to access "Manage Users" → **Should be blocked**
   - Try to access "Company Settings" → **Should be blocked**

3. **Profile Shows Company Info:**
   - View profile page
   - Verify company name and role are displayed

### Invite Flow UI

**✅ Checks:**

1. **Company Admin Can Generate Invite:**
   - Navigate to "Invite User"
   - Fill form and generate invite
   - Copy invite link

2. **Invite Link Works:**
   - Open invite link in new tab (incognito)
   - Should show registration form pre-filled with company info
   - Submit form → Should create user and redirect to dashboard

### Visual and UX

**✅ Checks:**

1. **Sidebar Renders Correctly:**
   - Each role sees appropriate menu items
   - Icons and labels are correct

2. **Logout Works:**
   - Click logout → Should clear token
   - Should redirect to `/login`

3. **Error Banners:**
   - Trigger 403 error → Should show error banner
   - Trigger 401 error → Should redirect to login

---

## 🔹 SECTION 3 — Database Validation (MongoDB)

After running tests, inspect your database:

### Verify User-Company Relationships

```javascript
// Each user has a companyId
db.users.find({}).forEach(user => {
  assert(user.companyId, "User missing companyId: " + user.email);
});

// Company Admin's _id is in company.createdBy (if created by Super Admin)
db.companies.find({}).forEach(company => {
  if (company.createdBy) {
    const admin = db.users.findOne({ _id: company.createdBy });
    assert(admin.companyId.toString() === company._id.toString(), 
           "Admin companyId mismatch");
  }
});

// Managers and Users listed in company arrays
db.companies.find({}).forEach(company => {
  const companyUsers = db.users.find({ companyId: company._id });
  companyUsers.forEach(user => {
    assert(company.users.includes(user._id), 
           "User not in company.users: " + user.email);
    if (user.role === 'manager' || user.role === 'company_admin') {
      assert(company.managers.includes(user._id), 
             "Manager not in company.managers: " + user.email);
    }
  });
});
```

### Verify No Cross-Company References

```javascript
// No user has companyId pointing to wrong company
db.users.find({}).forEach(user => {
  const company = db.companies.findOne({ _id: user.companyId });
  assert(company, "User has invalid companyId: " + user.email);
});
```

### Optional: Task-Company Validation

```javascript
// If tasks have companyId, verify they match assignee's companyId
db.tasks.find({}).forEach(task => {
  const assignee = db.users.findOne({ _id: task.assignedTo });
  if (task.companyId && assignee) {
    assert(task.companyId.toString() === assignee.companyId.toString(),
           "Task companyId mismatch with assignee");
  }
});
```

---

## 🔹 SECTION 4 — Automation (Optional but Recommended)

### Jest + Supertest Tests

Run the E2E test suite:

```bash
cd backend
npm run test:e2e
```

**Test File:** `backend/src/modules/auth/auth.e2e-spec.ts`

**Tests Cover:**
- ✅ Auth guard behavior
- ✅ Role restrictions
- ✅ Company guard validation
- ✅ JWT payload verification
- ✅ Company isolation
- ✅ Invite flow

### Cypress / Playwright for Frontend

Create E2E tests for:
- Route guards
- Role-based UI rendering
- Data isolation in UI
- Invite flow UI

**Example Cypress Test:**
```javascript
describe('Dashboard Access Control', () => {
  it('should redirect user away from admin dashboard', () => {
    cy.login('acme.user1@acme.com', 'acme123');
    cy.visit('/dashboard/company-admin');
    cy.url().should('not.include', '/dashboard/company-admin');
  });
});
```

---

## 🧠 Summary Table

| Area | Focus | Tools | Expected Result |
|------|-------|-------|-----------------|
| **Auth** | JWT payload + RBAC | Postman / Jest | Correct role & companyId |
| **Company Isolation** | Data guarding | Postman + DB inspect | 403 on cross tenant |
| **Company Registration** | Flow | UI / Postman | Creates company + admin |
| **Invite / Join Flow** | 2.5 Enhancement | UI | Token-based join works |
| **Role Routing** | Frontend Guards | Cypress / manual | Proper redirects |
| **UI Isolation** | Dashboard data | Browser | Only own company's data |

---

## ✅ Success Criteria

If all these tests pass, your Phase 2 + 2.5 are production-ready, and you can safely proceed to Phase 3 (Projects & Tasks) knowing the multi-tenant foundation is bulletproof.

### Checklist:

- [ ] All Postman tests pass
- [ ] All Jest E2E tests pass
- [ ] Frontend route guards work correctly
- [ ] No cross-company data leaks
- [ ] All roles can only access permitted endpoints
- [ ] Company registration flow works end-to-end
- [ ] Invite/join flow works end-to-end
- [ ] Database validation passes
- [ ] UI dashboards render correctly for each role

---

## 🐛 Troubleshooting

### Common Issues:

1. **403 Errors When They Shouldn't Happen:**
   - Check JWT token is being sent correctly (cookies or Authorization header)
   - Verify user's `companyId` matches the resource's `companyId`
   - Check role guard is configured correctly

2. **Tokens Not Being Set:**
   - Verify cookie settings (httpOnly, secure, sameSite)
   - Check CORS settings allow credentials
   - Verify JWT secret is consistent

3. **Database Queries Returning Wrong Data:**
   - Verify all queries filter by `companyId`
   - Check that `req.user.companyId` is being used in service methods

---

## 📝 Notes

- Always use test database for testing (not production!)
- Clean up test data after testing
- Document any issues found during testing
- Update this guide if you find additional test cases

---

**Happy Testing! 🚀**

