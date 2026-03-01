import { redirect } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
          <CardTitle>Replica / new features</CardTitle>
          <CardDescription>
            The WCOnline-style week schedule lives in the main <strong>Scheduling</strong> section (Schedule Grid tab).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/scheduling">
            <Button variant="outline">Go to Scheduling (week view)</Button>
          </Link>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>All data is read from and written to <strong>Supabase only</strong> (no WCOnline API fetch). See <code className="bg-muted px-1 rounded">docs/DATA-SOURCE-POLICY.md</code>.</li>
            <li>Creating appointments or tutors on the website stores them in Supabase; schedule, calendar, and reports reflect that data.</li>
            <li>Existing data in Supabase is kept; new rows use <code className="bg-muted px-1 rounded">source = &apos;replica&apos;</code> or <code className="bg-muted px-1 rounded">manual</code> when created from the site.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
