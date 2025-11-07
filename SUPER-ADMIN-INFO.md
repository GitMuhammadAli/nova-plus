# Super Admin Information

## ✅ Yes, NovaPulse has a Super Admin!

### Default Super Admin Credentials

The Super Admin is **automatically created** when the backend starts (if one doesn't exist).

**Default Credentials:**
- **Email:** `admin@novapulse.com`
- **Password:** `admin123`
- **Role:** `SUPER_ADMIN`

### Customize Credentials (Optional)

You can set custom credentials via environment variables:

```env
DEFAULT_ADMIN_EMAIL=your-admin@email.com
DEFAULT_ADMIN_PASSWORD=YourSecurePassword123
DEFAULT_ADMIN_NAME=Your Admin Name
```

### Super Admin Capabilities

The Super Admin has **platform-wide access** and can:

1. **Create Companies**
   - `POST /company/create` - Create new companies with admin users
   - Only Super Admin can use this endpoint

2. **View All Companies**
   - `GET /company/all` - See all companies in the platform
   - Only Super Admin can access this

3. **Access Any Company Data**
   - Can view any company's details
   - Can view any company's users
   - Can manage any company (if needed)

4. **Platform Management**
   - Manage all companies
   - View platform-wide analytics (Phase 4)
   - Manage billing (Phase 8)

### Super Admin vs Company Admin

| Feature | Super Admin | Company Admin |
|---------|-------------|---------------|
| **Scope** | Platform-wide | Single company |
| **Can create companies** | ✅ Yes | ❌ No |
| **Can view all companies** | ✅ Yes | ❌ No (only own) |
| **Can manage users** | ✅ Yes (any company) | ✅ Yes (own company only) |
| **Can access other companies** | ✅ Yes | ❌ No (403 Forbidden) |

### How to Login as Super Admin

1. **Start the backend:**
   ```bash
   npm run start
   ```

2. **Check logs** - You'll see:
   ```
   ✅ Default Super Admin user created successfully!
   📧 Email: admin@novapulse.com
   🔑 Password: admin123
   👑 Role: SUPER_ADMIN (can create companies)
   ```

3. **Login via API:**
   ```bash
   POST /auth/login
   {
     "email": "admin@novapulse.com",
     "password": "admin123"
   }
   ```

4. **Or use the test seed:**
   ```bash
   npm run seed:test
   ```
   This creates: `super.admin@test.com` / `super123`

### Super Admin Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/company/create` | POST | Create new company | Super Admin only |
| `/company/all` | GET | List all companies | Super Admin only |
| `/company/:id` | GET | View any company | Super Admin or Company Admin (own) |
| `/company/:id/users` | GET | View any company's users | Super Admin or Company Admin (own) |
| `/users/all` | GET | View all users (any company) | Super Admin, Company Admin, Manager |

### Security Notes

⚠️ **Important:**
- Change the default password after first login!
- Super Admin has full platform access - use carefully
- In production, use strong passwords via environment variables
- Consider disabling auto-creation in production

### Testing with Super Admin

Use the test seed to create a test Super Admin:
```bash
npm run seed:test
```

This creates: `super.admin@test.com` / `super123`

### Frontend Dashboard

Super Admin should see:
- `/dashboard/super-admin` - Platform overview
- All companies list
- Platform analytics
- Global settings

---

**Summary:** Yes, Super Admin exists and is automatically created on backend startup! 🎉

