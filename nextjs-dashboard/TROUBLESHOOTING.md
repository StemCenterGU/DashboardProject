# Troubleshooting - Pages Not Opening

## Common Issues

### 1. Pages Show 404 or Blank
- **Check**: Are you clicking links in the navbar?
- **Solution**: All pages have been created now. Try refreshing the page.

### 2. Dashboard Layout Not Loading
- **Check**: Browser console for errors
- **Check**: Network tab to see if requests are failing
- **Solution**: Make sure `.env.local` has correct Supabase credentials

### 3. Authentication Blocking Access
- **Check**: Are you logged in? Check if cookies are set
- **Solution**: Try logging out and logging back in

### 4. Components Not Found
- **Error**: "Cannot find module '@/components/ui/...'"
- **Solution**: Make sure you ran `npx shadcn@latest add [component]` for all components

## Pages Created

All these pages should now work:
- ✅ `/dashboard` - Main dashboard
- ✅ `/dashboard/scheduling` - Scheduling page
- ✅ `/dashboard/charts` - Analytics page
- ✅ `/dashboard/calendar` - Calendar page
- ✅ `/dashboard/profile` - Profile page
- ✅ `/dashboard/settings` - Settings page

## Test Steps

1. **Login** with: `admin@university.edu` / `password`
2. **Click "Dashboard"** in navbar - should show stats cards
3. **Click "Scheduling"** - should show scheduling page
4. **Click "Analytics"** - should show charts page
5. **Click "Calendar"** - should show calendar page

## If Still Not Working

1. **Check browser console** (F12) for errors
2. **Check Network tab** - see which requests are failing
3. **Check server terminal** - look for error messages
4. **Try hard refresh**: Ctrl+Shift+R or Cmd+Shift+R

## Debug Commands

Check if pages exist:
```bash
ls app/(dashboard)/
```

Check if components are installed:
```bash
ls components/ui/
```

