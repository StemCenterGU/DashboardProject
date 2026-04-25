# 🗺️ Navigation Guide - Where to Find Everything

## 📍 Main Navigation Bar

All new features are now accessible from the top navigation bar!

### For All Users:
```
📋 Tutor Dashboard (Logo)
├── Dashboard        → /dashboard
├── Scheduling       → /scheduling
├── Analytics        → /charts
├── Calendar         → /calendar
├── Tutor Schedules  → /tutor-schedules
└── Reports 🆕       → /reports (NEW!)
```

### For Admins & Managers:
```
Additional Menu Items:
├── Schedule Requests → /admin/schedule-requests
├── User Management   → /admin/users
├── Admin Setup 🆕    → Dropdown menu (NEW!)
│   ├── Appointment Forms   → /admin/form-setup
│   ├── Report Options      → /admin/report-options
│   └── Registration Forms  → /admin/registration-setup
└── Users             → /users
```

---

## 🎯 Quick Access Guide

### 1. **Client Reports** 📊
**Location:** Main nav → "Reports"

**What you can do:**
- View all client reports
- Filter by date range
- Create new report
- Edit existing reports
- Link reports to appointments

**URLs:**
- `/reports` - List all reports
- `/reports/new` - Create new report
- `/reports/[id]` - Edit specific report

**Who can access:** All tutors, leads, managers, admins

---

### 2. **Appointment Form Setup** 📝
**Location:** Main nav → "Admin Setup" dropdown → "Appointment Forms"

**What you can do:**
- Create custom booking questions (up to 20)
- Configure 6 different field types:
  - Fill-in text
  - Large textarea
  - Likert scale (1-5 + N/A)
  - Single checkbox
  - Multiple checkboxes
  - Dropdown menu
- Set required/optional fields
- Configure schedule restrictions
- Enable "Send to Staff" email notifications

**URL:** `/admin/form-setup`

**Who can access:** Admins only

---

### 3. **Report Options Manager** 🎛️
**Location:** Main nav → "Admin Setup" dropdown → "Report Options"

**What you can do:**
- Manage 5 categories of checkbox options:
  - Broad Appointment Focus (16 options)
  - Equipment/Resources (13 options)
  - WRC Detailed Focus (37 options)
  - WRC Student Categories (8 options)
  - Missing Information (5 options)
- Add/edit/delete options
- Activate/deactivate options
- Reorder options

**URL:** `/admin/report-options`

**Who can access:** Admins only

---

### 4. **Registration Form Setup** 👤
**Location:** Main nav → "Admin Setup" dropdown → "Registration Forms"

**What you can do:**
- Configure student profile questions
- Set "Display on Appointment" flag (shows data to tutors)
- Use same field types as appointment forms
- Manage one-time signup questions

**URL:** `/admin/registration-setup`

**Who can access:** Admins only

---

## 🔗 Integration Points

### From Appointment Dialog:
When viewing an appointment, you'll see:
- **"Create Report" button** (green) → Creates linked report
- **"Restore Appointment" option** → For no-show appointments

### From Schedule Grid:
- No-show appointments automatically free up their slots
- Schedule changes go through approval workflow

---

## 🎨 Visual Navigation Map

```
┌─────────────────────────────────────────────────────────────┐
│  📋 Tutor Dashboard  |  Dashboard  Scheduling  Analytics    │
│                      |  Calendar  Tutor Schedules  Reports  │
│                      |  Schedule Requests  Admin Setup ▼    │
│                      |                           👤 Profile  │
└─────────────────────────────────────────────────────────────┘
                                                    │
                                    ┌───────────────┴──────────────┐
                                    │   Admin Setup Dropdown       │
                                    ├──────────────────────────────┤
                                    │ ✓ Appointment Forms          │
                                    │ ✓ Report Options             │
                                    │ ✓ Registration Forms         │
                                    └──────────────────────────────┘
```

---

## 🎯 How to Access Each Feature

### Creating a Client Report:
1. Click **"Reports"** in main nav
2. Click **"New Report"** button
3. Fill in the comprehensive form
4. Click **"Submit Report"**

**OR** from an appointment:
1. Open appointment dialog
2. Click **"Create Report"** button (green)
3. Form auto-populates with appointment data

---

### Setting Up Appointment Form Questions:
1. Click **"Admin Setup"** dropdown in nav
2. Select **"Appointment Forms"**
3. Add new questions using the form at bottom
4. Use syntax from instructions banner:
   - Empty = fill-in text
   - `TEXTAREA` = large text area
   - `LIKERT` = 5-point scale
   - `CHECKBOX` = single checkbox
   - `CHECKBOX,Opt1,Opt2` = multiple checkboxes
   - `Opt1,Opt2,Opt3` = dropdown
5. Configure schedule restrictions if needed
6. Click **"Add Question"**

---

### Managing Report Options:
1. Click **"Admin Setup"** dropdown
2. Select **"Report Options"**
3. Choose category tab
4. Edit existing options or add new ones
5. Toggle active/inactive status
6. Changes save automatically

---

### Configuring Registration Forms:
1. Click **"Admin Setup"** dropdown
2. Select **"Registration Forms"**
3. Configure questions for student signup
4. Enable "Display on Appointment" to show data to tutors
5. Students fill this out once during registration

---

## 📱 Mobile Navigation

On smaller screens, the navigation collapses into a hamburger menu:
- All links remain accessible
- Dropdown menus work the same way
- Same permission-based visibility

---

## 🔐 Permission-Based Visibility

| Feature | Tutor | Lead Tutor | Manager | Admin |
|---------|-------|------------|---------|-------|
| Reports (view/create) | ✅ | ✅ | ✅ | ✅ |
| Schedule Requests | ❌ | ❌ | ✅ | ✅ |
| Admin Setup Dropdown | ❌ | ❌ | ❌ | ✅ |
| - Appointment Forms | ❌ | ❌ | ❌ | ✅ |
| - Report Options | ❌ | ❌ | ❌ | ✅ |
| - Registration Forms | ❌ | ❌ | ❌ | ✅ |

---

## 🚀 Quick Tips

1. **Can't find Admin Setup?**
   - Check your role - only admins see this
   - It's in the main navigation bar as a dropdown

2. **Want to test the forms?**
   - Go to `/admin/form-setup`
   - Create a test question
   - View it in the booking flow

3. **Need to edit report options?**
   - Use the tabbed interface at `/admin/report-options`
   - Changes are instant

4. **Looking for created reports?**
   - Click "Reports" in main nav
   - Use date filters to narrow results
   - Click any report to view/edit

---

## 📚 Additional Resources

- **Full Implementation Guide:** `IMPLEMENTATION_COMPLETE.md`
- **Performance Tips:** `PERFORMANCE_GUIDE.md`
- **Database Migrations:** `supabase/migrations/`

---

**🎉 All features are now easily accessible from the navigation bar!**
