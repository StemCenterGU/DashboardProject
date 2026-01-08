import { NextRequest, NextResponse } from 'next/server'
import { SchedulingAnalytics } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Parse all filter parameters
    const filters: any = {}
    
    const dateRange = searchParams.get('date_range')
    if (dateRange && dateRange !== 'all') {
      filters.dateRange = dateRange
    }
    
    const customStartDate = searchParams.get('custom_start_date')
    const customEndDate = searchParams.get('custom_end_date')
    if (customStartDate && customEndDate) {
      filters.startDate = customStartDate
      filters.endDate = customEndDate
    }
    
    const tutorIds = searchParams.get('tutor_ids')
    if (tutorIds) {
      filters.tutorIds = tutorIds.split(',')
    }
    
    const courseIds = searchParams.get('course_ids')
    if (courseIds) {
      filters.courseIds = courseIds.split(',')
    }
    
    const status = searchParams.get('status')
    if (status) {
      filters.status = status.split(',')
    }
    
    const isOnline = searchParams.get('is_online')
    if (isOnline !== null) {
      filters.isOnline = isOnline === 'true'
    }
    
    const isWalkIn = searchParams.get('is_walk_in')
    if (isWalkIn !== null) {
      filters.isWalkIn = isWalkIn === 'true'
    }
    
    const startTime = searchParams.get('start_time')
    if (startTime) {
      filters.startTime = startTime
    }
    
    const endTime = searchParams.get('end_time')
    if (endTime) {
      filters.endTime = endTime
    }
    
    const minDuration = searchParams.get('min_duration')
    if (minDuration) {
      filters.minDuration = parseFloat(minDuration)
    }
    
    const maxDuration = searchParams.get('max_duration')
    if (maxDuration) {
      filters.maxDuration = parseFloat(maxDuration)
    }
    
    const dayOfWeek = searchParams.get('day_of_week')
    if (dayOfWeek) {
      filters.dayOfWeek = dayOfWeek.split(',').map(Number)
    }
    
    const courseInstructor = searchParams.get('course_instructor')
    if (courseInstructor) {
      filters.courseInstructor = courseInstructor.split(',')
    }
    
    const isRepeating = searchParams.get('is_repeating')
    if (isRepeating !== null) {
      filters.isRepeating = isRepeating === 'true'
    }
    
    // Get appointments with filters
    const analytics = new SchedulingAnalytics()
    const appointments = await analytics.getAppointments(filters)
    
    // Convert to CSV format
    if (appointments.length === 0) {
      return new NextResponse('No data available for export', {
        status: 404,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="appointments.csv"'
        }
      })
    }
    
    // Get all unique keys from appointments
    const allKeys = new Set<string>()
    appointments.forEach((apt: any) => {
      Object.keys(apt).forEach(key => allKeys.add(key))
    })
    
    const headers = Array.from(allKeys).sort()
    
    // Create CSV content
    const csvRows: string[] = []
    
    // Add headers
    csvRows.push(headers.map(h => `"${h}"`).join(','))
    
    // Add data rows
    appointments.forEach((apt: any) => {
      const row = headers.map(header => {
        const value = apt[header]
        if (value === null || value === undefined) {
          return '""'
        }
        // Escape quotes and wrap in quotes
        const stringValue = String(value).replace(/"/g, '""')
        return `"${stringValue}"`
      })
      csvRows.push(row.join(','))
    })
    
    const csvContent = csvRows.join('\n')
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `appointments_export_${timestamp}.csv`
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error: any) {
    console.error('Error exporting CSV:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export CSV' },
      { status: 500 }
    )
  }
}

