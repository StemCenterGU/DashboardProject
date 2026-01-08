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
        date_range: 'custom',
        custom_start_date: today,
        custom_end_date: today
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
        throw new Error('Failed to export CSV')
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
    } catch (err) {
      console.error('Error exporting CSV:', err)
      alert('Failed to export CSV. Please try again.')
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
            </select>
            
            {chartData?.summary && (
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{chartData.summary.total}</span>
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
