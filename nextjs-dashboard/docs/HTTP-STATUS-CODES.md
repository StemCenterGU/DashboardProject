# HTTP Status Code Usage Guide

This document defines the correct HTTP status codes to use in API endpoints.

## Authentication & Authorization Codes

### 401 Unauthorized
**When to use:** User is not authenticated (no valid session/token)

**Examples:**
- User not logged in
- Session expired
- Invalid credentials on login
- Missing authentication header/cookie

**Code pattern:**
```typescript
const user = await requireAuth()
if (!user) {
  return NextResponse.json(
    { error: 'Unauthorized - authentication required' },
    { status: 401 }
  )
}
```

### 403 Forbidden
**When to use:** User is authenticated but lacks required permissions

**Examples:**
- Regular user trying to access admin endpoint
- Tutor trying to modify manager-only settings
- User trying to access another user's private data

**Code pattern:**
```typescript
const user = await requireAuth() // User IS authenticated
if (!hasRole(user, ['admin', 'manager'])) {
  return NextResponse.json(
    { error: 'Forbidden - insufficient permissions' },
    { status: 403 }
  )
}
```

## Client Error Codes (4xx)

### 400 Bad Request
**When to use:** Invalid request format or parameters

**Examples:**
- Missing required fields
- Invalid data types
- Validation errors
- Malformed JSON

**Code pattern:**
```typescript
if (!email || !password) {
  return NextResponse.json(
    { error: 'Email and password are required' },
    { status: 400 }
  )
}
```

### 404 Not Found
**When to use:** Requested resource doesn't exist

**Examples:**
- User ID not found
- Appointment doesn't exist
- Invalid route

**Code pattern:**
```typescript
if (!appointment) {
  return NextResponse.json(
    { error: 'Appointment not found' },
    { status: 404 }
  )
}
```

### 409 Conflict
**When to use:** Request conflicts with current state

**Examples:**
- Duplicate email on registration
- Unique constraint violation
- Resource already exists

**Code pattern:**
```typescript
if (error.code === '23505') { // Postgres unique violation
  return NextResponse.json(
    { error: 'A user with this email already exists' },
    { status: 409 }
  )
}
```

### 422 Unprocessable Entity
**When to use:** Request is well-formed but semantically incorrect

**Examples:**
- End date before start date
- Invalid business logic
- Valid format but impossible values

**Code pattern:**
```typescript
if (startDate > endDate) {
  return NextResponse.json(
    { error: 'Start date must be before end date' },
    { status: 422 }
  )
}
```

### 429 Too Many Requests
**When to use:** Rate limit exceeded

**Code pattern:**
```typescript
const rateLimitResult = rateLimit(request, RateLimits.strict)
if (!rateLimitResult.success) {
  return rateLimitResult.response! // Returns 429
}
```

## Server Error Codes (5xx)

### 500 Internal Server Error
**When to use:** Unexpected server error

**Examples:**
- Database connection failure
- Unhandled exception
- Third-party service error

**Code pattern:**
```typescript
try {
  // ... operation
} catch (error) {
  logger.error('Unexpected error:', error)
  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  )
}
```

### 503 Service Unavailable
**When to use:** Service temporarily unavailable

**Examples:**
- Database not configured
- Required service down
- Maintenance mode

**Code pattern:**
```typescript
if (!supabase) {
  return NextResponse.json(
    { error: 'Database not configured' },
    { status: 503 }
  )
}
```

## Success Codes (2xx)

### 200 OK
**When to use:** Request succeeded (default)

**Use for:** GET, PUT, PATCH operations that return data

### 201 Created
**When to use:** Resource created successfully

**Use for:** POST operations that create new resources

**Code pattern:**
```typescript
return NextResponse.json(
  { appointment_id: data.appointment_id, created: true },
  { status: 201 }
)
```

### 204 No Content
**When to use:** Request succeeded but no data to return

**Use for:** DELETE operations

## Common Mistakes to Avoid

### ❌ Don't use 403 for unauthenticated users
```typescript
// WRONG
if (!user) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// CORRECT
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### ❌ Don't use 401 for authorization failures
```typescript
// WRONG
if (!isAdmin(user)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// CORRECT
if (!isAdmin(user)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### ❌ Don't use 500 for expected errors
```typescript
// WRONG
if (!email) {
  return NextResponse.json({ error: 'Error' }, { status: 500 })
}

// CORRECT
if (!email) {
  return NextResponse.json({ error: 'Email is required' }, { status: 400 })
}
```

## Decision Tree

```
Is the request authenticated?
  ├─ No → 401 Unauthorized
  └─ Yes → Does user have required permission?
      ├─ No → 403 Forbidden
      └─ Yes → Is the request valid?
          ├─ No → 400 Bad Request (or 422 for semantic errors)
          └─ Yes → Does the resource exist?
              ├─ No → 404 Not Found
              └─ Yes → Can the operation be performed?
                  ├─ No → 409 Conflict
                  └─ Yes → Success (200, 201, 204)
```

## References

- [MDN HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [RFC 7231](https://tools.ietf.org/html/rfc7231#section-6)
- [REST API Best Practices](https://restfulapi.net/http-status-codes/)
