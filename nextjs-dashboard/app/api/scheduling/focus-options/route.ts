import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { requireAuth } from "@/lib/auth"

/**
 * Get focus/course options for filtering
 * GET /api/scheduling/focus-options
 * Requires: Authentication
 */
export async function GET() {
  try {
    // Require authentication
    await requireAuth()
  } catch (error) {
    return NextResponse.json(
      { error: "Unauthorized - authentication required" },
      { status: 401 }
    )
  }

  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const res = await supabase
      .from("course_focus_options")
      .select("focus_id, course_code, focus_label")
      .eq("active", true)
      .order("focus_label")

    if (res.error) {
      return NextResponse.json({ error: res.error.message }, { status: 500 })
    }

    return NextResponse.json({ options: res.data ?? [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

