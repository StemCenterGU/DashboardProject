'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClientReportForm } from '@/components/reports/ClientReportForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ReportViewPageProps {
  params: Promise<{ id: string }>
}

export default function ReportViewPage({ params }: ReportViewPageProps) {
  const router = useRouter()
  const [reportId, setReportId] = useState<string | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(({ id }) => {
      setReportId(id)
      fetchReport(id)
    })
  }, [params])

  const fetchReport = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/${id}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data.report)
      } else {
        toast.error('Failed to load report')
        router.push('/reports')
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      toast.error('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: any) => {
    if (!reportId) return

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update report')
      }

      toast.success('Report updated successfully')
      fetchReport(reportId)
    } catch (error: any) {
      console.error('Error updating report:', error)
      toast.error(error.message || 'Failed to update report')
      throw error
    }
  }

  const handleSubmit = async (data: any) => {
    // Same as save for existing reports
    await handleSave(data)
  }

  const handleDelete = async () => {
    if (!reportId) return

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete report')
      }

      toast.success('Report deleted successfully')
      router.push('/reports')
    } catch (error: any) {
      console.error('Error deleting report:', error)
      toast.error(error.message || 'Failed to delete report')
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading report...</p>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return null
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/reports">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </Link>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Report
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the report.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Client Report</h1>
        <p className="text-gray-600 mt-2">Update the report details below.</p>
      </div>

      <ClientReportForm
        initialData={reportData}
        onSave={handleSave}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
