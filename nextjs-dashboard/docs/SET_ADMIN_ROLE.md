# Setting a User's Role

See [RBAC-IMPLEMENTATION-GUIDE.md](./RBAC-IMPLEMENTATION-GUIDE.md) for what each role can do.

## From the app

Admins and project managers: **User Management** (`/admin/users`) → change the role in the user's row.
You can't change your own role.

## From the command line (first admin, or recovery)

The user must have signed up first. Needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

```bash
cd nextjs-dashboard
npm run set-admin -- someone@gannon.edu                 # role: admin
npm run set-role -- someone@gannon.edu student_manager  # any role
```

Roles: `admin`, `project_manager`, `student_manager`, `tutor`, `stem_pass_tutor`, `student`.

## From Supabase

Table Editor → `users` → edit `role`. Allowed values are enforced by the `users_role_check` constraint.
