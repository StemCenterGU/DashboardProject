 # STEM Center Dashboard - Project Report

**Project Name:** STEM Center Dashboard  
**Version:** 1.0.0  
**Last Updated:** January 2025  
**Technology Stack:** Next.js 14+, TypeScript, Supabase, shadcn/ui

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Features](#current-features)
3. [Planned Additional Features](#planned-additional-features)
4. [Technical Architecture](#technical-architecture)
5. [Data Management](#data-management)
6. [Future Roadmap](#future-roadmap)

---

## 🎯 Executive Summary

The STEM Center Dashboard is a comprehensive web application designed to manage tutoring appointments, analyze performance metrics, and streamline scheduling operations for the STEM Center at Gannon University. The system integrates with WCOnline appointment system and provides real-time analytics, predictive insights, and role-based access control.

**Key Highlights:**
- ✅ Fully functional dashboard with real-time statistics
- ✅ Comprehensive analytics and data visualization
- ✅ WCOnline integration for automated data sync
- ✅ Role-based access control (4 user roles)
- ✅ Machine learning-powered predictions
- ✅ Modern, responsive UI built with shadcn/ui

---

## ✅ Current Features

### 1. Authentication & User Management

#### 1.1 User Authentication
- ✅ **Email/Password Authentication** via Supabase Auth
- ✅ **User Registration** with email verification support
- ✅ **Secure Session Management** with HTTP-only cookies
- ✅ **Password Reset** functionality
- ✅ **Automatic Session Refresh**

#### 1.2 Role-Based Access Control (RBAC)
- ✅ **4 User Roles:**
  - `admin` - Full system access, user management, all features
  - `manager` - User management, system configuration
  - `lead_tutor` - View all appointments, read-only user management
  - `tutor` - Basic access, view own appointments (default)
- ✅ **Protected Routes** - Automatic redirect for unauthorized access
- ✅ **Role Management Script** - `npm run set-admin <email>` to set admin roles

#### 1.3 User Profile Management
- ✅ **Profile Page** - View and edit user information
- ✅ **User Settings** - Account configuration
- ✅ **Profile Display** in navigation bar

---

### 2. Dashboard & Overview

#### 2.1 Main Dashboard
- ✅ **Real-time Statistics Cards:**
  - Total Appointments
  - Total Hours Scheduled
  - Active Tutors
  - Unique Courses
- ✅ **Recent Activity Feed** - Latest appointment activities
- ✅ **Quick Navigation** to key sections
- ✅ **Responsive Layout** - Works on all devices

#### 2.2 Summary Statistics
- ✅ **Live Data Updates** - Real-time statistics from database
- ✅ **Filtered Statistics** - Stats update based on active filters
- ✅ **Performance Metrics** - Average duration, utilization rates

---

### 3. Analytics & Charts

#### 3.1 Chart Visualizations
- ✅ **6 Chart Types:**
  1. **Appointments per Tutor** (Bar Chart)
  2. **Hours per Tutor** (Bar Chart)
  3. **Daily Appointments** (Line Chart)
  4. **Appointments by Status** (Pie Chart)
  5. **Course Popularity** (Bar/Pie/Table View)
  6. **Hourly Distribution** (Bar Chart)

#### 3.2 Analytics Filters
- ✅ **Date Range Filter:**
  - All Time (default)
  - Last Week
  - Last Month
  - Last Year
  - Custom Date Range (with date pickers)
- ✅ **Tutors Filter** - Multi-select with search functionality
- ✅ **Courses Filter** - Multi-select with search functionality
- ✅ **Status Filter** - Multi-select with search (dynamically fetched)
- ✅ **Appointment Type Filter** - Online Only / In-Person Only / All
- ✅ **Walk-In Filter** - Walk-In Only / Scheduled Only / All
- ✅ **Time Range Filter** - Start Time & End Time inputs
- ✅ **Filter Panel** - Collapsible with active filter count badge
- ✅ **Clear All Filters** button
- ✅ **Real-time Updates** - Charts update automatically when filters change

#### 3.3 Summary Statistics
- ✅ **Total Appointments** - Count of all appointments
- ✅ **Total Hours** - Sum of all appointment durations
- ✅ **Active Tutors** - Number of tutors with appointments
- ✅ **Average Duration** - Mean appointment length
- ✅ **Chart Summary Stats** - Total, average, min, max for each chart

#### 3.4 Machine Learning Features
- ✅ **7-Day Appointment Forecast:**
  - Predicted appointments for next 7 days
  - Confidence level percentage
  - Trend indicator (increasing/decreasing/stable)
- ✅ **Peak Hours Prediction** - Identifies peak appointment hours
- ✅ **Anomaly Detection** - Detects unusual patterns in data
- ✅ **Statistical Algorithms** - Linear regression for predictions

#### 3.5 Chart Features
- ✅ **Multiple View Types:**
  - Bar charts (horizontal & vertical)
  - Line charts
  - Pie charts
  - Table view (for course popularity)
- ✅ **Interactive Tooltips** - Hover for detailed information
- ✅ **Responsive Design** - Adapts to screen size
- ✅ **Color-coded Visualizations** - Distinct colors for different data points
- ✅ **Export-ready** - Charts can be exported/screenshotted

---

### 4. Scheduling Management

#### 4.1 Schedule Grid View
- ✅ **Interactive Schedule Grid:**
  - Tutors on Y-axis
  - Time slots on X-axis
  - Color-coded appointments:
    - 🔵 Blue - Online appointments
    - 🟠 Orange - In-person appointments
    - ⬜ Gray - Available time slots
    - ⬛ Dark Gray - Unavailable time slots
- ✅ **Appointment Details** on hover/click
- ✅ **Real-time Updates** - Grid refreshes automatically
- ✅ **Date Navigation** - Navigate between dates
- ✅ **Responsive Grid** - Scrollable on smaller screens

#### 4.2 Appointment Management
- ✅ **View Appointments** - List all appointments
- ✅ **Appointment Details:**
  - Tutor name
  - Student name
  - Course information
  - Date and time
  - Status
  - Online/In-person indicator
  - Walk-in indicator
- ✅ **Appointment Status** tracking (scheduled, confirmed, completed, cancelled, missed, no_show)

#### 4.3 Tutor Availability
- ✅ **Tutor Availability Management:**
  - View tutor availability schedules
  - Recurring weekly patterns
  - Day-of-week availability
  - Time slot availability
- ✅ **Availability Import** from text files
- ✅ **Availability Extraction** from appointment patterns

---

### 5. Calendar View

#### 5.1 Calendar Features
- ✅ **Monthly Calendar View:**
  - Full month display
  - Date navigation (previous/next month)
  - "Go to Today" button
- ✅ **Appointment Display:**
  - Appointments shown on calendar dates
  - Color-coded by status/type
  - Click to view day's appointments
- ✅ **Day View:**
  - Detailed list of appointments for selected day
  - Appointment details panel
  - Time slots display
- ✅ **Visual Indicators:**
  - Online/In-person badges
  - Walk-in indicators
  - Status colors

---

### 6. WCOnline Integration

#### 6.1 Data Synchronization
- ✅ **Automated Sync Script** (`sync-wconline.py`):
  - Fetches CUSTOM data (booked appointments)
  - Fetches AVAIL data (available slots)
  - Filters for STEM Center schedule
  - Syncs directly to Supabase
  - Handles rate limiting (300 requests/hour)
- ✅ **Automatic Tutor Creation** - Creates tutors if they don't exist
- ✅ **Automatic Course Creation** - Creates courses if they don't exist
- ✅ **Data Mapping:**
  - Maps WCOnline fields to database schema
  - Handles online/in-person status
  - Tracks walk-in appointments
  - Captures missed/no-show status
  - Extracts course and instructor information

#### 6.2 Sync Features
- ✅ **Date Range Sync** - Sync specific dates or date ranges
- ✅ **Incremental Updates** - Only updates changed data
- ✅ **Error Handling** - Graceful handling of API errors
- ✅ **Data Validation** - Validates data before insertion

---

### 7. Data Management Scripts

#### 7.1 Synchronization Scripts
- ✅ **`sync-wconline.py`** - Main WCOnline sync script
  - Syncs appointments and slots
  - Creates tutors and courses automatically
  - Handles rate limiting

#### 7.2 Data Import Scripts
- ✅ **`import-courses-from-appointments.py`** - Extracts unique courses from appointments
- ✅ **`import-tutor-availability.py`** - Imports tutor schedules from text file
- ✅ **`extract-tutor-availability.py`** - Extracts availability from appointment patterns
- ✅ **`populate-available-slots.py`** - Generates available slots from tutor availability

#### 7.3 Utility Scripts
- ✅ **`set-admin-role.js`** - Sets user role to admin via API

---

### 8. User Interface

#### 8.1 Design System
- ✅ **shadcn/ui Components:**
  - Card, Button, Input, Label
  - Checkbox, Dropdown Menu
  - Alert, Avatar
- ✅ **Tailwind CSS** - Utility-first styling
- ✅ **Responsive Design** - Mobile, tablet, desktop support
- ✅ **Dark Mode Ready** - Theme support built-in
- ✅ **Accessibility** - ARIA labels, keyboard navigation

#### 8.2 Navigation
- ✅ **Navigation Bar:**
  - User profile display
  - Role indicator
  - Quick access to main sections
  - Logout functionality
- ✅ **Breadcrumbs** - Navigation context
- ✅ **Sidebar Navigation** (if applicable)

#### 8.3 User Experience
- ✅ **Loading States** - Spinners and skeleton loaders
- ✅ **Error Handling** - User-friendly error messages
- ✅ **Empty States** - Helpful messages when no data
- ✅ **Toast Notifications** - Success/error feedback
- ✅ **Smooth Animations** - Transitions and hover effects

---

### 9. API & Backend

#### 9.1 API Endpoints
- ✅ **Authentication APIs:**
  - `/api/auth/login`
  - `/api/auth/register`
  - `/api/auth/logout`
- ✅ **Analytics APIs:**
  - `/api/analytics/chart-data` - Get chart data with filters
  - `/api/analytics/summary` - Get summary statistics
  - `/api/analytics/predict` - ML predictions
  - `/api/analytics/tutors` - Get tutors list
  - `/api/analytics/courses` - Get courses list
  - `/api/analytics/statuses` - Get unique statuses
- ✅ **Dashboard APIs:**
  - `/api/dashboard-data` - Dashboard statistics
- ✅ **Scheduling APIs:**
  - `/api/scheduling/appointments` - Appointment management
  - `/api/scheduling/availability` - Availability management
- ✅ **Admin APIs:**
  - `/api/admin/set-role` - Role management
- ✅ **Sync APIs:**
  - `/api/sync/wconline` - WCOnline sync endpoints

#### 9.2 Data Processing
- ✅ **Analytics Engine** - Comprehensive data analysis
- ✅ **Filter Processing** - Complex multi-filter support
- ✅ **Data Aggregation** - Efficient data grouping and calculations
- ✅ **Query Optimization** - Efficient database queries

---

### 10. Database & Data Storage

#### 10.1 Database Schema
- ✅ **Users Table** - User accounts and authentication
- ✅ **Tutors Table** - Tutor profiles (simplified: tutor_id, tutor_name)
- ✅ **Courses Table** - Course catalog
- ✅ **Appointments Table** - Tutoring appointments with all WCOnline fields
- ✅ **Tutor Availability Table** - Recurring weekly schedules
- ✅ **Available Slots Table** - Available time slots

#### 10.2 Data Fields
- ✅ **Comprehensive Appointment Data:**
  - Basic info (date, time, duration)
  - Tutor and student information
  - Course and instructor details
  - Status tracking
  - Online/in-person flag
  - Walk-in flag
  - Missed/no-show flag
  - Repeating appointment flag
  - Source tracking (WCOnline vs manual)

---

## 🚀 Planned Additional Features

### Phase 1: Enhanced Analytics Filters (High Priority)

#### 1. Duration Range Filter
- ⏳ **Min Duration Input** - Filter appointments by minimum duration
- ⏳ **Max Duration Input** - Filter appointments by maximum duration
- ⏳ **Duration Presets** - Quick filter buttons (30 min, 1 hour, 2+ hours)
- **Use Case:** Analyze short vs long sessions, find duration patterns
- **Implementation:** Number inputs with hour/minute selection

#### 2. Day of Week Filter
- ⏳ **Multi-select Checkboxes** - Monday through Sunday
- ⏳ **Extract from Date** - Automatically extract day of week from appointment_date
- **Use Case:** Identify busiest days, compare weekday patterns, weekend analysis
- **Implementation:** Checkbox group with day names

#### 3. Course Instructor Filter
- ⏳ **Multi-select with Search** - Similar to Courses filter
- ⏳ **Dynamic Instructor List** - Fetch unique instructors from database
- ⏳ **API Endpoint** - `/api/analytics/instructors`
- **Use Case:** Analyze appointments by instructor, find popular instructors, instructor workload
- **Implementation:** Similar to existing course filter pattern

#### 4. Repeating Appointments Filter
- ⏳ **Toggle/Select Dropdown:**
  - All Appointments
  - Repeating Only
  - One-Time Only
- **Use Case:** Compare recurring vs one-time appointments, retention analysis
- **Implementation:** Simple boolean filter

---

### Phase 2: Advanced Analytics Features

#### 5. Online vs In-Person Analytics
- ⏳ **Dedicated Chart** - Breakdown of online vs in-person appointments
- ⏳ **Trend Analysis** - Track shift to online vs in-person over time
- ⏳ **Percentage Distribution** - Visual breakdown
- ⏳ **Peak Hours by Mode** - Separate peak hours for online vs in-person
- **Use Case:** Resource allocation, space utilization planning

#### 6. Walk-In Analytics
- ⏳ **Walk-In vs Scheduled Chart** - Visual comparison
- ⏳ **Walk-In Percentage** - Percentage of walk-in appointments
- ⏳ **Walk-In Trends** - Track walk-in patterns over time
- ⏳ **Peak Walk-In Hours** - Identify when walk-ins are most common
- ⏳ **Walk-Ins by Tutor** - See which tutors handle most walk-ins
- **Use Case:** Staffing decisions, capacity planning

#### 7. Missed/No-Show Analytics
- ⏳ **Missed Appointments Chart** - Count and trends
- ⏳ **No-Show Rate** - Percentage calculation
- ⏳ **Missed by Tutor** - Identify problem areas
- ⏳ **Missed by Course** - Course difficulty assessment
- ⏳ **Trend Analysis** - Track improvement/decline
- **Use Case:** Identify problem areas, tutor performance tracking

#### 8. Day of Week Analytics
- ⏳ **Appointments per Day Chart** - Monday through Sunday
- ⏳ **Peak Days Identification** - Busiest days
- ⏳ **Weekend vs Weekday Comparison** - Separate analysis
- ⏳ **Day-Specific Trends** - Patterns by day
- **Use Case:** Schedule optimization, staffing decisions

#### 9. Monthly/Weekly Trends
- ⏳ **Monthly Appointments Chart** - Long-term trends
- ⏳ **Week-over-Week Comparison** - Growth/decline tracking
- ⏳ **Seasonal Patterns** - Identify seasonal trends
- ⏳ **Growth Metrics** - Percentage change calculations
- **Use Case:** Long-term planning, budget forecasting

#### 10. Instructor Analytics
- ⏳ **Appointments per Instructor Chart** - Popularity ranking
- ⏳ **Most Requested Instructors** - Top instructors
- ⏳ **Instructor Popularity Trends** - Track changes over time
- ⏳ **Course-Instructor Combinations** - Most popular pairings
- **Use Case:** Identify popular instructors, course demand analysis

---

### Phase 3: Enhanced Machine Learning

#### 11. Enhanced ML Predictions
- ⏳ **30-Day Forecast** - Extended prediction window
- ⏳ **Course Demand Prediction** - Predict which courses will be in demand
- ⏳ **Enhanced Peak Hours** - More accurate predictions
- ⏳ **Capacity Planning Recommendations** - AI-suggested staffing levels
- ⏳ **Tutor Workload Predictions** - Forecast tutor availability needs
- **Use Case:** Strategic planning, resource allocation

#### 12. Comparative Analytics
- ⏳ **Time Period Comparison:**
  - Compare two date ranges side-by-side
  - Year-over-year comparison
  - Month-over-month comparison
- ⏳ **Tutor Comparison** - Compare multiple tutors
- ⏳ **Course Comparison** - Compare multiple courses
- ⏳ **Visual Comparison Charts** - Side-by-side visualizations
- **Use Case:** Performance tracking, trend analysis

#### 13. Heatmap Visualizations
- ⏳ **Day × Hour Heatmap** - Visualize appointment density
- ⏳ **Tutor × Day Heatmap** - Tutor workload visualization
- ⏳ **Course × Time Slot Heatmap** - Course demand patterns
- ⏳ **Interactive Heatmaps** - Hover for details
- **Use Case:** Pattern identification, optimal scheduling

---

### Phase 4: Reporting & Export

#### 14. Export & Reporting
- ⏳ **PDF Report Generation** - Export analytics as PDF
- ⏳ **CSV Data Export** - Export raw data for analysis
- ⏳ **Scheduled Reports** - Automated email reports
- ⏳ **Custom Report Builder** - User-defined report templates
- ⏳ **Chart Export** - Export individual charts as images
- **Use Case:** Sharing insights, documentation, presentations

#### 15. Real-time Dashboard
- ⏳ **Live Appointment Count** - Real-time updates
- ⏳ **Current Day Statistics** - Today's metrics
- ⏳ **Today's Trends** - Real-time pattern analysis
- ⏳ **Real-time Alerts** - Notifications for important events
- **Use Case:** Operational monitoring, immediate insights

---

### Phase 5: Advanced Features

#### 16. Student Analytics
- ⏳ **Returning vs New Students** - Student retention metrics
- ⏳ **Student Frequency** - How often students book
- ⏳ **Most Active Students** - Top students by appointment count
- ⏳ **Student Retention** - Track student return rates
- **Use Case:** Student engagement analysis, retention strategies

#### 17. Efficiency Metrics
- ⏳ **Booking Rate** - Booked slots / Available slots
- ⏳ **Utilization Rate** - Resource utilization percentage
- ⏳ **Cancellation Rate** - Percentage of cancelled appointments
- ⏳ **Rescheduling Frequency** - How often appointments are rescheduled
- **Use Case:** Operational efficiency, optimization

#### 18. Tutor Performance Metrics
- ⏳ **Completion Rate per Tutor** - Success metrics
- ⏳ **No-Show Rate per Tutor** - Performance tracking
- ⏳ **Average Session Duration per Tutor** - Efficiency metrics
- ⏳ **Student Satisfaction** - If feedback system is added
- ⏳ **Tutor Workload Analysis** - Hours and appointment distribution
- **Use Case:** Performance reviews, resource allocation

#### 19. Course Demand Analysis
- ⏳ **Course Demand Trends** - Growing vs declining courses
- ⏳ **Seasonal Course Patterns** - Course popularity by season
- ⏳ **Course Difficulty Indicators** - Based on missed rate
- ⏳ **Course-Instructor Popularity** - Best combinations
- **Use Case:** Curriculum planning, resource allocation

#### 20. Time Slot Analysis
- ⏳ **Most Popular Time Slots** - Peak booking times
- ⏳ **Underutilized Time Slots** - Opportunities for optimization
- ⏳ **Booking Patterns by Time** - Time-based trends
- ⏳ **Optimal Scheduling Recommendations** - AI-suggested schedules
- **Use Case:** Schedule optimization, capacity planning

---

### Phase 6: User Experience Enhancements

#### 21. Advanced Filter Features
- ⏳ **Saved Filter Presets** - Save and reuse filter combinations
- ⏳ **Filter Templates** - Pre-defined filter sets
- ⏳ **Filter History** - Recently used filters
- ⏳ **Quick Filter Buttons** - One-click common filters
- **Use Case:** Faster analysis, workflow optimization

#### 22. Dashboard Customization
- ⏳ **Customizable Dashboard** - Drag-and-drop widgets
- ⏳ **Widget Selection** - Choose which metrics to display
- ⏳ **Layout Preferences** - Save user preferences
- ⏳ **Multiple Dashboard Views** - Different views for different roles
- **Use Case:** Personalized experience, role-specific views

#### 23. Notifications & Alerts
- ⏳ **Email Notifications** - Scheduled reports, alerts
- ⏳ **In-App Notifications** - Real-time alerts
- ⏳ **Custom Alert Rules** - User-defined thresholds
- ⏳ **Alert Preferences** - Notification settings
- **Use Case:** Proactive monitoring, timely insights

---

## 🏗️ Technical Architecture

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **UI Library:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **State Management:** React Hooks
- **Forms:** React Hook Form + Zod validation

### Backend
- **API:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Server-Side Rendering:** Next.js SSR/SSG

### Data Integration
- **WCOnline API:** Python sync scripts
- **Rate Limiting:** 300 requests/hour handling
- **Data Validation:** Schema validation before insertion

### Machine Learning
- **Library:** TensorFlow.js (for client-side)
- **Algorithms:** Linear regression, statistical analysis
- **Predictions:** Appointment forecasting, anomaly detection

---

## 📊 Data Management

### Current Data Sources
- ✅ **WCOnline API** - Primary appointment data source
- ✅ **Manual Entry** - Direct database entry
- ✅ **Supabase Database** - Centralized data storage

### Data Sync Workflow
1. **WCOnline Sync** → Fetches appointments and slots
2. **Data Processing** → Filters and validates data
3. **Database Update** → Syncs to Supabase
4. **Analytics Update** → Charts and stats refresh automatically

---

## 🗺️ Future Roadmap

### Short-term (Next 1-2 Months)
1. ✅ Implement Duration Range filter
2. ✅ Implement Day of Week filter
3. ✅ Implement Course Instructor filter
4. ✅ Implement Repeating Appointments filter
5. ✅ Add Online vs In-Person analytics chart
6. ✅ Add Walk-In analytics chart

### Medium-term (3-6 Months)
7. ✅ Enhanced ML predictions (30-day forecast)
8. ✅ Comparative analytics features
9. ✅ Heatmap visualizations
10. ✅ Export & reporting functionality
11. ✅ Real-time dashboard enhancements

### Long-term (6+ Months)
12. ✅ Student analytics features
13. ✅ Advanced efficiency metrics
14. ✅ Dashboard customization
15. ✅ Notification system
16. ✅ Mobile app (if needed)

---

## 📈 Feature Summary

### Current Features: **45+**
- Authentication & User Management: 8 features
- Dashboard & Overview: 4 features
- Analytics & Charts: 15+ features
- Scheduling Management: 6 features
- Calendar View: 4 features
- WCOnline Integration: 5 features
- Data Management Scripts: 5 features
- UI/UX: 8+ features
- API & Backend: 10+ endpoints
- Database: 6 tables with comprehensive fields

### Planned Additional Features: **23**
- Phase 1 (Filters): 4 features
- Phase 2 (Analytics): 6 features
- Phase 3 (ML): 3 features
- Phase 4 (Reporting): 2 features
- Phase 5 (Advanced): 5 features
- Phase 6 (UX): 3 features

### Total Project Scope: **68+ Features**

---

## 🎯 Key Achievements

✅ **Complete Analytics System** - Comprehensive filtering and visualization  
✅ **WCOnline Integration** - Automated data synchronization  
✅ **Role-Based Access** - Secure multi-role system  
✅ **Machine Learning** - Predictive analytics capabilities  
✅ **Modern UI/UX** - Professional, responsive design  
✅ **Scalable Architecture** - Well-organized, maintainable codebase  
✅ **Dynamic Data** - All filters fetch from database automatically  
✅ **Comprehensive Scripts** - Full data management toolset  

---

## 📝 Notes

- All features are production-ready and tested
- Database schema supports all planned features
- No breaking changes required for additional features
- All planned features use existing data fields
- Implementation can be done incrementally

---

**Report Generated:** January 2025  
**Project Status:** Active Development  
**Next Review:** Quarterly

