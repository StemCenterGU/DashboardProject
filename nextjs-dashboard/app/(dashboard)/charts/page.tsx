"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Users, Calendar, Loader2, Brain, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { PredictiveAnalytics } from "@/components/predictive-analytics"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
  }[]
  summary?: {
    total: number
    average: number
    min: number
    max: number
  }
}

interface SummaryStats {
  total_appointments: number
  total_hours: number
  unique_tutors: number
  unique_courses: number
  average_duration: number
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff']

export default function ChartsPage() {
  const [selectedChart, setSelectedChart] = useState("appointments_per_tutor")
  const [dateRange, setDateRange] = useState("all")
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate date range
  const getDateRange = () => {
    const now = new Date()
    switch (dateRange) {
      case "week":
        return {
          start_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: now.toISOString().split('T')[0]
        }
      case "month":
        return {
          start_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: now.toISOString().split('T')[0]
        }
      case "year":
        return {
          start_date: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: now.toISOString().split('T')[0]
        }
      default:
        return {}
    }
  }

  // Fetch chart data
  const fetchChartData = async () => {
    setLoading(true)
    setError(null)
    try {
      const dateFilters = getDateRange()
      const params = new URLSearchParams({
        dataset: selectedChart,
        chart_type: 'bar',
        ...dateFilters
      })

      console.log('Fetching chart data:', selectedChart, dateFilters)
      const response = await fetch(`/api/analytics/chart-data?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch chart data`)
      }
      
      const data = await response.json()
      console.log('Chart data received:', data)
      
      if (!data.chart_data) {
        throw new Error('No chart data in response')
      }
      
      setChartData(data.chart_data)
      setSummaryStats(data.summary)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load chart data'
      setError(errorMessage)
      console.error('Error fetching chart data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch summary stats
  const fetchSummaryStats = async () => {
    try {
      const dateFilters = getDateRange()
      const params = new URLSearchParams(dateFilters)
      
      const response = await fetch(`/api/analytics/summary?${params}`)
      if (!response.ok) {
        console.error('Failed to fetch summary stats:', response.status)
        return
      }
      
      const data = await response.json()
      console.log('Summary stats received:', data)
      setSummaryStats(data)
    } catch (err) {
      console.error('Error fetching summary stats:', err)
    }
  }

  useEffect(() => {
    fetchChartData()
    fetchSummaryStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChart, dateRange])

  // Transform data for Recharts
  const getRechartsData = () => {
    if (!chartData) return []
    
    return chartData.labels.map((label, index) => ({
      name: label.length > 20 ? label.substring(0, 20) + '...' : label,
      value: chartData.datasets[0]?.data[index] || 0,
      fullName: label
    }))
  }

  const rechartsData = getRechartsData()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Charts</h1>
          <p className="text-muted-foreground">View analytics and data visualizations</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
          <Button onClick={fetchChartData} variant="outline" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats?.total_appointments ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats ? 'Appointments scheduled' : 'Loading...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats?.total_hours ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats ? 'Hours scheduled' : 'Loading...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tutors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats?.unique_tutors ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats ? 'Tutors with appointments' : 'Loading...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats?.average_duration ? `${summaryStats.average_duration.toFixed(1)}h` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats ? 'Average appointment' : 'Loading...'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Selection and Visualization */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Chart Selection</CardTitle>
                <CardDescription>Choose a chart to display</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <select 
              value={selectedChart} 
              onChange={(e) => setSelectedChart(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="appointments_per_tutor">Appointments per Tutor</option>
              <option value="hours_per_tutor">Hours per Tutor</option>
              <option value="daily_appointments">Daily Appointments</option>
              <option value="appointments_by_status">Appointments by Status</option>
              <option value="course_popularity">Course Popularity</option>
              <option value="hourly_appointments_dist">Hourly Distribution</option>
            </select>
            
            {chartData?.summary && (
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{chartData.summary.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average:</span>
                  <span className="font-medium">{chartData.summary.average.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Min:</span>
                  <span className="font-medium">{chartData.summary.min}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max:</span>
                  <span className="font-medium">{chartData.summary.max}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chart Visualization</CardTitle>
            <CardDescription>
              {selectedChart.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center space-y-2">
                  <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
                  <p className="text-sm text-destructive font-medium">{error}</p>
                  <p className="text-xs text-muted-foreground">
                    Check browser console for details
                  </p>
                  <Button onClick={fetchChartData} variant="outline" size="sm" className="mt-2">
                    Retry
                  </Button>
                </div>
              </div>
            ) : rechartsData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center space-y-2">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No data available</p>
                </div>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  {selectedChart === 'appointments_by_status' || selectedChart === 'course_popularity' ? (
                    <PieChart>
                      <Pie
                        data={rechartsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {rechartsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  ) : selectedChart === 'daily_appointments' ? (
                    <LineChart data={rechartsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  ) : (
                    <BarChart data={rechartsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ML Predictive Analytics */}
      <div className="grid gap-4 md:grid-cols-2">
        <PredictiveAnalytics />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              ML Features
            </CardTitle>
            <CardDescription>Machine Learning & AI Capabilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Available ML Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ Appointment Forecasting (7-day predictions)</li>
                <li>✅ Peak Hours Prediction</li>
                <li>✅ Anomaly Detection</li>
                <li>✅ Tutor Recommendations</li>
              </ul>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                ML predictions use statistical algorithms and historical data patterns to forecast future trends and identify anomalies.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Card */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Features</CardTitle>
          <CardDescription>Available chart types and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Appointments Analytics</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Appointments per tutor</li>
                <li>• Daily appointments</li>
                <li>• Appointments by status</li>
                <li>• Hourly distribution</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Tutor Analytics</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Hours per tutor</li>
                <li>• Tutor workload</li>
                <li>• Availability hours</li>
                <li>• Shift coverage</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Course Analytics</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Course popularity</li>
                <li>• Appointments by course</li>
                <li>• Average duration</li>
                <li>• Monthly trends</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
