"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { BarChart3, TrendingUp, Users, Calendar, Loader2, AlertCircle, Filter, X, Search, Download, FileText, Image as ImageIcon, FileSpreadsheet, RefreshCw, Clock } from "lucide-react"
import { useState, useEffect, useRef } from "react"
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
    total?: number
    average?: number
    min?: number
    max?: number
    // Chart-specific summary fields
    onlinePercent?: number
    online?: number
    inPerson?: number
    inPersonPercent?: number
    walkInPercent?: number
    walkIn?: number
    scheduled?: number
    scheduledPercent?: number
    missedPercent?: number
    missed?: number
    completed?: number
    completedPercent?: number
  }
}

interface SummaryStats {
  total_appointments: number
  total_hours: number
  unique_tutors: number
  unique_courses: number
  average_duration: number
}

interface Tutor {
  tutor_id: string
  tutor_name: string
}

interface Course {
  course_id: string
  course_name: string
  course_code?: string
}

interface StatusOption {
  value: string
  label: string
}

interface InstructorOption {
  value: string
  label: string
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff']



export default function ChartsPage() {
  const [selectedChart, setSelectedChart] = useState("appointments_per_tutor")
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [courseViewType, setCourseViewType] = useState<"pie" | "bar" | "table">("bar")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [todayStats, setTodayStats] = useState<SummaryStats | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  
  // Phase 3 state
  const [phase3Data, setPhase3Data] = useState<any>(null)
  const [comparisonData, setComparisonData] = useState<any>(null)
  const [heatmapData, setHeatmapData] = useState<any>(null)

  // Filter states
  const [dateRange, setDateRange] = useState("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [selectedTutors, setSelectedTutors] = useState<string[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [isWalkIn, setIsWalkIn] = useState<boolean | null>(null)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [minDuration, setMinDuration] = useState("")
  const [maxDuration, setMaxDuration] = useState("")
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([])
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([])
  const [isRepeating, setIsRepeating] = useState<boolean | null>(null)

  // Search filters for multi-selects
  const [tutorSearch, setTutorSearch] = useState("")
  const [courseSearch, setCourseSearch] = useState("")
  const [statusSearch, setStatusSearch] = useState("")
  const [instructorSearch, setInstructorSearch] = useState("")

  // Options for filters
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([])
  const [instructorOptions, setInstructorOptions] = useState<InstructorOption[]>([])

  // Day of week options
  const DAYS_OF_WEEK = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ]

  // Fetch tutors, courses, statuses, and instructors for filter options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [tutorsRes, coursesRes, statusesRes, instructorsRes] = await Promise.all([
          fetch('/api/analytics/tutors'),
          fetch('/api/analytics/courses'),
          fetch('/api/analytics/statuses'),
          fetch('/api/analytics/instructors')
        ])
        if (tutorsRes.ok) {
          const tutorsData = await tutorsRes.json()
          setTutors(tutorsData)
        }
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json()
          setCourses(coursesData)
        }
        if (statusesRes.ok) {
          const statusesData = await statusesRes.json()
          setStatusOptions(statusesData)
        }
        if (instructorsRes.ok) {
          const instructorsData = await instructorsRes.json()
          setInstructorOptions(instructorsData)
        }
      } catch (err) {
        console.error('Error fetching filter options:', err)
      }
    }
    fetchOptions()
  }, [])

  // Calculate date range
  const getDateRange = () => {
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return {
        start_date: customStartDate,
        end_date: customEndDate
      }
    }

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

  // Build filter params
  const buildFilterParams = () => {
    const dateFilters = getDateRange()
    const params: any = {
      dataset: selectedChart,
      chart_type: 'bar',
      ...dateFilters
    }

    if (selectedTutors.length > 0) {
      params.tutor_ids = selectedTutors.join(',')
    }
    if (selectedCourses.length > 0) {
      params.course_ids = selectedCourses.join(',')
    }
    if (selectedStatuses.length > 0) {
      params.status = selectedStatuses.join(',')
    }
    if (isOnline !== null) {
      params.is_online = isOnline.toString()
    }
    if (isWalkIn !== null) {
      params.is_walk_in = isWalkIn.toString()
    }
    if (startTime) {
      params.start_time = startTime
    }
    if (endTime) {
      params.end_time = endTime
    }
    if (minDuration) {
      params.min_duration = parseFloat(minDuration).toString()
    }
    if (maxDuration) {
      params.max_duration = parseFloat(maxDuration).toString()
    }
    if (selectedDaysOfWeek.length > 0) {
      params.day_of_week = selectedDaysOfWeek.join(',')
    }
    if (selectedInstructors.length > 0) {
      params.course_instructor = selectedInstructors.join(',')
    }
    if (isRepeating !== null) {
      params.is_repeating = isRepeating.toString()
    }

    return params
  }

  // Fetch chart data
  const fetchChartData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = buildFilterParams()
      const queryString = new URLSearchParams(params).toString()

      // Phase 3: Enhanced ML predictions
      const phase3MLCharts = ['extended_forecast', 'course_demand', 'capacity_planning', 'tutor_workload', 'peak_hours_enhanced']
      if (phase3MLCharts.includes(selectedChart)) {
        // Build clean params without dataset/chart_type for Phase 3 APIs
        const dateFilters = getDateRange()
        const cleanParams = new URLSearchParams()
        if (dateFilters.start_date) cleanParams.set('start_date', dateFilters.start_date)
        if (dateFilters.end_date) cleanParams.set('end_date', dateFilters.end_date)
        cleanParams.set('type', selectedChart)
        if (selectedChart === 'extended_forecast' || selectedChart === 'capacity_planning') {
          cleanParams.set('days', selectedChart === 'extended_forecast' ? '30' : '7')
        }
        
        const response = await fetch(`/api/analytics/predict?${cleanParams.toString()}`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to fetch ${selectedChart} data: ${response.status}`)
        }
        const data = await response.json()
        console.log('Phase 3 ML Data:', data)
        
        // Validate data structure
        if (!data || (data.type && data.type !== selectedChart)) {
          throw new Error(`Invalid data structure received for ${selectedChart}`)
        }
        
        // Log data structure for debugging
        console.log(`Phase 3 ${selectedChart} data structure:`, {
          hasForecast: !!data.forecast,
          hasPredictions: !!data.predictions,
          hasRecommendations: !!data.recommendations,
          hasPeakHours: !!data.peak_hours,
          forecastLength: data.forecast?.daily_predictions?.length || 0,
          predictionsLength: data.predictions?.length || 0,
          recommendationsLength: data.recommendations?.length || 0,
          peakHoursLength: data.peak_hours?.length || 0
        })
        
        setPhase3Data(data)
        setChartData(null)
        setComparisonData(null)
        setHeatmapData(null)
        return
      }

      // Phase 3: Comparative analytics
      const comparisonCharts = ['time_period_comparison', 'tutor_comparison', 'course_comparison']
      if (comparisonCharts.includes(selectedChart)) {
        const compareParams = new URLSearchParams()
        const dateFilters = getDateRange()
        
        if (selectedChart === 'time_period_comparison') {
          // For time period comparison, use default (last 7 days vs previous 7 days)
          const endDate = new Date().toISOString().split('T')[0]
          const period2Start = new Date()
          period2Start.setDate(period2Start.getDate() - 7)
          const period1End = new Date(period2Start)
          period1End.setDate(period1End.getDate() - 1)
          const period1Start = new Date(period1End)
          period1Start.setDate(period1Start.getDate() - 7)

          compareParams.set('type', 'time_period')
          compareParams.set('period1_start', period1Start.toISOString().split('T')[0])
          compareParams.set('period1_end', period1End.toISOString().split('T')[0])
          compareParams.set('period2_start', period2Start.toISOString().split('T')[0])
          compareParams.set('period2_end', endDate)
        } else if (selectedChart === 'tutor_comparison') {
          // For tutor comparison, need at least 2 tutors
          if (selectedTutors.length < 2) {
            throw new Error('Please select at least 2 tutors for comparison')
          }
          compareParams.set('type', 'tutors')
          compareParams.set('tutor_ids', selectedTutors.join(','))
          if (dateFilters.start_date) compareParams.set('start_date', dateFilters.start_date)
          if (dateFilters.end_date) compareParams.set('end_date', dateFilters.end_date)
        } else if (selectedChart === 'course_comparison') {
          // For course comparison, need at least 2 courses
          if (selectedCourses.length < 2) {
            throw new Error('Please select at least 2 courses for comparison')
          }
          compareParams.set('type', 'courses')
          compareParams.set('course_ids', selectedCourses.join(','))
          if (dateFilters.start_date) compareParams.set('start_date', dateFilters.start_date)
          if (dateFilters.end_date) compareParams.set('end_date', dateFilters.end_date)
        }

        const response = await fetch(`/api/analytics/compare?${compareParams.toString()}`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to fetch comparison data: ${response.status}`)
        }
        const data = await response.json()
        console.log('Comparison Data:', data)
        setComparisonData(data)
        setChartData(null)
        setPhase3Data(null)
        setHeatmapData(null)
        return
      }

      // Phase 3: Heatmaps
      const heatmapCharts = ['day_hour_heatmap', 'tutor_day_heatmap', 'course_timeslot_heatmap']
      if (heatmapCharts.includes(selectedChart)) {
        const dateFilters = getDateRange()
        const heatmapParams = new URLSearchParams({
          type: selectedChart === 'day_hour_heatmap' ? 'day_hour' :
                selectedChart === 'tutor_day_heatmap' ? 'tutor_day' : 'course_timeslot',
          ...(dateFilters.start_date ? { start_date: dateFilters.start_date } : {}),
          ...(dateFilters.end_date ? { end_date: dateFilters.end_date } : {})
        })

        const response = await fetch(`/api/analytics/heatmap?${heatmapParams.toString()}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch heatmap data`)
        }
        const data = await response.json()
        console.log('Heatmap Data:', data)
        
        // Validate data structure
        if (!data || !data.type || !data.data) {
          throw new Error(`Invalid heatmap data structure received`)
        }
        
        setHeatmapData(data)
        setChartData(null)
        setPhase3Data(null)
        setComparisonData(null)
        return
      }

      // Regular charts
      const response = await fetch(`/api/analytics/chart-data?${queryString}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch chart data`)
      }
      
      const data = await response.json()
      
      if (!data.chart_data) {
        throw new Error('No chart data in response')
      }
      
      setChartData(data.chart_data)
      setSummaryStats(data.summary)
      setPhase3Data(null)
      setComparisonData(null)
      setHeatmapData(null)
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
      const params = buildFilterParams()
      const queryString = new URLSearchParams(params).toString()
      
      const response = await fetch(`/api/analytics/summary?${queryString}`)
      if (!response.ok) {
        console.error('Failed to fetch summary stats:', response.status)
        return
      }
      
      const data = await response.json()
      setSummaryStats(data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching summary stats:', err)
    }
  }

  // Fetch today's statistics
  const fetchTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const params = new URLSearchParams({
        start_date: today,
        end_date: today
      })
      
      const response = await fetch(`/api/analytics/summary?${params.toString()}`)
      if (!response.ok) {
        console.error('Failed to fetch today stats:', response.status)
        return
      }
      
      const data = await response.json()
      setTodayStats(data)
    } catch (err) {
      console.error('Error fetching today stats:', err)
    }
  }

  useEffect(() => {
    fetchChartData()
    fetchSummaryStats()
    fetchTodayStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChart, dateRange, customStartDate, customEndDate, selectedTutors, selectedCourses, selectedStatuses, isOnline, isWalkIn, startTime, endTime, minDuration, maxDuration, selectedDaysOfWeek, selectedInstructors, isRepeating])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchChartData()
      fetchSummaryStats()
      fetchTodayStats()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh])

  // Export functions
  const exportCSV = async () => {
    setExporting('csv')
    try {
      const params = buildFilterParams()
      const queryString = new URLSearchParams(params).toString()
      
      const response = await fetch(`/api/analytics/export/csv?${queryString}`)
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to export CSV'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `appointments_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      console.error('Error exporting CSV:', err)
      alert(err.message || 'Failed to export CSV. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  const exportPDF = async () => {
    setExporting('pdf')
    try {
      const jsPDFModule = await import('jspdf')
      const jsPDF = (jsPDFModule as any).default || jsPDFModule
      const pdf = new jsPDF('landscape', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      // Add title
      pdf.setFontSize(18)
      pdf.text('Analytics Report', 20, 20)
      
      // Add date
      pdf.setFontSize(10)
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
      
      // Initialize yPos
      let yPos = 45
      
      // Add summary statistics
      if (summaryStats) {
        pdf.setFontSize(14)
        pdf.text('Summary Statistics', 20, yPos)
        pdf.setFontSize(10)
        yPos += 10
        pdf.text(`Total Appointments: ${summaryStats.total_appointments}`, 20, yPos)
        yPos += 7
        pdf.text(`Total Hours: ${summaryStats.total_hours.toFixed(2)}`, 20, yPos)
        yPos += 7
        pdf.text(`Active Tutors: ${summaryStats.unique_tutors}`, 20, yPos)
        yPos += 7
        pdf.text(`Unique Courses: ${summaryStats.unique_courses}`, 20, yPos)
        yPos += 7
        pdf.text(`Average Duration: ${summaryStats.average_duration.toFixed(2)} hours`, 20, yPos)
        yPos += 15
      }
      
      // Add chart data as table
      if (chartData) {
        pdf.setFontSize(14)
        pdf.text('Chart Data', 20, yPos)
        pdf.setFontSize(10)
        yPos += 10
        
        // Table headers
        pdf.text('Label', 20, yPos)
        pdf.text('Value', 100, yPos)
        yPos += 7
        
        // Table rows
        chartData.labels.forEach((label, index) => {
          if (yPos > pageHeight - 20) {
            pdf.addPage()
            yPos = 20
          }
          const value = chartData.datasets[0]?.data[index] || 0
          pdf.text(label.length > 40 ? label.substring(0, 40) + '...' : label, 20, yPos)
          pdf.text(value.toString(), 100, yPos)
          yPos += 7
        })
      }
      
      // Add chart image if available
      if (chartContainerRef.current) {
        try {
          const html2canvasModule = await import('html2canvas')
          const html2canvas = (html2canvasModule as any).default || html2canvasModule
          if (html2canvas) {
            const canvas = await html2canvas(chartContainerRef.current, {
              backgroundColor: '#ffffff',
              scale: 2
            })
            const imgData = canvas.toDataURL('image/png')
            
            // Add new page for chart
            pdf.addPage()
            const imgWidth = pageWidth - 40
            const imgHeight = (canvas.height * imgWidth) / canvas.width
            
            if (imgHeight > pageHeight - 40) {
              pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, pageHeight - 40)
            } else {
              pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight)
            }
          }
        } catch (err) {
          console.error('Error capturing chart image:', err)
        }
      }
      
      pdf.save(`analytics_report_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error('Error exporting PDF:', err)
      alert('Failed to export PDF. Please install packages: npm install jspdf html2canvas')
    } finally {
      setExporting(null)
    }
  }

  const exportChartImage = async () => {
    setExporting('image')
    try {
      if (!chartContainerRef.current) {
        throw new Error('Chart container not found')
      }
      
      const html2canvasModule = await import('html2canvas')
      const html2canvas = (html2canvasModule as any).default || html2canvasModule
      const canvas = await html2canvas(chartContainerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      })
      
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `chart_${selectedChart}_${new Date().toISOString().split('T')[0]}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error exporting chart image:', err)
      alert('Failed to export chart image. Please install packages: npm install html2canvas')
    } finally {
      setExporting(null)
    }
  }

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

  // Get course popularity data sorted by value
  const getCoursePopularityData = () => {
    if (!chartData || selectedChart !== 'course_popularity') return []
    
    const total = chartData.summary?.total || 0
    return rechartsData
      .map(item => ({
        ...item,
        percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.value - a.value)
  }

  const courseData = getCoursePopularityData()

  // Clear all filters
  const clearFilters = () => {
    setDateRange("all")
    setCustomStartDate("")
    setCustomEndDate("")
    setSelectedTutors([])
    setSelectedCourses([])
    setSelectedStatuses([])
    setIsOnline(null)
    setIsWalkIn(null)
    setStartTime("")
    setEndTime("")
    setMinDuration("")
    setMaxDuration("")
    setSelectedDaysOfWeek([])
    setSelectedInstructors([])
    setIsRepeating(null)
  }

  // Count active filters
  const activeFiltersCount = () => {
    let count = 0
    if (dateRange !== 'all') count++
    if (selectedTutors.length > 0) count++
    if (selectedCourses.length > 0) count++
    if (selectedStatuses.length > 0) count++
    if (isOnline !== null) count++
    if (isWalkIn !== null) count++
    if (startTime) count++
    if (endTime) count++
    if (minDuration) count++
    if (maxDuration) count++
    if (selectedDaysOfWeek.length > 0) count++
    if (selectedInstructors.length > 0) count++
    if (isRepeating !== null) count++
    return count
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Charts</h1>
          <p className="text-muted-foreground">View analytics and data visualizations</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setFiltersOpen(!filtersOpen)} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount() > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {activeFiltersCount()}
              </span>
            )}
          </Button>
          <Button onClick={fetchChartData} variant="outline" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {filtersOpen && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Filter analytics data by various criteria</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={clearFilters} variant="ghost" size="sm">
                  Clear All
                </Button>
                <Button onClick={() => setFiltersOpen(false)} variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Date Range */}
              <div className="space-y-2">
                <Label htmlFor="date-range" className="text-sm font-medium">Date Range</Label>
                <select 
                  id="date-range"
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
                {dateRange === 'custom' && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      placeholder="Start Date"
                      className="flex-1"
                    />
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      placeholder="End Date"
                      className="flex-1"
                    />
                  </div>
                )}
              </div>

              {/* Tutors */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Tutors {selectedTutors.length > 0 && <span className="text-muted-foreground">({selectedTutors.length})</span>}
                </Label>
                <div className="border rounded-md bg-background">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search tutors..."
                        value={tutorSearch}
                        onChange={(e) => setTutorSearch(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                    {tutors
                      .filter(tutor => tutor.tutor_name.toLowerCase().includes(tutorSearch.toLowerCase()))
                      .map(tutor => {
                        const isSelected = selectedTutors.includes(tutor.tutor_id)
                        return (
                          <label
                            key={tutor.tutor_id}
                            className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTutors([...selectedTutors, tutor.tutor_id])
                                } else {
                                  setSelectedTutors(selectedTutors.filter(id => id !== tutor.tutor_id))
                                }
                              }}
                            />
                            <span className="text-sm flex-1">{tutor.tutor_name}</span>
                          </label>
                        )
                      })}
                    {tutors.filter(tutor => tutor.tutor_name.toLowerCase().includes(tutorSearch.toLowerCase())).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">No tutors found</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Courses */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Courses {selectedCourses.length > 0 && <span className="text-muted-foreground">({selectedCourses.length})</span>}
                </Label>
                <div className="border rounded-md bg-background">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search courses..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                    {courses
                      .filter(course => {
                        const searchTerm = courseSearch.toLowerCase()
                        const name = course.course_name.toLowerCase()
                        const code = (course.course_code || '').toLowerCase()
                        return name.includes(searchTerm) || code.includes(searchTerm)
                      })
                      .map(course => {
                        const isSelected = selectedCourses.includes(course.course_id)
                        return (
                          <label
                            key={course.course_id}
                            className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCourses([...selectedCourses, course.course_id])
                                } else {
                                  setSelectedCourses(selectedCourses.filter(id => id !== course.course_id))
                                }
                              }}
                            />
                            <span className="text-sm flex-1">
                              {course.course_code ? `${course.course_code} - ` : ''}{course.course_name}
                            </span>
                          </label>
                        )
                      })}
                    {courses.filter(course => {
                      const searchTerm = courseSearch.toLowerCase()
                      const name = course.course_name.toLowerCase()
                      const code = (course.course_code || '').toLowerCase()
                      return name.includes(searchTerm) || code.includes(searchTerm)
                    }).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">No courses found</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Status {selectedStatuses.length > 0 && <span className="text-muted-foreground">({selectedStatuses.length})</span>}
                </Label>
                {statusOptions.length > 0 ? (
                  <div className="border rounded-md bg-background">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search statuses..."
                          value={statusSearch}
                          onChange={(e) => setStatusSearch(e.target.value)}
                          className="pl-8 h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                      {statusOptions
                        .filter(status => status.label.toLowerCase().includes(statusSearch.toLowerCase()))
                        .map(status => {
                          const isSelected = selectedStatuses.includes(status.value)
                          return (
                            <label
                              key={status.value}
                              className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedStatuses([...selectedStatuses, status.value])
                                  } else {
                                    setSelectedStatuses(selectedStatuses.filter(val => val !== status.value))
                                  }
                                }}
                              />
                              <span className="text-sm flex-1">{status.label}</span>
                            </label>
                          )
                        })}
                      {statusOptions.filter(status => status.label.toLowerCase().includes(statusSearch.toLowerCase())).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">No statuses found</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Loading statuses...</p>
                )}
              </div>

              {/* Online/In-Person */}
              <div className="space-y-2">
                <Label htmlFor="appointment-type" className="text-sm font-medium">Appointment Type</Label>
                <select 
                  id="appointment-type"
                  value={isOnline === null ? '' : isOnline.toString()}
                  onChange={(e) => setIsOnline(e.target.value === '' ? null : e.target.value === 'true')}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All</option>
                  <option value="true">Online Only</option>
                  <option value="false">In-Person Only</option>
                </select>
              </div>

              {/* Walk-In */}
              <div className="space-y-2">
                <Label htmlFor="walk-in" className="text-sm font-medium">Walk-In</Label>
                <select 
                  id="walk-in"
                  value={isWalkIn === null ? '' : isWalkIn.toString()}
                  onChange={(e) => setIsWalkIn(e.target.value === '' ? null : e.target.value === 'true')}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All</option>
                  <option value="true">Walk-In Only</option>
                  <option value="false">Scheduled Only</option>
                </select>
              </div>

              {/* Time Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Time Range</Label>
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="start-time" className="text-xs text-muted-foreground">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="00:00"
                      className="h-10"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="end-time" className="text-xs text-muted-foreground">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      placeholder="23:59"
                      className="h-10"
                    />
                  </div>
                </div>
                {(startTime || endTime) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStartTime("")
                      setEndTime("")
                    }}
                    className="h-6 text-xs"
                  >
                    Clear time
                  </Button>
                )}
              </div>

              {/* Duration Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Duration Range (hours)</Label>
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="min-duration" className="text-xs text-muted-foreground">Min</Label>
                    <Input
                      id="min-duration"
                      type="number"
                      step="0.5"
                      min="0"
                      value={minDuration}
                      onChange={(e) => setMinDuration(e.target.value)}
                      placeholder="0.5"
                      className="h-10"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="max-duration" className="text-xs text-muted-foreground">Max</Label>
                    <Input
                      id="max-duration"
                      type="number"
                      step="0.5"
                      min="0"
                      value={maxDuration}
                      onChange={(e) => setMaxDuration(e.target.value)}
                      placeholder="4.0"
                      className="h-10"
                    />
                  </div>
                </div>
                {(minDuration || maxDuration) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMinDuration("")
                      setMaxDuration("")
                    }}
                    className="h-6 text-xs"
                  >
                    Clear duration
                  </Button>
                )}
              </div>

              {/* Day of Week */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Day of Week {selectedDaysOfWeek.length > 0 && <span className="text-muted-foreground">({selectedDaysOfWeek.length})</span>}
                </Label>
                <div className="border rounded-md bg-background p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {DAYS_OF_WEEK.map(day => {
                      const isSelected = selectedDaysOfWeek.includes(day.value)
                      return (
                        <label
                          key={day.value}
                          className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDaysOfWeek([...selectedDaysOfWeek, day.value])
                              } else {
                                setSelectedDaysOfWeek(selectedDaysOfWeek.filter(d => d !== day.value))
                              }
                            }}
                          />
                          <span className="text-sm flex-1">{day.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Course Instructor */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Course Instructor {selectedInstructors.length > 0 && <span className="text-muted-foreground">({selectedInstructors.length})</span>}
                </Label>
                {instructorOptions.length > 0 ? (
                  <div className="border rounded-md bg-background">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search instructors..."
                          value={instructorSearch}
                          onChange={(e) => setInstructorSearch(e.target.value)}
                          className="pl-8 h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                      {instructorOptions
                        .filter(instructor => instructor.label.toLowerCase().includes(instructorSearch.toLowerCase()))
                        .map(instructor => {
                          const isSelected = selectedInstructors.includes(instructor.value)
                          return (
                            <label
                              key={instructor.value}
                              className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedInstructors([...selectedInstructors, instructor.value])
                                  } else {
                                    setSelectedInstructors(selectedInstructors.filter(val => val !== instructor.value))
                                  }
                                }}
                              />
                              <span className="text-sm flex-1">{instructor.label}</span>
                            </label>
                          )
                        })}
                      {instructorOptions.filter(instructor => instructor.label.toLowerCase().includes(instructorSearch.toLowerCase())).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">No instructors found</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Loading instructors...</p>
                )}
              </div>

              {/* Repeating Appointments */}
              <div className="space-y-2">
                <Label htmlFor="repeating" className="text-sm font-medium">Repeating Appointments</Label>
                <select 
                  id="repeating"
                  value={isRepeating === null ? '' : isRepeating.toString()}
                  onChange={(e) => setIsRepeating(e.target.value === '' ? null : e.target.value === 'true')}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All</option>
                  <option value="true">Repeating Only</option>
                  <option value="false">One-Time Only</option>
                </select>
              </div>

            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls and Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchChartData()
            fetchSummaryStats()
            fetchTodayStats()
          }}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Now
        </Button>
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

      {/* Today's Statistics */}
      {todayStats && (
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today's Statistics</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>
              Real-time statistics for {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div>
                <p className="text-sm text-muted-foreground">Appointments</p>
                <p className="text-2xl font-bold">{todayStats.total_appointments}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hours</p>
                <p className="text-2xl font-bold">{todayStats.total_hours.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Tutors</p>
                <p className="text-2xl font-bold">{todayStats.unique_tutors}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Courses</p>
                <p className="text-2xl font-bold">{todayStats.unique_courses}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Duration</p>
                <p className="text-2xl font-bold">{todayStats.average_duration.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart Selection and Visualization */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chart Selection</CardTitle>
            <CardDescription>Choose a chart to display</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <select 
              value={selectedChart} 
              onChange={(e) => setSelectedChart(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <optgroup label="Tutor Analytics">
                <option value="appointments_per_tutor">Appointments per Tutor</option>
                <option value="hours_per_tutor">Hours per Tutor</option>
              </optgroup>
              <optgroup label="Time Analytics">
                <option value="daily_appointments">Daily Appointments</option>
                <option value="hourly_appointments_dist">Hourly Distribution</option>
                <option value="day_of_week_analytics">Day of Week</option>
                <option value="monthly_trends">Monthly Trends</option>
              </optgroup>
              <optgroup label="Status & Type Analytics">
                <option value="appointments_by_status">Appointments by Status</option>
                <option value="online_vs_inperson">Online vs In-Person</option>
                <option value="walk_in_analytics">Walk-In Analytics</option>
                <option value="missed_noshow_analytics">Missed/No-Show Analytics</option>
              </optgroup>
              <optgroup label="Course & Instructor Analytics">
                <option value="course_popularity">Course Popularity</option>
                <option value="instructor_analytics">Instructor Analytics</option>
              </optgroup>
              <optgroup label="Phase 3: Enhanced ML & Analytics">
                <option value="extended_forecast">30-Day Forecast</option>
                <option value="course_demand">Course Demand Prediction</option>
                <option value="capacity_planning">Capacity Planning</option>
                <option value="tutor_workload">Tutor Workload Prediction</option>
                <option value="peak_hours_enhanced">Enhanced Peak Hours</option>
              </optgroup>
              <optgroup label="Phase 3: Comparative Analytics">
                <option value="time_period_comparison">Time Period Comparison</option>
                <option value="tutor_comparison">Tutor Comparison</option>
                <option value="course_comparison">Course Comparison</option>
              </optgroup>
              <optgroup label="Phase 3: Heatmaps">
                <option value="day_hour_heatmap">Day × Hour Heatmap</option>
                <option value="tutor_day_heatmap">Tutor × Day Heatmap</option>
                <option value="course_timeslot_heatmap">Course × Time Slot Heatmap</option>
              </optgroup>
            </select>
            
            {chartData?.summary && (
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{chartData.summary.total ?? '—'}</span>
                </div>
                {selectedChart === 'course_popularity' && courseData.length > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Top Course:</span>
                      <span className="font-medium">{courseData[0].fullName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Top Course Share:</span>
                      <span className="font-medium">{courseData[0].percentage}%</span>
                    </div>
                  </>
                )}
                {(selectedChart === 'online_vs_inperson' && chartData.summary.onlinePercent) && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Online:</span>
                      <span className="font-medium">{chartData.summary.online} ({chartData.summary.onlinePercent}%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">In-Person:</span>
                      <span className="font-medium">{chartData.summary.inPerson} ({chartData.summary.inPersonPercent}%)</span>
                    </div>
                  </>
                )}
                {(selectedChart === 'walk_in_analytics' && chartData.summary.walkInPercent) && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Walk-In:</span>
                      <span className="font-medium">{chartData.summary.walkIn} ({chartData.summary.walkInPercent}%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Scheduled:</span>
                      <span className="font-medium">{chartData.summary.scheduled} ({chartData.summary.scheduledPercent}%)</span>
                    </div>
                  </>
                )}
                {(selectedChart === 'missed_noshow_analytics' && chartData.summary.missedPercent) && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Missed/No-Show:</span>
                      <span className="font-medium">{chartData.summary.missed} ({chartData.summary.missedPercent}%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="font-medium">{chartData.summary.completed} ({chartData.summary.completedPercent}%)</span>
                    </div>
                  </>
                )}
                {!['course_popularity', 'online_vs_inperson', 'walk_in_analytics', 'missed_noshow_analytics'].includes(selectedChart) && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Average:</span>
                      <span className="font-medium">{chartData.summary.average != null ? chartData.summary.average.toFixed(1) : '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Min:</span>
                      <span className="font-medium">{chartData.summary.min ?? '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Max:</span>
                      <span className="font-medium">{chartData.summary.max ?? '—'}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Chart Visualization</CardTitle>
                <CardDescription>
                  {selectedChart.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportCSV}
                    disabled={exporting !== null || loading}
                    title="Export data as CSV"
                  >
                    {exporting === 'csv' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportPDF}
                    disabled={exporting !== null || loading}
                    title="Export report as PDF"
                  >
                    {exporting === 'pdf' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportChartImage}
                    disabled={exporting !== null || loading || !chartData}
                    title="Export chart as image"
                  >
                    {exporting === 'image' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {selectedChart === 'course_popularity' && (
                  <div className="flex gap-2">
                    <Button
                      variant={courseViewType === 'bar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCourseViewType('bar')}
                    >
                      Bar
                    </Button>
                    <Button
                      variant={courseViewType === 'pie' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCourseViewType('pie')}
                    >
                      Pie
                    </Button>
                    <Button
                      variant={courseViewType === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCourseViewType('table')}
                    >
                      Table
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
              <div ref={chartContainerRef} className="w-full">
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
                      <p className="text-sm text-destructive font-medium">{error}</p>
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
                ) : selectedChart === 'course_popularity' && courseViewType === 'table' ? (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-semibold text-sm">Rank</th>
                        <th className="text-left p-3 font-semibold text-sm">Course</th>
                        <th className="text-right p-3 font-semibold text-sm">Appointments</th>
                        <th className="text-right p-3 font-semibold text-sm">Percentage</th>
                        <th className="text-right p-3 font-semibold text-sm w-32">Visual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseData.map((course, index) => {
                        const maxValue = courseData[0]?.value || 1
                        const barWidth = (course.value / maxValue) * 100
                        return (
                          <tr key={index} className="border-t hover:bg-muted/50 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {index < 3 && (
                                  <span className={`text-lg ${
                                    index === 0 ? 'text-yellow-500' :
                                    index === 1 ? 'text-gray-400' :
                                    'text-orange-600'
                                  }`}>
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                  </span>
                                )}
                                <span className="font-medium text-muted-foreground">#{index + 1}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium">{course.fullName}</div>
                            </td>
                            <td className="p-3 text-right font-semibold">{course.value}</td>
                            <td className="p-3 text-right text-muted-foreground">{course.percentage}%</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${barWidth}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {courseData.length > 0 && (
                  <div className="text-sm text-muted-foreground text-center">
                    Total: {chartData?.summary?.total || 0} appointments across {courseData.length} courses
                  </div>
                )}
              </div>
            ) : phase3Data && selectedChart === 'capacity_planning' ? (
              phase3Data.recommendations ? (
                <div className="space-y-4 p-4">
                  {phase3Data.recommendations.length > 0 ? (
                    phase3Data.recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{rec.date}</p>
                            <p className="text-sm text-muted-foreground">{rec.reason}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            rec.recommendation === 'increase' ? 'bg-red-100 text-red-800' :
                            rec.recommendation === 'decrease' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {rec.recommendation.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Predicted</p>
                            <p className="font-semibold">{rec.predicted_appointments}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Recommended Tutors</p>
                            <p className="font-semibold">{rec.recommended_tutors}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Utilization</p>
                            <p className="font-semibold">{rec.utilization_rate}%</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Need at least 2 days of historical data to generate capacity planning recommendations.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                  <p className="text-lg font-semibold mb-2">Insufficient Data for Capacity Planning</p>
                  <p className="text-muted-foreground mb-4">
                    We need more historical appointment data to generate capacity planning recommendations.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try selecting a longer date range with appointment history or wait until more appointments are recorded.
                  </p>
                </div>
              )
            ) : comparisonData && selectedChart === 'time_period_comparison' ? (
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="font-semibold mb-2">Period 1</p>
                    <p className="text-sm text-muted-foreground">{comparisonData.period1?.start} to {comparisonData.period1?.end}</p>
                    <p className="text-2xl font-bold mt-2">{comparisonData.period1?.stats?.total_appointments || 0}</p>
                    <p className="text-sm">Appointments</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-semibold mb-2">Period 2</p>
                    <p className="text-sm text-muted-foreground">{comparisonData.period2?.start} to {comparisonData.period2?.end}</p>
                    <p className="text-2xl font-bold mt-2">{comparisonData.period2?.stats?.total_appointments || 0}</p>
                    <p className="text-sm">Appointments</p>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold mb-2">Change</p>
                  <p className={`text-2xl font-bold ${
                    comparisonData.comparison?.appointment_change_percentage > 0 ? 'text-green-600' : 
                    comparisonData.comparison?.appointment_change_percentage < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {comparisonData.comparison?.appointment_change_percentage > 0 ? '+' : ''}
                    {comparisonData.comparison?.appointment_change_percentage || 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {comparisonData.comparison?.appointment_difference > 0 ? '+' : ''}
                    {comparisonData.comparison?.appointment_difference || 0} appointments
                  </p>
                </div>
              </div>
            ) : heatmapData ? (
              heatmapData.data && heatmapData.data.length > 0 && heatmapData.max_value > 0 ? (
                <div className="space-y-4 p-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    Max value: {heatmapData.max_value || 0}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-2 text-left">{heatmapData.type === 'day_hour' ? 'Day' : heatmapData.type === 'tutor_day' ? 'Tutor' : 'Course'}</th>
                          {heatmapData.type === 'day_hour' ? (
                            Array.from({ length: 24 }, (_, i) => (
                              <th key={i} className="border p-2 text-center text-xs">{i}:00</th>
                            ))
                          ) : heatmapData.type === 'tutor_day' ? (
                            ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                              <th key={day} className="border p-2 text-center text-xs">{day}</th>
                            ))
                          ) : (
                            ['8:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'].map(slot => (
                              <th key={slot} className="border p-2 text-center text-xs">{slot}</th>
                            ))
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {heatmapData.data.map((row: any, idx: number) => {
                        const rowKey = heatmapData.type === 'day_hour' ? 'day' : heatmapData.type === 'tutor_day' ? 'tutor' : 'course'
                        return (
                          <tr key={idx}>
                            <td className="border p-2 font-medium">{row[rowKey]}</td>
                            {heatmapData.type === 'day_hour' ? (
                              Array.from({ length: 24 }, (_, hour) => {
                                const value = row[hour] || 0
                                const intensity = heatmapData.max_value > 0 ? (value / heatmapData.max_value) : 0
                                return (
                                  <td 
                                    key={hour} 
                                    className="border p-2 text-center text-xs"
                                    style={{ backgroundColor: `rgba(136, 132, 216, ${intensity})` }}
                                  >
                                    {value}
                                  </td>
                                )
                              })
                            ) : heatmapData.type === 'tutor_day' ? (
                              ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                const value = row[day] || 0
                                const intensity = heatmapData.max_value > 0 ? (value / heatmapData.max_value) : 0
                                return (
                                  <td 
                                    key={day} 
                                    className="border p-2 text-center text-xs"
                                    style={{ backgroundColor: `rgba(136, 132, 216, ${intensity})` }}
                                  >
                                    {value}
                                  </td>
                                )
                              })
                            ) : (
                              ['8:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'].map(slot => {
                                const value = row[slot] || 0
                                const intensity = heatmapData.max_value > 0 ? (value / heatmapData.max_value) : 0
                                return (
                                  <td 
                                    key={slot} 
                                    className="border p-2 text-center text-xs"
                                    style={{ backgroundColor: `rgba(136, 132, 216, ${intensity})` }}
                                  >
                                    {value}
                                  </td>
                                )
                              })
                            )}
                          </tr>
                        )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                  <p className="text-lg font-semibold mb-2">No Heatmap Data Available</p>
                  <p className="text-muted-foreground mb-4">
                    We need appointment data to generate heatmap visualizations.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try selecting a date range with appointments or adjust your filters to include more data.
                  </p>
                </div>
              )
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  {selectedChart === 'appointments_by_status' ? (
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
                  ) : selectedChart === 'course_popularity' && courseViewType === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={courseData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent, value }) => 
                          `${name.length > 15 ? name.substring(0, 15) + '...' : name}\n${value} (${(percent * 100).toFixed(1)}%)`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {courseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any, name: any, props: any) => [
                          `${value} appointments (${props.payload.percentage}%)`,
                          props.payload.fullName
                        ]}
                      />
                      <Legend 
                        formatter={(value, entry: any) => `${entry.payload.fullName} (${entry.payload.percentage}%)`}
                      />
                    </PieChart>
                  ) : selectedChart === 'course_popularity' && courseViewType === 'bar' ? (
                    <BarChart data={courseData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="fullName" 
                        type="category"
                        width={150}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value: any, name: any, props: any) => [
                          `${value} appointments (${props.payload.percentage}%)`,
                          props.payload.fullName
                        ]}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
                      />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                        {courseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
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
                  ) : selectedChart === 'online_vs_inperson' || 
                       selectedChart === 'walk_in_analytics' || 
                       selectedChart === 'missed_noshow_analytics' ? (
                    <PieChart>
                      <Pie
                        data={rechartsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent, value }) => `${name}\n${value} (${(percent * 100).toFixed(1)}%)`}
                        outerRadius={100}
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
                  ) : selectedChart === 'day_of_week_analytics' ? (
                    <BarChart data={rechartsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                        {rechartsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : selectedChart === 'monthly_trends' ? (
                    <LineChart data={rechartsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={{ fill: '#8884d8' }} />
                    </LineChart>
                  ) : selectedChart === 'instructor_analytics' ? (
                    <BarChart data={rechartsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category"
                        width={150}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                        {rechartsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : phase3Data && selectedChart === 'extended_forecast' ? (
                    phase3Data.forecast ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Predicted</p>
                            <p className="text-2xl font-bold">{phase3Data.forecast?.total_predicted || 0}</p>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Average Daily</p>
                            <p className="text-2xl font-bold">{phase3Data.forecast?.average_daily || 0}</p>
                          </div>
                        </div>
                        {phase3Data.forecast.daily_predictions && phase3Data.forecast.daily_predictions.length > 0 ? (
                          <LineChart data={phase3Data.forecast.daily_predictions} height={300}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="predicted" stroke="#8884d8" strokeWidth={2} />
                          </LineChart>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-[300px] text-center p-8">
                            <p className="text-muted-foreground">
                              Need at least 2 days of historical data to generate predictions.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                        <p className="text-lg font-semibold mb-2">Insufficient Data for Predictions</p>
                        <p className="text-muted-foreground mb-4">
                          We need more historical appointment data to generate accurate 30-day forecasts.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Try selecting a longer date range or wait until more appointments are recorded.
                        </p>
                      </div>
                    )
                  ) : phase3Data && selectedChart === 'course_demand' ? (
                    phase3Data.predictions && phase3Data.predictions.length > 0 ? (
                      <BarChart data={phase3Data.predictions} layout="vertical" height={400}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="course_name" type="category" width={200} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="predicted_appointments" fill="#8884d8" />
                      </BarChart>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                        <p className="text-lg font-semibold mb-2">No Course Demand Data Available</p>
                        <p className="text-muted-foreground mb-4">
                          We need historical course appointment data to predict future demand.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Try selecting a date range with course appointments or wait until more data is available.
                        </p>
                      </div>
                    )
                  ) : phase3Data && selectedChart === 'tutor_workload' ? (
                    phase3Data.predictions && phase3Data.predictions.length > 0 ? (
                      <BarChart data={phase3Data.predictions} layout="vertical" height={400}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="tutor_name" type="category" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="predicted_appointments" fill="#8884d8" />
                      </BarChart>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                        <p className="text-lg font-semibold mb-2">No Tutor Workload Data Available</p>
                        <p className="text-muted-foreground mb-4">
                          We need historical tutor appointment data to predict future workload.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Try selecting tutors with appointment history or wait until more appointments are recorded.
                        </p>
                      </div>
                    )
                  ) : phase3Data && selectedChart === 'peak_hours_enhanced' ? (
                    phase3Data.peak_hours && phase3Data.peak_hours.length > 0 ? (
                      <BarChart data={phase3Data.peak_hours} height={300}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="predicted_count" fill="#8884d8">
                          {phase3Data.peak_hours.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.is_peak ? '#ff7300' : '#8884d8'} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                        <p className="text-lg font-semibold mb-2">No Peak Hours Data Available</p>
                        <p className="text-muted-foreground mb-4">
                          We need historical appointment time data to identify peak hours.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Try selecting a date range with appointments that have time information.
                        </p>
                      </div>
                    )
                  ) : comparisonData && (selectedChart === 'tutor_comparison' || selectedChart === 'course_comparison') ? (
                    comparisonData.comparisons && comparisonData.comparisons.length > 0 ? (
                      <BarChart data={comparisonData.comparisons.map((comp: any) => ({
                        name: comp.tutor_name || comp.course_name,
                        appointments: comp.stats?.total_appointments || 0,
                        hours: comp.stats?.total_hours || 0
                      }))} height={300}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="appointments" fill="#8884d8" />
                        <Bar dataKey="hours" fill="#82ca9d" />
                      </BarChart>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                        <p className="text-lg font-semibold mb-2">No Comparison Data Available</p>
                        <p className="text-muted-foreground mb-4">
                          We need appointment data for the selected {selectedChart === 'tutor_comparison' ? 'tutors' : 'courses'} to generate comparisons.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedChart === 'tutor_comparison' 
                            ? 'Make sure you have selected at least 2 tutors with appointment history.'
                            : 'Make sure you have selected at least 2 courses with appointment history.'}
                        </p>
                      </div>
                    )
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
              </div>
          </CardContent>
        </Card>
      </div>

      {/* ML Predictive Analytics */}
      <PredictiveAnalytics />
    </div>
  )
}
