"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Loader2, Search, Clock, CheckCircle2, XCircle, Eye, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/contexts/AuthContext"
import { hasPermission } from "@/lib/roles"

interface ScheduleRequest {
  request_id: string
  tutor_id: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at?: string
  tutors: {
    tutor_name: string
    username: string
    role: string
  }
  users: {
    email: string
    full_name: string
  }
  changeCount: number
  addCount: number
  deleteCount: number
  modifyCount: number
}

export default function AdminScheduleRequestsPage() {
  const [requests, setRequests] = useState<ScheduleRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ScheduleRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending')
  const { toast } = useToast()
  const { role, isLoading: authLoading } = useUser()
  const router = useRouter()

  // Check permissions
  const canViewRequests = role ? hasPermission(role, 'VIEW_SCHEDULE_REQUESTS') : false

  useEffect(() => {
    if (!authLoading && !canViewRequests) {
      router.push('/tutor-schedules')
      toast({
        title: "Access Denied",
        description: "You don't have permission to view schedule requests.",
        variant: "destructive",
      })
    }
  }, [authLoading, canViewRequests, router, toast])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const url = `/api/admin/schedule-requests?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`
      const response = await fetch(url)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch requests')
      }

      const data = await response.json()
      setRequests(data.requests || [])
      setFilteredRequests(data.requests || [])
    } catch (error: any) {
      console.error('Fetch requests error:', error)
      toast({
        title: "Error Loading Requests",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canViewRequests && !authLoading) {
      fetchRequests()
    }
  }, [statusFilter, canViewRequests, authLoading])

  // Filter by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRequests(requests)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredRequests(
        requests.filter((req) =>
          req.tutors.tutor_name.toLowerCase().includes(query) ||
          req.tutors.username.toLowerCase().includes(query) ||
          req.users.email.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, requests])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (authLoading || (!canViewRequests && loading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!canViewRequests) {
    return null
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schedule Change Requests</h1>
        <p className="text-gray-600 mt-1">Review and approve tutor schedule changes</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by tutor name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
            <TabsList>
              <TabsTrigger value="pending">Pending Only</TabsTrigger>
              <TabsTrigger value="all">All Requests</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading requests...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Requests Found</h3>
          <p className="text-gray-500">
            {searchQuery
              ? `No requests matching "${searchQuery}"`
              : statusFilter === 'pending'
              ? "All schedule change requests have been reviewed"
              : "No schedule change requests yet"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Showing {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
          {filteredRequests.map((request) => (
            <Card key={request.request_id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.tutors.tutor_name}
                    </h3>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Submitted:</span> {formatDate(request.submitted_at)}
                    </p>
                    {request.reviewed_at && (
                      <p>
                        <span className="font-medium">Reviewed:</span> {formatDate(request.reviewed_at)}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Changes:</span>{' '}
                      {request.addCount > 0 && (
                        <span className="text-green-600">{request.addCount} added</span>
                      )}
                      {request.addCount > 0 && (request.modifyCount > 0 || request.deleteCount > 0) && ', '}
                      {request.modifyCount > 0 && (
                        <span className="text-blue-600">{request.modifyCount} modified</span>
                      )}
                      {request.modifyCount > 0 && request.deleteCount > 0 && ', '}
                      {request.deleteCount > 0 && (
                        <span className="text-red-600">{request.deleteCount} deleted</span>
                      )}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/schedule-requests/${request.request_id}`)}
                  className="ml-4"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {request.status === 'pending' ? 'Review' : 'View Details'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
