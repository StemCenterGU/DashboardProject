'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Search, FileText, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Report {
  report_id: string
  client_name: string
  report_date: string
  location: string
  staff: {
    tutor_name: string
  }
  course: {
    course_code: string
    course_name: string
  } | null
  created_at: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchReports()
  }, [startDate, endDate])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      const response = await fetch(`/api/reports?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReports = reports.filter((report) =>
    report.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Client Reports</h1>
          <p className="text-gray-600 mt-1">View and manage all client appointment reports</p>
        </div>
        <Link href="/reports/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
              />
            </div>
            <div>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No reports found</p>
          <Link href="/reports/new">
            <Button variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Report
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReports.map((report) => (
            <Link key={report.report_id} href={`/reports/${report.report_id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">{report.client_name}</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(report.report_date), 'MMM dd, yyyy')}</span>
                        </div>
                        {report.staff && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{report.staff.tutor_name}</span>
                          </div>
                        )}
                        {report.course && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{report.course.course_code}</span>
                          </div>
                        )}
                        {report.location && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {report.location}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Created {format(new Date(report.created_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
