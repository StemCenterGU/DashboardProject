# Appointment Form Setup Implementation Plan

## Overview
This plan details the implementation of a dynamic "Appointment Form Setup" system. This system allows administrators to define custom questions that clients must answer when booking an appointment. The configuration dictates the input type, requirement status, visibility, staff notifications, and schedule-specific conditional logic.

## Phase 1: Database Schema

### 1.1 `appointment_form_questions` Table
This table stores the configuration for each question.
*   `id` (uuid, primary key)
*   `question_number` (integer, 1-20 for ordering)
*   `question_text` (text)
*   `possible_answers` (text) - Stores the syntax string (e.g., "CHECKBOX,Option1,Option2" or empty).
*   `is_required` (boolean) - Maps to "Required" / "Optional".
*   `visibility` (text) - Maps to "Normal Visibility", etc.
*   `send_to_staff` (boolean) - Maps to "Yes" / "No".
*   `schedule_restrictions` (jsonb array) - Stores IDs or names of schedules this question applies to. Empty array means "All schedules".
*   `created_at` (timestamp)
*   `updated_at` (timestamp)

### 1.2 `appointment_answers` Table
This table stores the actual answers provided by clients during booking.
*   `id` (uuid, primary key)
*   `appointment_id` (uuid, foreign key to appointments)
*   `question_id` (uuid, foreign key to appointment_form_questions)
*   `answer_text` (text) - The submitted value.
*   `created_at` (timestamp)

## Phase 2: Form Syntax Parser Utility

Create a utility module (`lib/form-parser.ts`) to interpret the `possible_answers` string and determine the UI component to render.

**Parser Logic Rules:**
1.  **FILL-IN:** If `possible_answers` is empty -> Render standard text input.
2.  **LARGE TEXT AREA:** If `possible_answers` exactly matches "TEXTAREA" -> Render textarea.
3.  **LIKERT:** If `possible_answers` exactly matches "LIKERT" -> Render 5-point radio group + N/A.
4.  **SINGLE CHECKBOX:** If `possible_answers` starts with "CHECKBOX" but has no commas -> Render single checkbox.
5.  **MULTIPLE CHECKBOXES:** If `possible_answers` starts with "CHECKBOX," followed by comma-separated values -> Render checkbox group.
6.  **DROP-DOWN:** If `possible_answers` contains commas but does NOT start with "CHECKBOX" -> Render select dropdown.

## Phase 3: Admin UI (Form Setup Page)

**Route:** `/admin/form-setup`

### 3.1 Layout & Instructions
*   Create a persistent instructions banner at the top explaining the syntax rules for `possible_answers`.

### 3.2 Question List Editor
*   Fetch all rows from `appointment_form_questions`, ordered by `question_number`.
*   Render a repeating block for each question.
*   **Fields per block:**
    *   `Question Text` (Input)
    *   `Possible Answers` (Input)
    *   `Required?` (Select: Required/Optional)
    *   `Visibility` (Select)
    *   `Send to Staff?` (Select: Yes/No)
    *   `Schedule Restriction` (Multi-select / Checkbox list of available schedules).
*   **Actions:** Up/Down arrows to swap `question_number` with adjacent questions, triggering an immediate API update for reordering.

### 3.3 "New Question" Form
*   At the bottom of the list, display an empty form block.
*   If there are already 20 questions, hide this block and show a message: "Maximum of 20 questions reached."
*   "Save Changes" button to submit the new question.

## Phase 4: API Routes

*   `GET /api/admin/form-questions`: Retrieve all questions ordered by number.
*   `POST /api/admin/form-questions`: Create a new question. Enforce max limit of 20.
*   `PUT /api/admin/form-questions/:id`: Update an existing question's properties.
*   `PUT /api/admin/form-questions/reorder`: Accept an array of IDs in their new order and bulk-update their `question_number` fields.
*   `DELETE /api/admin/form-questions/:id`: Remove a question and adjust subsequent question numbers.

## Phase 5: Client Booking UI Integration

### 5.1 Dynamic Form Rendering
*   On the client appointment booking page, after a user selects a specific Schedule/Tutor, fetch the questions.
*   **Filter Logic:** Only fetch questions where `schedule_restrictions` is empty OR contains the currently selected schedule.
*   Map over the fetched questions using the Parser Utility (Phase 2) to render the exact React components needed (Input, Select, CheckboxGroup, etc.).

### 5.2 Submission
*   When the client submits the booking form, intercept the dynamic answers.
*   Store the core appointment details in the `appointments` table.
*   Batch insert the dynamic answers into the `appointment_answers` table, linked to the newly created appointment.

### 5.3 Staff Notifications
*   Modify the email notification service.
*   When sending a booking confirmation to staff, query `appointment_form_questions` where `send_to_staff = true`.
*   Retrieve the corresponding answers from `appointment_answers` and append them to the email body.

## Implementation Order
1.  **Database:** Create and run migrations for the two new tables.
2.  **Parser:** Build and unit-test the `lib/form-parser.ts` utility.
3.  **Admin APIs:** Build CRUD operations for the questions.
4.  **Admin UI:** Build the visual builder at `/admin/form-setup`.
5.  **Booking Integration:** Update the client-facing booking form to dynamically render the questions and save the answers.
6.  **Email Integration:** Update the notification logic to include staff-visible answers.

---

## Appendix A: Dropdown Options

### A.1 Schedule Restrictions
The following schedules populate the "Schedule Restriction" checkbox list:
*   Graduate Writing SP26
*   Main Menu
*   OAS - Office of Accessibility Services
*   OAS - Office of Accessibility Services (Ruskin)
*   Palumbo - Student Success Center (STEM Center satellite location)
*   Sanner Presentation Studio
*   STEM Center
*   STEM Center Proctored Exams
*   Writing Center/Humanities Tutoring SP26
*   ZZZZ - Practice Schedule (not real!)
*   ZZZZ - Practice Schedule 2 (not real!)
*   *Hidden/Archived Schedules*
    *   WC/Humanities Tutoring PRE FA21
    *   WC/Humanities Tutoring PRE FA22
    *   WC/Humanities Tutoring PRE SP22
    *   Writing Center/Humanities Tutoring FA13
    *   Writing Center/Humanities Tutoring FA14
    *   Writing Center/Humanities Tutoring FA15
    *   Writing Center/Humanities Tutoring FA16
    *   Writing Center/Humanities Tutoring FA17
    *   Writing Center/Humanities Tutoring FA18
    *   Writing Center/Humanities Tutoring FA19
    *   Writing Center/Humanities Tutoring FA20
    *   Writing Center/Humanities Tutoring FA21
    *   Writing Center/Humanities Tutoring FA22
    *   Writing Center/Humanities Tutoring FA23
    *   Writing Center/Humanities Tutoring FA24
    *   Writing Center/Humanities Tutoring FA25
    *   Writing Center/Humanities Tutoring SM13
    *   Writing Center/Humanities Tutoring SM14
    *   Writing Center/Humanities Tutoring SM15
    *   Writing Center/Humanities Tutoring SM16
    *   Writing Center/Humanities Tutoring SM17
    *   Writing Center/Humanities Tutoring SM18
    *   Writing Center/Humanities Tutoring SM19
    *   Writing Center/Humanities Tutoring SM20
    *   Writing Center/Humanities Tutoring SM21
    *   Writing Center/Humanities Tutoring SM22
    *   Writing Center/Humanities Tutoring SM23
    *   Writing Center/Humanities Tutoring SM24
    *   Writing Center/Humanities Tutoring SM25
    *   Writing Center/Humanities Tutoring SP13
    *   Writing Center/Humanities Tutoring SP15
    *   Writing Center/Humanities Tutoring SP16
    *   Writing Center/Humanities Tutoring SP17
    *   Writing Center/Humanities Tutoring SP18
    *   Writing Center/Humanities Tutoring SP19
    *   Writing Center/Humanities Tutoring SP20
    *   Writing Center/Humanities Tutoring SP21
    *   Writing Center/Humanities Tutoring SP22
    *   Writing Center/Humanities Tutoring SP23
    *   Writing Center/Humanities Tutoring SP24
    *   Writing Center/Humanities Tutoring SP25
    *   ~ WeBWorK Exams ~
    *   ~ Writing and Wellness Write-In ~
    *   ~ Writing and Wellness Write-In FA17~
    *   ~Nogaj College Algebra Exam Retake
    *   ~Nogaj MATH 111
    *   ~Prier Calculus 1 Gateway Exam
    *   ~WeBWorK Exams
    *   ~Writing and Wellness Write-In FA18~
    *   Bookstore Drawing!
    *   Caulfield Gateway
    *   College Algebra Presentations
    *   Graduate Writing FA19
    *   Graduate Writing FA20
    *   Graduate Writing FA21
    *   Graduate Writing FA22
    *   Graduate Writing FA23
    *   Graduate Writing FA24
    *   Graduate Writing FA25
    *   Graduate Writing PRE FA22
    *   Graduate Writing SM19
    *   Graduate Writing SM20
    *   Graduate Writing SM21
    *   Graduate Writing SM22
    *   Graduate Writing SM23
    *   Graduate Writing SM24
    *   Graduate Writing SM25
    *   Graduate Writing SP20
    *   Graduate Writing SP21
    *   Graduate Writing SP22
    *   Graduate Writing SP23
    *   Graduate Writing SP24
    *   Graduate Writing SP25
    *   Graduate Writing WM20
    *   Math Center - 2012 Fall
    *   Math Center - 2013 Spring
    *   Math Center - 2013 Summer
    *   Math Center & Subject Area (FA13)
    *   Math Center & Subject Area Tutoring
    *   Math/Tutoring/Speech Fall 2014
    *   Math/Tutoring/Speech SPRING 2015
    *   Mathematics Center - 2012 Fall (Start)
    *   Mathematics Center - 2012 Spring
    *   Mathematics Center - 2012 Summer
    *   Mr. Nogaj Student Appointments
    *   Office Hours - 2012 Fall
    *   Online Tutoring -- Math - 2012 Spring
    *   Palumbo - Student Success Center (STEM Center satellite location)
    *   Peer Mentoring
    *   Proctored Exams - 2013 Spring
    *   PSLD Exam Room Reservations - 2013Spring
    *   Sanner Presentation Studio
    *   Sanner Presentation Studio FA19
    *   Sanner Presentation Studio Fall 22
    *   Sanner Presentation Studio SM25
    *   Sanner Presentation Studio SP25
    *   Speech Communication Center
    *   Speech Communication Center - 2012 Fall
    *   Speech Communication Center - 2012 Sprin
    *   Speech Communication Center - 2013Spring
    *   Speech Communication Center FA13
    *   Staff Use Only - FA25
    *   STEM Center (FA 15)
    *   STEM Center / Tutoring SUMMER 2015
    *   STEM Center 16/SP
    *   STEM Center 16FA
    *   STEM Center 16SP
    *   STEM Center 17/FA
    *   STEM Center 17/SP
    *   STEM Center 17/SU
    *   STEM Center 18/FA
    *   STEM Center 18/SP
    *   STEM Center 18/SU
    *   STEM Center 19/FA
    *   STEM Center 19/SP
    *   STEM Center 20/FA
    *   STEM Center 20/SP Physical
    *   STEM Center 20/SU Information
    *   STEM Center 21/FA
    *   STEM Center 21/SP
    *   STEM Center 22/FA
    *   STEM Center 22/SP
    *   STEM Center 23/FA
    *   STEM Center 23/SP
    *   STEM Center 24/FA
    *   STEM Center 24/SP
    *   STEM Center 25/FA
    *   STEM Center 25/SP
    *   STEM Center Finals Week
    *   STEM Center Proctored Exams (archive)
    *   STEM/WRC Spaces
    *   Test
    *   Test Schedule
    *   Tutoring Center - 2013 Spring
    *   Tutoring Summer 2014
    *   Undeclared FA13 Registration - Spring 13
    *   Welcome!!!!
    *   Wintermester Tutoring
    *   WRC TEST ZZZZ
    *   ZZ Test Schedule (not real!)

### A.2 Visibility Options
*   Normal Visibility
*   Administrators Only

### A.3 Required Options
*   Required
*   Optional

### A.4 Send to Staff Options
*   Yes
*   No
