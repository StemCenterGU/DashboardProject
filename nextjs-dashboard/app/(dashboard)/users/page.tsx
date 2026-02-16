"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

const ROLES = [
  { value: "tutor", label: "Tutor" },
  { value: "lead_tutor", label: "Lead Tutor" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
  { value: "developer", label: "Developer" },
] as const

type UserRow = {
  user_id: string
  email: string
  full_name: string | null
  role: string
  active: boolean
  created_at: string
  last_login: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/users")
      if (res.status === 403) {
        setError("You need admin or manager role to view this page.")
        setUsers([])
        return
      }
      if (!res.ok) throw new Error("Failed to load users")
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (email: string, newRole: string) => {
    setUpdating(email)
    try {
      const res = await fetch("/api/admin/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Failed to update role")
        return
      }
      setUsers((prev) =>
        prev.map((u) => (u.email === email ? { ...u, role: newRole } : u))
      )
    } catch (e) {
      alert("Failed to update role")
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Loading users…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription className="text-destructive">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage roles. Use the dropdown to set a user to Developer or another role.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User table</CardTitle>
          <CardDescription>Change role via the dropdown; updates are saved to the database.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Email</th>
                  <th className="text-left p-2 font-medium">Name</th>
                  <th className="text-left p-2 font-medium">Role</th>
                  <th className="text-left p-2 font-medium">Active</th>
                  <th className="text-left p-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} className="border-b">
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{u.full_name || "—"}</td>
                    <td className="p-2">
                      <select
                        value={u.role}
                        disabled={updating === u.email}
                        onChange={(e) => handleRoleChange(u.email, e.target.value)}
                        className="border rounded px-2 py-1 bg-background text-foreground min-w-[120px]"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      {updating === u.email && (
                        <span className="ml-2 text-muted-foreground text-xs">Saving…</span>
                      )}
                    </td>
                    <td className="p-2">{u.active ? "Yes" : "No"}</td>
                    <td className="p-2 text-muted-foreground">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <p className="text-muted-foreground py-4">No users found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
