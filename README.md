# NovaPulse - Multi-Tenant SaaS Platform

> Modern SaaS platform built with NestJS and Next.js 15 for managing companies, users, projects, and tasks with complete multi-tenant isolation.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git

### Installation

```bash
# Clone repository
git clone <repository-url>
cd Novapulsee

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../Frontend
npm install
```

### Environment Setup

**Backend (`backend/.env`):**
```env
NODE_ENV=development
PORT=5500
MONGO_URI=mongodb://localhost:27017/novapulse
JWT_SECRET=your-secure-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
FRONTEND_URL=http://localhost:3100

# Mailtrap Configuration (for email invites)
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password
EMAIL_FROM=noreply@novapulse.com
EMAIL_FROM_NAME=NovaPulse
```

**Frontend (`Frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5500
```

### Running the Application

```bash
# Terminal 1: Start backend
cd backend
npm run start:dev

# Terminal 2: Start frontend
cd Frontend
npm run dev
```

Visit `http://localhost:3100` in your browser.

## 🏗️ Architecture

### Tech Stack

**Backend:**
- NestJS 10+ (Node.js framework)
- MongoDB with Mongoose
- JWT authentication (Passport.js)
- Nodemailer (Mailtrap integration)
- TypeScript

**Frontend:**
- Next.js 15 (App Router)
- React 19
- Redux Toolkit (state management)
- Tailwind CSS + shadcn/ui
- TypeScript

### Project Structure

```
Novapulsee/
├── backend/          # NestJS backend API
│   ├── src/
│   │   ├── modules/  # Feature modules (auth, user, company, etc.)
│   │   ├── common/   # Shared utilities, guards, decorators
│   │   └── config/   # Configuration files
│   └── package.json
│
└── Frontend/         # Next.js frontend
    ├── app/         # App Router pages
    ├── components/  # React components
    └── app/store/   # Redux store
```

## ✨ Features

### Phase 1: Foundation ✅
- JWT-based authentication with refresh tokens
- User management (CRUD operations)
- Role-based access control (RBAC)
- Session management
- Secure cookie-based auth

### Phase 2: Multi-Tenancy ✅
- Company/tenant isolation
- Company registration flow
- Invite system (email + token-based via Mailtrap)
- Company-scoped data access
- Enhanced RBAC with company context

### Phase 3: Projects & Tasks (Coming Soon)
- Project management
- Task assignment and tracking
- Team collaboration
- Status workflows

## 🔐 Authentication

### Default Super Admin

The Super Admin is automatically created on backend startup:
- **Email:** `admin@novapulse.com`
- **Password:** `admin123`
- **Role:** `SUPER_ADMIN`

⚠️ **Change the default password in production!**

### User Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| `SUPER_ADMIN` | Platform administrator | Manage all companies, create companies |
| `COMPANY_ADMIN` | Company owner/admin | Manage company users, projects, settings, create invites |
| `MANAGER` | Team manager | Create projects, assign tasks, manage team, invite users |
| `USER` | Regular user | View assigned tasks, update status |
| `EDITOR` | Content editor | Edit content, limited access |
| `VIEWER` | Read-only | View-only access |

## 📡 API Endpoints

### Authentication
```
POST   /auth/login          # Login user
POST   /auth/register       # Register user
POST   /auth/refresh        # Refresh access token
POST   /auth/logout         # Logout user
GET    /auth/me             # Get current user
```

### Company
```
POST   /company/register    # Public company registration
POST   /company/create       # Create company (Super Admin)
POST   /company/invite       # Create invite (Company Admin/Manager)
GET    /company/all          # List all companies (Super Admin)
GET    /company/:id          # Get company details
PATCH  /company/:id         # Update company
GET    /company/:id/users    # Get company users
```

### Users
```
GET    /users               # List users (company-scoped)
GET    /user/:id            # Get user details
POST   /users/create        # Create user (Admin)
PATCH  /user/:id            # Update user
DELETE /user/:id            # Delete user
```

### Invites
```
POST   /invite/company/:id  # Create invite
GET    /invite/:token       # Get invite details
POST   /invite/:token/accept # Accept invite
```

## 🧪 Testing

### Quick Test

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e
```

### Manual Testing Checklist

**Authentication:**
- ✅ Login flow works correctly
- ✅ Token generation and validation
- ✅ Token refresh mechanism
- ✅ JWT payload contains `companyId` and `role`

**Company Isolation:**
- ✅ Users can only access their own company data
- ✅ Cross-company access returns 403
- ✅ Company-scoped queries filter correctly

**RBAC:**
- ✅ Each role only accesses permitted endpoints
- ✅ 403 errors for unauthorized roles
- ✅ Role guards work correctly

**Company Registration:**
- ✅ Public registration creates company + admin
- ✅ Admin is automatically assigned to company
- ✅ Returns token and company info

**Invite System:**
- ✅ Company Admin can create invites
- ✅ Invite tokens are generated correctly
- ✅ Email sent via Mailtrap (if configured)
- ✅ Invite link works for registration
- ✅ Token invalid after use

**Database Validation:**
- ✅ All users have `companyId`
- ✅ Company arrays contain correct user IDs
- ✅ No cross-company references

## 🔒 Security

- **JWT Tokens:** HttpOnly cookies, 15-minute expiration
- **Refresh Tokens:** 30-day expiration, stored as bcrypt hashes
- **Password Hashing:** bcrypt with 10 rounds
- **CORS:** Configured for specific origins
- **Company Isolation:** All data scoped by `companyId`
- **Role Guards:** Endpoint-level access control
- **Company Guards:** Prevent cross-tenant access

## 📧 Email Configuration (Mailtrap)

The application uses Mailtrap for sending invite emails in development/testing.

**Setup:**
1. Sign up at [mailtrap.io](https://mailtrap.io)
2. Get SMTP credentials from Email Testing → Inboxes
3. Add credentials to `backend/.env`:
   ```env
   MAILTRAP_HOST=sandbox.smtp.mailtrap.io
   MAILTRAP_PORT=2525
   MAILTRAP_USER=your_username
   MAILTRAP_PASS=your_password
   EMAIL_FROM=noreply@novapulse.com
   EMAIL_FROM_NAME=NovaPulse
   ```

**How it works:**
- With Mailtrap configured: Emails sent to Mailtrap inbox
- Without Mailtrap: Emails logged to console (development fallback)
- Invite links are always returned in API response for manual sharing

## 🐛 Troubleshooting

**401 Unauthorized:**
- Check JWT token is being sent (cookies or Authorization header)
- Verify JWT secret is consistent
- Check token expiration

**403 Forbidden:**
- Verify user's role matches endpoint requirements
- Check `companyId` matches resource's company
- Verify company guard is not blocking legitimate access

**Company Isolation Issues:**
- Verify `companyId` is in JWT payload
- Check service methods filter by `companyId`
- Ensure company guard is applied to routes

**Invite System Issues:**
- Verify invite token is valid and not expired
- Check if invite is already used
- Verify company exists and is active
- Check Mailtrap configuration if emails not sending

**Token Issues:**
- Verify cookie settings (httpOnly, secure, sameSite)
- Check CORS settings allow credentials
- Verify `companyId` is included in token payload

## 📦 Development

### Backend Commands

```bash
cd backend

# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Tests
npm run test
npm run test:e2e
```

### Frontend Commands

```bash
cd Frontend

# Development
npm run dev

# Production build
npm run build
npm start

# Lint
npm run lint
```

## 🚢 Deployment

### Backend Deployment

1. Set environment variables (including Mailtrap for production SMTP)
2. Build: `npm run build`
3. Start: `npm run start:prod`

### Frontend Deployment

1. Set `NEXT_PUBLIC_API_URL` to production backend URL
2. Build: `npm run build`
3. Deploy to Vercel/Netlify or run: `npm start`

## 📝 License

Proprietary - All rights reserved

---

**Version:** 2.0  
**Last Updated:** 2024  
**Status:** Phase 2 Complete (Multi-Tenancy)
