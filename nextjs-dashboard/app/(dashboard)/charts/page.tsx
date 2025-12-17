"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// Select component will be added when needed - using Button for now
import { BarChart3, TrendingUp, Users, Calendar } from "lucide-react"
import { useState } from "react"

export default function ChartsPage() {
  const [selectedChart, setSelectedChart] = useState("appointments_per_tutor")
  const [dateRange, setDateRange] = useState("all")

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
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Loading data...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Loading data...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tutors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Loading data...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Loading data...</p>
          </CardContent>
        </Card>
      </div>

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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chart Visualization</CardTitle>
            <CardDescription>Data visualization will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
              <div className="text-center space-y-2">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Chart will be rendered here using Recharts
                </p>
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedChart.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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

