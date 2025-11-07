# 🧪 Complete Testing Guide - NovaPulse Phase 2 & 2.5

## 📋 Table of Contents
1. [Why You're Getting 401 Error](#why-401-error)
2. [Quick Fix for Token Issues](#quick-fix)
3. [All API Endpoints](#all-endpoints)
4. [Testing Workflows](#testing-workflows)
5. [Postman Setup](#postman-setup)
6. [UI Testing Guide](#ui-testing)

---

## 🔴 Why You're Getting 401 Error

### Common Causes:
1. **Token Expired** - JWT tokens expire in **15 minutes**
2. **Wrong Role** - `/users/create` requires `COMPANY_ADMIN` role
3. **Invalid Token Format** - Token might be corrupted
4. **User Not Found** - User was deleted or doesn't exist in DB

### How to Fix:
1. **Get a fresh token** by logging in again
2. **Use Company Admin credentials** (not regular user)
3. **Check token format**: Should be `Bearer <token>` in Authorization header

---

## ⚡ Quick Fix

### Step 1: Login to Get Fresh Token
```http
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "ceo@technova.com",
  "password": "Admin@123"
}
```

### Step 2: Copy the Token
From response, copy the `token` or `accessToken` field.

### Step 3: Use Token in Headers
```http
Authorization: Bearer <your-token-here>
```

**Important:** Tokens expire in 15 minutes! Re-login if you get 401.

---

## 📡 All API Endpoints

### 🔐 Authentication Endpoints

#### 1. Company Registration (Public)
```http
POST /company/register
Content-Type: application/json

{
  "companyName": "TechNova",
  "email": "ceo@technova.com",
  "password": "Admin@123",
  "adminName": "John Doe"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Company and Admin created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "company": {
      "_id": "652f7b9...",
      "name": "TechNova"
    },
    "user": {
      "_id": "652f7c1...",
      "email": "ceo@technova.com",
      "role": "COMPANY_ADMIN"
    }
  }
}
```

**What it does:**
- Creates a new Company
- Creates a Company Admin user (CEO)
- Auto-logs in and returns JWT token
- Sets auth cookies

---

#### 2. Login (Any Role)
```http
POST /auth/login
Content-Type: application/json

{
  "email": "ceo@technova.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "652f7c1...",
    "email": "ceo@technova.com",
    "role": "COMPANY_ADMIN",
    "companyId": "652f7b9...",
    "name": "John Doe"
  }
}
```

**Token Expiry:**
- Access Token: **15 minutes**
- Refresh Token: **7 days**

---

#### 3. Get Current User Profile
```http
GET /user/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Your profile info",
  "user": {
    "_id": "652f7c1...",
    "email": "ceo@technova.com",
    "role": "COMPANY_ADMIN",
    "companyId": "652f7b9...",
    "name": "John Doe"
  }
}
```

---

#### 4. Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 🏢 Company Endpoints

#### 5. Create Company (Super Admin Only)
```http
POST /company/create
Authorization: Bearer <super-admin-token>
Content-Type: application/json

{
  "companyName": "NewCorp",
  "email": "admin@newcorp.com",
  "password": "Admin@123",
  "adminName": "CEO Name"
}
```

**Access:** `SUPER_ADMIN` only

---

#### 6. Get All Companies (Super Admin Only)
```http
GET /company/all
Authorization: Bearer <super-admin-token>
```

**Response:**
```json
[
  {
    "_id": "652f7b9...",
    "name": "TechNova",
    "domain": "technova.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Access:** `SUPER_ADMIN` only

---

#### 7. Get Company by ID
```http
GET /company/:id
Authorization: Bearer <token>
```

**Access:** 
- `SUPER_ADMIN` - Can view any company
- `COMPANY_ADMIN` - Can only view own company

---

#### 8. Update Company
```http
PATCH /company/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Company Name",
  "domain": "newdomain.com"
}
```

**Access:** `COMPANY_ADMIN` or `SUPER_ADMIN`

---

#### 9. Create Invite Token (Company Admin/Manager)
```http
POST /company/invite
Authorization: Bearer <company-admin-token>
Content-Type: application/json

{
  "email": "newuser@technova.com",
  "role": "USER"  // or "MANAGER"
}
```

**Response:**
```json
{
  "inviteToken": "a3f9c2b7-8dbe-4c87-a421-7c6e..."
}
```

**Access:** `COMPANY_ADMIN`, `MANAGER`

---

#### 10. Join Company via Invite Token (Public)
```http
POST /company/join
Content-Type: application/json

{
  "email": "newuser@technova.com",
  "password": "User@123",
  "name": "New User",
  "inviteToken": "a3f9c2b7-8dbe-4c87-a421-7c6e..."
}
```

**Response:**
```json
{
  "message": "User joined company successfully",
  "data": {
    "companyId": "652f7b9...",
    "role": "USER"
  }
}
```

**What it does:**
- Validates invite token
- Creates user account
- Links user to company
- Auto-logs in and returns token

---

### 👥 User Management Endpoints

#### 11. Create User (Company Admin Only)
```http
POST /users/create
Authorization: Bearer <company-admin-token>
Content-Type: application/json

{
  "name": "Ali Manager",
  "email": "manager@technova.com",
  "password": "Manager@123",
  "role": "MANAGER",  // or "USER"
  "managerId": "optional-manager-id"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "652f8a1...",
    "email": "manager@technova.com",
    "role": "MANAGER",
    "name": "Ali Manager",
    "companyId": "652f7b9...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Access:** `COMPANY_ADMIN` only

**⚠️ Common Error:** 401 Unauthorized
- **Cause:** Token expired or wrong role
- **Fix:** Re-login as Company Admin and use fresh token

---

#### 12. Get All Users in Company
```http
GET /users/all
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "email": "ceo@technova.com",
    "role": "COMPANY_ADMIN",
    "name": "John Doe",
    "_id": "652f7c1..."
  },
  {
    "email": "manager@technova.com",
    "role": "MANAGER",
    "name": "Ali Manager",
    "_id": "652f8a1..."
  },
  {
    "email": "user@technova.com",
    "role": "USER",
    "name": "New User",
    "_id": "652f9b2..."
  }
]
```

**Access:** `COMPANY_ADMIN`, `MANAGER`, `SUPER_ADMIN`

---

#### 13. Get My Users (Manager Only)
```http
GET /user/my-users
Authorization: Bearer <manager-token>
```

**Access:** `MANAGER` only

**Response:** List of users created by this manager

---

#### 14. Get My Team (Manager Only)
```http
GET /user/my-team
Authorization: Bearer <manager-token>
```

**Access:** `MANAGER` only

**Response:** List of users under this manager

---

#### 15. Update User
```http
PATCH /user/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "newemail@technova.com"
}
```

**Access:** 
- `COMPANY_ADMIN` - Can update any user in company
- `MANAGER` - Can update users they created
- `USER` - Can only update themselves

---

#### 16. Get User by ID
```http
GET /user/:id
Authorization: Bearer <token>
```

**Access:** Based on role and company isolation

---

### 📬 Invite Endpoints

#### 17. Create Invite (Alternative)
```http
POST /invite/create
Authorization: Bearer <company-admin-token>
Content-Type: application/json

{
  "email": "user@technova.com",
  "role": "USER"
}
```

**Response:**
```json
{
  "invite": {
    "token": "a3f9c2b7-8dbe-4c87-a421-7c6e...",
    "email": "user@technova.com",
    "role": "USER",
    "expiresAt": "2024-01-08T00:00:00.000Z"
  }
}
```

**Access:** `COMPANY_ADMIN`, `MANAGER`

---

#### 18. Accept Invite
```http
POST /invite/accept
Content-Type: application/json

{
  "token": "a3f9c2b7-8dbe-4c87-a421-7c6e...",
  "email": "user@technova.com",
  "name": "New User",
  "password": "User@123"
}
```

**Response:**
```json
{
  "message": "Invite accepted successfully",
  "user": {
    "_id": "652f9b2...",
    "email": "user@technova.com",
    "role": "USER",
    "companyId": "652f7b9..."
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 19. Get Invite Details (Public)
```http
GET /invite/:token
```

**Response:**
```json
{
  "invite": {
    "email": "user@technova.com",
    "role": "USER",
    "company": {
      "name": "TechNova",
      "_id": "652f7b9..."
    },
    "expiresAt": "2024-01-08T00:00:00.000Z"
  }
}
```

---

## 🧪 Testing Workflows

### Workflow 1: Company Self-Registration
1. **Register Company**
   ```http
   POST /company/register
   {
     "companyName": "AcmeCorp",
     "email": "ceo@acme.com",
     "password": "Admin@123"
   }
   ```
2. **Save the token** from response
3. **Test Company Admin access**
   ```http
   GET /user/me
   Authorization: Bearer <token>
   ```
4. **Create a user**
   ```http
   POST /users/create
   Authorization: Bearer <token>
   {
     "name": "Manager One",
     "email": "manager@acme.com",
     "password": "Manager@123",
     "role": "MANAGER"
   }
   ```

---

### Workflow 2: Invite Flow
1. **Company Admin creates invite**
   ```http
   POST /company/invite
   Authorization: Bearer <company-admin-token>
   {
     "email": "newuser@acme.com",
     "role": "USER"
   }
   ```
2. **Copy invite token**
3. **User accepts invite** (in new browser/Postman)
   ```http
   POST /company/join
   {
     "email": "newuser@acme.com",
     "password": "User@123",
     "inviteToken": "<invite-token>"
   }
   ```
4. **User is auto-logged in** with token

---

### Workflow 3: Super Admin Creates Company
1. **Login as Super Admin**
   ```http
   POST /auth/login
   {
     "email": "admin@novapulse.com",
     "password": "admin123"
   }
   ```
2. **Create company**
   ```http
   POST /company/create
   Authorization: Bearer <super-admin-token>
   {
     "companyName": "NewCorp",
     "email": "ceo@newcorp.com",
     "password": "Admin@123"
   }
   ```
3. **View all companies**
   ```http
   GET /company/all
   Authorization: Bearer <super-admin-token>
   ```

---

### Workflow 4: RBAC Testing
1. **Login as Company Admin** → Get token
2. **Try to create user** → Should work ✅
3. **Login as Manager** → Get token
4. **Try to create user** → Should fail (403) ❌
5. **Try to view all users** → Should work ✅
6. **Login as User** → Get token
7. **Try to view all users** → Should fail (403) ❌

---

## 📮 Postman Setup

### Step 1: Create Environment
Create a new environment in Postman:
- `baseUrl`: `http://localhost:5000` (or your backend URL)
- `token`: (leave empty, will be set automatically)

### Step 2: Create Collection
Create collection: **NovaPulse API**

### Step 3: Add Pre-request Script (Auto Token)
For authenticated requests, add this script:
```javascript
// Auto-set token from environment
const token = pm.environment.get("token");
if (token) {
    pm.request.headers.add({
        key: "Authorization",
        value: `Bearer ${token}`
    });
}
```

### Step 4: Add Tests Script (Save Token)
For login/register endpoints, add this:
```javascript
// Save token to environment
if (pm.response.code === 200 || pm.response.code === 201) {
    const jsonData = pm.response.json();
    if (jsonData.token) {
        pm.environment.set("token", jsonData.token);
    } else if (jsonData.accessToken) {
        pm.environment.set("token", jsonData.accessToken);
    }
}
```

### Step 5: Test Token Expiry
Add this test to check token:
```javascript
pm.test("Token is valid", function () {
    pm.response.to.have.status(200);
});

// If 401, token expired - need to re-login
if (pm.response.code === 401) {
    console.log("⚠️ Token expired! Please login again.");
}
```

---

## 🖥️ UI Testing Guide

### 1. Company Registration Flow
1. Go to `/register-company`
2. Fill form:
   - Company Name: "TechNova"
   - Email: "ceo@technova.com"
   - Password: "Admin@123"
3. Submit
4. **Expected:** Redirects to `/dashboard/company-admin`
5. **Check:** Sidebar shows company admin options

---

### 2. Login Flow
1. Go to `/login`
2. Enter credentials
3. Submit
4. **Expected:** Redirects based on role:
   - Super Admin → `/dashboard/super-admin`
   - Company Admin → `/dashboard/company-admin`
   - Manager → `/dashboard/manager`
   - User → `/dashboard/user`

---

### 3. Invite Flow (UI)
1. **As Company Admin:**
   - Go to "Invite Users" or "Team" section
   - Enter email and select role
   - Generate invite link
   - Copy invite token/URL

2. **As New User:**
   - Open invite link or go to `/register?token=<invite-token>`
   - Fill registration form
   - Submit
   - **Expected:** Auto-logged in and redirected to dashboard

---

### 4. User Management (UI)
1. **As Company Admin:**
   - Go to "Users" or "Team Management"
   - Click "Create User"
   - Fill form (name, email, password, role)
   - Submit
   - **Expected:** User appears in list

2. **As Manager:**
   - Go to "My Team"
   - **Expected:** Only see users you created

3. **As User:**
   - Try to access "Users" page
   - **Expected:** 403 Forbidden or hidden from sidebar

---

### 5. Data Isolation Testing
1. **Create Company A:**
   - Register: "AcmeCorp" with "ceo@acme.com"
   - Create user: "user1@acme.com"

2. **Create Company B:**
   - Register: "TechVerse" with "ceo@techverse.com"
   - Create user: "user2@techverse.com"

3. **Test Isolation:**
   - Login as "ceo@acme.com"
   - View users list
   - **Expected:** Only see AcmeCorp users
   - **Not Expected:** See TechVerse users

4. **Try Cross-Company Access:**
   - Login as "ceo@acme.com"
   - Try to access TechVerse company ID
   - **Expected:** 403 Forbidden

---

## 🔍 Troubleshooting

### Problem: 401 Unauthorized
**Solutions:**
1. Token expired (15 minutes) → Re-login
2. Wrong token format → Use `Bearer <token>`
3. User deleted → Create new user
4. JWT secret mismatch → Check `.env` file

---

### Problem: 403 Forbidden
**Solutions:**
1. Wrong role → Use correct role (Company Admin for `/users/create`)
2. Cross-company access → Only access your own company
3. Missing permissions → Check role requirements

---

### Problem: Token Not Working
**Solutions:**
1. Check token in JWT.io → Decode and verify payload
2. Verify `companyId` and `role` in token
3. Check backend logs for errors
4. Ensure JWT secret matches in `.env`

---

### Problem: User Not Found
**Solutions:**
1. Check if user exists in database
2. Verify `_id` format (MongoDB ObjectId)
3. Check if user was deleted
4. Verify companyId matches

---

## 📊 Test Data

### Super Admin (Auto-created)
- **Email:** `admin@novapulse.com`
- **Password:** `admin123`
- **Role:** `SUPER_ADMIN`

### Test Company 1: AcmeCorp
- **Company:** AcmeCorp
- **Admin:** `ceo@acme.com` / `Admin@123`
- **Manager:** `manager@acme.com` / `Manager@123`
- **User:** `user@acme.com` / `User@123`

### Test Company 2: TechVerse
- **Company:** TechVerse
- **Admin:** `ceo@techverse.com` / `Admin@123`
- **Manager:** `manager@techverse.com` / `Manager@123`
- **User:** `user@techverse.com` / `User@123`

**To create test data:**
```bash
npm run seed:test
```

---

## ✅ Testing Checklist

### Authentication
- [ ] Company registration works
- [ ] Login works for all roles
- [ ] Token expires after 15 minutes
- [ ] Refresh token works
- [ ] Logout clears token

### Company Management
- [ ] Company Admin can view own company
- [ ] Super Admin can view all companies
- [ ] Company Admin cannot view other companies
- [ ] Company update works

### User Management
- [ ] Company Admin can create users
- [ ] Manager cannot create users
- [ ] User cannot create users
- [ ] Company Admin can view all users
- [ ] Manager can view team users
- [ ] User cannot view other users

### Invite System
- [ ] Company Admin can create invites
- [ ] Manager can create invites
- [ ] Invite token works
- [ ] Invite expires after set time
- [ ] User can join via invite

### RBAC
- [ ] Role guards work correctly
- [ ] 403 errors for unauthorized roles
- [ ] 401 errors for expired tokens
- [ ] Company isolation enforced

### Data Isolation
- [ ] Users only see own company data
- [ ] Cross-company access blocked
- [ ] Company Admin isolated to own company
- [ ] Super Admin can access all

---

## 🎯 Quick Reference

### Base URL
```
http://localhost:5000
```

### Token Format
```
Authorization: Bearer <token>
```

### Token Expiry
- Access Token: **15 minutes**
- Refresh Token: **7 days**

### Roles
- `SUPER_ADMIN` - Platform owner
- `COMPANY_ADMIN` - Company CEO
- `MANAGER` - Team lead
- `USER` - Regular employee

---

## 📝 Notes

1. **Always use fresh tokens** - They expire in 15 minutes
2. **Check role requirements** - Each endpoint has specific role needs
3. **Test data isolation** - Verify companies can't see each other's data
4. **Use Postman environments** - Save tokens automatically
5. **Check backend logs** - They show detailed error messages

---

**Happy Testing! 🚀**

