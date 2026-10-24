import { redirect } from "next/navigation"

// User management lives at /admin/users
export default function UsersPage() {
  redirect("/admin/users")
}
