# NovaPulse - Complete Project Documentation

> **Comprehensive technical documentation for the NovaPulse multi-tenant SaaS platform**

**Version:** 2.0  
**Last Updated:** November 2024  
**Status:** Phase 2 Complete (Multi-Tenancy & Company System)

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
11. [Development Workflow](#development-workflow)
12. [Testing Strategy](#testing-strategy)
13. [Deployment Guide](#deployment-guide)
14. [Future Roadmap](#future-roadmap)

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

### Authentication

All protected endpoints require JWT authentication via:
- **HttpOnly Cookies:** `access_token` and `refresh_token`
- **Authorization Header:** `Bearer <token>` (alternative)

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
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
  "role": "user"  // Optional, defaults to 'user'
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
    "orgId": "..."  // Legacy
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
  "domain": "acme.com",  // Optional
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
  "domain": "techverse.com",  // Optional
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
  "name": "Acme Corporation",  // Optional
  "domain": "acme-corp.com",    // Optional
  "isActive": true              // Optional
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
  "email": "newuser@example.com",  // Optional
  "role": "user",                   // 'user' or 'manager'
  "expiresInDays": 7                // Optional, default: 7
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
  "role": "user"  // 'user' or 'manager'
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
  "name": "Updated Name",  // Optional
  "role": "manager",       // Optional
  "isActive": true         // Optional
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

Accept an invite and create a user account.

**Request Body:**
```json
{
  "email": "invited@example.com",  // Must match invite email if specified
  "name": "Invited User",
  "password": "securePassword123"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "invited@example.com",
    "name": "Invited User",
    "role": "user",
    "companyId": "..."
  },
  "access_token": "jwt_token",
  "refresh_token": "refresh_token"
}
```

**Required:** None (public endpoint)

**Validation:**
- Token must be valid and not expired
- Token must not be already used
- Email must match invite email (if specified)

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
  "description": "Project description",  // Optional
  "startDate": "2024-11-15",            // Optional
  "endDate": "2024-12-15"               // Optional
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
  "name": "Updated Name",      // Optional
  "description": "...",        // Optional
  "status": "completed",       // Optional
  "startDate": "...",          // Optional
  "endDate": "..."             // Optional
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
  "description": "Task description",  // Optional
  "projectId": "...",                  // Optional
  "assignedTo": "...",                // User ID
  "priority": "high",                 // Optional: 'low', 'medium', 'high'
  "dueDate": "2024-11-20"            // Optional
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
  "title": "Updated Title",     // Optional
  "description": "...",        // Optional
  "status": "in_progress",     // Optional
  "priority": "medium",        // Optional
  "dueDate": "..."             // Optional
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
  "status": "done"  // 'pending', 'in_progress', 'done', 'cancelled'
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

#### GET `/api/dashboard/summary`

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

#### GET `/api/dashboard/stats`

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

#### GET `/api/activity/recent`

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

## Authentication & Security

### JWT Token Structure

**Access Token Payload:**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "company_admin",
  "companyId": "company_id",
  "orgId": "org_id",  // Legacy, optional
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

| Role | Capabilities |
|------|-------------|
| `SUPER_ADMIN` | Manage all companies, create companies, access all data |
| `COMPANY_ADMIN` | Manage company users, projects, settings, create invites |
| `MANAGER` | Create projects, assign tasks, manage team, invite users |
| `USER` | View assigned tasks, update task status |
| `EDITOR` | Edit content, limited access |
| `VIEWER` | View-only access |

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
2. System validates token (not expired, not used)
3. User creates account with invite details
4. User is assigned to company with specified role
5. Invite is marked as used
6. JWT tokens are generated and returned

**Invite Token Format:**
- Random UUID or cryptographically secure string
- Stored in database with expiration date
- Single-use (marked as `isUsed: true` after acceptance)

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
├── layout.tsx              # Root layout
├── page.tsx               # Home page
├── (dashboard)/           # Protected dashboard routes
│   ├── layout.tsx         # Dashboard layout
│   ├── dashboard/
│   │   ├── super-admin/   # Super Admin dashboard
│   │   ├── company-admin/ # Company Admin dashboard
│   │   ├── manager/       # Manager dashboard
│   │   └── user/          # User dashboard
│   ├── users/             # User management
│   ├── projects/          # Project management
│   └── tasks/             # Task management
├── (marketing)/           # Public marketing pages
│   ├── page.tsx          # Landing page
│   └── about/            # About page
├── login/                 # Login page
├── register/              # Registration page
├── register-company/      # Company registration
└── invite/                # Invite acceptance
    └── [token]/
        └── page.tsx
```

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
  withCredentials: true,  // Send cookies
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
  if (!isAuthenticated) redirect('/login');
  
  return <>{children}</>;
}
```

**Role Guard:**
```typescript
// app/guards/RoleGuard.tsx
export function RoleGuard({ 
  allowedRoles, 
  children 
}: { 
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  
  if (!allowedRoles.includes(user?.role)) {
    redirect('/unauthorized');
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

## Testing Strategy

### Backend Testing

**Unit Tests:**
```bash
cd backend
npm run test
```

**E2E Tests:**
```bash
cd backend
npm run test:e2e
```

**Test Coverage:**
- Authentication flow
- User CRUD operations
- Company isolation
- RBAC validation
- Invite system

### Frontend Testing

**Component Tests:**
```bash
cd Frontend
npm run test
```

**E2E Tests (Cypress/Playwright):**
- Route guards
- Role-based UI rendering
- Data isolation
- Invite flow

### Manual Testing Checklist

**Authentication:**
- [ ] Login flow
- [ ] Registration flow
- [ ] Token refresh
- [ ] Logout
- [ ] Protected routes

**Company System:**
- [ ] Company registration
- [ ] Company isolation
- [ ] Cross-company access prevention
- [ ] Company Admin permissions

**Invite System:**
- [ ] Invite creation
- [ ] Email sending (if configured)
- [ ] Invite acceptance
- [ ] Token validation
- [ ] Expired token handling

**RBAC:**
- [ ] Role-based endpoint access
- [ ] Role-based UI rendering
- [ ] Permission validation

---

## Deployment Guide

### Backend Deployment

1. **Environment Setup:**
   - Set production environment variables
   - Configure MongoDB Atlas connection
   - Set secure JWT secrets
   - Configure production SMTP (not Mailtrap)

2. **Build:**
   ```bash
   cd backend
   npm run build
   ```

3. **Start:**
   ```bash
   npm run start:prod
   ```

4. **Process Manager (PM2):**
   ```bash
   pm2 start dist/main.js --name novapulse-api
   ```

### Frontend Deployment

1. **Environment Setup:**
   - Set `NEXT_PUBLIC_API_URL` to production backend URL

2. **Build:**
   ```bash
   cd Frontend
   npm run build
   ```

3. **Deploy:**
   - **Vercel:** Connect GitHub repo, auto-deploy
   - **Netlify:** Connect GitHub repo, set build command
   - **Self-hosted:** `npm start`

### Production Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection secure
- [ ] JWT secrets are strong and unique
- [ ] CORS configured for production domain
- [ ] Cookies set to `secure: true`
- [ ] HTTPS enabled
- [ ] Email service configured (production SMTP)
- [ ] Logging configured
- [ ] Error tracking (Sentry, etc.)
- [ ] Monitoring (health checks)
- [ ] Backup strategy

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

## Support & Resources

### Documentation
- **README.md:** Quick start guide
- **Documentation.md:** This comprehensive guide

### Development
- **Backend:** NestJS documentation
- **Frontend:** Next.js documentation
- **Database:** MongoDB documentation

### Contact
- **Issues:** GitHub Issues
- **Questions:** Project maintainers

---

**Document Version:** 2.0  
**Last Updated:** November 2024  
**Maintained By:** NovaPulse Development Team

---

*This documentation is continuously updated as the project evolves. Please refer to the latest version for the most current information.*

