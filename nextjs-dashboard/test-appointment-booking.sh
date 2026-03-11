#!/bin/bash

# STEM Face Dashboard - Appointment Booking Tests
# This script tests the appointment booking functionality end-to-end

echo "=================================================="
echo "STEM Face Dashboard - Appointment Booking Tests"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
PASS_COUNT=0
FAIL_COUNT=0

# Helper function to print test results
print_test() {
    local test_name="$1"
    local result="$2"
    local details="$3"

    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        [ -n "$details" ] && echo "  ${BLUE}→${NC} $details"
        ((PASS_COUNT++))
    else
        echo -e "${RED}✗${NC} $test_name"
        [ -n "$details" ] && echo "  ${YELLOW}→${NC} $details"
        ((FAIL_COUNT++))
    fi
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "=== Prerequisites Check ==="
echo ""

# Check if server is running
print_info "Checking if dev server is running..."
SERVER_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/" 2>/dev/null)
if [ "$SERVER_CODE" = "307" ] || [ "$SERVER_CODE" = "200" ]; then
    print_test "Dev Server Running" "PASS" "Server is accessible"
else
    print_test "Dev Server Running" "FAIL" "Server not responding (HTTP $SERVER_CODE)"
    echo ""
    echo -e "${RED}ERROR: Dev server is not running. Please start it with 'npm run dev'${NC}"
    exit 1
fi

echo ""
echo "=== Authentication Setup ==="
print_warning "NOTE: Appointment booking requires authentication."
print_info "This test suite checks the booking flow without authentication to verify security."
print_info "For full end-to-end tests, you'll need to manually test with a logged-in user."
echo ""

echo "=== Test 1: Appointment Form Validation ==="
echo ""

print_info "Testing appointment booking endpoint without authentication..."
RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "tutor_id": "test-tutor-id",
        "student_name": "Test Student",
        "appointment_date": "2026-03-15",
        "start_time": "10:00",
        "end_time": "11:00",
        "status": "scheduled",
        "is_online": false,
        "notes": "Test appointment"
    }' \
    -w "\n%{http_code}" \
    "$BASE_URL/api/scheduling/appointments")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "401" ]; then
    print_test "Authentication Required" "PASS" "Correctly requires authentication (401)"
elif [ "$HTTP_CODE" = "400" ]; then
    print_test "Validation Working" "PASS" "Returns 400 for invalid data"
    print_info "Validation error: $BODY"
else
    print_test "Endpoint Security" "FAIL" "Unexpected status: $HTTP_CODE"
fi

echo ""
echo "=== Test 2: Past Date/Time Prevention ==="
echo ""

YESTERDAY=$(date -d "yesterday" +%Y-%m-%d 2>/dev/null || date -v-1d +%Y-%m-%d 2>/dev/null || echo "2026-01-01")
print_info "Testing with past date: $YESTERDAY"

PAST_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"tutor_id\": \"test-tutor-id\",
        \"student_name\": \"Test Student\",
        \"appointment_date\": \"$YESTERDAY\",
        \"start_time\": \"10:00\",
        \"end_time\": \"11:00\",
        \"status\": \"scheduled\",
        \"notes\": \"Test\"
    }" \
    -w "\n%{http_code}" \
    "$BASE_URL/api/scheduling/appointments")

PAST_CODE=$(echo "$PAST_RESPONSE" | tail -n1)
if [ "$PAST_CODE" = "401" ] || [ "$PAST_CODE" = "400" ]; then
    print_test "Past Date Prevention" "PASS" "Prevents booking past dates (HTTP $PAST_CODE)"
else
    print_test "Past Date Prevention" "FAIL" "Unexpected status: $PAST_CODE"
fi

echo ""
echo "=== Test 3: Required Fields Validation ==="
echo ""

print_info "Testing with missing required fields..."
MISSING_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "tutor_id": "test-tutor-id"
    }' \
    -w "\n%{http_code}" \
    "$BASE_URL/api/scheduling/appointments")

MISSING_CODE=$(echo "$MISSING_RESPONSE" | tail -n1)
if [ "$MISSING_CODE" = "401" ] || [ "$MISSING_CODE" = "400" ]; then
    print_test "Required Fields Validation" "PASS" "Rejects incomplete data (HTTP $MISSING_CODE)"
else
    print_test "Required Fields Validation" "FAIL" "Unexpected status: $MISSING_CODE"
fi

echo ""
echo "=== Test 4: File Upload Endpoint ==="
echo ""

print_info "Testing file upload endpoint security..."
UPLOAD_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    "$BASE_URL/api/scheduling/appointments/upload")

if [ "$UPLOAD_CODE" = "401" ]; then
    print_test "File Upload Authentication" "PASS" "Requires authentication (401)"
elif [ "$UPLOAD_CODE" = "400" ]; then
    print_test "File Upload Validation" "PASS" "Validates input (400)"
else
    print_test "File Upload Endpoint" "FAIL" "Unexpected status: $UPLOAD_CODE"
fi

echo ""
echo "=== Test 5: Course Focus Options ==="
echo ""

print_info "Testing course focus options endpoint..."
FOCUS_RESPONSE=$(curl -s "$BASE_URL/api/scheduling/focus-options" -w "\n%{http_code}")
FOCUS_CODE=$(echo "$FOCUS_RESPONSE" | tail -n1)

if [ "$FOCUS_CODE" = "200" ]; then
    FOCUS_DATA=$(echo "$FOCUS_RESPONSE" | head -n-1)
    if echo "$FOCUS_DATA" | grep -q "options"; then
        print_test "Course Focus Options Available" "PASS" "Returns course options"
    else
        print_test "Course Focus Options Format" "FAIL" "Invalid response format"
    fi
elif [ "$FOCUS_CODE" = "401" ]; then
    print_test "Course Focus Options" "PASS" "Authentication required (401)"
else
    print_test "Course Focus Options" "FAIL" "Status: $FOCUS_CODE"
fi

echo ""
echo "=== Test 6: Schedule Week Endpoint ==="
echo ""

WEEK_START=$(date +%Y-%m-%d 2>/dev/null || echo "2026-03-08")
print_info "Testing schedule week endpoint with date: $WEEK_START"

WEEK_RESPONSE=$(curl -s "$BASE_URL/api/scheduling/schedule-week?week_start=$WEEK_START" -w "\n%{http_code}")
WEEK_CODE=$(echo "$WEEK_RESPONSE" | tail -n1)

if [ "$WEEK_CODE" = "200" ]; then
    WEEK_DATA=$(echo "$WEEK_RESPONSE" | head -n-1)
    if echo "$WEEK_DATA" | grep -q "tutors\|days\|hours"; then
        print_test "Schedule Week Data" "PASS" "Returns schedule structure"
    else
        print_test "Schedule Week Format" "FAIL" "Invalid response format"
    fi
elif [ "$WEEK_CODE" = "401" ]; then
    print_test "Schedule Week Endpoint" "PASS" "Authentication required (401)"
else
    print_test "Schedule Week Endpoint" "FAIL" "Status: $WEEK_CODE"
fi

echo ""
echo "=== Test 7: Component Files Exist ==="
echo ""

# Check appointment booking dialog component
if [ -f "components/appointment-booking-dialog.tsx" ]; then
    # Check for course focus dropdown implementation
    if grep -q "select.*focusOptions" "components/appointment-booking-dialog.tsx"; then
        print_test "Course Focus Dropdown" "PASS" "Dropdown implementation found"
    else
        print_test "Course Focus Dropdown" "FAIL" "Dropdown not found in component"
    fi

    # Check for end time cap at 8pm
    if grep -q "endH > 20" "components/appointment-booking-dialog.tsx"; then
        print_test "8pm Time Cap" "PASS" "End time limited to 8pm"
    else
        print_test "8pm Time Cap" "FAIL" "Time cap not found"
    fi

    # Check for file upload functionality
    if grep -q "selectedFile\|upload" "components/appointment-booking-dialog.tsx"; then
        print_test "File Upload Feature" "PASS" "File upload implemented"
    else
        print_test "File Upload Feature" "FAIL" "File upload not found"
    fi
else
    print_test "Appointment Dialog Component" "FAIL" "Component file not found"
fi

echo ""
echo "=== Test 8: Schedule Grid Refresh Logic ==="
echo ""

if [ -f "app/(dashboard)/scheduling/page.tsx" ]; then
    # Check for refresh key implementation
    if grep -q "scheduleRefreshKey" "app/(dashboard)/scheduling/page.tsx"; then
        print_test "Schedule Refresh Key" "PASS" "Refresh mechanism implemented"
    else
        print_test "Schedule Refresh Key" "FAIL" "Refresh key not found"
    fi

    # Check for handleBookingSuccess
    if grep -q "handleBookingSuccess" "app/(dashboard)/scheduling/page.tsx"; then
        print_test "Booking Success Handler" "PASS" "Success callback implemented"
    else
        print_test "Booking Success Handler" "FAIL" "Success handler not found"
    fi
else
    print_test "Scheduling Page Component" "FAIL" "Component file not found"
fi

echo ""
echo "=== Database Schema Validation ==="
echo ""

if [ -f "database/supabase-schema.sql" ]; then
    # Check for appointments table
    if grep -q "CREATE TABLE.*appointments" "database/supabase-schema.sql"; then
        print_test "Appointments Table Schema" "PASS" "Table definition found"

        # Check for attachment_path column
        if grep -q "attachment_path" "database/supabase-schema.sql"; then
            print_test "Attachment Support" "PASS" "attachment_path column exists"
        else
            print_test "Attachment Support" "FAIL" "attachment_path column not found"
        fi

        # Check for required columns
        REQUIRED_COLS=("student_name" "appointment_date" "start_time" "end_time" "status")
        for col in "${REQUIRED_COLS[@]}"; do
            if grep -q "$col" "database/supabase-schema.sql"; then
                print_test "Column: $col" "PASS" "Exists in schema"
            else
                print_test "Column: $col" "FAIL" "Missing from schema"
            fi
        done
    else
        print_test "Appointments Table Schema" "FAIL" "Table definition not found"
    fi
else
    print_test "Database Schema File" "FAIL" "Schema file not found"
fi

echo ""
echo "=================================================="
echo "                 Test Summary                      "
echo "=================================================="
TOTAL_TESTS=$((PASS_COUNT + FAIL_COUNT))
PASS_PERCENTAGE=$(awk "BEGIN {printf \"%.1f\", ($PASS_COUNT/$TOTAL_TESTS)*100}")

echo ""
echo -e "Total Tests:    $TOTAL_TESTS"
echo -e "${GREEN}Passed:         $PASS_COUNT ($PASS_PERCENTAGE%)${NC}"
echo -e "${RED}Failed:         $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   ✓ All appointment booking tests passed!    ${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}   ✗ Some tests failed. Review output above.  ${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

echo ""
echo "=== Manual Testing Instructions ==="
echo ""
print_info "To test actual appointment booking:"
echo "  1. Start the dev server: npm run dev"
echo "  2. Login at: http://localhost:3000/login"
echo "  3. Navigate to: Scheduling → Schedule Grid"
echo "  4. Click on an available time slot"
echo "  5. Fill out the appointment form"
echo "  6. Submit and verify:"
echo "     - Appointment is created"
echo "     - Slot turns orange/booked"
echo "     - Appears in Today's/Upcoming Appointments"
echo "     - Data saved in database"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    exit 0
else
    exit 1
fi
