# Role-Based Access Control (RBAC)

This is the authoritative description of roles and access. Older docs that mention
`developer`, `lead_tutor` or `manager` roles are out of date.

## Roles

| Role | Value | Access |
|---|---|---|
| Admin | `admin` | Full access |
| Project Manager | `project_manager` | Full access (identical to admin) |
| Student Manager | `student_manager` | Views **all** appointments, schedules, reports and analytics (read-only); edits only their own |
| Tutor | `tutor` | Only their own appointments, schedule and client reports |
| STEM PASS Tutor | `stem_pass_tutor` | Same as tutor |
| Student | `student` | Books and cancels their own appointments only |

New accounts always start as `student`. Admins and project managers change roles in
**User Management** (`/admin/users`).

## Where it is enforced

| Layer | File | What it does |
|---|---|---|
| Role definitions | `lib/roles.ts` | Single source of truth: roles, groups, `PERMISSIONS`, `PAGE_ACCESS` |
| Session + role | `lib/auth.ts` | `getCurrentUser()` verifies the session with Supabase and reads the role from the `users` table (never from `user_metadata`); inactive users are treated as signed out |
| Pages | `proxy.ts` | Redirects signed-out users to `/login` and sends each role to pages it may open (`PAGE_ACCESS`) |
| Navbar | `components/navbar.tsx` | Shows links using the same `canAccessPage()` / `hasPermission()` helpers |
| API routes | `app/api/**` | `requireAuth()`, `requirePermission()`, `requireFullAccess()` etc. |
| Appointment ownership | `lib/appointment-access.ts` | Who owns/can view/can edit an appointment or client report |
| Database | `supabase/migrations/20261024000000_role_restructure_and_rls.sql` | Row-level security mirroring the rules above; no table access for anonymous requests |

## Appointment rules

"Own" appointment:
- **Tutor-type roles** (`tutor`, `stem_pass_tutor`, `student_manager`): `appointments.tutor_id` is a tutor row linked to them (`tutors.user_id`)
- **Students**: `appointments.student_email` matches their login email

| | View | Edit / cancel | Book |
|---|---|---|---|
| Admin, Project Manager | All | All | For any tutor |
| Student Manager | All | Own | With themselves as tutor |
| Tutor, STEM PASS Tutor | Own | Own | With themselves as tutor |
| Student | Own | Cancel own | For themselves only (name/email come from their account; no repeating, walk-in, placeholder or no-show options) |

On the schedule grid, appointments you can't view are returned by the API as plain
**Booked** entries: no student, course, notes or appointment ID, and they can't be opened.

## Page access

| Page | Roles |
|---|---|
| `/admin/*`, `/users`, `/replica` | Admin, Project Manager |
| `/dashboard`, `/charts` (analytics) | Student Manager and above |
| `/tutor-schedules`, `/reports`, `/clients`, `/scheduling/repeat`, `/scheduling/reports` | All staff (not students) |
| `/scheduling`, `/calendar`, `/profile`, `/settings` | Everyone signed in |

After login, Student Manager and above land on `/dashboard`; everyone else on `/scheduling`.

## Adding a check

```ts
// API route
import { requirePermission, authErrorStatus } from '@/lib/auth'

export async function GET() {
  try {
    await requirePermission('VIEW_ANALYTICS')
  } catch (error) {
    return NextResponse.json({ error: 'Forbidden' }, { status: authErrorStatus(error) })
  }
  // ...
}
```

```tsx
// Client component
import { useUser } from '@/contexts/AuthContext'
import { hasPermission } from '@/lib/roles'

const { role } = useUser()
{hasPermission(role, 'EDIT_ALL_SCHEDULES') && <EditButton />}
```

Never hard-code role strings; add a permission to `PERMISSIONS` in `lib/roles.ts` instead.
UI checks are only for display. Every rule must also be enforced in the API route.

## Scripts

```bash
# Set a role directly (e.g. bootstrap the first admin). Needs SUPABASE_SERVICE_ROLE_KEY.
npm run set-role -- someone@gannon.edu project_manager
npm run set-admin -- someone@gannon.edu

# Create one test account per role (plus-addresses of the given email)
npm run create-test-accounts -- you@gmail.com
```

## Database migration

Run `supabase/migrations/20261024000000_role_restructure_and_rls.sql` in the Supabase SQL
Editor **before** deploying this code. It:
1. Converts existing roles (`developer` → `admin`, `manager` → `project_manager`, `lead_tutor` → `student_manager`; anything else unknown → `student`)
2. Drops every policy in the `public` schema and recreates them to match the rules above
3. Revokes all table access from anonymous (logged-out) requests
4. Lets signed-in users change only `full_name`/`last_login` on their own `users` row; roles change only through the server
