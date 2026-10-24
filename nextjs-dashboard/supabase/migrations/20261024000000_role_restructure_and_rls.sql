-- Migration: Role restructure + row-level security aligned with lib/roles.ts
--
-- Roles: admin, project_manager (full access), student_manager (view all, edit own),
--        tutor, stem_pass_tutor (own appointments), student (own bookings)
--
-- This migration is the single source of truth for public-schema policies:
-- it drops EVERY existing policy in the public schema and recreates them.
--
-- Safe to re-run.

BEGIN;

-- ======================================
-- 1. DROP ALL EXISTING POLICIES IN public
-- ======================================
-- (Policies that reference users.role also block the column type change below.)
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END
$$;

-- ======================================
-- 2. ROLE VALUES ON users.role
-- ======================================
-- Works whether role is VARCHAR + CHECK or the user_role ENUM.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.users ALTER COLUMN role TYPE TEXT USING role::TEXT;

UPDATE public.users SET role = CASE role
  WHEN 'developer'  THEN 'admin'
  WHEN 'manager'    THEN 'project_manager'
  WHEN 'lead_tutor' THEN 'student_manager'
  ELSE role
END;

UPDATE public.users SET role = 'student'
WHERE role IS NULL
   OR role NOT IN ('admin', 'project_manager', 'student_manager', 'tutor', 'stem_pass_tutor', 'student');

ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'student';
ALTER TABLE public.users ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'project_manager', 'student_manager', 'tutor', 'stem_pass_tutor', 'student'));

-- Old enum type is no longer used
DO $$
BEGIN
  DROP TYPE IF EXISTS public.user_role;
EXCEPTION WHEN dependent_objects_still_exist THEN
  RAISE NOTICE 'user_role enum still used elsewhere; left in place';
END
$$;

-- ======================================
-- 3. HELPER FUNCTIONS (SECURITY DEFINER so they can read users/tutors without RLS recursion)
-- ======================================
CREATE OR REPLACE FUNCTION public.app_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.users WHERE user_id::TEXT = auth.uid()::TEXT AND COALESCE(active, TRUE)
$$;

CREATE OR REPLACE FUNCTION public.is_full_access()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(public.app_role() IN ('admin', 'project_manager'), FALSE)
$$;

CREATE OR REPLACE FUNCTION public.is_oversight()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(public.app_role() IN ('admin', 'project_manager', 'student_manager'), FALSE)
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(public.app_role() IN ('admin', 'project_manager', 'student_manager', 'tutor', 'stem_pass_tutor'), FALSE)
$$;

-- tutor_ids linked to the signed-in user (their "own" appointments as tutor)
CREATE OR REPLACE FUNCTION public.my_tutor_ids()
RETURNS SETOF TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT tutor_id::TEXT FROM public.tutors WHERE user_id::TEXT = auth.uid()::TEXT
$$;

-- Signed-in user's email, lower-cased (students own appointments booked with this email)
CREATE OR REPLACE FUNCTION public.my_email()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT LOWER(auth.jwt() ->> 'email')
$$;

-- ======================================
-- 4. NO ACCESS FOR ANONYMOUS REQUESTS; RLS ON EVERYWHERE
-- ======================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END
$$;

-- ======================================
-- 5. users
-- ======================================
-- Read: your own row; staff can read everyone (names/emails on reports and schedules)
CREATE POLICY users_select ON public.users FOR SELECT TO authenticated
  USING (user_id::TEXT = auth.uid()::TEXT OR public.is_staff());

-- Insert: only your own row, and only with the default role (first sign-in)
CREATE POLICY users_insert_self ON public.users FOR INSERT TO authenticated
  WITH CHECK (user_id::TEXT = auth.uid()::TEXT AND role = 'student');

-- Update: your own row (column grants below stop role/active changes) or full access
CREATE POLICY users_update ON public.users FOR UPDATE TO authenticated
  USING (user_id::TEXT = auth.uid()::TEXT OR public.is_full_access())
  WITH CHECK (user_id::TEXT = auth.uid()::TEXT OR public.is_full_access());

CREATE POLICY users_delete ON public.users FOR DELETE TO authenticated
  USING (public.is_full_access());

-- Signed-in users may only change these columns through the API.
-- Role and active changes go through the server (service role) after an admin check.
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (full_name, last_login, updated_at) ON public.users TO authenticated;

-- ======================================
-- 6. appointments
-- ======================================
CREATE POLICY appointments_select ON public.appointments FOR SELECT TO authenticated
  USING (
    public.is_oversight()
    OR tutor_id::TEXT IN (SELECT public.my_tutor_ids())
    OR LOWER(student_email) = public.my_email()
  );

CREATE POLICY appointments_insert ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (
    public.is_full_access()
    OR tutor_id::TEXT IN (SELECT public.my_tutor_ids())
    OR (public.app_role() = 'student' AND LOWER(student_email) = public.my_email())
  );

CREATE POLICY appointments_update ON public.appointments FOR UPDATE TO authenticated
  USING (
    public.is_full_access()
    OR tutor_id::TEXT IN (SELECT public.my_tutor_ids())
    OR LOWER(student_email) = public.my_email()
  )
  WITH CHECK (
    public.is_full_access()
    OR tutor_id::TEXT IN (SELECT public.my_tutor_ids())
    OR LOWER(student_email) = public.my_email()
  );

CREATE POLICY appointments_delete ON public.appointments FOR DELETE TO authenticated
  USING (public.is_full_access() OR tutor_id::TEXT IN (SELECT public.my_tutor_ids()));

-- ======================================
-- 7. Per-user tables: notifications, registration answers
-- ======================================
DO $$
BEGIN
  IF to_regclass('public.notifications') IS NOT NULL THEN
    CREATE POLICY notifications_select ON public.notifications FOR SELECT TO authenticated
      USING (user_id::TEXT = auth.uid()::TEXT);
    CREATE POLICY notifications_insert ON public.notifications FOR INSERT TO authenticated
      WITH CHECK (user_id::TEXT = auth.uid()::TEXT OR public.is_full_access());
    CREATE POLICY notifications_update ON public.notifications FOR UPDATE TO authenticated
      USING (user_id::TEXT = auth.uid()::TEXT) WITH CHECK (user_id::TEXT = auth.uid()::TEXT);
    CREATE POLICY notifications_delete ON public.notifications FOR DELETE TO authenticated
      USING (user_id::TEXT = auth.uid()::TEXT);
  END IF;

  IF to_regclass('public.user_registration_answers') IS NOT NULL THEN
    CREATE POLICY registration_answers_own ON public.user_registration_answers FOR ALL TO authenticated
      USING (user_id::TEXT = auth.uid()::TEXT OR public.is_full_access())
      WITH CHECK (user_id::TEXT = auth.uid()::TEXT OR public.is_full_access());
  END IF;
END
$$;

-- ======================================
-- 8. client_reports: staff only (per-tutor scoping is enforced in the API)
-- ======================================
DO $$
BEGIN
  IF to_regclass('public.client_reports') IS NOT NULL THEN
    CREATE POLICY client_reports_select ON public.client_reports FOR SELECT TO authenticated
      USING (public.is_staff());
    CREATE POLICY client_reports_insert ON public.client_reports FOR INSERT TO authenticated
      WITH CHECK (public.is_staff());
    CREATE POLICY client_reports_update ON public.client_reports FOR UPDATE TO authenticated
      USING (public.is_staff()) WITH CHECK (public.is_staff());
    CREATE POLICY client_reports_delete ON public.client_reports FOR DELETE TO authenticated
      USING (public.is_full_access());
  END IF;
END
$$;

-- ======================================
-- 9. Reference / configuration tables: every signed-in user reads, full access writes
-- ======================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'tutors', 'courses', 'tutor_courses', 'tutor_availability', 'available_slots',
    'instructors', 'programs', 'additional_programs', 'course_focus_options',
    'report_focus_options', 'registration_form_questions', 'appointment_form_questions',
    'client_report_questions', 'client_report_config'
  ] LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (TRUE)', tbl || '_select', tbl);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_full_access())', tbl || '_insert', tbl);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_full_access()) WITH CHECK (public.is_full_access())', tbl || '_update', tbl);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_full_access())', tbl || '_delete', tbl);
    END IF;
  END LOOP;
END
$$;

-- ======================================
-- 10. Everything else (schedule requests, drafts, audit logs, shifts, students, ...):
--     staff only. Students and anonymous requests get no access.
-- ======================================
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN (SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public')
  LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff())', t.tablename || '_staff', t.tablename);
  END LOOP;
END
$$;

COMMIT;
