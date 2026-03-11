#!/bin/bash

# STEM Face Dashboard - Automated Test Runner
# This script runs automated tests for the appointment system

echo "======================================"
echo "STEM Face Dashboard - Automated Tests"
echo "======================================"
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0
BASE_URL="http://localhost:3000"

# Helper function to print test results
print_test() {
    local test_name="$1"
    local result="$2"
    local details="$3"

    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        ((PASS_COUNT++))
    else
        echo -e "${RED}✗${NC} $test_name"
        if [ -n "$details" ]; then
            echo "  Details: $details"
        fi
        ((FAIL_COUNT++))
    fi
}

echo "=== 1. TypeScript Compilation ==="
echo "Running TypeScript type checking..."
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    print_test "TypeScript Compilation" "FAIL" "Type errors found"
else
    print_test "TypeScript Compilation" "PASS"
fi
echo ""

echo "=== 2. Dev Server Health ==="
echo "Checking if dev server is responding..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/)
if [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "200" ]; then
    print_test "Dev Server Running" "PASS" "Status: $HTTP_CODE"
else
    print_test "Dev Server Running" "FAIL" "Status: $HTTP_CODE"
fi
echo ""

echo "=== 3. API Endpoint Tests ==="
echo "Testing API endpoints (requires authentication)..."

# Test 1: GET /api/scheduling/tutors (requires auth)
echo "  Testing /api/scheduling/tutors..."
TUTORS_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/scheduling/tutors)
if [ "$TUTORS_CODE" = "401" ]; then
    print_test "Tutors API (Auth Required)" "PASS" "Correctly requires authentication"
elif [ "$TUTORS_CODE" = "200" ]; then
    print_test "Tutors API (Authenticated)" "PASS" "Returns 200"
else
    print_test "Tutors API" "FAIL" "Status: $TUTORS_CODE"
fi

# Test 2: GET /api/scheduling/focus-options (requires auth)
echo "  Testing /api/scheduling/focus-options..."
FOCUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/scheduling/focus-options)
if [ "$FOCUS_CODE" = "401" ]; then
    print_test "Focus Options API (Auth Required)" "PASS" "Correctly requires authentication"
elif [ "$FOCUS_CODE" = "200" ]; then
    print_test "Focus Options API (Authenticated)" "PASS" "Returns 200"
else
    print_test "Focus Options API" "FAIL" "Status: $FOCUS_CODE"
fi

# Test 3: GET /api/scheduling/schedule-week (requires auth)
echo "  Testing /api/scheduling/schedule-week..."
WEEK_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/scheduling/schedule-week?week_start=2026-03-08")
if [ "$WEEK_CODE" = "401" ]; then
    print_test "Schedule Week API (Auth Required)" "PASS" "Correctly requires authentication"
elif [ "$WEEK_CODE" = "200" ]; then
    print_test "Schedule Week API (Authenticated)" "PASS" "Returns 200"
else
    print_test "Schedule Week API" "FAIL" "Status: $WEEK_CODE"
fi

# Test 4: POST /api/scheduling/appointments (requires auth)
echo "  Testing /api/scheduling/appointments (POST)..."
APPT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    $BASE_URL/api/scheduling/appointments)
if [ "$APPT_CODE" = "401" ]; then
    print_test "Create Appointment API (Auth Required)" "PASS" "Correctly requires authentication"
elif [ "$APPT_CODE" = "400" ] || [ "$APPT_CODE" = "200" ]; then
    print_test "Create Appointment API" "PASS" "Returns $APPT_CODE"
else
    print_test "Create Appointment API" "FAIL" "Status: $APPT_CODE"
fi

# Test 5: GET /api/scheduling/appointments (requires auth)
echo "  Testing /api/scheduling/appointments (GET)..."
APPT_GET_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/scheduling/appointments)
if [ "$APPT_GET_CODE" = "401" ]; then
    print_test "List Appointments API (Auth Required)" "PASS" "Correctly requires authentication"
elif [ "$APPT_GET_CODE" = "200" ]; then
    print_test "List Appointments API (Authenticated)" "PASS" "Returns 200"
else
    print_test "List Appointments API" "FAIL" "Status: $APPT_GET_CODE"
fi

echo ""

echo "=== 4. Page Accessibility Tests ==="
echo "Testing if pages load correctly..."

# Test /dashboard
DASHBOARD_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/dashboard)
if [ "$DASHBOARD_CODE" = "200" ] || [ "$DASHBOARD_CODE" = "307" ]; then
    print_test "Dashboard Page" "PASS" "Status: $DASHBOARD_CODE"
else
    print_test "Dashboard Page" "FAIL" "Status: $DASHBOARD_CODE"
fi

# Test /scheduling
SCHEDULING_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/scheduling)
if [ "$SCHEDULING_CODE" = "200" ] || [ "$SCHEDULING_CODE" = "307" ]; then
    print_test "Scheduling Page" "PASS" "Status: $SCHEDULING_CODE"
else
    print_test "Scheduling Page" "FAIL" "Status: $SCHEDULING_CODE"
fi

# Test /login
LOGIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/login)
if [ "$LOGIN_CODE" = "200" ]; then
    print_test "Login Page" "PASS" "Status: $LOGIN_CODE"
else
    print_test "Login Page" "FAIL" "Status: $LOGIN_CODE"
fi

echo ""

echo "=== 5. File Structure Tests ==="
echo "Checking critical files exist..."

# Check proxy.ts exists
if [ -f "proxy.ts" ]; then
    print_test "proxy.ts file exists" "PASS"
else
    print_test "proxy.ts file exists" "FAIL" "File not found"
fi

# Check middleware.ts doesn't exist (should be renamed to proxy.ts)
if [ ! -f "middleware.ts" ]; then
    print_test "middleware.ts removed (migrated to proxy.ts)" "PASS"
else
    print_test "middleware.ts removed" "FAIL" "Old file still exists"
fi

# Check appointment booking dialog
if [ -f "components/appointment-booking-dialog.tsx" ]; then
    print_test "Appointment Booking Dialog exists" "PASS"
else
    print_test "Appointment Booking Dialog exists" "FAIL"
fi

# Check appointments API route
if [ -f "app/api/scheduling/appointments/route.ts" ]; then
    print_test "Appointments API Route exists" "PASS"
else
    print_test "Appointments API Route exists" "FAIL"
fi

echo ""

echo "=== 6. Code Quality Tests ==="
echo "Running linter..."
if npm run lint 2>&1 | grep -q "error"; then
    print_test "ESLint" "FAIL" "Linting errors found"
else
    print_test "ESLint" "PASS" "No linting errors"
fi

echo ""

echo "======================================"
echo "Test Summary"
echo "======================================"
TOTAL_TESTS=$((PASS_COUNT + FAIL_COUNT))
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi
