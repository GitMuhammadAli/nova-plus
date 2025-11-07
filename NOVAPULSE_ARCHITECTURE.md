# NovaPulse - Complete Architecture Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Database Schema](#database-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [Multi-Tenancy & Company System](#multi-tenancy--company-system)
8. [Project & Task Management](#project--task-management)
9. [Invite System](#invite-system)
10. [API Endpoints](#api-endpoints)
11. [Frontend Routes & Components](#frontend-routes--components)
12. [Deployment Guide](#deployment-guide)
13. [Development Workflow](#development-workflow)

---

## 🎯 Overview

NovaPulse is a **multi-tenant SaaS collaboration platform** built with:
- **Backend**: NestJS (Node.js) + MongoDB
- **Frontend**: Next.js 15 (React 19) + TypeScript
- **Authentication**: JWT (Access + Refresh Tokens)
- **State Management**: Redux Toolkit
- **UI Framework**: Tailwind CSS + shadcn/ui

### Key Features

✅ Multi-company support (tenant isolation)  
✅ Role-based access control (Super Admin, Company Admin, Manager, User)  
✅ Company registration & invite system  
✅ Project & Task management  
✅ User dashboards (role-specific views)  
✅ Automation workflow builder (NovaFlow)  
✅ Analytics & reporting  

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Pages   │  │Components│  │  Redux   │  │  API     │ │
│  │  (App    │  │   (UI)   │  │  Store   │  │  Client  │ │
│  │  Router) │  │          │  │          │  │          │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/REST API
                          │
┌─────────────────────────────────────────────────────────┐
│              Backend (NestJS)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Auth    │  │  Company │  │  Project │  │   Task   │ │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Invite  │  │  User    │  │  Email   │  │ Dashboard │ │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Mongoose ODM
                          │
┌─────────────────────────────────────────────────────────┐
│                  MongoDB Database                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Users   │  │ Companies│  │ Projects │  │  Tasks   │ │
│  │          │  │          │  │          │  │          │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  Invites │  │ Sessions │  │  Teams   │               │
│  │          │  │          │  │          │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend Architecture

### Technology Stack

- **Framework**: NestJS 10+
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (Passport.js)
- **Validation**: class-validator, class-transformer
- **Environment**: ConfigModule for configuration

### Project Structure

```
backend/
├── src/
│   ├── modules/              # Feature modules
│   │   ├── auth/            # Authentication & JWT
│   │   ├── user/            # User management
│   │   ├── company/         # Company/tenant management
│   │   ├── project/         # Project management
│   │   ├── task/            # Task management
│   │   ├── invite/          # Invite system
│   │   ├── email/           # Email service
│   │   ├── dashboard/       # Dashboard data
│   │   └── ...
│   ├── config/              # Configuration files
│   ├── common/              # Shared utilities
│   │   ├── decorators/     # Custom decorators
│   │   └── guards/          # Auth guards
│   └── app.module.ts       # Root module
├── package.json
└── tsconfig.json
```

### Module Pattern

Each module follows NestJS best practices:

```
module-name/
├── entities/              # MongoDB schemas
│   └── entity.entity.ts
├── dto/                   # Data Transfer Objects
│   ├── create-*.dto.ts
│   └── update-*.dto.ts
├── module-name.service.ts # Business logic
├── module-name.controller.ts # API endpoints
└── module-name.module.ts  # Module definition
```

---

## 🎨 Frontend Architecture

### Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI)
- **Animations**: Framer Motion
- **Workflow Builder**: @xyflow/react

### Project Structure

```
Frontend/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard routes (protected)
│   │   ├── dashboard/     # Main dashboard
│   │   ├── projects/      # Project pages
│   │   ├── tasks/         # Task pages
│   │   ├── users/         # User management
│   │   └── automation/    # Workflow builder
│   ├── (marketing)/       # Public routes
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   ├── automation/       # Workflow components
│   └── ...
├── app/store/            # Redux store
│   ├── store.ts          # Store configuration
│   ├── authSlice.ts      # Auth state
│   ├── companySlice.ts   # Company state
│   └── ...
├── app/services/         # API client
│   └── api.ts           # Axios instance
├── types/               # TypeScript types
└── lib/                 # Utilities
```

### Routing Structure

```
/                          # Landing page (public)
/login                     # Login page
/register                  # Registration (Create/Join company)
/dashboard                 # User dashboard (role-based)
/dashboard/projects        # Projects list
/dashboard/projects/:id    # Project details
/dashboard/tasks           # Tasks list
/dashboard/tasks/:id       # Task details
/dashboard/users           # User management (Admin/Manager)
/dashboard/automation      # Workflow builder
/dashboard/settings        # Settings
```

---

## 🗄️ Database Schema

### User Entity

```typescript
{
  _id: ObjectId,
  email: string (unique, required),
  password: string (hashed),
  name: string,
  role: enum [
    'SUPER_ADMIN',      // Platform admin
    'COMPANY_ADMIN',    // Company owner/admin
    'MANAGER',          // Project manager
    'USER',             // Regular user
    'EDITOR',           // Content editor
    'VIEWER'            // Read-only
  ],
  companyId: ObjectId (ref: Company),
  orgId: ObjectId (ref: Company, backward compat),
  createdBy: ObjectId (ref: User),
  isActive: boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Company Entity

```typescript
{
  _id: ObjectId,
  name: string (required),
  domain: string (optional, unique),
  createdBy: ObjectId (ref: User, Super Admin),
  managers: [ObjectId] (ref: User),
  users: [ObjectId] (ref: User),
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Project Entity

```typescript
{
  _id: ObjectId,
  name: string (required),
  description: string,
  companyId: ObjectId (ref: Company, required),
  createdBy: ObjectId (ref: User, required),
  assignedUsers: [ObjectId] (ref: User),
  status: enum ['active', 'completed', 'on_hold', 'cancelled'],
  startDate: Date,
  endDate: Date,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Task Entity

```typescript
{
  _id: ObjectId,
  title: string (required),
  description: string,
  projectId: ObjectId (ref: Project, optional),
  companyId: ObjectId (ref: Company, required),
  assignedBy: ObjectId (ref: User, required),
  assignedTo: ObjectId (ref: User, required),
  team: ObjectId (ref: Team, optional),
  status: enum ['pending', 'in_progress', 'done', 'cancelled'],
  priority: enum ['low', 'medium', 'high'],
  comments: [{
    userId: ObjectId (ref: User),
    comment: string,
    createdAt: Date
  }],
  dueDate: Date,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Invite Entity

```typescript
{
  _id: ObjectId,
  token: string (unique, indexed),
  companyId: ObjectId (ref: Company, required),
  createdBy: ObjectId (ref: User, required),
  email: string (optional),
  role: string (required, 'manager' | 'user'),
  isUsed: boolean,
  usedBy: ObjectId (ref: User),
  usedAt: Date,
  expiresAt: Date (required),
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Authentication & Authorization

### JWT Strategy

**Access Token**:
- Expires in: 15 minutes
- Contains: `sub` (userId), `email`, `role`, `companyId`, `orgId`
- Stored in: HTTP-only cookie + response body

**Refresh Token**:
- Expires in: 7 days
- Stored in: HTTP-only cookie
- Used to: Generate new access tokens

### Authentication Flow

```
1. User submits credentials
   ↓
2. Backend validates credentials
   ↓
3. Backend generates JWT tokens
   ↓
4. Tokens sent via cookies + response body
   ↓
5. Frontend stores tokens (cookies auto-handled)
   ↓
6. Subsequent requests include tokens in cookies
   ↓
7. Backend validates tokens via JwtAuthGuard
```

### Role-Based Access Control (RBAC)

**Roles Hierarchy**:
```
SUPER_ADMIN (Platform owner)
  └── Can manage all companies
  
COMPANY_ADMIN (Company owner)
  └── Can manage company users, projects, tasks
  
MANAGER (Project manager)
  └── Can create projects, assign tasks
  
USER/EDITOR/VIEWER (Regular users)
  └── Can view/update assigned tasks
```

**Guards**:
- `JwtAuthGuard`: Validates JWT token
- `RolesGuard`: Validates user role
- `CompanyGuard`: Validates company access

**Usage**:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER)
@Get('projects')
async getProjects() { ... }
```

---

## 🏢 Multi-Tenancy & Company System

### Tenant Isolation

Every resource is **company-scoped**:
- Users belong to one company
- Projects belong to one company
- Tasks belong to one company
- All queries filter by `companyId`

### Company Registration Flow

**Option 1: Create Company (Public)**
```
1. User visits /register
2. Selects "Create Company" tab
3. Fills: Company name, domain, admin details
4. Backend creates:
   - Company entity
   - Company Admin user
   - JWT tokens
5. User auto-logged in
```

**Option 2: Join Company (Invite)**
```
1. Admin creates invite (with/without email)
2. Invite link sent via email
3. User clicks link → /register?token=xxx
4. User fills registration form
5. Backend validates invite token
6. User account created + auto-joined to company
7. User auto-logged in
```

### Company Code System (Future)

- Generate unique company codes
- Users can join via code instead of invite link
- Useful for bulk onboarding

---

## 📊 Project & Task Management

### Project Module

**Features**:
- Create projects (Manager/Admin only)
- Assign users to projects
- Track project status
- Filter by status, assigned users

**API Endpoints**:
```
POST   /projects              # Create project
GET    /projects              # List projects (company-scoped)
GET    /projects/me           # My assigned projects
GET    /projects/:id           # Project details
PATCH  /projects/:id          # Update project
DELETE /projects/:id          # Delete project (soft)
```

**Business Rules**:
- Only Managers/Admins can create projects
- Assigned users can view project details
- Project status: active → completed/on_hold/cancelled

### Task Module

**Features**:
- Create tasks (Manager/Admin only)
- Assign tasks to users
- Link tasks to projects (optional)
- Task status workflow: pending → in_progress → done
- Task priority: low, medium, high
- Comments system
- Due dates

**API Endpoints**:
```
POST   /tasks                 # Create task
GET    /tasks                 # List tasks (filtered by role)
GET    /tasks/me              # My assigned tasks
GET    /tasks/:id              # Task details
PATCH  /tasks/:id              # Update task
PATCH  /tasks/:id/status       # Update status only
POST   /tasks/:id/comments     # Add comment
DELETE /tasks/:id              # Delete task (soft)
```

**Business Rules**:
- Managers/Admins can create tasks
- Assigned users can update status & add comments
- Tasks can be linked to projects
- All tasks are company-scoped

---

## 📧 Invite System

### Invite Flow

**Step 1: Create Invite (Admin/Manager)**
```
POST /invite/company/:companyId
Body: {
  email: "user@example.com",  // Optional
  role: "user" | "manager",
  expiresInDays: 7
}
```

**Step 2: Email Sent (if email provided)**
- Email contains invite link
- Link format: `/register?token=xxx`
- Email includes company name, inviter name, role

**Step 3: User Accepts Invite**
```
GET  /invite/:token           # Validate invite
POST /invite/:token/accept     # Accept & create account
Body: {
  name: "John Doe",
  email: "user@example.com",
  password: "secure123"
}
```

**Step 4: Auto-Join Company**
- User account created
- User auto-assigned to company
- JWT tokens generated
- User redirected to dashboard

### Invite Management

**View Invites** (Company Admin only):
```
GET /invite/company/:companyId
```

**Revoke Invite**:
```
DELETE /invite/:inviteId/company/:companyId
```

---

## 🌐 API Endpoints

### Authentication

```
POST   /auth/register          # Register new user
POST   /auth/login             # Login
POST   /auth/refresh           # Refresh access token
POST   /auth/logout            # Logout
GET    /auth/me                # Get current user
```

### Company

```
POST   /company/register       # Public company registration
POST   /company                # Create company (Super Admin)
GET    /company                # List companies (Super Admin)
GET    /company/:id            # Get company details
PATCH  /company/:id            # Update company
GET    /company/:id/users      # Get company users
```

### Projects

```
POST   /projects               # Create project
GET    /projects               # List projects
GET    /projects/me            # My projects
GET    /projects/:id           # Project details
PATCH  /projects/:id          # Update project
DELETE /projects/:id          # Delete project
```

### Tasks

```
POST   /tasks                  # Create task
GET    /tasks                  # List tasks
GET    /tasks/me               # My tasks
GET    /tasks/:id              # Task details
PATCH  /tasks/:id              # Update task
PATCH  /tasks/:id/status       # Update status
POST   /tasks/:id/comments     # Add comment
DELETE /tasks/:id              # Delete task
```

### Invites

```
POST   /invite/company/:companyId    # Create invite
GET    /invite/:token                # Get invite details
POST   /invite/:token/accept         # Accept invite
GET    /invite/company/:companyId    # List invites
DELETE /invite/:id/company/:id      # Revoke invite
```

### Users

```
GET    /users                  # List users (company-scoped)
GET    /users/:id              # Get user details
POST   /users                  # Create user (Admin)
PATCH  /users/:id              # Update user
DELETE /users/:id              # Delete user
```

---

## 🎨 Frontend Routes & Components

### Public Routes

**`/`** - Landing page  
**`/login`** - Login form  
**`/register`** - Registration (Create/Join tabs)

### Protected Routes (Dashboard)

**`/dashboard`** - Main dashboard (role-based)
- User: My tasks, projects overview
- Manager: Team overview, create projects/tasks
- Admin: Company stats, user management

**`/dashboard/projects`** - Projects list
- Filter by status
- Create new project (Manager/Admin)
- View project details

**`/dashboard/projects/:id`** - Project details
- Project info
- Assigned users
- Related tasks
- Activity timeline

**`/dashboard/tasks`** - Tasks list
- Filter by project, status, assigned to
- Create new task (Manager/Admin)
- Quick status update

**`/dashboard/tasks/:id`** - Task details
- Task info
- Comments
- Status updates
- Due date

**`/dashboard/users`** - User management
- List company users
- Create users (Admin/Manager)
- Invite users
- Manage roles

**`/dashboard/automation`** - Workflow builder
- List workflows
- Create/edit workflows
- Workflow templates
- Test workflows

**`/dashboard/settings`** - Settings
- Profile settings
- Company settings (Admin)
- Preferences

### Component Structure

```
components/
├── ui/                      # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── layout/
│   ├── sidebar.tsx          # Navigation sidebar
│   ├── topbar.tsx           # Top navigation
│   └── ...
├── automation/
│   ├── WorkflowCanvas.tsx   # Main canvas
│   ├── CustomNode.tsx       # Node component
│   ├── NodePalette.tsx      # Node library
│   └── ...
└── ...
```

---

## 🚀 Deployment Guide

### Backend Deployment

**Environment Variables**:
```env
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
FRONTEND_URL=https://yourdomain.com
```

**Build & Start**:
```bash
cd backend
npm install
npm run build
npm run start:prod
```

### Frontend Deployment

**Environment Variables**:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

**Build & Start**:
```bash
cd Frontend
npm install
npm run build
npm start
```

### Docker (Optional)

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "run", "start:prod"]
```

---

## 💻 Development Workflow

### Backend Development

```bash
# Install dependencies
cd backend
npm install

# Run in development mode
npm run start:dev

# Run tests
npm run test

# Generate module (NestJS CLI)
nest g module module-name
nest g service module-name
nest g controller module-name
```

### Frontend Development

```bash
# Install dependencies
cd Frontend
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

### Database Migrations

Currently using Mongoose schemas (auto-migration). For manual migrations:

```typescript
// backend/src/modules/user/migrations/example.migration.ts
export async function up() {
  // Migration logic
}

export async function down() {
  // Rollback logic
}
```

---

## 📝 Key Concepts Explained

### 1. Multi-Tenancy

**What**: Each company is isolated from others  
**How**: All queries filter by `companyId`  
**Why**: Security, data isolation, scalability

### 2. Role-Based Access Control

**What**: Different permissions per role  
**How**: Guards check user role before allowing actions  
**Why**: Security, proper access control

### 3. Soft Deletes

**What**: Records marked as `isActive: false` instead of deleted  
**How**: Queries filter `isActive: true`  
**Why**: Data recovery, audit trails

### 4. JWT Token Strategy

**What**: Access tokens (short-lived) + Refresh tokens (long-lived)  
**How**: Cookies for security, body for API clients  
**Why**: Security, scalability, stateless auth

### 5. Company Scoping

**What**: All resources belong to a company  
**How**: `companyId` field in all entities  
**Why**: Multi-tenancy, data isolation

---

## 🔄 Data Flow Examples

### Example 1: Creating a Project

```
Frontend:
1. User fills project form
2. Dispatches Redux action
3. API call: POST /projects

Backend:
1. JwtAuthGuard validates token
2. RolesGuard checks role (Manager/Admin)
3. ProjectService.create()
4. Validates companyId
5. Creates project in MongoDB
6. Returns project data

Frontend:
1. Receives response
2. Updates Redux store
3. Redirects to project page
```

### Example 2: Accepting an Invite

```
1. User clicks invite link
2. Frontend extracts token from URL
3. GET /invite/:token (validate)
4. User fills registration form
5. POST /invite/:token/accept
6. Backend:
   - Validates token
   - Creates user account
   - Assigns to company
   - Generates JWT tokens
7. Frontend receives tokens
8. User auto-logged in
9. Redirect to dashboard
```

---

## 🎯 Phase 3 Implementation Summary

### Completed Features

✅ **Project Module**
- Full CRUD operations
- User assignment
- Status management
- Company scoping

✅ **Enhanced Task Module**
- Project linking
- Priority system
- Comments
- Status workflow
- Due dates

✅ **Invite System**
- Email invites
- Token-based invites
- Auto-join company
- Invite management

✅ **Registration Flow**
- Create company
- Join via invite
- Token validation
- Auto-login

### Future Enhancements

🔜 **Phase 4**: Billing & Subscriptions  
🔜 **Phase 5**: Advanced Automation  
🔜 **Phase 6**: AI-Powered Insights  
🔜 **Phase 7**: Mobile App  

---

## 📚 Additional Resources

### Backend Documentation
- [NestJS Documentation](https://docs.nestjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)

### Frontend Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

### API Testing
- Use Postman/Insomnia for API testing
- Import collection from `/docs/api-collection.json`

---

## 🤝 Contributing

1. Create feature branch
2. Implement changes
3. Write tests
4. Update documentation
5. Submit PR

---

## 📄 License

Proprietary - All rights reserved

---

**Last Updated**: 2024  
**Version**: 1.0.0  
**Maintained by**: NovaPulse Team

