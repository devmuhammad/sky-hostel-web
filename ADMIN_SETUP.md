# Admin Authentication Setup

This document explains how to set up admin authentication for the Sky Student Hostel system.

## Overview

The admin authentication system includes:

- Admin user management with roles (admin, super_admin)
- Secure login with admin-only access
- Role-based access control
- Activity logging for admin actions

## Setup Steps

### 1. Database Setup

First, run the database setup script to create the admin_users table:

```sql
-- Run the admin-setup.sql script in your Supabase SQL editor
-- This creates the admin_users table and necessary policies
```

### 2. Create First Admin User

Visit `/admin/setup` in your browser to create the first admin user. This page will only be accessible if no admin users exist in the database.

**Note:** This setup can only be performed once. After the first admin user is created, the setup page will no longer be accessible.

### 3. Login as Admin

After creating the admin user, you can log in at `/login` using the credentials you created.

## Admin User Roles

### Super Admin

- Can access all admin features
- Can create new admin users
- Can manage all system settings
- Full system access

### Admin

- Can access most admin features
- Cannot create new admin users
- Limited to standard admin operations

## Security Features

### Row Level Security (RLS)

- All admin operations are protected by RLS policies
- Only authenticated users can access admin data
- Super admins have additional privileges for user management

### Activity Logging

- All admin actions are logged in the `activity_logs` table
- Includes admin user ID for audit trails
- Tracks login times and system changes

### Session Management

- Secure session handling with Supabase Auth
- Automatic session validation on admin routes
- Redirect to login for unauthenticated users

## API Endpoints

### Admin Setup

- `POST /api/admin/setup` - Create first admin user
- Only works when no admin users exist

### Authentication

- Login: `/login`
- Admin Dashboard: `/admin`
- Setup: `/admin/setup`

## Database Schema

### admin_users Table

```sql
CREATE TABLE admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Troubleshooting

### Common Issues

1. **Setup page not accessible**
   - Check if admin users already exist in the database
   - Clear browser cache and try again

2. **Login fails**
   - Verify the admin user exists in the `admin_users` table
   - Check if the user is marked as `is_active = true`
   - Ensure the email matches exactly

3. **Permission denied errors**
   - Verify the user has the correct role
   - Check RLS policies are properly configured
   - Ensure the user is authenticated

### Database Checks

```sql
-- Check if admin users exist
SELECT * FROM admin_users;

-- Check user roles
SELECT email, role, is_active FROM admin_users;

-- Check activity logs
SELECT * FROM activity_logs WHERE admin_user_id IS NOT NULL;
```

## Best Practices

1. **Password Security**
   - Use strong passwords (minimum 8 characters)
   - Consider implementing password complexity requirements
   - Regularly rotate admin passwords

2. **Access Control**
   - Limit admin user creation to super admins only
   - Regularly review admin user access
   - Deactivate unused admin accounts

3. **Monitoring**
   - Monitor activity logs for suspicious activity
   - Set up alerts for failed login attempts
   - Regular security audits

## Environment Variables

Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Support

For issues with admin authentication:

1. Check the browser console for errors
2. Verify database connectivity
3. Review activity logs for clues
4. Contact system administrator
