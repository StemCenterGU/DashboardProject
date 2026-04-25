# Client Report Forms Implementation Plan

## Overview
Implement a comprehensive client report system integrated with the appointments workflow, allowing tutors to create detailed session reports with auto-population from appointments, multiple checkbox sections, rich text notes, file attachments, and email notifications.

## Phase 1: Database Schema & Migrations (Foundation)

**1.1 Create client_reports table**
- Primary table storing all report data
- Links to appointments, tutors, courses
- JSONB fields for checkbox arrays (broad_focus, resources, wrc_detailed, wrc_categories)
- Separate shared_notes (email-visible) and confidential_notes (staff-only)
- Email recipients tracking, attachment paths
- Audit fields (created_by, updated_by, timestamps)

**1.2 Create report_focus_options table**
- Database-driven checkbox options
- Categories: 'broad_focus', 'resources', 'wrc_detailed', 'wrc_categories', 'departments'
- Fields: category, label, description, order_index, active flag
- Enables admin management without code changes

**1.3 Seed initial focus options**
- Migrate 16 broad appointment focus options from screenshots
- Add resources/equipment list (Sanner Studio, tablets, calculators, etc.)
- Add WRC detailed focus options (thesis, transitions, citations, etc.)
- Add WRC student categories (Global Student, ESL, Freshmen, etc.)
- Add department list

## Phase 2: Backend API Routes

**2.1 Report CRUD APIs**
- POST /api/reports - Create new report (requires appointmentId in body)
- GET /api/reports/:reportId - Get single report details
- PUT /api/reports/:reportId - Update existing report
- DELETE /api/reports/:reportId - Delete report (admin only)
- GET /api/reports - List reports with filters (date range, tutor, student name, pagination)

**2.2 Focus Options API**
- GET /api/reports/focus-options - Get all checkbox options grouped by category
- POST /api/admin/reports/focus-options - Create new option (admin only)
- PUT /api/admin/reports/focus-options/:optionId - Update option
- DELETE /api/admin/reports/focus-options/:optionId - Delete/deactivate option
- PUT /api/admin/reports/focus-options/reorder - Reorder options within category

**2.3 Report Email API**
- POST /api/reports/:reportId/send-email - Send report to selected recipients (client/staff/resource)
- Integrate with existing email notification system
- Template includes: shared notes, appointment details, non-confidential attachments

**2.4 Report Attachments**
- Reuse existing file upload pattern from appointments
- Create separate Supabase storage bucket: report-attachments
- Support multiple files per report with visibility flag (public vs confidential)

## Phase 3: Frontend Components

**3.1 Core Form Components**
1. ReportForm.tsx - Main container with form state management, validation
2. ClientDetailsSection.tsx - Read-only display (auto-populated from appointment)
3. StaffResourceSelect.tsx - Dropdown for staff/resource (editable, pre-filled)
4. AppointmentLengthInput.tsx - Actual length in minutes (editable, defaults to scheduled duration)
5. MissingInfoCheckboxGroup.tsx - 5 predefined checkboxes for incomplete data
6. CourseInformationSection.tsx - Department, Course, Instructor dropdowns (editable, pre-filled)
7. EmailAutomationSection.tsx - Toggle + advisor email lookup field

**3.2 Reusable Checkbox Components**
8. CheckboxSection.tsx - Generic multi-select checkbox group
  - Fetches options from API by category
  - "Select All" / "Clear All" buttons
  - Returns array of selected option IDs
  - Used for: Broad Focus (16), Resources (13), WRC Detailed (14), WRC Categories (6)

**3.3 Rich Text & Notes**
9. RichTextEditor.tsx - Install and configure Tiptap
  - Features: bold, italic, underline, lists, links, headings
  - Used for both shared and confidential notes
  - Save as HTML in database

**3.4 Additional Sections**
10. Gannon101CreditSelect.tsx - Single dropdown (Yes/No/N/A)
11. EmailOptionsCheckboxes.tsx - Client, Staff, Resource checkboxes
12. FileAttachmentSection.tsx - Multiple file upload with visibility toggle per file
13. ReportActionButtons.tsx - Save Report, Return to Overview, Close

**3.5 View/List Components**
14. ReportsList.tsx - Paginated list with filters (date range, tutor, student name)
15. ReportCard.tsx - Individual report display card
16. ReportDetailView.tsx - Full report view/edit page
17. ReportFilters.tsx - Date range picker, tutor dropdown, student name search

## Phase 4: Integration with Appointments

**4.1 Appointment Dropdown Integration**
- Add "Create Client Report" option to existing appointment action dropdown
- Button appears for appointments with status: completed, missed, or no_show
- Clicking navigates to /scheduling/reports/new?appointmentId={id}

**4.2 Auto-population Logic**
- When appointmentId query param present, fetch appointment details
- Pre-fill: client_name, report_date (appointment date/time), location (STEM Center or online)
- Pre-fill: staff_resource_id (from tutor_id), course info, actual_appointment_length (from duration)
- All pre-filled fields remain editable (user can correct if needed)

**4.3 Report Status Indicator**
- Add "Has Report" badge/icon to appointments that have associated reports
- Link from appointment to view existing report(s)

## Phase 5: Admin Management Features

**5.1 Focus Options Management Page**
- Route: /admin/reports/focus-options
- CRUD interface for checkbox options
- Group by category with tabs
- Drag-and-drop reordering
- Active/inactive toggle (don't delete, just deactivate)

**5.2 Reports Management Dashboard**
- Route: /admin/reports
- View all reports across all tutors
- Advanced filtering (date, tutor, course, focus areas)
- Export to CSV
- Bulk actions (delete, archive)

## Phase 6: Permissions & Security

**6.1 Permission Rules**
- CREATE_REPORT: tutor level and above
- VIEW_OWN_REPORTS: tutors see only their own reports
- VIEW_ALL_REPORTS: manager level and above see all reports
- EDIT_REPORT: creator can edit within 24 hours, managers can edit anytime
- DELETE_REPORT: admin/developer only
- MANAGE_FOCUS_OPTIONS: admin/developer only

**6.2 Data Access Control**
- Confidential notes visible only to staff (tutor level and above)
- Shared notes visible to clients when email is sent
- Confidential attachments not included in client emails
- RLS policies on Supabase for report_attachments bucket

## Phase 7: Validation & Error Handling

**7.1 Zod Validation Schemas**
- createReportSchema - All required fields, JSONB array validation
- updateReportSchema - Partial updates
- focusOptionSchema - Admin option management
- reportQuerySchema - Filter/pagination params

**7.2 Frontend Validation**
- Required fields: client_name, staff_resource, appointment_length
- At least one checkbox must be selected in broad_focus
- Email validation for advisor_email if provided
- File size limits (5 MB per file, 25 MB total)

**7.3 Error Messages**
- Clear user-facing error messages
- Toast notifications for success/failure
- Form-level and field-level error display
- Network error handling with retry option

## Phase 8: Email Integration

**8.1 Email Template**
- Subject: "Appointment Report - {Client Name} - {Date}"
- Body includes: Shared notes (rich text), appointment details, tutor name
- Attachments: Only non-confidential files
- Recipients: Dynamically selected (client/staff/resource)

**8.2 Email Service Setup**
- Choose: Resend (recommended) or SendGrid
- Add API key to environment variables
- Create HTML email template
- Implement in existing /api/notifications/send-email route

## Implementation Order

**Sprint 1 (Foundation) - 2-3 days**
1. Create database migrations (client_reports, report_focus_options)
2. Seed initial focus options data
3. Create TypeScript types and validation schemas
4. Build core API routes (CRUD, focus-options)

**Sprint 2 (Form Components) - 3-4 days**
5. Install and configure Tiptap rich text editor
6. Build form sections (1-7 from Phase 3.1)
7. Build reusable CheckboxSection component
8. Build RichTextEditor, EmailOptions, FileAttachment components

**Sprint 3 (Integration) - 2-3 days**
9. Integrate "Create Report" button in appointment dropdown
10. Implement auto-population logic
11. Build ReportDetailView for viewing/editing
12. Add "Has Report" indicator to appointments

**Sprint 4 (View & Filter) - 2 days**
13. Build ReportsList with filters (date, tutor, student)
14. Implement pagination and search
15. Create ReportCard component

**Sprint 5 (Admin Features) - 2 days**
16. Build Focus Options Management page
17. Build Reports Dashboard for admins
18. Implement reordering and CRUD for options

**Sprint 6 (Permissions & Email) - 1-2 days**
19. Add permission checks to all routes
20. Implement email integration
21. Test email sending with all recipient combinations

**Sprint 7 (Testing & Polish) - 1-2 days**
22. End-to-end testing of complete workflow
23. Error handling and validation refinement
24. UI polish and responsive design
25. Documentation

## File Structure

```
plans/
  client-report-forms-plan.md                    # This plan document

app/
  (dashboard)/
    scheduling/
      reports/
        page.tsx                                 # List view with filters
        new/
          page.tsx                               # Create new report form
        [reportId]/
          page.tsx                               # View/edit report details
    admin/
      reports/
        page.tsx                                 # Admin reports dashboard
        focus-options/
          page.tsx                               # Manage checkbox options

  api/
    reports/
      route.ts                                   # GET list, POST create
      [reportId]/
        route.ts                                 # GET, PUT, DELETE
      focus-options/
        route.ts                                 # GET options
      send-email/
        route.ts                                 # POST send email
    admin/
      reports/
        focus-options/
          route.ts                               # Admin CRUD for options
          [optionId]/
            route.ts                             # Update/delete specific option

components/
  reports/
    ReportForm.tsx                               # Main form container
    ClientDetailsSection.tsx
    StaffResourceSelect.tsx
    AppointmentLengthInput.tsx
    MissingInfoCheckboxGroup.tsx
    CourseInformationSection.tsx
    EmailAutomationSection.tsx
    CheckboxSection.tsx                          # Reusable multi-select
    RichTextEditor.tsx                           # Tiptap integration
    Gannon101CreditSelect.tsx
    EmailOptionsCheckboxes.tsx
    FileAttachmentSection.tsx
    ReportActionButtons.tsx
    ReportsList.tsx                              # List view
    ReportCard.tsx                               # Card display
    ReportDetailView.tsx                         # Full detail view
    ReportFilters.tsx                            # Filter controls
    FocusOptionsManager.tsx                      # Admin options CRUD
    index.ts

supabase/
  migrations/
    20260420000000_create_client_reports.sql
    20260420000001_create_report_focus_options.sql
    20260420000002_seed_report_focus_options.sql

lib/
  validation.ts                                  # Add report schemas

types/
  index.ts                                       # Add ClientReport types
```

## Dependencies to Install

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link
npm install date-fns react-day-picker  # For date range picker if not already installed
```

## Success Criteria

1. ✅ Tutors can create reports from completed appointments with one click
2. ✅ All form fields from screenshots are present and functional
3. ✅ Checkbox options are database-driven and admin-manageable
4. ✅ Reports auto-populate from appointments but remain editable
5. ✅ Rich text editor works for shared and confidential notes
6. ✅ Multiple file attachments with visibility control
7. ✅ Email notifications sent to selected recipients with correct content
8. ✅ Reports list page with working filters (date, tutor, student)
9. ✅ Proper permissions: tutors see own, admins see all
10. ✅ Confidential notes/attachments not exposed to clients

## Estimated Total Time

12-15 days of focused development work across 7 sprints
