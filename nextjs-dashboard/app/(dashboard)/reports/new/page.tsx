'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ClientReportForm } from '@/components/reports/ClientReportForm'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get('appointment_id')

  const handleSave = async (data: any) => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save report')
      }

      toast.success('Report saved successfully')
      router.push('/reports')
    } catch (error: any) {
      console.error('Error saving report:', error)
      toast.error(error.message || 'Failed to save report')
      throw error
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit report')
      }

      toast.success('Report submitted successfully')
      router.push('/reports')
    } catch (error: any) {
      console.error('Error submitting report:', error)
      toast.error(error.message || 'Failed to submit report')
      throw error
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/reports">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">New Client Report</h1>
        <p className="text-gray-600 mt-2">
          Complete the form below to create a new client report.
          {appointmentId && ' This report is linked to an appointment.'}
        </p>
      </div>

      <ClientReportForm
        appointmentId={appointmentId || undefined}
        onSave={handleSave}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
