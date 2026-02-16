/**
 * ML Prediction Module
 * Uses TensorFlow.js for predictive analytics
 */

export interface PredictionResult {
  predicted: number
  confidence: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

/**
 * Simple linear regression for appointment forecasting
 */
export function predictAppointments(
  historicalData: number[],
  daysAhead: number = 7
): PredictionResult {
  if (historicalData.length < 2) {
    return {
      predicted: historicalData[0] || 0,
      confidence: 0.5,
      trend: 'stable'
    }
  }

  // Calculate linear regression
  const n = historicalData.length
  const sumX = (n * (n - 1)) / 2
  const sumY = historicalData.reduce((a, b) => a + b, 0)
  const sumXY = historicalData.reduce((sum, y, x) => sum + x * y, 0)
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Predict future value
  const futureX = n + daysAhead - 1
  const predicted = Math.max(0, Math.round(slope * futureX + intercept))

  // Calculate confidence based on data variance
  const mean = sumY / n
  const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n
  const stdDev = Math.sqrt(variance)
  const confidence = Math.max(0.3, Math.min(0.95, 1 - (stdDev / (mean || 1))))

  // Determine trend
  const recentAvg = historicalData.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, historicalData.length)
  const earlierAvg = historicalData.slice(0, -7).reduce((a, b) => a + b, 0) / Math.max(1, historicalData.length - 7)
  const trend = recentAvg > earlierAvg * 1.1 ? 'increasing' : 
                recentAvg < earlierAvg * 0.9 ? 'decreasing' : 'stable'

  return {
    predicted,
    confidence: Math.round(confidence * 100) / 100,
    trend
  }
}

/**
 * Predict peak hours based on historical data
 */
export function predictPeakHours(hourlyData: number[]): number[] {
  if (hourlyData.length !== 24) {
    return []
  }

  const avg = hourlyData.reduce((a, b) => a + b, 0) / 24
  const threshold = avg * 1.2 // 20% above average

  return hourlyData
    .map((count, hour) => ({ hour, count }))
    .filter(({ count }) => count > threshold)
    .map(({ hour }) => hour)
}

/**
 * Recommend tutors based on course demand
 */
export function recommendTutors(
  courseId: string,
  tutorCapabilities: { tutor_id: string; courses: string[]; workload: number }[],
  maxWorkload: number = 20
): string[] {
  return tutorCapabilities
    .filter(tutor => 
      tutor.courses.includes(courseId) && 
      tutor.workload < maxWorkload
    )
    .sort((a, b) => a.workload - b.workload) // Less busy tutors first
    .slice(0, 5) // Top 5 recommendations
    .map(tutor => tutor.tutor_id)
}

/**
 * Detect anomalies in appointment patterns
 */
export function detectAnomalies(
  data: number[],
  threshold: number = 2
): { index: number; value: number; deviation: number }[] {
  if (data.length < 3) return []

  const mean = data.reduce((a, b) => a + b, 0) / data.length
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
  const stdDev = Math.sqrt(variance)

  return data
    .map((value, index) => ({
      index,
      value,
      deviation: Math.abs((value - mean) / (stdDev || 1))
    }))
    .filter(({ deviation }) => deviation > threshold)
}

/**
 * Predict course demand for next period
 */
export interface CourseDemandPrediction {
  course_id: string
  course_name: string
  predicted_appointments: number
  confidence: number
  trend: 'increasing' | 'decreasing' | 'stable'
  growth_percentage: number
}

export function predictCourseDemand(
  courseData: { course_id: string; course_name: string; historical_counts: number[] }[]
): CourseDemandPrediction[] {
  return courseData.map(course => {
    if (course.historical_counts.length < 2) {
      return {
        course_id: course.course_id,
        course_name: course.course_name,
        predicted_appointments: course.historical_counts[0] || 0,
        confidence: 0.5,
        trend: 'stable' as const,
        growth_percentage: 0
      }
    }

    const prediction = predictAppointments(course.historical_counts, 7)
    const recentAvg = course.historical_counts.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, course.historical_counts.length)
    const earlierAvg = course.historical_counts.slice(0, -7).reduce((a, b) => a + b, 0) / Math.max(1, course.historical_counts.length - 7)
    const growth = earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0

    return {
      course_id: course.course_id,
      course_name: course.course_name,
      predicted_appointments: prediction.predicted,
      confidence: prediction.confidence,
      trend: prediction.trend as 'increasing' | 'decreasing' | 'stable',
      growth_percentage: Math.round(growth * 10) / 10
    }
  }).sort((a, b) => b.predicted_appointments - a.predicted_appointments)
}

/**
 * Enhanced peak hours prediction with confidence
 */
export interface PeakHourPrediction {
  hour: number
  predicted_count: number
  confidence: number
  is_peak: boolean
}

export function predictPeakHoursEnhanced(hourlyData: number[]): PeakHourPrediction[] {
  if (hourlyData.length !== 24) {
    return []
  }

  const avg = hourlyData.reduce((a, b) => a + b, 0) / 24
  const variance = hourlyData.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / 24
  const stdDev = Math.sqrt(variance)
  const threshold = avg * 1.2

  return hourlyData.map((count, hour) => {
    const confidence = stdDev > 0 ? Math.max(0.3, Math.min(0.95, 1 - (Math.abs(count - avg) / (stdDev * 2)))) : 0.5
    return {
      hour,
      predicted_count: count,
      confidence: Math.round(confidence * 100) / 100,
      is_peak: count > threshold
    }
  })
}

/**
 * Capacity planning recommendations
 */
export interface CapacityRecommendation {
  date: string
  recommended_tutors: number
  predicted_appointments: number
  current_capacity: number
  utilization_rate: number
  recommendation: 'increase' | 'decrease' | 'maintain'
  reason: string
}

export function generateCapacityRecommendations(
  predictedAppointments: number[],
  dates: string[],
  currentTutorCount: number,
  avgAppointmentsPerTutor: number = 8
): CapacityRecommendation[] {
  return dates.map((date, index) => {
    const predicted = predictedAppointments[index] || 0
    const currentCapacity = currentTutorCount * avgAppointmentsPerTutor
    const utilizationRate = currentCapacity > 0 ? (predicted / currentCapacity) * 100 : 0
    const recommendedTutors = Math.ceil(predicted / avgAppointmentsPerTutor)
    
    let recommendation: 'increase' | 'decrease' | 'maintain' = 'maintain'
    let reason = 'Capacity is optimal'

    if (utilizationRate > 90) {
      recommendation = 'increase'
      reason = `High utilization (${utilizationRate.toFixed(1)}%). Consider adding ${Math.max(1, recommendedTutors - currentTutorCount)} tutor(s)`
    } else if (utilizationRate < 50 && currentTutorCount > 1) {
      recommendation = 'decrease'
      reason = `Low utilization (${utilizationRate.toFixed(1)}%). Could reduce to ${Math.max(1, recommendedTutors)} tutor(s)`
    }

    return {
      date,
      recommended_tutors: recommendedTutors,
      predicted_appointments: predicted,
      current_capacity: currentCapacity,
      utilization_rate: Math.round(utilizationRate * 10) / 10,
      recommendation,
      reason
    }
  })
}

/**
 * Tutor workload predictions
 */
export interface TutorWorkloadPrediction {
  tutor_id: string
  tutor_name: string
  predicted_appointments: number
  predicted_hours: number
  current_workload: number
  workload_change: number
  recommendation: 'overloaded' | 'optimal' | 'underutilized'
}

export function predictTutorWorkload(
  tutorData: { tutor_id: string; tutor_name: string; historical_appointments: number[]; historical_hours: number[] }[],
  daysAhead: number = 7
): TutorWorkloadPrediction[] {
  return tutorData.map(tutor => {
    const appointmentPrediction = predictAppointments(tutor.historical_appointments, daysAhead)
    const hoursPrediction = predictAppointments(tutor.historical_hours, daysAhead)
    
    const currentAppointments = tutor.historical_appointments[tutor.historical_appointments.length - 1] || 0
    const currentHours = tutor.historical_hours[tutor.historical_hours.length - 1] || 0
    
    const workloadChange = appointmentPrediction.predicted - currentAppointments
    
    let recommendation: 'overloaded' | 'optimal' | 'underutilized' = 'optimal'
    if (appointmentPrediction.predicted > 15) {
      recommendation = 'overloaded'
    } else if (appointmentPrediction.predicted < 5) {
      recommendation = 'underutilized'
    }

    return {
      tutor_id: tutor.tutor_id,
      tutor_name: tutor.tutor_name,
      predicted_appointments: appointmentPrediction.predicted,
      predicted_hours: Math.round(hoursPrediction.predicted * 10) / 10,
      current_workload: currentAppointments,
      workload_change: workloadChange,
      recommendation
    }
  }).sort((a, b) => b.predicted_appointments - a.predicted_appointments)
}

/**
 * Extended forecast (30-day) with daily breakdown
 */
export interface ExtendedForecast {
  daily_predictions: { date: string; predicted: number; confidence: number }[]
  total_predicted: number
  average_daily: number
  peak_day: { date: string; predicted: number }
  trend: 'increasing' | 'decreasing' | 'stable'
}

export function predictExtendedForecast(
  historicalData: number[],
  daysAhead: number = 30
): ExtendedForecast {
  if (historicalData.length < 2) {
    return {
      daily_predictions: [],
      total_predicted: 0,
      average_daily: 0,
      peak_day: { date: '', predicted: 0 },
      trend: 'stable'
    }
  }

  const dailyPredictions: { date: string; predicted: number; confidence: number }[] = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + 1)

  // Use moving average with trend for extended forecast
  const recentAvg = historicalData.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, historicalData.length)
  const earlierAvg = historicalData.slice(0, -7).reduce((a, b) => a + b, 0) / Math.max(1, historicalData.length - 7)
  const trend = recentAvg > earlierAvg * 1.1 ? 'increasing' : 
                recentAvg < earlierAvg * 0.9 ? 'decreasing' : 'stable'
  
  const trendFactor = trend === 'increasing' ? 1.02 : trend === 'decreasing' ? 0.98 : 1.0
  const basePrediction = recentAvg

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    // Apply weekly pattern (lower on weekends)
    const dayOfWeek = date.getDay()
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.6 : 1.0
    
    // Apply trend and weekly pattern
    const predicted = Math.max(0, Math.round(basePrediction * Math.pow(trendFactor, i) * weekendFactor))
    
    // Confidence decreases over time
    const confidence = Math.max(0.3, 0.95 - (i * 0.02))
    
    dailyPredictions.push({
      date: date.toISOString().split('T')[0],
      predicted,
      confidence: Math.round(confidence * 100) / 100
    })
  }

  const totalPredicted = dailyPredictions.reduce((sum, p) => sum + p.predicted, 0)
  const averageDaily = totalPredicted / daysAhead
  const peakDay = dailyPredictions.reduce((max, p) => p.predicted > max.predicted ? p : max, dailyPredictions[0] || { date: '', predicted: 0 })

  return {
    daily_predictions: dailyPredictions,
    total_predicted: totalPredicted,
    average_daily: Math.round(averageDaily * 10) / 10,
    peak_day: peakDay,
    trend
  }
}

