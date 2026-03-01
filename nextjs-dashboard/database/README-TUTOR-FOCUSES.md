# Tutor focuses (Course or Focus filter)

Tutors can be linked to **courses/focuses** so that when a user filters by "Course or Focus" on the schedule, only tutors who support that course are shown.

## 1. Create the table

Run in Supabase SQL Editor (in order):

```text
database/migration-tutor-courses.sql
database/migration-tutor-courses-instructor.sql
```

This creates `tutor_courses(tutor_id, course_id, instructor)`. The **instructor** column stores the instructor for each link (e.g. "Dr Michael Messina", "any instructors"), so one tutor can have the same course with multiple instructors.

## 2. Seed a tutor and their focuses

After courses exist (e.g. from `seed-course-focus-options.sql` or `seed-course-focus-from-list.sql`), run:

```text
database/seed-tutor-aizirek-focuses.sql
```

This inserts the tutor "Aizirek A." (if missing) and links them to the listed focuses. Filtering by any of those courses on the schedule will show only tutors who have that course in `tutor_courses` (e.g. Aizirek A. for those courses).

## 2b. Bulk seed (all STEM Center tutors from WCOnline list)

To add all tutors and their FOCUSES from the STEM Center list in one go:

1. **Generate the SQL** (from repo root `nextjs-dashboard`):
   ```bash
   node scripts/seed-tutor-focuses-bulk.js
   ```
   This writes `database/seed-tutor-focuses-bulk.sql` (21 tutors, hundreds of tutor–course links).

2. **Run in Supabase** (after both migrations and after courses are populated):
   ```text
   database/seed-tutor-focuses-bulk.sql
   ```
   The script matches each focus to a course by `course_code` or `course_name`, and parses **instructor** from the focus (text after `" - "`). Each link is stored as (tutor_id, course_id, instructor). Tutors with no focuses are still inserted.

To change who is included or what focuses they have, edit the `tutorFocuses` object in `scripts/seed-tutor-focuses-bulk.js` and re-run the script.

## 3. Adding more tutors or focuses

- **New tutor:** `INSERT INTO tutors (tutor_name) VALUES ('Name');`
- **Link tutor to a course with instructor:**  
  `INSERT INTO tutor_courses (tutor_id, course_id, instructor) SELECT t.tutor_id, c.course_id, 'Dr X' FROM tutors t, courses c WHERE t.tutor_name = 'Name' AND c.course_code = 'BCOR105' ON CONFLICT (tutor_id, course_id, instructor) DO NOTHING;`

Courses are identified by `course_code` (or `course_name` for non-code options like "Academic AdviceMentoring Not Major-Dependent"). The **instructor** is stored per link (e.g. "Dr Michael Messina", "any instructors").
