import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { SchedulingAnalytics } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }
    const analytics = new SchedulingAnalytics(supabase)

    const searchParams = request.nextUrl.searchParams
    const heatmapType = searchParams.get('type') || 'day_hour'

    const filters: any = {}
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    if (startDate) filters.start_date = startDate
    if (endDate) filters.end_date = endDate

    if (heatmapType === 'day_hour') {
      // Day × Hour heatmap
      const appointments = await analytics.getAppointments(filters)
      
      const heatmapData: { [key: string]: number } = {}
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      
      appointments.forEach((apt: any) => {
        if (apt.appointment_date && apt.start_time) {
          const date = new Date(apt.appointment_date)
          const dayName = days[date.getDay()]
          const hour = parseInt(apt.start_time.split(':')[0])
          
          const key = `${dayName}_${hour}`
          heatmapData[key] = (heatmapData[key] || 0) + 1
        }
      })

      // Format for frontend
      const formattedData = days.map(day => {
        const row: { day: string; [key: number]: number } = { day }
        for (let hour = 0; hour < 24; hour++) {
          row[hour] = heatmapData[`${day}_${hour}`] || 0
        }
        return row
      })

      return NextResponse.json({
        type: 'day_hour',
        data: formattedData,
        max_value: Math.max(...Object.values(heatmapData), 0)
      })
    }

    if (heatmapType === 'tutor_day') {
      // Tutor × Day heatmap
      const appointments = await analytics.getAppointments(filters)
      const { data: tutors } = await supabase.from('tutors').select('tutor_id, tutor_name')
      const tutorMap = new Map(tutors?.map((t: any) => [t.tutor_id, t.tutor_name]) || [])
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const heatmapData: { [key: string]: number } = {}
      
      appointments.forEach((apt: any) => {
        if (apt.appointment_date && apt.tutor_id) {
          const date = new Date(apt.appointment_date)
          const dayName = days[date.getDay()]
          const tutorName = tutorMap.get(apt.tutor_id) || `Tutor ${apt.tutor_id}`
          
          const key = `${tutorName}_${dayName}`
          heatmapData[key] = (heatmapData[key] || 0) + 1
        }
      })

      // Format for frontend
      const tutorNames = Array.from(new Set(Array.from(tutorMap.values())))
      const formattedData = tutorNames.map(tutorName => {
        const row: { tutor: string; [key: string]: number } = { tutor: tutorName }
        days.forEach(day => {
          row[day] = heatmapData[`${tutorName}_${day}`] || 0
        })
        return row
      })

      return NextResponse.json({
        type: 'tutor_day',
        data: formattedData,
        max_value: Math.max(...Object.values(heatmapData), 0)
      })
    }

    if (heatmapType === 'course_timeslot') {
      // Course × Time Slot heatmap
      const appointments = await analytics.getAppointments(filters)
      
      const timeSlots = [
        '8:00-10:00', '10:00-12:00', '12:00-14:00', 
        '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'
      ]
      
      const heatmapData: { [key: string]: number } = {}
      const courseSet = new Set<string>()
      
      appointments.forEach((apt: any) => {
        if (apt.start_time && apt.course_name) {
          const hour = parseInt(apt.start_time.split(':')[0])
          let timeSlot = ''
          
          if (hour >= 8 && hour < 10) timeSlot = '8:00-10:00'
          else if (hour >= 10 && hour < 12) timeSlot = '10:00-12:00'
          else if (hour >= 12 && hour < 14) timeSlot = '12:00-14:00'
          else if (hour >= 14 && hour < 16) timeSlot = '14:00-16:00'
          else if (hour >= 16 && hour < 18) timeSlot = '16:00-18:00'
          else if (hour >= 18 && hour < 20) timeSlot = '18:00-20:00'
          else if (hour >= 20 && hour < 22) timeSlot = '20:00-22:00'
          else timeSlot = 'Other'
          
          const courseName = apt.course_name || 'No course'
          courseSet.add(courseName)
          
          const key = `${courseName}_${timeSlot}`
          heatmapData[key] = (heatmapData[key] || 0) + 1
        }
      })

      // Format for frontend
      const courseNames = Array.from(courseSet).sort()
      const formattedData = courseNames.map(courseName => {
        const row: { course: string; [key: string]: number } = { course: courseName }
        timeSlots.forEach(slot => {
          row[slot] = heatmapData[`${courseName}_${slot}`] || 0
        })
        return row
      })

      return NextResponse.json({
        type: 'course_timeslot',
        data: formattedData,
        max_value: Math.max(...Object.values(heatmapData), 0)
      })
    }

    return NextResponse.json(
      { error: 'Invalid heatmap type' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error generating heatmap:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}

