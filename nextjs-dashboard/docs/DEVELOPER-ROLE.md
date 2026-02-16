# Developer Role

Accounts with the **developer** role see the **Replica** link in the navbar and can access `/replica` (new changes / WCOnline replica features). Other users do not see that link or page.

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

Admin accounts can also access `/replica`; the Replica nav link is shown only for **developer** so it’s obvious when you’re on a dev account.
