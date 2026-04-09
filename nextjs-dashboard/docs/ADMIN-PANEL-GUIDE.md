# Admin User Management Panel - Quick Start Guide

## Overview

The Admin User Management Panel allows administrators to view all users and change their roles in real-time through a clean, intuitive interface.

## Features

✅ **View All Users** - See complete user list with email, name, role, and join date
✅ **Search Users** - Search by name or email
✅ **Filter by Role** - Filter users by their current role
✅ **Change Roles** - Update user roles with a simple dropdown
✅ **Real-time Updates** - Role changes reflect within 30 seconds
✅ **Safety Checks** - Admins cannot change their own role
✅ **Audit Logging** - All role changes are logged on the server

## Access

### URL
```
/admin/users
```

### Who Can Access
- **Admin** role only
- **Developer** role (has same permissions as admin)

### Navigation
Accessible from the navbar when logged in as admin:
- Click "User Management" in the top navigation bar

## How to Use

### 1. View Users

Navigate to `/admin/users` to see a table of all users with:
- User name
- Email address
- Current role (color-coded badge)
- Join date
- Role change dropdown

### 2. Search for Users

Use the search bar at the top to find users by:
- Name
- Email address

The search is case-insensitive and updates in real-time.

### 3. Filter by Role

Use the "Filter by role" dropdown to show only users with specific roles:
- Tutor
- Lead Tutor
- Manager
- Admin
- Developer

### 4. Change a User's Role

1. Find the user in the table
2. Click the dropdown in the "Change Role" column
3. Select the new role
4. Confirm the change when prompted
5. The table updates immediately
6. The user's permissions update within 30 seconds

**Note:** You cannot change your own role (safety feature)

### 5. Clear Filters

Click the "Clear" button to reset all search and filter criteria.

## Role Hierarchy

```
ADMIN (Full Access) → MANAGER → LEAD_TUTOR → TUTOR
DEVELOPER (Same as ADMIN + dev tools)
```

### Role Descriptions

| Role | Level | Permissions |
|------|-------|-------------|
| **Admin** | 5 | Full access to everything including user management |
| **Developer** | 5 | Same as Admin + development tools |
| **Manager** | 4 | Schedule management, CSV uploads, reports |
| **Lead Tutor** | 3 | View all schedules, manage tutors |
| **Tutor** | 2 | Manage own appointments and schedule |

## Security

### Backend Protection
- All API endpoints require admin authentication
- Role changes are validated on the server
- Uses admin client to bypass Row Level Security
- Prevents self-role changes

### Frontend Protection
- Admin layout redirects non-admins to dashboard
- Navigation links only show for admins
- Real-time role checks

## Technical Details

### API Endpoints

#### Get All Users
```
GET /api/admin/users?search=john&role=tutor
```

Response:
```json
{
  "users": [
    {
      "user_id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "tutor",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 50
}
```

#### Update User Role
```
PUT /api/admin/users/[user_id]/role
Body: { "role": "manager" }
```

Response:
```json
{
  "success": true,
  "message": "Role updated from tutor to manager",
  "user": { ... }
}
```

### Files Created

```
app/
├── (dashboard)/
│   └── admin/
│       ├── layout.tsx          # Route protection
│       └── users/
│           └── page.tsx        # User management UI
│
└── api/
    └── admin/
        └── users/
            ├── route.ts        # GET all users
            └── [id]/
                └── role/
                    └── route.ts # PUT update role

contexts/
└── AuthContext.tsx             # Role auto-refresh added

components/
└── navbar.tsx                  # Admin link added

lib/
├── supabase-client.ts          # Client-side Supabase
├── roles.ts                    # Role definitions
└── auth.ts                     # Auth helpers
```

## Troubleshooting

### Issue: "User Management" link not showing

**Solution:**
- Ensure you're logged in as admin or developer
- Check your role in the navbar dropdown
- Try logging out and back in

### Issue: Can't change user role

**Possible causes:**
1. You're trying to change your own role (blocked for safety)
2. You're not logged in as admin
3. Invalid role selected

**Solution:**
- Verify you have admin permissions
- Try a different role
- Check browser console for error messages

### Issue: Role change doesn't take effect

**Solution:**
- Wait 30 seconds for auto-refresh
- Have the user log out and back in
- Check that the API call succeeded (check Network tab)

### Issue: Page shows "Loading..." forever

**Solution:**
- Check that you have admin role in the database
- Verify Supabase connection is working
- Check browser console for errors

## Testing

### Test Scenario 1: View Users
1. Log in as admin
2. Click "User Management"
3. Verify you see a list of all users

### Test Scenario 2: Search
1. Enter a search term in the search box
2. Verify only matching users are shown
3. Clear search to see all users again

### Test Scenario 3: Change Role
1. Select a test user (not yourself)
2. Click the role dropdown
3. Select "manager"
4. Confirm the change
5. Verify the badge updates to show "Manager"
6. Log in as that user
7. Verify they have manager permissions

### Test Scenario 4: Self-Role Protection
1. Try to change your own role
2. Verify you get an error message
3. Verify your role doesn't change

## Best Practices

### 1. Double Check Before Changing Roles
Always verify you're changing the correct user's role before confirming.

### 2. Document Role Changes
Keep a log of who changed what and why for audit purposes.

### 3. Test New Permissions
After changing a role, test that the user has the expected permissions.

### 4. Don't Remove All Admins
Always ensure at least one admin account exists.

### 5. Use Manager for Most Tasks
Reserve admin role for true system administrators. Use manager for day-to-day operations.

## Examples

### Example 1: Promote Tutor to Lead Tutor
```
1. Search for tutor by email: "john@example.com"
2. Find John in results
3. Click role dropdown (shows "Tutor")
4. Select "Lead Tutor"
5. Confirm
6. Badge updates to purple "Lead Tutor"
```

### Example 2: Bulk Role Assignment
```
1. Filter by role: "Tutor"
2. For each user needing promotion:
   - Change role to "Lead Tutor"
   - Confirm
3. Clear filter to verify changes
```

### Example 3: Find All Admins
```
1. Clear all filters
2. Select filter: "Admin"
3. Review list of all admin users
4. Verify each should have admin access
```

## Support

For issues or questions:
1. Check this guide first
2. Review `/docs/RBAC-IMPLEMENTATION-GUIDE.md`
3. Check browser console for errors
4. Review server logs for API errors

## Quick Reference

| Action | Steps |
|--------|-------|
| View Users | Navigate to `/admin/users` |
| Search | Type in search box at top |
| Filter | Select from "Filter by role" dropdown |
| Change Role | Click dropdown → Select role → Confirm |
| Clear Filters | Click "Clear" button |
| Refresh Data | Click refresh icon button |

---

**Last Updated:** March 2026
**Version:** 1.0.0
