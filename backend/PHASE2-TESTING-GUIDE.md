# Phase 2 - Multi-Tenant Company + Role & User Management Testing Guide

## 🧪 Testing Checklist

### Prerequisites
1. MongoDB is running
2. Backend is compiled (`npm run build`)
3. Environment variables are set (`.env` file)

### 1. Start Backend Server
```bash
cd backend
npm run start:dev
```

Expected: Server starts and creates default SUPER_ADMIN user
- Email: `admin@novapulse.com` (or from env)
- Password: `admin123` (or from env)
- Role: `super_admin`

---

## 📋 Test Scenarios

### Test 1: Super Admin Login & Create Company

**Endpoint:** `POST /auth/login`
```json
{
  "email": "admin@novapulse.com",
  "password": "admin123"
}
```

**Expected Response:**
- Status: 200
- Contains: `accessToken`, `refreshToken`, `user`
- User role: `super_admin`
- User has `companyId` (null for super admin)

**Next:** Use the `accessToken` in Authorization header for subsequent requests

---

### Test 2: Create Company (Super Admin)

**Endpoint:** `POST /company/create`
**Headers:**
```
Authorization: Bearer <accessToken>
```

**Body:**
```json
{
  "name": "Acme Corporation",
  "domain": "acme.com",
  "companyAdminEmail": "admin@acme.com",
  "companyAdminName": "Acme Admin",
  "companyAdminPassword": "AcmeAdmin123!"
}
```

**Expected Response:**
- Status: 201
- Contains: `company` object with `_id`, `name`, `domain`
- Contains: `companyAdmin` object with role `company_admin`
- Company admin's `companyId` matches company `_id`

---

### Test 3: Get All Companies (Super Admin)

**Endpoint:** `GET /company/all`
**Headers:**
```
Authorization: Bearer <accessToken>
```

**Expected Response:**
- Status: 200
- Array of companies
- Each company has: `name`, `domain`, `createdBy`, `managers[]`, `users[]`

---

### Test 4: Login as Company Admin

**Endpoint:** `POST /auth/login`
```json
{
  "email": "admin@acme.com",
  "password": "AcmeAdmin123!"
}
```

**Expected Response:**
- Status: 200
- User role: `company_admin`
- User has `companyId` matching the created company

---

### Test 5: Get Company Details (Company Admin)

**Endpoint:** `GET /company/:companyId`
**Headers:**
```
Authorization: Bearer <companyAdminToken>
```

**Expected Response:**
- Status: 200
- Company details with populated managers and users

---

### Test 6: Create Manager (Company Admin)

**Endpoint:** `POST /user/create-by-admin`
**Headers:**
```
Authorization: Bearer <companyAdminToken>
```

**Body:**
```json
{
  "name": "John Manager",
  "email": "manager@acme.com",
  "password": "Manager123!",
  "role": "manager"
}
```

**Expected Response:**
- Status: 201
- Created user has role `manager`
- User's `companyId` matches company admin's company
- User's `createdBy` is the company admin's ID

---

### Test 7: Get All Company Users (Company Admin)

**Endpoint:** `GET /user/company`
**Headers:**
```
Authorization: Bearer <companyAdminToken>
```

**Expected Response:**
- Status: 200
- Array of all users in the company
- Includes company admin and manager

---

### Test 8: Login as Manager

**Endpoint:** `POST /auth/login`
```json
{
  "email": "manager@acme.com",
  "password": "Manager123!"
}
```

**Expected Response:**
- Status: 200
- User role: `manager`
- User has `companyId`

---

### Test 9: Create User (Manager)

**Endpoint:** `POST /user/create-by-manager`
**Headers:**
```
Authorization: Bearer <managerToken>
```

**Body:**
```json
{
  "name": "Jane User",
  "email": "user@acme.com",
  "password": "User123!",
  "department": "Engineering",
  "location": "Remote"
}
```

**Expected Response:**
- Status: 201
- Created user has role `user`
- User's `companyId` matches manager's company
- User's `createdBy` is the manager's ID
- User's `managerId` is the manager's ID

---

### Test 10: Get My Team (Manager)

**Endpoint:** `GET /user/my-team`
**Headers:**
```
Authorization: Bearer <managerToken>
```

**Expected Response:**
- Status: 200
- Array of users created by this manager
- Should include the user created in Test 9

---

### Test 11: Login as Regular User

**Endpoint:** `POST /auth/login`
```json
{
  "email": "user@acme.com",
  "password": "User123!"
}
```

**Expected Response:**
- Status: 200
- User role: `user`
- User has `companyId`

---

### Test 12: Access Control Tests

#### Test 12a: Company Admin Cannot Access Other Company
- Try: `GET /company/:otherCompanyId` with company admin token
- Expected: 403 Forbidden

#### Test 12b: Manager Cannot Create Manager
- Try: `POST /user/create-by-admin` with manager token
- Expected: 403 Forbidden (only company admin can create managers)

#### Test 12c: Regular User Cannot Access Company Endpoints
- Try: `GET /company/all` with user token
- Expected: 403 Forbidden

---

## 🎯 Frontend Testing

### 1. Login Flow
1. Navigate to `/login`
2. Login with super admin credentials
3. Should redirect to `/dashboard/super-admin`

### 2. Super Admin Dashboard
- Should see stats: Total Companies, Total Users, etc.
- Should have "Create Company" button
- Should list recent companies

### 3. Create Company Flow
1. Click "Create Company"
2. Fill form: name, domain, admin email/password
3. Submit
4. Should create company and company admin

### 4. Company Admin Dashboard
1. Logout
2. Login with company admin credentials
3. Should redirect to `/dashboard/company-admin`
4. Should see company stats
5. Should be able to create managers

### 5. Manager Dashboard
1. Login as manager
2. Should redirect to `/dashboard/manager`
3. Should see team size
4. Should be able to create users

### 6. User Dashboard
1. Login as regular user
2. Should redirect to `/dashboard/user`
3. Should see limited view (tasks, profile)

---

## 🔍 Verification Checklist

- [ ] Super Admin can create companies
- [ ] Company Admin is created with correct companyId
- [ ] Company Admin can view their company
- [ ] Company Admin can create managers
- [ ] Manager can create users
- [ ] Users are scoped to correct company
- [ ] JWT tokens include companyId
- [ ] Role-based access control works
- [ ] Frontend dashboards route correctly
- [ ] Data isolation per company works

---

## 🐛 Common Issues

1. **"Company not found"** - Check companyId in JWT payload
2. **"Forbidden"** - Check role in JWT payload matches required role
3. **"User must belong to a company"** - Verify companyId is set on user
4. **Token expired** - Use refresh token endpoint to get new access token

---

## 📝 Postman Collection

Import this collection to test all endpoints:

```json
{
  "info": {
    "name": "Phase 2 - Multi-Tenant API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login Super Admin",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@novapulse.com\",\n  \"password\": \"admin123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Company",
      "item": [
        {
          "name": "Create Company",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{accessToken}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Acme Corporation\",\n  \"domain\": \"acme.com\",\n  \"companyAdminEmail\": \"admin@acme.com\",\n  \"companyAdminName\": \"Acme Admin\",\n  \"companyAdminPassword\": \"AcmeAdmin123!\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/company/create",
              "host": ["{{baseUrl}}"],
              "path": ["company", "create"]
            }
          }
        },
        {
          "name": "Get All Companies",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{accessToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/company/all",
              "host": ["{{baseUrl}}"],
              "path": ["company", "all"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## ✅ Success Criteria

Phase 2 is complete when:
1. ✅ All backend endpoints work correctly
2. ✅ RBAC is enforced (guards work)
3. ✅ Multi-tenant isolation works (users can't access other companies)
4. ✅ Frontend dashboards load and route correctly
5. ✅ User hierarchy works (Super Admin → Company Admin → Manager → User)
6. ✅ JWT tokens include role and companyId



