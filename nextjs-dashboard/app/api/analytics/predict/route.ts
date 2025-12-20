import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { SchedulingAnalytics } from '@/lib/analytics'
import { predictAppointments, predictPeakHours, detectAnomalies } from '@/lib/ml/predictions'

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

    // Get historical data
    const filters: any = {}
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30) // Last 30 days

    filters.start_date = startDate.toISOString().split('T')[0]
    filters.end_date = endDate.toISOString().split('T')[0]

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

