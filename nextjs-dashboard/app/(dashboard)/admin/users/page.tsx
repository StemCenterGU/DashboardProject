/**
 * Admin User Management Page
 * Allows admins to view all users and change their roles
 */

'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Loader2, UserCog, RefreshCw } from 'lucide-react'
import { isAdminLevel, ALL_ROLES, ROLE_DISPLAY_NAMES, type Role } from '@/lib/roles'

// Role badge colors
const roleColors: Record<Role, string> = {
  tutor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  lead_tutor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  manager: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  developer: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
}

interface User {
  user_id: string
  email: string
  full_name?: string
  role: Role
  created_at: string
  updated_at?: string
}

export default function AdminUsersPage() {
  const { role, user, isLoading: authLoading } = useUser()
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  // Redirect if not admin
  useEffect(() => {
    if (authLoading) return
    if (!isAdminLevel(role)) {
      router.push('/dashboard')
    }
  }, [role, authLoading, router])

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter)

      const res = await fetch(`/api/admin/users?${params.toString()}`)

      if (!res.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdminLevel(role)) {
      fetchUsers()
    }
  }, [role, search, roleFilter])

  // Update user role
  const handleRoleChange = async (userId: string, newRole: Role) => {
    // Prevent changing own role
    if (user && userId === user.id) {
      alert('You cannot change your own role')
      return
    }

    if (!confirm(`Are you sure you want to change this user's role to ${ROLE_DISPLAY_NAMES[newRole]}?`)) {
      return
    }

    try {
      setUpdatingUserId(userId)

      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update role')
      }

      // Update local state
      setUsers(
        users.map((u) =>
          u.user_id === userId ? { ...u, role: newRole } : u
        )
      )

      alert('Role updated successfully!')
    } catch (error: any) {
      console.error('Error updating role:', error)
      alert(error.message || 'Failed to update role')
    } finally {
      setUpdatingUserId(null)
    }
  }

  // Don't render if not admin
  if (authLoading || !isAdminLevel(role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <UserCog className="h-6 w-6" />
                User Management
              </CardTitle>
              <CardDescription>
                View and manage user roles and permissions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {users.length} Users
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ALL_ROLES.map((roleOption) => (
                  <SelectItem key={roleOption} value={roleOption}>
                    {ROLE_DISPLAY_NAMES[roleOption]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(search || roleFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setRoleFilter('all')
                }}
              >
                Clear
              </Button>
            )}
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No users found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Change Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userItem) => (
                    <TableRow key={userItem.user_id}>
                      <TableCell className="font-medium">
                        {userItem.full_name || 'Unnamed'}
                        {user && userItem.user_id === user.id && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            You
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-gray-600">
                        {userItem.email}
                      </TableCell>

                      <TableCell>
                        <Badge className={roleColors[userItem.role]}>
                          {ROLE_DISPLAY_NAMES[userItem.role]}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-sm text-gray-600">
                        {new Date(userItem.created_at).toLocaleDateString()}
                      </TableCell>

                      <TableCell className="text-right">
                        <Select
                          value={userItem.role}
                          onValueChange={(newRole) =>
                            handleRoleChange(userItem.user_id, newRole as Role)
                          }
                          disabled={updatingUserId === userItem.user_id}
                        >
                          <SelectTrigger className="w-[180px] ml-auto">
                            {updatingUserId === userItem.user_id && (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            )}
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_ROLES.map((roleOption) => (
                              <SelectItem key={roleOption} value={roleOption}>
                                {ROLE_DISPLAY_NAMES[roleOption]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
