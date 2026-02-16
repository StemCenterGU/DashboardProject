# Set Up Database for WCOnline Replica

Follow these steps in order. You need a Supabase project with the main schema already applied.

---

## Prerequisites

- Supabase project created
- **Main schema applied**: `database/supabase-schema.sql` has been run in the Supabase SQL Editor (you already have `users`, `tutors`, `courses`, `appointments`, `available_slots`, etc.)

---

## Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. In the left sidebar, click **SQL Editor**

---

## Step 2: Run the Replica Setup Script

1. Click **New query**
2. Open the file **`database/setup-replica.sql`** from this repo (in your project folder, not from this doc)
3. Copy **only** the SQL inside that file and paste into the SQL Editor — do **not** copy any markdown (no `\`\`\`` backticks, no `sql` label)
4. Click **Run** (or press Ctrl+Enter)

You should see success messages for each statement (no errors).

---

## Step 3: Verify (optional)

1. Click **New query** in the SQL Editor.
2. Open the file **`database/verify-replica-setup.sql`** from this repo.
3. Copy its entire contents and paste into the SQL Editor, then click **Run**.

You should see two result sets; each should show a constraint whose definition includes `'replica'`. If you copy from the doc instead, copy only the SQL — not the word `sql` or any backticks, or you’ll get a syntax error.

---

## What This Setup Does

| Change | Purpose |
|--------|--------|
| **appointments.source** | Allows value `'replica'` in addition to `'wconline'` and `'manual'` |
| **available_slots.source** | Allows value `'replica'` in addition to existing values |
| **Column comments** | Documents the meaning of `source` for future developers |

After this:

- The **WCOnline sync script** continues to only touch rows with `source = 'wconline'`.
- The **replica app** can insert appointments and slots with `source = 'replica'` without being overwritten by sync.
- The **dashboard** can show all sources together or filter by source.

---

## Replica App Requirements When Writing Data

When building the replica, ensure:

1. **Appointments**: Set `source = 'replica'` on every insert. Use a unique `appointment_id` (e.g. `replica-` + UUID) so it doesn’t clash with WCOnline IDs.
2. **Available slots** (if the replica creates slots): Set `source = 'replica'` on every insert.
3. **Foreign keys**: Use existing `tutor_id` from `tutors` and `course_id` from `courses` (or leave nullable where allowed).

No other schema changes are required for the replica.
