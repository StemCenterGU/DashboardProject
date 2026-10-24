import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { isFullAccess } from "@/lib/roles"

export default async function ReplicaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user || !isFullAccess(user.role)) {
    redirect("/dashboard")
  }
  return <>{children}</>
}
