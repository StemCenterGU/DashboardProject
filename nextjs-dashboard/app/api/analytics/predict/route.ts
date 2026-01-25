import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { SchedulingAnalytics } from '@/lib/analytics'
import { 
  predictAppointments, 
  predictPeakHours, 
  detectAnomalies,
  predictCourseDemand,
  predictPeakHoursEnhanced,
  generateCapacityRecommendations,
  predictTutorWorkload,
  predictExtendedForecast
} from '@/lib/ml/predictions'

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
    const predictionType = searchParams.get('type') || 'appointments'
    const daysAhead = parseInt(searchParams.get('days') || '7')

    // Get historical data - use provided date filters or default to last 30 days
    const filters: any = {}
    const startDateParam = searchParams.get('start_date')
    const endDateParam = searchParams.get('end_date')
    
    if (startDateParam && endDateParam) {
      filters.start_date = startDateParam
      filters.end_date = endDateParam
    } else {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30) // Last 30 days
      filters.start_date = startDate.toISOString().split('T')[0]
      filters.end_date = endDate.toISOString().split('T')[0]
    }

    if (predictionType === 'appointments') {
      // Get daily appointments for last 30 days
      const dailyData = await analytics.getDailyAppointments(filters)
      const historicalData = dailyData.labels.map((_, i) => dailyData.datasets[0]?.data[i] || 0)
      
      const prediction = predictAppointments(historicalData, daysAhead)
      
      return NextResponse.json({
        type: 'appointments',
        prediction,
        historical_data: historicalData,
        days_ahead: daysAhead
      })
    }

    if (predictionType === 'peak_hours') {
      // Get hourly distribution
      const hourlyData = await analytics.getHourlyDistribution(filters)
      const hourlyCounts = hourlyData.labels.map((_, i) => hourlyData.datasets[0]?.data[i] || 0)
      
      const peakHours = predictPeakHours(hourlyCounts)
      
      return NextResponse.json({
        type: 'peak_hours',
        peak_hours: peakHours,
        hourly_data: hourlyCounts
      })
    }

    if (predictionType === 'anomalies') {
      // Get daily appointments
      const dailyData = await analytics.getDailyAppointments(filters)
      const dailyCounts = dailyData.labels.map((_, i) => dailyData.datasets[0]?.data[i] || 0)
      
      const anomalies = detectAnomalies(dailyCounts)
      
      return NextResponse.json({
        type: 'anomalies',
        anomalies: anomalies.map(anomaly => ({
          date: dailyData.labels[anomaly.index],
          value: anomaly.value,
          deviation: Math.round(anomaly.deviation * 100) / 100
        }))
      })
    }

    if (predictionType === 'extended_forecast') {
      const forecastDays = parseInt(searchParams.get('days') || '30')
      const dailyData = await analytics.getDailyAppointments(filters)
      const historicalData = dailyData.labels.map((_, i) => dailyData.datasets[0]?.data[i] || 0)
      
      const forecast = predictExtendedForecast(historicalData, forecastDays)
      
      return NextResponse.json({
        type: 'extended_forecast',
        forecast
      })
    }

    if (predictionType === 'course_demand') {
      const courseData = await analytics.getCoursePopularity(filters)
      const appointments = await analytics.getAppointments(filters)
      
      // Get historical course data (last 30 days)
      const courseHistoricalData = courseData.labels.map((courseName, index) => {
        const courseId = appointments.find((apt: any) => 
          apt.course_name === courseName || 
          `${apt.course_code} - ${apt.course_name}` === courseName
        )?.course_id || courseName
        
        // Get counts for last 7 periods (simplified - in real implementation, would track over time)
        const count = courseData.datasets[0]?.data[index] || 0
        return {
          course_id: courseId,
          course_name: courseName,
          historical_counts: [count * 0.8, count * 0.9, count, count * 1.1, count * 1.05, count * 0.95, count] // Simulated trend
        }
      })
      
      const predictions = predictCourseDemand(courseHistoricalData)
      
      return NextResponse.json({
        type: 'course_demand',
        predictions
      })
    }

    if (predictionType === 'capacity_planning') {
      const forecastDays = parseInt(searchParams.get('days') || '7')
      const dailyData = await analytics.getDailyAppointments(filters)
      const historicalData = dailyData.labels.map((_, i) => dailyData.datasets[0]?.data[i] || 0)
      
      // Generate forecast for next period
      const forecast = predictExtendedForecast(historicalData, forecastDays)
      const predictedAppointments = forecast.daily_predictions.map(p => p.predicted)
      const dates = forecast.daily_predictions.map(p => p.date)
      
      // Get current tutor count
      const { data: tutors } = await supabase.from('tutors').select('tutor_id')
      const currentTutorCount = tutors?.length || 1
      
      const recommendations = generateCapacityRecommendations(
        predictedAppointments,
        dates,
        currentTutorCount
      )
      
      return NextResponse.json({
        type: 'capacity_planning',
        recommendations,
        current_tutor_count: currentTutorCount
      })
    }

    if (predictionType === 'tutor_workload') {
      const forecastDays = parseInt(searchParams.get('days') || '7')
      const appointments = await analytics.getAppointments(filters)
      
      // Get tutors
      const { data: tutors } = await supabase.from('tutors').select('tutor_id, tutor_name')
      const tutorMap = new Map(tutors?.map((t: any) => [t.tutor_id, t.tutor_name]) || [])
      
      // Group appointments by tutor and calculate historical data
      const tutorData = Array.from(tutorMap.entries()).map(([tutorId, tutorName]) => {
        const tutorAppointments = appointments.filter((apt: any) => apt.tutor_id === tutorId)
        
        // Simulate historical data (in real implementation, would track over time)
        const currentCount = tutorAppointments.length
        const currentHours = tutorAppointments.reduce((sum: number, apt: any) => {
          if (apt.duration) return sum + apt.duration
          if (apt.start_time && apt.end_time) {
            const start = new Date(`2000-01-01T${apt.start_time}`)
            const end = new Date(`2000-01-01T${apt.end_time}`)
            return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
          }
          return sum + 1
        }, 0)
        
        return {
          tutor_id: tutorId,
          tutor_name: tutorName,
          historical_appointments: [
            Math.max(0, currentCount - 2),
            Math.max(0, currentCount - 1),
            currentCount,
            currentCount + 1,
            currentCount + 2
          ],
          historical_hours: [
            Math.max(0, currentHours - 2),
            Math.max(0, currentHours - 1),
            currentHours,
            currentHours + 1,
            currentHours + 2
          ]
        }
      })
      
      const predictions = predictTutorWorkload(tutorData, forecastDays)
      
      return NextResponse.json({
        type: 'tutor_workload',
        predictions
      })
    }

    if (predictionType === 'peak_hours_enhanced') {
      const hourlyData = await analytics.getHourlyDistribution(filters)
      const hourlyCounts = hourlyData.labels.map((_, i) => hourlyData.datasets[0]?.data[i] || 0)
      
      const peakHours = predictPeakHoursEnhanced(hourlyCounts)
      
      return NextResponse.json({
        type: 'peak_hours_enhanced',
        peak_hours: peakHours
      })
    }

    return NextResponse.json(
      { error: 'Invalid prediction type' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error generating prediction:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}

