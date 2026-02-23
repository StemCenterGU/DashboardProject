# GU Courses and Faculty Seed (STEM Dashboard)

Load the official Gannon University course and faculty lists into the dashboard from **one combined file**.

## 1. Put everything in one file

Use **gu-academics-raw.txt** with both lists in this order:

1. **Courses** – Comma-delimited (one line or multiple). Format: `CODE (Course Name),CODE (Course Name),...`  
   Example: `ACCT_313 (Accounting Information Systems),MATH_140 (Calculus 1),...`

2. **A separator line** – Any line that contains `---` or `---FACULTY---` (so the script knows where faculty start).

3. **Faculty** – Comma-delimited. Format: `Name (Department): USERID,Name (Department): USERID,...`  
   Example: `Nogaj Adam (Library): NOGAJ001,Adams Heather (Physician Assistant Program): ADAMS051,...`

You can paste the full lists from the GU email into this one file (courses first, then a line with `---`, then faculty).

**Alternative:** If you only have two lines total (no separator), the script treats line 1 as courses and line 2 as faculty.

## 2. Generate SQL seeds

From the **nextjs-dashboard** project root:

```bash
node scripts/seed-gu-academics.js
```

This reads **gu-academics-raw.txt** and writes:

- **seed-gu-courses.sql** – INSERT into `courses`
- **seed-gu-faculty.sql** – INSERT into `faculty`

## 3. Run in Supabase

1. If the **faculty** table does not exist, run **migration-gu-faculty.sql** once in the Supabase SQL Editor.
2. Run **seed-gu-courses.sql** in the SQL Editor.
3. Run **seed-gu-faculty.sql** in the SQL Editor.

After this, the dashboard can fetch courses and faculty from the database.
