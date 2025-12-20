# Troubleshooting Charts & Analytics Page

## If you can't see analytics/ML features:

### 1. Check Browser Console
Open DevTools (F12) → Console tab and look for:
- API errors
- Network errors
- JavaScript errors

### 2. Check Network Tab
Open DevTools (F12) → Network tab:
- Look for `/api/analytics/chart-data` request
- Check if it returns 200 (success) or error
- Check the response data

### 3. Verify Supabase Connection
- Check `.env.local` has correct Supabase credentials
- Verify Supabase tables exist: `appointments`, `tutors`, `users`, `courses`
- Check if there's data in the tables

### 4. Common Issues

#### Issue: "No data available"
**Cause**: No appointments in Supabase
**Fix**: Add test data to Supabase or check date filters

#### Issue: "Failed to fetch chart data"
**Cause**: API route error or Supabase connection issue
**Fix**: 
- Check terminal for API errors
- Verify Supabase credentials
- Check RLS policies allow data access

#### Issue: Charts not rendering
**Cause**: Recharts not installed or data format issue
**Fix**: 
```bash
npm install recharts
```

#### Issue: ML predictions not showing
**Cause**: Prediction API error or no historical data
**Fix**: 
- Check `/api/analytics/predict` endpoint
- Need at least 2 days of historical data for predictions

### 5. Test API Routes Directly

Test in browser:
```
http://localhost:3000/api/analytics/summary
http://localhost:3000/api/analytics/chart-data?dataset=appointments_per_tutor
http://localhost:3000/api/analytics/predict?type=appointments&days=7
```

### 6. Verify Data Structure

Check Supabase tables have these columns:
- `appointments`: appointment_id, tutor_id, course_id, appointment_date, start_time, end_time, status
- `tutors`: tutor_id, user_id, is_available
- `users`: user_id, full_name, email
- `courses`: course_id, course_name, course_code, active

### 7. Check RLS Policies

Supabase RLS (Row Level Security) might be blocking queries:
- Go to Supabase Dashboard → Authentication → Policies
- Ensure policies allow SELECT on tables

## Quick Fixes

1. **Restart dev server**:
   ```bash
   npm run dev
   ```

2. **Clear browser cache**: Ctrl+Shift+R

3. **Check environment variables**:
   ```bash
   # In .env.local
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

4. **Verify packages installed**:
   ```bash
   npm install
   ```

## What Should Be Visible

On `/dashboard/charts` page you should see:

1. **Summary Cards** (top):
   - Total Appointments
   - Total Hours
   - Active Tutors
   - Avg. Duration

2. **Chart Selection** (left):
   - Dropdown to select chart type
   - Statistics summary

3. **Chart Visualization** (right):
   - Bar/Line/Pie chart based on selection
   - Interactive with tooltips

4. **ML Predictive Analytics** (below charts):
   - 7-day appointment forecast
   - Confidence score
   - Trend indicator

5. **ML Features Card**:
   - List of available ML features

6. **Analytics Features** (bottom):
   - Feature descriptions

If any of these are missing, check the console for errors!


