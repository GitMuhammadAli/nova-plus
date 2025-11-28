# NovaPulse - Complete Project Documentation

> **Comprehensive technical documentation for the NovaPulse multi-tenant SaaS platform**

**Version:** 2.0  
**Last Updated:** November 2024  
**Status:** Phase 2 Complete (Multi-Tenancy & Company System)  
**Documentation Status:** Complete - Ready for Production

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [API Documentation](#api-documentation)
5. [Authentication & Security](#authentication--security)
6. [Multi-Tenancy Implementation](#multi-tenancy-implementation)
7. [Phase 1: Foundation & Authentication](#phase-1-foundation--authentication)
8. [Phase 2: Multi-Tenancy & Company System](#phase-2-multi-tenancy--company-system)
9. [Frontend Architecture](#frontend-architecture)
10. [Email System (Mailtrap Integration)](#email-system-mailtrap-integration)
11. [Database Migrations & Schema Management](#database-migrations--schema-management)
12. [Development Workflow](#development-workflow)
13. [Testing Strategy](#testing-strategy)
14. [Deployment Guide](#deployment-guide)
15. [Troubleshooting](#troubleshooting)
16. [Future Roadmap](#future-roadmap)
17. [Support & Resources](#support--resources)

---

## Quick Reference

### Essential Commands

**Backend:**

```bash
cd backend
npm install          # Install dependencies
npm run start:dev   # Start development server
npm run build       # Build for production
npm run start:prod  # Start production server
npm run test        # Run unit tests
npm run test:e2e    # Run E2E tests
```

**Frontend:**

```bash
cd Frontend
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run test         # Run tests
```

### Key Endpoints

- **Health Check:** `GET /health`
- **Login:** `POST /auth/login`
- **Register:** `POST /auth/register`
- **Company Register:** `POST /company/register`
- **Get Current User:** `GET /auth/me`

### Default Ports

- **Backend:** `http://localhost:5500`
- **Frontend:** `http://localhost:3100`
- **MongoDB:** `mongodb://localhost:27017`

### Environment Variables (Required)

**Backend:**

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh secret
- `FRONTEND_URL` - Frontend URL for CORS

**Frontend:**

- `NEXT_PUBLIC_API_URL` - Backend API URL

---

## Project Overview

### What is NovaPulse?

NovaPulse is a modern, scalable multi-tenant SaaS platform designed for managing companies, users, projects, and tasks with complete tenant isolation. Built with enterprise-grade security and scalability in mind.

### Key Characteristics

- **Multi-Tenant Architecture:** Complete data isolation between companies
- **Role-Based Access Control (RBAC):** Granular permissions system
- **JWT Authentication:** Secure token-based authentication with refresh tokens
- **Company Management:** Self-service company registration and administration
- **Invite System:** Token-based and email-based user invitations
- **Scalable Design:** Built for growth with MongoDB and NestJS

### Technology Stack

**Backend:**

- **Framework:** NestJS 10+ (Node.js)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (Passport.js), bcrypt
- **Email:** Nodemailer with Mailtrap integration
- **Language:** TypeScript
- **Validation:** class-validator, class-transformer

**Frontend:**

- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **State Management:** Redux Toolkit
- **Styling:** Tailwind CSS + shadcn/ui components
- **Language:** TypeScript
- **HTTP Client:** Axios with interceptors

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │  Redux Store │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                 │
│                    ┌───────▼────────┐                       │
│                    │   API Client    │                       │
│                    │   (Axios)       │                       │
│                    └───────┬─────────┘                       │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTPS
                             │ (with cookies)
┌────────────────────────────▼─────────────────────────────────┐
│                    Backend (NestJS)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Controllers │  │   Services   │  │    Guards    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
│                    ┌───────▼────────┐                        │
│                    │   MongoDB     │                        │
│                    │   Database    │                        │
│                    └────────────────┘                        │
└───────────────────────────────────────────────────────────────┘
```

### Module Structure

**Backend Modules:**

```
backend/src/
├── modules/
│   ├── auth/          # Authentication & authorization
│   ├── user/          # User management
│   ├── company/       # Company/tenant management
│   ├── invite/        # Invite system
│   ├── project/       # Project management
│   ├── task/          # Task management
│   ├── team/          # Team management
│   ├── dashboard/     # Dashboard & analytics
│   ├── email/         # Email service (Mailtrap)
│   └── health/        # Health checks
├── common/            # Shared utilities
│   ├── decorators/    # Custom decorators
│   ├── filters/       # Exception filters
│   ├── guards/        # Auth guards
│   ├── interceptors/   # Request/response interceptors
│   └── logger/        # Winston logger
└── config/            # Configuration
    ├── configuration.ts
    └── validation.ts
```

**Frontend Structure:**

```
Frontend/
├── app/
│   ├── (dashboard)/   # Dashboard routes (protected)
│   ├── (marketing)/   # Public marketing pages
│   ├── login/         # Login page
│   ├── register/      # Registration page
│   ├── invite/        # Invite acceptance
│   └── layout.tsx     # Root layout
├── components/        # React components
│   ├── auth/         # Auth components
│   ├── ui/           # shadcn/ui components
│   └── layout/       # Layout components
├── app/store/        # Redux store
│   ├── slices/       # Redux slices
│   └── store.ts      # Store configuration
└── lib/              # Utilities
    ├── api.ts        # Axios client
    └── utils.ts      # Helper functions
```

---

## Database Schema

### User Collection

```typescript
{
  _id: ObjectId,
  email: string (unique, required, indexed),
  password: string (hashed with bcrypt, required),
  name: string (default: 'User'),
  role: enum [
    'super_admin',
    'company_admin',
    'manager',
    'user',
    'admin',        // Legacy
    'editor',      // Legacy
    'viewer',      // Legacy
    'superadmin'   // Legacy
  ] (default: 'user'),
  orgId: ObjectId (ref: 'Organization', optional, legacy),
  companyId: ObjectId (ref: 'Company', optional, indexed),
  createdBy: ObjectId (ref: 'User', optional),
  managerId: ObjectId (ref: 'User', optional),
  isActive: boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `email` (unique)
- `companyId`
- `orgId` (legacy)

**Relationships:**

- `companyId` → Company (many-to-one)
- `createdBy` → User (self-reference)
- `managerId` → User (self-reference, for users only)

### Company Collection

```typescript
{
  _id: ObjectId,
  name: string (required, indexed),
  domain: string (optional, unique if provided),
  createdBy: ObjectId (ref: 'User', optional),
    // null = self-registered, ObjectId = created by Super Admin
  managers: ObjectId[] (ref: 'User', default: []),
    // Company admins and managers
  users: ObjectId[] (ref: 'User', default: []),
    // All users in the company
  isActive: boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `name`
- `domain` (unique, sparse)

**Relationships:**

- `createdBy` → User (one-to-one, optional)
- `managers[]` → User (many-to-many)
- `users[]` → User (many-to-many)

### Invite Collection

```typescript
{
  _id: ObjectId,
  token: string (unique, required, indexed),
  companyId: ObjectId (ref: 'Company', required, indexed),
  createdBy: ObjectId (ref: 'User', required),
  email: string (optional, indexed),
    // Optional: for email-specific invites
  role: string (required, default: 'user'),
    // 'manager' or 'user' (admin roles cannot be invited)
  isUsed: boolean (default: false),
  usedBy: ObjectId (ref: 'User', optional),
  usedAt: Date (optional),
  expiresAt: Date (required, indexed),
  isActive: boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `token` (unique)
- `companyId`
- `email`
- `expiresAt`

**Relationships:**

- `companyId` → Company (many-to-one)
- `createdBy` → User (many-to-one)
- `usedBy` → User (one-to-one, optional)

### Session Collection

```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required, indexed),
  refreshTokenHash: string (bcrypt hashed, required),
  userAgent: string,
  ip: string,
  createdAt: Date,
  lastUsedAt: Date
}
```

**Indexes:**

- `userId`

**Relationships:**

- `userId` → User (many-to-one)

### Project Collection

```typescript
{
  _id: ObjectId,
  name: string (required),
  description: string (optional),
  companyId: ObjectId (ref: 'Company', required, indexed),
  createdBy: ObjectId (ref: 'User', required, indexed),
  assignedUsers: ObjectId[] (ref: 'User', default: []),
  status: enum [
    'active',
    'completed',
    'on_hold',
    'cancelled'
  ] (default: 'active', indexed),
  startDate: Date (optional),
  endDate: Date (optional),
  isActive: boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `companyId`
- `createdBy`
- `status`

**Relationships:**

- `companyId` → Company (many-to-one)
- `createdBy` → User (many-to-one)
- `assignedUsers[]` → User (many-to-many)

### Task Collection

```typescript
{
  _id: ObjectId,
  title: string (required),
  description: string (optional),
  projectId: ObjectId (ref: 'Project', optional),
  companyId: ObjectId (ref: 'Company', required, indexed),
  assignedTo: ObjectId (ref: 'User', required, indexed),
  createdBy: ObjectId (ref: 'User', required),
  status: enum [
    'pending',
    'in_progress',
    'done',
    'cancelled'
  ] (default: 'pending', indexed),
  priority: enum [
    'low',
    'medium',
    'high'
  ] (default: 'medium'),
  dueDate: Date (optional),
  comments: Array<{
    userId: ObjectId,
    text: string,
    createdAt: Date
  }> (default: []),
  isActive: boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `companyId`
- `assignedTo`
- `status`

**Relationships:**

- `projectId` → Project (many-to-one, optional)
- `companyId` → Company (many-to-one)
- `assignedTo` → User (many-to-one)
- `createdBy` → User (many-to-one)

### Activity Collection

```typescript
{
  _id: ObjectId,
  type: enum [
    'user',
    'project',
    'task',
    'company',
    'login',
    'logout',
    'system'
  ] (required, indexed),
  userId: ObjectId (ref: 'User', optional, indexed),
  userName: string (optional),
  action: string (required),
  description: string (optional),
  target: string (optional),
  metadata: Object (optional),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `type`
- `userId`

**Relationships:**

- `userId` → User (many-to-one, optional)

---

## API Documentation

### Base URL

- **Development:** `http://localhost:5500`
- **Production:** `https://api.novapulse.com` (example)

### API Versioning

Currently using unversioned API. All endpoints are under root path (e.g., `/auth/login`). Future versions may use `/api/v1/` prefix.

### Authentication

All protected endpoints require JWT authentication via:

- **HttpOnly Cookies:** `access_token` and `refresh_token` (preferred)
- **Authorization Header:** `Bearer <token>` (alternative)

**Note:** Cookies are automatically sent by browsers, making them the preferred method for web applications.

### Response Format

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"  // Optional
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400,
  "timestamp": "2024-11-13T12:00:00.000Z",
  "path": "/api/endpoint"
}
```

**Validation Error Response:**

```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "email must be an email"
    }
  ]
}
```

### API Endpoint Summary

**Authentication (Public):**

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user

**Company (Mixed):**

- `POST /company/register` - Public company registration
- `POST /company/create` - Create company (Super Admin)
- `POST /company/invite` - Create invite
- `GET /company/all` - List all companies (Super Admin)
- `GET /company/:id` - Get company details
- `PATCH /company/:id` - Update company
- `GET /company/:id/users` - Get company users

**Users:**

- `GET /users/all` - List users (company-scoped)
- `POST /users/create` - Create user (Admin)
- `GET /user/:id` - Get user details
- `PATCH /user/:id` - Update user
- `DELETE /user/:id` - Delete user

**Invites:**

- `GET /invite/:token` - Get invite details (Public)
- `POST /invite/:token/accept` - Accept invite (Public)
- `GET /invite/company/:companyId` - List company invites
- `DELETE /invite/:inviteId/company/:companyId` - Delete invite

**Projects:**

- `POST /projects` - Create project
- `GET /projects` - List projects
- `GET /projects/:id` - Get project details
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

**Tasks:**

- `POST /tasks` - Create task
- `GET /tasks` - List tasks
- `GET /tasks/me` - Get my tasks
- `GET /tasks/:id` - Get task details
- `PATCH /tasks/:id` - Update task
- `PATCH /tasks/:id/status` - Update task status
- `POST /tasks/:id/comments` - Add comment
- `DELETE /tasks/:id` - Delete task

**Dashboard:**

- `GET /dashboard/summary` - Dashboard summary
- `GET /dashboard/stats` - Detailed statistics
- `GET /activity/recent` - Recent activity

**Teams:**

- `POST /teams` - Create team
- `GET /teams` - List teams
- `GET /teams/:id` - Get team details
- `POST /teams/:id/members` - Add member
- `DELETE /teams/:id/members/:memberId` - Remove member
- `DELETE /teams/:id` - Delete team

**Settings:**

- `GET /settings` - List settings
- `POST /settings` - Create setting
- `GET /settings/:id` - Get setting
- `PATCH /settings/:id` - Update setting
- `DELETE /settings/:id` - Delete setting

**Billing:**

- `GET /billing` - Get billing info
- `POST /billing` - Create billing record
- `GET /billing/:id` - Get billing record
- `PATCH /billing/:id` - Update billing
- `DELETE /billing/:id` - Delete billing

**Analytics:**

- `GET /analytics` - List analytics
- `POST /analytics` - Create analytics event
- `GET /analytics/:id` - Get analytics record
- `PATCH /analytics/:id` - Update analytics
- `DELETE /analytics/:id` - Delete analytics

**Uploads:**

- `POST /uploads` - Upload file
- `GET /uploads` - List files
- `GET /uploads/:id` - Get file details
- `DELETE /uploads/:id` - Delete file

**Health:**

- `GET /health` - Health check (Public)

---

### Authentication Endpoints

#### POST `/auth/register`

Register a new user (public endpoint).

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "user" // Optional, defaults to 'user'
}
```

**Response:** 201 Created

```json
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "access_token": "jwt_token",
  "refresh_token": "refresh_token"
}
```

**Cookies Set:**

- `access_token` (HttpOnly, 15 minutes)
- `refresh_token` (HttpOnly, 30 days)

---

#### POST `/auth/login`

Login with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "company_admin",
    "companyId": "..."
  },
  "access_token": "jwt_token",
  "refresh_token": "refresh_token"
}
```

**Cookies Set:**

- `access_token` (HttpOnly, 15 minutes)
- `refresh_token` (HttpOnly, 30 days)

---

#### POST `/auth/refresh`

Refresh access token using refresh token.

**Request:** No body required (uses refresh_token cookie)

**Response:** 200 OK

```json
{
  "success": true,
  "access_token": "new_jwt_token"
}
```

**Cookies Updated:**

- `access_token` (new token)

---

#### POST `/auth/logout`

Logout and invalidate refresh token.

**Request:** No body required

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Cookies Cleared:**

- `access_token`
- `refresh_token`

---

#### GET `/auth/me`

Get current authenticated user.

**Request:** No body required (uses access_token cookie)

**Response:** 200 OK

```json
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "company_admin",
    "companyId": "...",
    "orgId": "..." // Legacy
  }
}
```

---

### Company Endpoints

#### POST `/company/register`

Public company registration (creates company + admin user).

**Request Body:**

```json
{
  "companyName": "Acme Corp",
  "domain": "acme.com", // Optional
  "adminName": "John Doe",
  "email": "admin@acme.com",
  "password": "securePassword123"
}
```

**Response:** 201 Created

```json
{
  "success": true,
  "company": {
    "_id": "...",
    "name": "Acme Corp",
    "domain": "acme.com",
    "isActive": true
  },
  "admin": {
    "_id": "...",
    "email": "admin@acme.com",
    "name": "John Doe",
    "role": "company_admin",
    "companyId": "..."
  },
  "access_token": "jwt_token",
  "refresh_token": "refresh_token"
}
```

**Required:** None (public endpoint)

---

#### POST `/company/create`

Create a company (Super Admin only).

**Request Body:**

```json
{
  "name": "TechVerse Inc",
  "domain": "techverse.com", // Optional
  "adminEmail": "admin@techverse.com",
  "adminName": "Jane Smith",
  "adminPassword": "securePassword123"
}
```

**Response:** 201 Created

```json
{
  "success": true,
  "company": { ... },
  "admin": { ... }
}
```

**Required Roles:** `SUPER_ADMIN`

---

#### GET `/company/all`

List all companies (Super Admin only).

**Response:** 200 OK

```json
{
  "success": true,
  "companies": [
    {
      "_id": "...",
      "name": "Acme Corp",
      "domain": "acme.com",
      "isActive": true,
      "usersCount": 10,
      "managersCount": 2
    }
  ]
}
```

**Required Roles:** `SUPER_ADMIN`

---

#### GET `/company/:id`

Get company details.

**Response:** 200 OK

```json
{
  "success": true,
  "company": {
    "_id": "...",
    "name": "Acme Corp",
    "domain": "acme.com",
    "managers": [...],
    "users": [...],
    "isActive": true
  }
}
```

**Required:** Authenticated user (Company Guard ensures user can only access their own company)

---

#### PATCH `/company/:id`

Update company information.

**Request Body:**

```json
{
  "name": "Acme Corporation", // Optional
  "domain": "acme-corp.com", // Optional
  "isActive": true // Optional
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "company": { ... }
}
```

**Required Roles:** `COMPANY_ADMIN` (own company only)

---

#### GET `/company/:id/users`

Get all users in a company.

**Response:** 200 OK

```json
{
  "success": true,
  "users": [
    {
      "_id": "...",
      "email": "user@acme.com",
      "name": "User Name",
      "role": "user",
      "isActive": true
    }
  ]
}
```

**Required Roles:** `COMPANY_ADMIN` (own company only) or `SUPER_ADMIN`

---

#### POST `/company/invite`

Create an invite for a user to join the company.

**Request Body:**

```json
{
  "email": "newuser@example.com", // Optional
  "role": "user", // 'user' or 'manager'
  "expiresInDays": 3 // Optional, default: 3
}
```

**Response:** 201 Created

```json
{
  "success": true,
  "inviteToken": "unique_token_string",
  "inviteLink": "http://localhost:3100/register?token=unique_token_string",
  "invite": {
    "_id": "...",
    "email": "newuser@example.com",
    "role": "user",
    "expiresAt": "2024-11-20T12:00:00.000Z"
  }
}
```

**Required Roles:** `COMPANY_ADMIN` or `MANAGER` (Managers can only invite users, not managers)

**Email:** If Mailtrap is configured, an email will be sent to the provided email address.

---

### User Endpoints

#### GET `/users/all`

Get all users in the current user's company.

**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search term

**Response:** 200 OK

```json
{
  "success": true,
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

**Required Roles:** `COMPANY_ADMIN`, `MANAGER`, or `SUPER_ADMIN`

---

#### POST `/users/create`

Create a new user (Company Admin only).

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "New User",
  "role": "user" // 'user' or 'manager'
}
```

**Response:** 201 Created

```json
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "user",
    "companyId": "..."
  }
}
```

**Required Roles:** `COMPANY_ADMIN`

---

#### GET `/user/:id`

Get user details.

**Response:** 200 OK

```json
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "companyId": "...",
    "isActive": true
  }
}
```

**Required:** Authenticated user (Company Guard ensures user can only access users from their company)

---

#### PATCH `/user/:id`

Update user information.

**Request Body:**

```json
{
  "name": "Updated Name", // Optional
  "role": "manager", // Optional
  "isActive": true // Optional
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "user": { ... }
}
```

**Required Roles:** `COMPANY_ADMIN` (own company only)

---

#### DELETE `/user/:id`

Delete (soft delete) a user.

**Response:** 200 OK

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Required Roles:** `COMPANY_ADMIN` (own company only)

---

### Invite Endpoints

#### GET `/invite/:token`

Get invite details by token (public endpoint).

**Response:** 200 OK

```json
{
  "success": true,
  "invite": {
    "_id": "...",
    "token": "...",
    "companyId": "...",
    "email": "invited@example.com",
    "role": "user",
    "expiresAt": "2024-11-20T12:00:00.000Z",
    "isUsed": false,
    "isActive": true
  },
  "company": {
    "_id": "...",
    "name": "Acme Corp"
  }
}
```

**Required:** None (public endpoint)

---

#### POST `/invite/:token/accept`

Accept an invite and create a user account. **Automatically logs in the user** after successful registration.

**Request Body:**

```json
{
  "email": "invited@example.com", // Must match invite email if specified
  "name": "Invited User",
  "password": "securePassword123"
}
```

**Response:** 201 Created

```json
{
  "success": true,
  "message": "Invite accepted successfully",
  "user": {
    "_id": "...",
    "email": "invited@example.com",
    "name": "Invited User",
    "role": "user",
    "companyId": "..."
  },
  "company": {
    "_id": "...",
    "name": "Acme Corp"
  }
}
```

**Cookies Set:**

- `access_token` (HttpOnly, 15 minutes)
- `refresh_token` (HttpOnly, 7 days)

**Required:** None (public endpoint)

**Validation:**

- Token must be valid and not expired
- Token must be active (not revoked)
- Email must match invite email (if specified)
- User with email must not already exist

**Post-Acceptance:**

- Invite is **automatically deleted** from database (single-use enforcement)
- User is automatically logged in via HttpOnly cookies
- Frontend redirects user to their role-based dashboard

---

#### GET `/invite/company/:companyId`

Get all invites for a company.

**Response:** 200 OK

```json
{
  "success": true,
  "invites": [
    {
      "_id": "...",
      "email": "invited@example.com",
      "role": "user",
      "isUsed": false,
      "expiresAt": "...",
      "createdAt": "..."
    }
  ]
}
```

**Required Roles:** `COMPANY_ADMIN` (own company only) or `SUPER_ADMIN`

---

#### DELETE `/invite/:inviteId/company/:companyId`

Delete an invite.

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Invite deleted successfully"
}
```

**Required Roles:** `COMPANY_ADMIN` (own company only)

---

### Project Endpoints

#### POST `/projects`

Create a new project.

**Request Body:**

```json
{
  "name": "Project Name",
  "description": "Project description", // Optional
  "startDate": "2024-11-15", // Optional
  "endDate": "2024-12-15" // Optional
}
```

**Response:** 201 Created

```json
{
  "success": true,
  "project": {
    "_id": "...",
    "name": "Project Name",
    "companyId": "...",
    "createdBy": "...",
    "status": "active"
  }
}
```

**Required Roles:** `COMPANY_ADMIN` or `MANAGER`

---

#### GET `/projects`

Get all projects in the current user's company.

**Response:** 200 OK

```json
{
  "success": true,
  "projects": [...]
}
```

**Required:** Authenticated user (Company Guard ensures company-scoped results)

---

#### GET `/projects/:id`

Get project details.

**Response:** 200 OK

```json
{
  "success": true,
  "project": { ... }
}
```

**Required:** Authenticated user (Company Guard)

---

#### PATCH `/projects/:id`

Update project.

**Request Body:**

```json
{
  "name": "Updated Name", // Optional
  "description": "...", // Optional
  "status": "completed", // Optional
  "startDate": "...", // Optional
  "endDate": "..." // Optional
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "project": { ... }
}
```

**Required Roles:** `COMPANY_ADMIN` or `MANAGER` (own company only)

---

#### DELETE `/projects/:id`

Delete a project.

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Required Roles:** `COMPANY_ADMIN` or `MANAGER` (own company only)

---

### Task Endpoints

#### POST `/tasks`

Create a new task.

**Request Body:**

```json
{
  "title": "Task Title",
  "description": "Task description", // Optional
  "projectId": "...", // Optional
  "assignedTo": "...", // User ID
  "priority": "high", // Optional: 'low', 'medium', 'high'
  "dueDate": "2024-11-20" // Optional
}
```

**Response:** 201 Created

```json
{
  "success": true,
  "task": {
    "_id": "...",
    "title": "Task Title",
    "companyId": "...",
    "assignedTo": "...",
    "status": "pending",
    "priority": "high"
  }
}
```

**Required Roles:** `COMPANY_ADMIN` or `MANAGER`

---

#### GET `/tasks`

Get all tasks in the current user's company.

**Query Parameters:**

- `status` (optional): Filter by status
- `assignedTo` (optional): Filter by assignee
- `projectId` (optional): Filter by project

**Response:** 200 OK

```json
{
  "success": true,
  "tasks": [...]
}
```

**Required:** Authenticated user (Company Guard)

---

#### GET `/tasks/me`

Get tasks assigned to the current user.

**Response:** 200 OK

```json
{
  "success": true,
  "tasks": [...]
}
```

**Required:** Authenticated user

---

#### GET `/tasks/:id`

Get task details.

**Response:** 200 OK

```json
{
  "success": true,
  "task": { ... }
}
```

**Required:** Authenticated user (Company Guard)

---

#### PATCH `/tasks/:id`

Update task.

**Request Body:**

```json
{
  "title": "Updated Title", // Optional
  "description": "...", // Optional
  "status": "in_progress", // Optional
  "priority": "medium", // Optional
  "dueDate": "..." // Optional
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "task": { ... }
}
```

**Required:** Authenticated user (Company Guard, assignee or admin)

---

#### PATCH `/tasks/:id/status`

Update task status only.

**Request Body:**

```json
{
  "status": "done" // 'pending', 'in_progress', 'done', 'cancelled'
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "task": { ... }
}
```

**Required:** Authenticated user (Company Guard, assignee or admin)

---

#### POST `/tasks/:id/comments`

Add a comment to a task.

**Request Body:**

```json
{
  "text": "Comment text"
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "task": { ... }
}
```

**Required:** Authenticated user (Company Guard)

---

#### DELETE `/tasks/:id`

Delete a task.

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

**Required Roles:** `COMPANY_ADMIN` or `MANAGER` (own company only)

---

### Dashboard Endpoints

#### GET `/dashboard/summary`

Get dashboard summary for the current user.

**Response:** 200 OK

```json
{
  "success": true,
  "summary": {
    "totalProjects": 10,
    "activeProjects": 8,
    "totalTasks": 45,
    "pendingTasks": 12,
    "inProgressTasks": 20,
    "completedTasks": 13,
    "totalUsers": 15
  }
}
```

**Required:** Authenticated user (Company Guard)

---

#### GET `/dashboard/stats`

Get detailed statistics.

**Response:** 200 OK

```json
{
  "success": true,
  "stats": {
    "projects": { ... },
    "tasks": { ... },
    "users": { ... }
  }
}
```

**Required:** Authenticated user (Company Guard)

---

#### GET `/activity/recent`

Get recent activity logs.

**Query Parameters:**

- `limit` (optional): Number of activities (default: 20)

**Response:** 200 OK

```json
{
  "success": true,
  "activities": [
    {
      "_id": "...",
      "type": "task",
      "action": "created",
      "description": "Task 'Fix bug' was created",
      "userId": "...",
      "userName": "John Doe",
      "createdAt": "..."
    }
  ]
}
```

**Required:** Authenticated user (Company Guard)

---

### Health Check Endpoints

#### GET `/health`

Health check endpoint for monitoring and load balancers.

**Response:** 200 OK

```json
{
  "ok": true,
  "uptime": 12345.67,
  "timestamp": 1700000000000
}
```

**Required:** None (public endpoint)

---

### Team Endpoints

#### POST `/teams`

Create a new team.

**Request Body:**

```json
{
  "name": "Development Team",
  "description": "Team description" // Optional
}
```

**Response:** 201 Created

```json
{
  "success": true,
  "team": {
    "_id": "...",
    "name": "Development Team",
    "companyId": "...",
    "members": [...],
    "createdBy": "..."
  }
}
```

**Required Roles:** `MANAGER`, `COMPANY_ADMIN`, or `SUPER_ADMIN`

---

#### GET `/teams`

List all teams the current user is a member of or manages.

**Response:** 200 OK

```json
{
  "success": true,
  "teams": [
    {
      "_id": "...",
      "name": "Development Team",
      "members": [...],
      "companyId": "..."
    }
  ]
}
```

**Required:** Authenticated user

---

#### GET `/teams/:id`

Get team details.

**Response:** 200 OK

```json
{
  "success": true,
  "team": {
    "_id": "...",
    "name": "Development Team",
    "members": [...],
    "companyId": "..."
  }
}
```

**Required:** Authenticated user (must be team member or manager)

---

#### POST `/teams/:id/members`

Add a member to a team.

**Request Body:**

```json
{
  "userId": "user_id"
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "team": { ... }
}
```

**Required Roles:** `MANAGER`, `COMPANY_ADMIN`, or `SUPER_ADMIN`

---

#### DELETE `/teams/:id/members/:memberId`

Remove a member from a team.

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

**Required Roles:** `MANAGER`, `COMPANY_ADMIN`, or `SUPER_ADMIN`

---

#### DELETE `/teams/:id`

Delete a team.

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Team deleted successfully"
}
```

**Required Roles:** `MANAGER`, `COMPANY_ADMIN`, or `SUPER_ADMIN`

---

### Settings Endpoints

#### GET `/settings`

Get all settings for the current company.

**Response:** 200 OK

```json
{
  "success": true,
  "settings": [
    {
      "_id": "...",
      "key": "setting_key",
      "value": "setting_value",
      "companyId": "..."
    }
  ]
}
```

**Required:** Authenticated user (Company Guard)

---

#### POST `/settings`

Create a new setting.

**Request Body:**

```json
{
  "key": "setting_key",
  "value": "setting_value"
}
```

**Response:** 201 Created

```json
{
  "success": true,
  "setting": { ... }
}
```

**Required Roles:** `COMPANY_ADMIN` or `SUPER_ADMIN`

---

#### GET `/settings/:id`

Get a specific setting.

**Response:** 200 OK

```json
{
  "success": true,
  "setting": { ... }
}
```

**Required:** Authenticated user (Company Guard)

---

#### PATCH `/settings/:id`

Update a setting.

**Request Body:**

```json
{
  "value": "new_value"
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "setting": { ... }
}
```

**Required Roles:** `COMPANY_ADMIN` or `SUPER_ADMIN`

---

#### DELETE `/settings/:id`

Delete a setting.

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Setting deleted successfully"
}
```

**Required Roles:** `COMPANY_ADMIN` or `SUPER_ADMIN`

---

### Billing Endpoints

#### GET `/billing`

Get billing information for the current company.

**Response:** 200 OK

```json
{
  "success": true,
  "billing": {
    "_id": "...",
    "companyId": "...",
    "plan": "pro",
    "status": "active",
    "currentPeriodEnd": "2024-12-31T00:00:00.000Z"
  }
}
```

**Required:** Authenticated user (Company Guard)

---

#### POST `/billing`

Create billing record (typically handled by payment webhook).

**Request Body:**

```json
{
  "plan": "pro",
  "status": "active"
}
```

**Response:** 201 Created

```json
{
  "success": true,
  "billing": { ... }
}
```

**Required:** Internal/Webhook only

---

#### GET `/billing/:id`

Get specific billing record.

**Response:** 200 OK

```json
{
  "success": true,
  "billing": { ... }
}
```

**Required:** Authenticated user (Company Guard)

---

#### PATCH `/billing/:id`

Update billing information.

**Request Body:**

```json
{
  "plan": "enterprise",
  "status": "active"
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "billing": { ... }
}
```

**Required Roles:** `COMPANY_ADMIN` or `SUPER_ADMIN`

---

#### DELETE `/billing/:id`

Delete billing record.

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Billing record deleted successfully"
}
```

**Required Roles:** `SUPER_ADMIN` only

---

### Analytics Endpoints

#### GET `/analytics`

Get analytics data for the current company.

**Response:** 200 OK

```json
{
  "success": true,
  "analytics": [
    {
      "_id": "...",
      "type": "user_activity",
      "data": { ... },
      "companyId": "..."
    }
  ]
}
```

**Required:** Authenticated user (Company Guard)

---

#### POST `/analytics`

Create analytics event.

**Request Body:**

```json
{
  "type": "user_activity",
  "data": { ... }
}
```

**Response:** 201 Created

```json
{
  "success": true,
  "analytics": { ... }
}
```

**Required:** Authenticated user (Company Guard)

---

#### GET `/analytics/:id`

Get specific analytics record.

**Response:** 200 OK

```json
{
  "success": true,
  "analytics": { ... }
}
```

**Required:** Authenticated user (Company Guard)

---

#### PATCH `/analytics/:id`

Update analytics record.

**Request Body:**

```json
{
  "data": { ... }
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "analytics": { ... }
}
```

**Required Roles:** `COMPANY_ADMIN` or `SUPER_ADMIN`

---

#### DELETE `/analytics/:id`

Delete analytics record.

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Analytics record deleted successfully"
}
```

**Required Roles:** `COMPANY_ADMIN` or `SUPER_ADMIN`

---

### Upload Endpoints

#### POST `/uploads`

Upload a file.

**Request:** Multipart form data

- `file`: File to upload
- `type` (optional): File type/category

**Response:** 201 Created

```json
{
  "success": true,
  "file": {
    "_id": "...",
    "filename": "document.pdf",
    "url": "https://...",
    "size": 1024000,
    "mimeType": "application/pdf",
    "companyId": "..."
  }
}
```

**Required:** Authenticated user (Company Guard)

---

#### GET `/uploads`

List uploaded files for the current company.

**Response:** 200 OK

```json
{
  "success": true,
  "files": [
    {
      "_id": "...",
      "filename": "document.pdf",
      "url": "https://...",
      "size": 1024000,
      "mimeType": "application/pdf"
    }
  ]
}
```

**Required:** Authenticated user (Company Guard)

---

#### GET `/uploads/:id`

Get file details.

**Response:** 200 OK

```json
{
  "success": true,
  "file": { ... }
}
```

**Required:** Authenticated user (Company Guard)

---

#### DELETE `/uploads/:id`

Delete an uploaded file.

**Response:** 200 OK

```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Required:** Authenticated user (Company Guard, must be file owner or admin)

---

## Authentication & Security

### JWT Token Structure

**Access Token Payload:**

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "company_admin",
  "companyId": "company_id",
  "orgId": "org_id", // Legacy, optional
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Token Expiration:**

- **Access Token:** 15 minutes
- **Refresh Token:** 30 days

### Token Storage

**HttpOnly Cookies:**

- `access_token`: JWT access token
- `refresh_token`: Refresh token (hashed in database)

**Cookie Settings:**

```typescript
{
  httpOnly: true,        // Prevents XSS attacks
  secure: true,          // HTTPS only (production)
  sameSite: 'lax',       // CSRF protection
  maxAge: 15 * 60 * 1000 // 15 minutes (access token)
}
```

### Password Security

- **Hashing Algorithm:** bcrypt
- **Salt Rounds:** 10
- **Storage:** Never stored in plain text

### Role-Based Access Control (RBAC)

**Role Hierarchy:**

```
SUPER_ADMIN (highest)
  └── COMPANY_ADMIN
      └── MANAGER
          └── USER
              └── EDITOR
                  └── VIEWER (lowest)
```

**Role Permissions:**

| Role            | Capabilities                                             |
| --------------- | -------------------------------------------------------- |
| `SUPER_ADMIN`   | Manage all companies, create companies, access all data  |
| `COMPANY_ADMIN` | Manage company users, projects, settings, create invites |
| `MANAGER`       | Create projects, assign tasks, manage team, invite users |
| `USER`          | View assigned tasks, update task status                  |
| `EDITOR`        | Edit content, limited access                             |
| `VIEWER`        | View-only access                                         |

### Guards

**JwtAuthGuard:**

- Validates JWT token
- Extracts user from token
- Attaches user to request object

**RolesGuard:**

- Checks user role against required roles
- Normalizes role names (handles legacy roles)
- Provides detailed error messages

**Company Guard (implicit):**

- Ensures users can only access their own company's data
- Validates `companyId` matches resource's company
- Super Admin bypasses company restrictions

### CORS Configuration

```typescript
{
  origin: ['http://localhost:3100', 'http://127.0.0.1:3100'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  credentials: true  // Required for cookies
}
```

### Error Handling

**Global Exception Filter:**

- Catches all exceptions and formats consistent error responses
- Logs errors with Winston logger
- Provides detailed error messages in development
- Sanitizes error messages in production

**Error Response Format:**

```json
{
  "statusCode": 400,
  "timestamp": "2024-11-13T12:00:00.000Z",
  "path": "/api/endpoint",
  "message": "Error message",
  "error": "Error type" // Optional
}
```

**Common HTTP Status Codes:**

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Server error

**Validation Errors:**
When validation fails, the response includes detailed field errors:

```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "email must be an email"
    }
  ]
}
```

**Authentication Errors:**

- `401` - Token missing or invalid
- `401` - Token expired (with message: "Token expired. Please refresh your session.")
- `401` - Invalid token format
- `401` - User account inactive

**Authorization Errors:**

- `403` - Insufficient role permissions
- `403` - Cross-company access attempt
- `403` - Resource access denied

### Request Validation

**Validation Pipe Configuration:**

```typescript
{
  whitelist: true,      // Strip unknown properties
  transform: true,     // Transform payloads to DTO instances
  forbidNonWhitelisted: false
}
```

**DTO Validation:**

- Uses `class-validator` decorators
- Automatic validation on all endpoints
- Type transformation with `class-transformer`
- Custom validators for complex rules

**Example DTO:**

```typescript
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;
}
```

### Logging System

**Winston Logger Configuration:**

- **Log Levels:** error, warn, info, debug
- **Log Files:** Separate files for application logs, exceptions, and rejections
- **Log Rotation:** Daily log files with date stamps
- **Format:** JSON format for structured logging

**Log Files:**

- `logs/application-YYYY-MM-DD.log` - General application logs
- `logs/exceptions-YYYY-MM-DD.log` - Exception logs
- `logs/rejections-YYYY-MM-DD.log` - Unhandled promise rejections

**Logging Interceptor:**

- Logs all HTTP requests and responses
- Includes request method, URL, status code, response time
- Logs errors with stack traces
- Excludes sensitive data (passwords, tokens)

**Example Log Entry:**

```json
{
  "level": "info",
  "message": "HTTP Request",
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 200,
  "responseTime": 45,
  "timestamp": "2024-11-13T12:00:00.000Z"
}
```

### Response Transformation

**Transform Interceptor:**

- Wraps all successful responses in standard format
- Adds `success: true` flag
- Includes `data` or direct response payload
- Adds optional `message` field

**Standard Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"  // Optional
}
```

---

## Multi-Tenancy Implementation

### Company Isolation

**Data Scoping:**

- All queries filter by `companyId`
- Users can only access data from their company
- Cross-company access returns 403 Forbidden

**Implementation:**

```typescript
// Service method example
async findAll(user: User) {
  return this.model.find({
    companyId: user.companyId
  });
}
```

### Company Registration Flow

1. **Public Registration:**

   - User submits company registration form
   - System creates Company entity
   - System creates Company Admin user
   - Admin is automatically assigned to company
   - JWT tokens are generated and returned

2. **Super Admin Creation:**
   - Super Admin creates company via `/company/create`
   - Admin user is created and assigned
   - Company is linked to Super Admin

### Invite System

**Invite Creation:**

1. Company Admin or Manager creates invite
2. System generates unique token
3. Invite is stored in database with expiration
4. Email is sent via Mailtrap (if configured)
5. Invite link is returned in API response

**Invite Acceptance:**

1. User clicks invite link or uses token
2. System validates token (not expired, active)
3. User creates account with invite details (name, email, password)
4. User is assigned to company with specified role
5. **Invite is automatically deleted from database** (single-use enforcement)
6. JWT tokens are generated and set as HttpOnly cookies
7. User is automatically logged in and redirected to dashboard

**Invite Token Format:**

- Random UUID or cryptographically secure string
- Stored in database with expiration date (default: 3 days)
- Single-use (invite is **deleted** from database after successful acceptance)
- Invites remain valid until expiration or manual deletion by admin/manager

---

## Phase 1: Foundation & Authentication

### ✅ Completed Features

#### 1. Authentication System

- **JWT-based Authentication**

  - Access tokens (15-minute expiration)
  - Refresh tokens (30-day expiration)
  - HttpOnly cookie-based token storage
  - Token refresh mechanism
  - Session management with MongoDB

- **User Registration & Login**

  - Email/password registration
  - Login with credentials
  - Password hashing (bcrypt, 10 rounds)
  - Email validation
  - Duplicate email prevention

- **Security Features**
  - HttpOnly cookies (XSS protection)
  - SameSite cookie policy (CSRF protection)
  - Secure cookie flag (HTTPS in production)
  - Password strength validation
  - Session tracking (user agent, IP address)

#### 2. User Management

- **User Entity**

  - User schema with Mongoose
  - Role-based user model
  - User profile management
  - Last login tracking
  - Soft delete support (`isActive` flag)

- **Basic Roles**

  - `SUPER_ADMIN` - Platform administrator
  - `COMPANY_ADMIN` - Company owner/admin
  - `MANAGER` - Team manager
  - `USER` - Regular user
  - `EDITOR` - Content editor
  - `VIEWER` - Read-only access

- **User CRUD Operations**
  - Create user (admin only)
  - Read user profile
  - Update user information
  - Delete user (soft delete)
  - List users (with pagination)

#### 3. Backend Architecture

- **NestJS Framework Setup**

  - Modular architecture
  - Dependency injection
  - Guards and interceptors
  - DTOs for validation
  - Exception filters

- **Database Integration**

  - MongoDB connection
  - Mongoose ODM
  - Schema definitions
  - Indexes for performance

- **API Structure**
  - RESTful endpoints
  - Request/response validation
  - Error handling
  - CORS configuration

#### 4. Frontend Foundation

- **Next.js 15 Setup**

  - App Router structure
  - TypeScript configuration
  - Tailwind CSS integration
  - shadcn/ui components

- **State Management**

  - Redux Toolkit setup
  - Auth slice implementation
  - API client with Axios
  - Automatic token refresh interceptor

- **Authentication UI**
  - Login page
  - Registration page
  - Protected route guards
  - Role-based routing
  - Loading states

#### 5. Development Infrastructure

- **Project Structure**

  - Monorepo organization
  - Backend/Frontend separation
  - Shared types and utilities
  - Environment configuration

- **Development Tools**
  - ESLint configuration
  - TypeScript strict mode
  - Hot reload (development)
  - Logging system (Winston)

### Phase 1 API Endpoints

```
POST   /auth/register          # Register new user
POST   /auth/login             # Login user
POST   /auth/refresh           # Refresh access token
POST   /auth/logout            # Logout user
GET    /auth/me                # Get current user

GET    /user/me                # Get current user profile
GET    /user/:id               # Get user by ID
POST   /user                   # Create user (admin)
PATCH  /user/:id               # Update user
DELETE /user/:id               # Delete user (soft)
GET    /users                  # List users (paginated)
```

### Phase 1 Database Schema

**User Collection:**

```javascript
{
  _id: ObjectId,
  email: string (unique, required),
  password: string (hashed),
  name: string,
  role: enum ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'USER', 'EDITOR', 'VIEWER'],
  isActive: boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Session Collection:**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  refreshTokenHash: string (bcrypt),
  userAgent: string,
  ip: string,
  createdAt: Date
}
```

---

## Phase 2: Multi-Tenancy & Company System

### ✅ Completed Features

#### 1. Company System

- **Company Entity**

  - Company schema with Mongoose
  - Company name and domain
  - Manager and user arrays
  - Active/inactive status

- **Company Registration**

  - Public company registration endpoint
  - Super Admin company creation
  - Automatic admin user creation
  - Company-user relationship setup

- **Company Management**
  - Update company information
  - List all companies (Super Admin)
  - Get company details
  - Company-scoped user listing

#### 2. Multi-Tenancy

- **Data Isolation**

  - All queries filter by `companyId`
  - Company guards on protected endpoints
  - Cross-company access prevention
  - Super Admin bypass for management

- **Company-Scoped Data**
  - Users belong to companies
  - Projects belong to companies
  - Tasks belong to companies
  - All data queries include company filter

#### 3. Invite System

- **Invite Creation**

  - Company Admin can create invites
  - Manager can create invites (users only)
  - Token generation
  - Email integration (Mailtrap)
  - Expiration management

- **Invite Acceptance**
  - Public invite acceptance endpoint
  - Token validation
  - User creation with company assignment
  - Single-use token enforcement

#### 4. Enhanced RBAC

- **Company Context**

  - JWT includes `companyId`
  - Role checks include company context
  - Company Admin can only manage own company
  - Managers can only manage own team

- **Role Permissions**
  - Company Admin: Full company management
  - Manager: Project and task management, user invites
  - User: Task viewing and status updates

#### 5. Frontend Enhancements

- **Company Registration UI**

  - Company registration form
  - Auto-login after registration
  - Company dashboard

- **Invite Flow UI**
  - Invite creation form
  - Invite link sharing
  - Invite acceptance page
  - Token-based registration

### Phase 2 API Endpoints

```
POST   /company/register       # Public company registration
POST   /company/create         # Create company (Super Admin)
POST   /company/invite         # Create invite
GET    /company/all            # List all companies (Super Admin)
GET    /company/:id            # Get company details
PATCH  /company/:id            # Update company
GET    /company/:id/users      # Get company users

POST   /invite/company/:id      # Create invite
GET    /invite/:token          # Get invite details
POST   /invite/:token/accept   # Accept invite
GET    /invite/company/:id     # Get company invites
DELETE /invite/:inviteId/company/:id  # Delete invite
```

### Phase 2 Database Schema

**Company Collection:**

```javascript
{
  _id: ObjectId,
  name: string (required),
  domain: string (optional, unique),
  createdBy: ObjectId (ref: User, optional),
  managers: [ObjectId] (ref: User),
  users: [ObjectId] (ref: User),
  isActive: boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Invite Collection:**

```javascript
{
  _id: ObjectId,
  token: string (unique, required),
  companyId: ObjectId (ref: Company, required),
  createdBy: ObjectId (ref: User, required),
  email: string (optional),
  role: string (required),
  isUsed: boolean (default: false),
  usedBy: ObjectId (ref: User, optional),
  usedAt: Date (optional),
  expiresAt: Date (required),
  isActive: boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Updated User Schema:**

```javascript
{
  // ... Phase 1 fields ...
  companyId: ObjectId (ref: Company, optional),
  orgId: ObjectId (ref: Organization, optional, legacy),
  createdBy: ObjectId (ref: User, optional),
  managerId: ObjectId (ref: User, optional)
}
```

---

## Frontend Architecture

### Next.js App Router Structure

```
Frontend/app/
├── layout.tsx              # Root layout with providers
├── page.tsx               # Home/landing page
├── providers.tsx          # Redux and theme providers
├── (dashboard)/           # Protected dashboard routes
│   ├── layout.tsx         # Dashboard layout with sidebar
│   ├── dashboard/
│   │   ├── page.tsx       # Main dashboard (redirects by role)
│   │   ├── super-admin/   # Super Admin dashboard
│   │   ├── company-admin/ # Company Admin dashboard
│   │   ├── manager/       # Manager dashboard
│   │   └── user/          # User dashboard
│   ├── users/             # User management
│   │   ├── page.tsx       # Users list
│   │   └── [id]/          # User details
│   ├── managers/          # Managers management
│   ├── projects/          # Project management
│   ├── tasks/             # Task management
│   ├── invites/           # Invite management
│   ├── analytics/         # Analytics dashboard
│   ├── automation/        # Automation/NovaFlow
│   │   └── builder/       # Automation builder
│   ├── reports/           # Reports
│   ├── settings/          # Settings
│   │   ├── page.tsx       # Settings home
│   │   ├── branding/      # Branding settings
│   │   ├── theme/         # Theme settings
│   │   ├── team/          # Team settings
│   │   ├── api/           # API settings
│   │   ├── webhooks/      # Webhook settings
│   │   ├── sidebar-config/# Sidebar configuration
│   │   ├── pages/         # Custom pages
│   │   └── custom-fields/ # Custom fields
│   └── customize/         # Customization
├── (marketing)/           # Public marketing pages
│   ├── layout.tsx         # Marketing layout
│   ├── page.tsx          # Landing page
│   ├── features/         # Features page
│   ├── pricing/           # Pricing page
│   └── blog/              # Blog
│       ├── page.tsx       # Blog list
│       └── [id]/          # Blog post
├── login/                 # Login page
├── register/              # User registration
├── register-company/      # Company registration
├── invite/                # Invite acceptance
│   └── [token]/
│       └── page.tsx       # Invite acceptance page
├── billing/               # Billing pages
│   ├── page.tsx          # Billing overview
│   └── plans/            # Pricing plans
├── activity/              # Activity feed
├── integrations/          # Integrations
├── reports/               # Reports (public)
├── error.tsx              # Error boundary
├── not-found.tsx          # 404 page
├── unauthorized.tsx       # 403 page
└── maintenance.tsx        # Maintenance mode
```

### Frontend Route Protection

**Public Routes:**

- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page
- `/register-company` - Company registration
- `/invite/[token]` - Invite acceptance
- `/(marketing)/*` - All marketing pages

**Protected Routes:**

- All routes under `/(dashboard)/*` require authentication
- Role-based access control enforced client-side and server-side
- Automatic redirect to role-specific dashboard on login

**Route Guards:**

- `useAuthGuard` hook checks authentication status
- Redirects to `/login` if not authenticated
- Fetches user data on protected route access
- Handles token refresh automatically

### State Management (Redux Toolkit)

**Auth Slice:**

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
}
```

**Actions:**

- `login` - Login user
- `logout` - Logout user
- `setUser` - Set current user
- `refreshToken` - Refresh access token

### API Client (Axios)

**Configuration:**

```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Send cookies
});
```

**Interceptors:**

- **Request:** Attach access token from cookie
- **Response:** Handle 401 errors, auto-refresh token
- **Error:** Queue failed requests, retry after refresh

### Route Protection

**Auth Guard:**

```typescript
// app/guards/AuthGuard.tsx
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) redirect("/login");

  return <>{children}</>;
}
```

**Role Guard:**

```typescript
// app/guards/RoleGuard.tsx
export function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!allowedRoles.includes(user?.role)) {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
```

---

## Email System (Mailtrap Integration)

### Configuration

**Environment Variables:**

```env
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_username
MAILTRAP_PASS=your_password
EMAIL_FROM=noreply@novapulse.com
EMAIL_FROM_NAME=NovaPulse
FRONTEND_URL=http://localhost:3100
```

### Email Service

**Nodemailer Setup:**

```typescript
const transporter = nodemailer.createTransport({
  host: mailtrapHost,
  port: mailtrapPort || 2525,
  auth: {
    user: mailtrapUser,
    pass: mailtrapPass,
  },
});
```

### Invite Email Template

**HTML Email:**

- Professional design with NovaPulse branding
- Company name and inviter information
- Invite link button
- Expiration date
- Plain text fallback

**Email Content:**

- Subject: "You've been invited to join {companyName} on NovaPulse"
- Body: Includes invite link, role, expiration date
- Footer: Company information and unsubscribe option

### Fallback Mode

**Without Mailtrap:**

- Emails are logged to console
- Invite tokens and links are still returned in API response
- Manual sharing of invite links is supported

---

## Development Workflow

### Local Development Setup

1. **Clone Repository:**

   ```bash
   git clone <repository-url>
   cd Novapulsee
   ```

2. **Install Dependencies:**

   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../Frontend
   npm install
   ```

3. **Configure Environment:**

   - Copy `.env.example` to `.env` (backend)
   - Copy `.env.local.example` to `.env.local` (frontend)
   - Set MongoDB connection string
   - Set JWT secrets
   - Configure Mailtrap (optional)

4. **Start MongoDB:**

   ```bash
   mongod
   # or use MongoDB Atlas
   ```

5. **Start Development Servers:**

   ```bash
   # Terminal 1: Backend
   cd backend
   npm run start:dev

   # Terminal 2: Frontend
   cd Frontend
   npm run dev
   ```

6. **Access Application:**
   - Frontend: `http://localhost:3100`
   - Backend API: `http://localhost:5500`

### Code Structure Guidelines

**Backend:**

- Follow NestJS module structure
- Use DTOs for all request/response validation
- Implement guards for authentication and authorization
- Use services for business logic
- Keep controllers thin

**Frontend:**

- Use Next.js App Router conventions
- Organize components by feature
- Use Redux for global state
- Keep components small and focused
- Use TypeScript for type safety

### Git Workflow

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and commit: `git commit -m "feat: add feature"`
3. Push to remote: `git push origin feature/feature-name`
4. Create pull request
5. Code review and merge

### Environment Variables

**Backend (.env):**

```env
NODE_ENV=development
PORT=5500
MONGO_URI=mongodb://localhost:27017/novapulse
JWT_SECRET=your-secure-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
ACCESS_TOKEN_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=30d
COOKIE_SECURE=false
COOKIE_DOMAIN=localhost
COOKIE_SAME_SITE=lax
FRONTEND_URL=http://localhost:3100
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_username
MAILTRAP_PASS=your_password
EMAIL_FROM=noreply@novapulse.com
EMAIL_FROM_NAME=NovaPulse
```

**Frontend (.env.local):**

```env
NEXT_PUBLIC_API_URL=http://localhost:5500
```

---

## Database Migrations & Schema Management

### Schema Evolution

**Current Approach:**

- Mongoose schemas define database structure
- Automatic schema validation on save
- Indexes defined in schema files
- Manual migration scripts for data transformations

**Creating Indexes:**
Indexes are defined in Mongoose schemas and created automatically on first connection. For manual index creation:

```javascript
// Run in MongoDB shell or migration script
db.users.createIndex({ email: 1 }, { unique: true });
db.companies.createIndex({ domain: 1 }, { unique: true, sparse: true });
```

**Migration Scripts:**
Create migration scripts in `backend/src/scripts/` for data transformations:

```typescript
// Example: backend/src/scripts/migrate-user-roles.ts
import { connect } from "mongoose";
import { User } from "../modules/user/entities/user.entity";

async function migrate() {
  await connect(process.env.MONGO_URI);

  // Migration logic
  await User.updateMany({ role: "admin" }, { $set: { role: "company_admin" } });

  console.log("Migration completed");
  process.exit(0);
}

migrate();
```

**Running Migrations:**

```bash
cd backend
ts-node src/scripts/migrate-user-roles.ts
```

### Schema Versioning

**Best Practices:**

- Add new fields as optional initially
- Use `default` values for new required fields
- Deprecate fields before removing (mark as optional, stop using)
- Document breaking changes in changelog

---

## Testing Strategy

### Backend Testing

**Unit Tests:**

```bash
cd backend
npm run test
```

**Test Structure:**

```
backend/src/
├── modules/
│   └── auth/
│       ├── auth.service.spec.ts
│       └── auth.controller.spec.ts
```

**E2E Tests:**

```bash
cd backend
npm run test:e2e
```

**Test Coverage:**

- Authentication flow (login, register, refresh, logout)
- User CRUD operations
- Company isolation
- RBAC validation
- Invite system
- Multi-tenancy enforcement
- Error handling

**Example Test:**

```typescript
describe("AuthController (e2e)", () => {
  it("/auth/login (POST)", () => {
    return request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "test@example.com", password: "password123" })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty("access_token");
      });
  });
});
```

### Frontend Testing

**Component Tests:**

```bash
cd Frontend
npm run test
```

**E2E Tests (Cypress/Playwright):**

- Route guards and authentication
- Role-based UI rendering
- Data isolation between companies
- Invite flow (creation and acceptance)
- Form validation
- Error handling

**Test Scenarios:**

1. User can log in and access dashboard
2. User cannot access unauthorized routes
3. Company Admin can create invites
4. Invite acceptance creates user and logs them in
5. Users can only see their company's data

### Manual Testing Checklist

**Authentication:**

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error handling)
- [ ] Registration creates user and company
- [ ] Token refresh works automatically
- [ ] Logout clears cookies and invalidates session
- [ ] Protected routes redirect to login
- [ ] Expired token triggers refresh

**Company System:**

- [ ] Company registration creates company and admin
- [ ] Company isolation enforced (users see only their company)
- [ ] Cross-company access returns 403
- [ ] Company Admin can update company info
- [ ] Super Admin can access all companies

**Invite System:**

- [ ] Company Admin can create invites
- [ ] Manager can create user invites (not manager invites)
- [ ] Email sent via Mailtrap (if configured)
- [ ] Invite link works and shows invite details
- [ ] Invite acceptance creates user and logs them in
- [ ] Invite automatically deleted after use
- [ ] Expired invites are rejected
- [ ] Used invites cannot be reused

**RBAC:**

- [ ] Each role can only access permitted endpoints
- [ ] 403 errors for unauthorized roles
- [ ] Role guards work correctly
- [ ] UI shows/hides features based on role
- [ ] Role-based dashboard redirects work

**Projects & Tasks:**

- [ ] Managers can create projects
- [ ] Tasks can be assigned to users
- [ ] Users can update their task status
- [ ] Company isolation enforced for projects/tasks
- [ ] Task comments work correctly

**Data Validation:**

- [ ] Email validation works
- [ ] Password strength requirements enforced
- [ ] Required fields validated
- [ ] Invalid data returns 400/422 errors
- [ ] Duplicate emails rejected

### Performance Testing

**Load Testing:**

- Use tools like Apache Bench, k6, or Artillery
- Test concurrent user logins
- Test API endpoint response times
- Test database query performance

**Key Metrics:**

- API response time < 200ms (p95)
- Database query time < 100ms (p95)
- Concurrent user capacity
- Memory usage under load

### Security Testing

**Checklist:**

- [ ] SQL injection attempts fail (N/A - MongoDB)
- [ ] XSS attempts are sanitized
- [ ] CSRF protection works
- [ ] JWT tokens cannot be tampered with
- [ ] Password hashing verified
- [ ] Rate limiting works (if implemented)
- [ ] CORS blocks unauthorized origins
- [ ] Sensitive data not logged

---

## Deployment Guide

### Pre-Deployment Checklist

**Backend:**

- [ ] All environment variables configured
- [ ] MongoDB connection string set (Atlas recommended)
- [ ] JWT secrets are strong and unique (32+ characters)
- [ ] CORS configured for production domain(s)
- [ ] Cookie settings updated for production
- [ ] Email service configured (production SMTP)
- [ ] Logging configured and log rotation enabled
- [ ] Health check endpoint tested
- [ ] Database indexes created
- [ ] Backup strategy implemented

**Frontend:**

- [ ] `NEXT_PUBLIC_API_URL` set to production backend
- [ ] Environment variables configured
- [ ] Build tested locally
- [ ] Error tracking configured (if applicable)
- [ ] Analytics configured (if applicable)

### Backend Deployment

#### Option 1: PM2 (Recommended for VPS)

1. **Build the application:**

   ```bash
   cd backend
   npm install --production
   npm run build
   ```

2. **Start with PM2:**

   ```bash
   pm2 start dist/main.js --name novapulse-api
   pm2 save
   pm2 startup  # Enable auto-start on reboot
   ```

3. **PM2 Management:**
   ```bash
   pm2 status              # Check status
   pm2 logs novapulse-api  # View logs
   pm2 restart novapulse-api  # Restart
   pm2 stop novapulse-api     # Stop
   ```

#### Option 2: Docker

1. **Create Dockerfile:**

   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 5500
   CMD ["node", "dist/main.js"]
   ```

2. **Build and run:**
   ```bash
   docker build -t novapulse-api .
   docker run -d -p 5500:5500 --env-file .env novapulse-api
   ```

#### Option 3: Cloud Platforms

**Heroku:**

```bash
heroku create novapulse-api
heroku config:set NODE_ENV=production
git push heroku main
```

**Railway/Render:**

- Connect GitHub repository
- Set environment variables
- Auto-deploy on push

### Frontend Deployment

#### Option 1: Vercel (Recommended)

1. **Connect Repository:**

   - Import GitHub repository
   - Configure build settings:
     - Framework: Next.js
     - Build Command: `npm run build`
     - Output Directory: `.next`

2. **Environment Variables:**

   - `NEXT_PUBLIC_API_URL`: Production backend URL

3. **Auto-deploy:** Enabled by default on push to main branch

#### Option 2: Netlify

1. **Connect Repository:**

   - Import GitHub repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`

2. **Environment Variables:**
   - Add `NEXT_PUBLIC_API_URL` in site settings

#### Option 3: Self-Hosted

1. **Build:**

   ```bash
   cd Frontend
   npm install
   npm run build
   ```

2. **Start:**

   ```bash
   npm start  # Runs on port 3000 by default
   ```

3. **With PM2:**
   ```bash
   pm2 start npm --name novapulse-frontend -- start
   ```

### Production Environment Variables

**Backend (.env):**

```env
NODE_ENV=production
PORT=5500
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/novapulse
JWT_SECRET=your-super-secure-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-min-32-chars
ACCESS_TOKEN_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=30d
COOKIE_SECURE=true
COOKIE_DOMAIN=.yourdomain.com
COOKIE_SAME_SITE=strict
FRONTEND_URL=https://app.yourdomain.com

# Production SMTP (not Mailtrap)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=NovaPulse
```

**Frontend (.env.local):**

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Database Setup

**MongoDB Atlas (Recommended):**

1. Create cluster on MongoDB Atlas
2. Configure network access (whitelist IPs)
3. Create database user
4. Get connection string
5. Set `MONGO_URI` environment variable

**Database Indexes:**
Ensure these indexes are created for optimal performance:

```javascript
// Users collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ companyId: 1 });
db.users.createIndex({ orgId: 1 }); // Legacy

// Companies collection
db.companies.createIndex({ name: 1 });
db.companies.createIndex({ domain: 1 }, { unique: true, sparse: true });

// Invites collection
db.invites.createIndex({ token: 1 }, { unique: true });
db.invites.createIndex({ companyId: 1 });
db.invites.createIndex({ email: 1 });
db.invites.createIndex({ expiresAt: 1 });

// Projects collection
db.projects.createIndex({ companyId: 1 });
db.projects.createIndex({ createdBy: 1 });
db.projects.createIndex({ status: 1 });

// Tasks collection
db.tasks.createIndex({ companyId: 1 });
db.tasks.createIndex({ assignedTo: 1 });
db.tasks.createIndex({ status: 1 });
db.tasks.createIndex({ projectId: 1 });

// Sessions collection
db.sessions.createIndex({ userId: 1 });
```

### Monitoring & Health Checks

**Health Check Endpoint:**

- URL: `GET /health`
- Use for load balancer health checks
- Returns: `{ ok: true, uptime: number, timestamp: number }`

**Logging:**

- Application logs: `logs/application-YYYY-MM-DD.log`
- Exception logs: `logs/exceptions-YYYY-MM-DD.log`
- Monitor log files for errors
- Set up log rotation (daily)

**Recommended Monitoring:**

- **Uptime Monitoring:** UptimeRobot, Pingdom
- **Error Tracking:** Sentry, Rollbar
- **Performance:** New Relic, Datadog
- **Log Aggregation:** Loggly, Papertrail

### Backup Strategy

**Database Backups:**

1. **MongoDB Atlas:** Automated daily backups (recommended)
2. **Manual Backups:**
   ```bash
   mongodump --uri="mongodb+srv://..." --out=/backup/novapulse-$(date +%Y%m%d)
   ```

**Backup Schedule:**

- Daily automated backups (MongoDB Atlas)
- Weekly manual backup verification
- Monthly backup restoration test

**Backup Retention:**

- Daily backups: 7 days
- Weekly backups: 4 weeks
- Monthly backups: 12 months

### Security Checklist

- [ ] HTTPS enabled (SSL/TLS certificates)
- [ ] JWT secrets are strong and unique
- [ ] Cookies set to `secure: true` in production
- [ ] CORS configured for specific domains only
- [ ] Rate limiting implemented (recommended)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (N/A - using MongoDB)
- [ ] XSS protection (input sanitization)
- [ ] CSRF protection (SameSite cookies)
- [ ] Password hashing (bcrypt, 10 rounds)
- [ ] Environment variables secured
- [ ] Database credentials secured
- [ ] API keys stored securely
- [ ] Regular security updates
- [ ] Dependency vulnerability scanning

### Scaling Considerations

**Backend Scaling:**

- Use load balancer (Nginx, AWS ALB)
- Multiple PM2 instances: `pm2 start dist/main.js -i max`
- Database connection pooling
- Redis for session storage (optional)
- CDN for static assets

**Frontend Scaling:**

- Vercel/Netlify handle scaling automatically
- CDN for static assets
- Image optimization enabled
- Code splitting implemented

### Production Checklist

**Before Launch:**

- [ ] All environment variables configured
- [ ] MongoDB connection secure and tested
- [ ] JWT secrets are strong and unique
- [ ] CORS configured for production domain
- [ ] Cookies set to `secure: true`
- [ ] HTTPS enabled
- [ ] Email service configured (production SMTP)
- [ ] Logging configured and tested
- [ ] Error tracking configured
- [ ] Health checks working
- [ ] Backup strategy implemented
- [ ] Database indexes created
- [ ] Performance testing completed
- [ ] Security audit completed
- [ ] Load testing completed
- [ ] Documentation updated

---

## Future Roadmap

### Phase 3: Enhanced Project & Task Management

**Planned Features:**

- Advanced project templates
- Task dependencies
- Task time tracking
- Project milestones
- Gantt chart view
- Project analytics

### Phase 4: Team Collaboration

**Planned Features:**

- Team creation and management
- Team-based task assignment
- Team chat/messaging
- File sharing
- Activity feeds
- Notifications

### Phase 5: Advanced Features

**Planned Features:**

- Reporting and analytics
- Custom workflows
- API integrations
- Webhooks
- Mobile app (React Native)
- Advanced permissions system

### Phase 6: Enterprise Features

**Planned Features:**

- SSO (Single Sign-On)
- Advanced audit logging
- Compliance features
- Advanced security (2FA, etc.)
- White-labeling
- Multi-region deployment

---

## Changelog

### Version 2.0 (November 2024) - Phase 2 Complete

**Added:**

- Multi-tenant company system
- Company registration flow
- Invite system with email integration
- Company-scoped data access
- Enhanced RBAC with company context
- Mailtrap email integration
- Company Admin dashboard
- Invite acceptance flow

**Changed:**

- User schema includes `companyId`
- All queries filter by company
- JWT tokens include `companyId`
- API endpoints require company context

**Fixed:**

- Company isolation issues
- Role guard normalization
- Invite token validation
- Email service configuration

### Version 1.0 (October 2024) - Phase 1 Complete

**Added:**

- JWT authentication system
- User management (CRUD)
- Role-based access control
- Session management
- Frontend foundation
- Basic project structure

---

## Troubleshooting

### Common Issues

**Backend Issues:**

1. **MongoDB Connection Failed:**

   - Check `MONGO_URI` environment variable
   - Verify MongoDB is running
   - Check network access (firewall, IP whitelist)
   - Verify credentials

2. **JWT Token Invalid:**

   - Clear browser cookies
   - Verify `JWT_SECRET` matches between restarts
   - Check token expiration
   - Ensure cookies are being sent (check CORS)

3. **CORS Errors:**

   - Verify frontend URL in CORS configuration
   - Check `credentials: true` is set
   - Ensure `withCredentials: true` in Axios config
   - Check browser console for specific CORS error

4. **Email Not Sending:**

   - Verify Mailtrap/SMTP credentials
   - Check email service logs
   - Verify `EMAIL_FROM` is set
   - Test SMTP connection manually

5. **Port Already in Use:**

   ```bash
   # Find process using port
   lsof -i :5500  # macOS/Linux
   netstat -ano | findstr :5500  # Windows

   # Kill process
   kill -9 <PID>  # macOS/Linux
   taskkill /PID <PID> /F  # Windows
   ```

**Frontend Issues:**

1. **API Calls Failing:**

   - Check `NEXT_PUBLIC_API_URL` is set correctly
   - Verify backend is running
   - Check browser console for errors
   - Verify CORS is configured

2. **Authentication Not Working:**

   - Clear browser cookies
   - Check Redux store state
   - Verify token refresh is working
   - Check network tab for API responses

3. **Build Errors:**

   - Clear `.next` directory: `rm -rf .next`
   - Delete `node_modules` and reinstall
   - Check TypeScript errors
   - Verify environment variables

4. **Routing Issues:**
   - Check `useAuthGuard` hook
   - Verify route protection logic
   - Check role-based redirects
   - Verify Next.js App Router structure

### Debugging Tips

**Backend Debugging:**

- Enable debug logging: `NODE_ENV=development`
- Check Winston logs in `logs/` directory
- Use `console.log` in development (remove in production)
- Use Postman/Insomnia to test API endpoints
- Check MongoDB Compass for database state

**Frontend Debugging:**

- Use React DevTools
- Check Redux DevTools for state
- Use browser Network tab
- Check browser Console for errors
- Use Next.js debug mode: `NODE_OPTIONS='--inspect' npm run dev`

**Database Debugging:**

- Use MongoDB Compass for visual inspection
- Check indexes: `db.collection.getIndexes()`
- Verify queries: `db.collection.find({...}).explain()`
- Check connection status: `db.serverStatus()`

### Performance Optimization

**Backend:**

- Add database indexes for frequently queried fields
- Use pagination for large datasets
- Implement caching (Redis) for frequently accessed data
- Optimize database queries (use `select()` to limit fields)
- Use connection pooling

**Frontend:**

- Implement code splitting
- Lazy load components
- Optimize images
- Use React.memo for expensive components
- Implement virtual scrolling for long lists

---

## Support & Resources

### Documentation

- **README.md:** Quick start guide
- **Documentation.md:** This comprehensive guide

### Development Resources

- **Backend:** [NestJS Documentation](https://docs.nestjs.com/)
- **Frontend:** [Next.js Documentation](https://nextjs.org/docs)
- **Database:** [MongoDB Documentation](https://docs.mongodb.com/)
- **Mongoose:** [Mongoose Documentation](https://mongoosejs.com/docs/)

### Tools & Libraries

- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [Redux Toolkit](https://redux-toolkit.js.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Email Testing:** [Mailtrap](https://mailtrap.io/)

### Contact

- **Issues:** GitHub Issues
- **Questions:** Project maintainers
- **Documentation Updates:** Submit PR with improvements

---

**Document Version:** 2.0  
**Last Updated:** November 2024  
**Maintained By:** NovaPulse Development Team

---

---

## Documentation Summary

This documentation provides a complete guide to the NovaPulse platform, covering:

✅ **Complete API Documentation** - All endpoints with request/response examples  
✅ **Database Schema** - Full schema definitions with relationships  
✅ **Authentication & Security** - JWT, RBAC, and security best practices  
✅ **Multi-Tenancy** - Complete company isolation implementation  
✅ **Frontend Architecture** - Next.js App Router structure and routing  
✅ **Development Workflow** - Setup, testing, and deployment guides  
✅ **Troubleshooting** - Common issues and solutions  
✅ **Production Deployment** - Complete deployment checklist and procedures

**Key Features Documented:**

- Multi-tenant SaaS architecture
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Company registration and management
- Invite system with email integration
- Project and task management
- Team collaboration
- Dashboard and analytics
- Settings and billing management

**Ready for:**

- Development team onboarding
- API integration
- Production deployment
- Maintenance and troubleshooting

---

_This documentation is continuously updated as the project evolves. Please refer to the latest version for the most current information._
