# Client Report Form Setup Implementation Plan

## Overview
This plan details the implementation of a dynamic "Client Report Form Setup" system. Unlike the Appointment Form (which clients fill out before an appointment), the Client Report Form is filled out by **staff/tutors after the appointment** to log what happened. It is not accessible to the client.

## Key Differences from Appointment Form Setup
Based on the provided specification, this setup is similar to the appointment form but has three distinct differences:
1.  **Global Email Settings:** It includes a field at the top to configure the "Client Report Email Subject" (with variables like `[username]` and `[date]`).
2.  **AUTOEMAIL Syntax:** It introduces a new `possible_answers` command (`AUTOEMAIL`) to generate a dropdown of faculty/instructor emails that the final report should be automatically forwarded to.
3.  **Simpler Configuration:** Questions only have "Question Text", "Possible Answers", and "Required?" fields. There are no Visibility, Send to Staff, or Schedule Restriction settings.

## Phase 1: Database Schema

### 1.1 `client_report_form_settings` Table
To store the global configuration for the client reports.
*   `id` (integer, primary key, likely just a single row)
*   `email_subject` (text) - Default: "Automated Tutoring Report - [username], [date]"

### 1.2 `client_report_form_questions` Table
To store the dynamic question configurations.
*   `id` (uuid, primary key)
*   `question_number` (integer, 1-20)
*   `question_code` (text) - e.g., "[q25]", "[q26]"
*   `question_text` (text)
*   `possible_answers` (text)
*   `is_required` (boolean)
*   `created_at`, `updated_at` (timestamps)

## Phase 2: Form Syntax Parser Utility Update
Extend the existing `lib/form-parser.ts` (created for the Appointment form) to support the new `AUTOEMAIL` type.

**New Parser Logic Rule:**
*   **AUTOMATIC EMAIL:** If `possible_answers` starts with "AUTOEMAIL," followed by a comma-separated list of emails -> Render a select dropdown containing those emails. Attach specific logic so that when the form is submitted, a copy of the report is emailed to the selected address.

## Phase 3: Admin UI (Form Setup Page)

**Route:** `/admin/client-report-form-setup`

### 3.1 Global Settings Section
*   Input field for "Client Report Email Subject".

### 3.2 Question List Editor
*   Fetch all rows from `client_report_form_questions`, ordered by `question_number`.
*   Render a repeating block for each question.
*   **Fields per block:**
    *   `Question Text` (Input)
    *   `Possible Answers` (Input)
    *   `Required?` (Select: Required/Optional)
*   **Actions:** "Move Question Up" / "Move Question Down" to swap `question_number`.

### 3.3 "New Question" Form
*   Empty form block at the bottom to add a new question (up to 20).
*   "Save Changes" button.

## Phase 4: Tutor Form Integration

*   When a tutor clicks to "Add Client Report" for a past appointment, the system fetches all active questions from `client_report_form_questions`.
*   The form is rendered dynamically using the parser.
*   Upon submission, answers are saved to `client_report_answers` (as designed in the main client report forms plan).
*   **Auto-Email Trigger:** If an answer is provided for an `AUTOEMAIL` field, immediately dispatch an email to that address using the subject defined in `client_report_form_settings`, replacing `[username]` and `[date]` variables with the actual appointment data.

---

## Appendix A: Massive Dropdown Datasets
*The user provided extensive lists for Courses and Instructors. These will be pasted directly into the `possible_answers` fields in the database via seed scripts or manual entry by the admin.*

### A.1 Course List snippet (Question #3)
`N/A,ACCT_313 (Accounting Information Systems),ACCT_315 (Intermediate Fin Accounting II),ACCT_320 (Cost Management),... [Full list provided in prompt]`

### A.2 Instructor Email List snippet (Question #5)
`AUTOEMAIL,ABDELAL001@gannon.edu,ADAMS051@gannon.edu,ADAMUS002@gannon.edu,... [Full list provided in prompt]`
