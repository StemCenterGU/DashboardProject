import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code2 } from "lucide-react"

export default async function ReplicaPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  // Latest/new features are developer-only (not admin)
  if (user.role !== "developer") {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Code2 className="h-8 w-8" />
          WCOnline Replica
        </h1>
        <p className="text-muted-foreground">
          New and latest features live here. Only visible when logged in with the <strong>developer</strong> role.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming next</CardTitle>
          <CardDescription>
            Replica of the WCOnline booking site — same tables, <code className="text-xs bg-muted px-1 rounded">source = &apos;replica&apos;</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>Student-facing booking UI (replica of WCOnline)</li>
            <li>Appointments and slots with <code className="bg-muted px-1 rounded">source = &apos;replica&apos;</code></li>
            <li>Dashboard continues to show WCOnline-synced data; replica data appears in the same views</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
