# Debug Login Issues

## Test Credentials

From your CSV data:
- **Email**: `admin@university.edu`
- **Password**: `password`

The password hash in your database is SHA256.

## Common Issues

### 1. "Invalid email or password"
- Check browser console for errors
- Check Network tab to see API response
- Verify `.env.local` has correct Supabase credentials

### 2. Password hash mismatch
- Your passwords are stored as SHA256 hashes
- The API route tries SHA256 first, then MD5 if hash is 32 chars
- Make sure password is exactly "password" (lowercase)

### 3. Environment variables not loaded
- Make sure `.env.local` exists in `nextjs-dashboard` folder
- Variable names must start with `NEXT_PUBLIC_`
- Restart dev server after adding env vars

## Debug Steps

1. **Check browser console** - Look for errors
2. **Check Network tab** - See if `/api/auth/login` is called and what it returns
3. **Check server logs** - Look at terminal where `npm run dev` is running
4. **Test API directly** - Use Postman or curl to test the login endpoint

## Test API Endpoint

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@university.edu","password":"password"}'
```

## Expected Response

Success:
```json
{
  "success": true,
  "user": { ... },
  "sessionToken": "..."
}
```

Error:
```json
{
  "error": "Invalid email or password"
}
```

