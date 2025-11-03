# Default Admin User Seed

## Overview

The backend automatically creates a default admin user when it starts, **only if no admin user exists** in the database.

## How It Works

1. When the backend starts, the `DefaultAdminSeed` service runs automatically
2. It checks if any admin user (role: `admin` or `superadmin`) already exists
3. If no admin exists, it creates one with default credentials
4. If an admin already exists, it skips creation and logs a message

## Default Credentials

If no environment variables are set, the default admin will be:

- **Email:** `admin@novapulse.com`
- **Password:** `admin123`
- **Name:** `Admin User`
- **Role:** `admin`

## Configuration via Environment Variables

You can customize the default admin credentials by adding these to your `.env` file:

```env
# Optional: Customize default admin user
DEFAULT_ADMIN_EMAIL=admin@yourcompany.com
DEFAULT_ADMIN_PASSWORD=YourSecurePassword123
DEFAULT_ADMIN_NAME=System Administrator
```

## Security Notes

⚠️ **IMPORTANT:**
- Change the default password immediately after first login!
- In production, always set `DEFAULT_ADMIN_PASSWORD` to a strong password
- The default credentials are only used if no admin exists
- If you already have admin users, this seed will not run

## Logs

When the backend starts, you'll see one of these messages:

**If admin is created:**
```
✅ Default admin user created successfully!
📧 Email: admin@novapulse.com
🔑 Password: admin123
⚠️  Please change the default password after first login!
```

**If admin already exists:**
```
✅ Admin user already exists. Skipping default admin creation.
```

## Example `.env` Configuration

```env
# Database
MONGO_URI=mongodb://localhost:27017/novapulse

# JWT Secrets
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Default Admin (Optional - only used if no admin exists)
DEFAULT_ADMIN_EMAIL=admin@novapulse.com
DEFAULT_ADMIN_PASSWORD=SecurePassword123!
DEFAULT_ADMIN_NAME=Administrator

# Server
PORT=5500
NODE_ENV=development
```

## Testing

1. Start the backend: `npm run start:dev`
2. Check the console logs for seed messages
3. Try logging in with the default admin credentials
4. Change the password immediately!

