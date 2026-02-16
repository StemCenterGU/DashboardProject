# Developer Role

Accounts with the **developer** role see the **Replica** link in the navbar and can access `/replica` and all other **new/latest features**. Other roles (including admin) do not see or access these areas.

**Policy:** From now on, all new and latest changes are gated to **developer role only** (login as developer to see and use them).

---

## 1. Add the role in the database

Run this in the Supabase SQL Editor (once per project):

- Open **`database/migration-add-developer-role.sql`**, copy its contents, paste into a new query, and run.

---

## 2. Assign developer to your account

If the user doesn’t appear in the **users** table (e.g. they only exist in Supabase Auth), the set-role API will **create** their row from Auth and set the role in one step. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in the environment.

**Option A — npm script (dev server must be running):**

```bash
npm run set-developer your-email@example.com
```

**Option B — API (e.g. from Postman or curl):**

```bash
curl -X POST http://localhost:3001/api/admin/set-role \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","role":"developer"}'
```

**Option C — Supabase SQL:**

```sql
UPDATE users SET role = 'developer' WHERE email = 'your-email@example.com';
```

---

## 3. Log in

Log in with that account. You should see:

- A **Replica** link (with a “New” badge) in the top nav.
- Access to **/replica** for new/replica features.

Only **developer** accounts can access `/replica` and new features; the Replica nav link is shown only when logged in as developer.

---

## 4. Adding new features (for developers)

When adding new or experimental features:

- **Gate access to developer role only:** e.g. `if (user.role !== "developer") redirect("/dashboard")` on the page, and show nav links only when `user?.role === "developer"`.
- Do **not** grant admin or other roles access to these areas; keep “latest” features developer-only.
