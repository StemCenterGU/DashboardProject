# Registration Form Setup Implementation Plan

## Overview
This plan details the implementation of a dynamic "Registration Form Setup" system. This form collects demographic and academic information from clients (students) when they first register for an account on the platform. 

## Key Differences from Other Forms
1.  **One-Time Completion:** Unlike the Appointment Form (filled out per appointment), this form is filled out once during account creation (though students can likely update their profile later).
2.  **`Display on Appointment?` Setting:** This is a unique configuration for the registration form. It allows admins to specify if a piece of demographic data (like "Primary Major") should be pulled from the student's profile and displayed directly to the tutor on the appointment booking view.
3.  **No Conditional Logic:** It lacks the "Schedule Restrictions" seen in the Appointment Form, meaning all users see all registration questions.

## Phase 1: Database Schema

### 1.1 `registration_form_questions` Table
Stores the configuration for the registration questions.
*   `id` (uuid, primary key)
*   `question_number` (integer, 1-20)
*   `question_text` (text)
*   `possible_answers` (text)
*   `is_required` (boolean)
*   `display_on_appointment` (boolean) - Maps to "Yes" / "No"
*   `created_at`, `updated_at` (timestamps)

### 1.2 `user_registration_answers` Table
Stores the responses linked directly to the user's profile.
*   `id` (uuid, primary key)
*   `user_id` (uuid, foreign key to the main `users` or `profiles` table)
*   `question_id` (uuid, foreign key to `registration_form_questions`)
*   `answer_text` (text)
*   `updated_at` (timestamp, to track when they last updated their profile)

## Phase 2: Form Syntax Parser Utility
We will reuse the exact same `lib/form-parser.ts` utility created for the Appointment Form, as the syntax rules (FILL-IN, DROP-DOWN, CHECKBOX, LIKERT, TEXTAREA) are identical. No new parser logic is required for this form.

## Phase 3: Admin UI (Form Setup Page)

**Route:** `/admin/registration-form-setup`

### 3.1 Question List Editor
*   Fetch all rows from `registration_form_questions`, ordered by `question_number`.
*   Render a repeating block for each question.
*   **Fields per block:**
    *   `Question Text` (Input)
    *   `Possible Answers` (Input)
    *   `Required?` (Select: Required/Optional)
    *   `Display on Appointment?` (Select: Yes/No)
*   **Actions:** "Move Question Up" / "Move Question Down" to reorder.

### 3.2 "New Question" Form
*   Empty form block at the bottom to add a new question (up to 20).
*   "Save Changes" button.

## Phase 4: Client Authentication Integration

*   **Registration Flow:** During the sign-up process (e.g., `/register` or `/auth/signup`), after collecting basic auth details (email/password), fetch the active questions from `registration_form_questions`.
*   Dynamically render the form using the parser.
*   Upon submission, batch insert the answers into the `user_registration_answers` table.
*   **Profile Editing:** Create a "My Profile" page where students can update these answers later.

## Phase 5: Appointment View Integration

*   **Tutor View Modification:** When a tutor opens the details of a booked appointment, the system needs to fetch the student's demographic profile.
*   Query `registration_form_questions` where `display_on_appointment = true`.
*   Cross-reference with `user_registration_answers` for that specific student.
*   Display these specific demographic details (e.g., Class Standing, Major, Primary Language) prominently on the appointment view so the tutor has context before the session begins.

---

## Appendix A: Massive Dropdown Datasets
*The user provided extensive lists for Majors and Programs. These will be pasted directly into the `possible_answers` fields in the database via seed scripts or manual entry by the admin.*

### A.1 Primary/Additional Major List snippet (Questions #3 & #4)
`Not Listed,Undergraduate | Accounting | B.S.,Undergraduate | Accounting | A.S.,Undergraduate | Accounting | Minor,... [Full list provided in prompt]`
