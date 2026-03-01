import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { requireAdmin, requireAuth } from "@/lib/auth"

/**
 * Create a new tutor
 * POST /api/scheduling/tutors
 * Requires: admin or manager role
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin/manager authentication
    await requireAdmin()
  } catch (error) {
    return NextResponse.json(
      { error: "Unauthorized - admin or manager role required" },
      { status: 401 }
    )
  }

  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const body = await request.json()
    const { tutor_name } = body as { tutor_name: string }

    if (!tutor_name || typeof tutor_name !== "string" || !tutor_name.trim()) {
      return NextResponse.json({ error: "Missing or invalid tutor_name" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("tutors")
      .insert({ tutor_name: tutor_name.trim() })
      .select("tutor_id, tutor_name")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "A tutor with this name already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tutor: data, created: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Get all tutors
 * GET /api/scheduling/tutors
 * Requires: Authentication
 */
export async function GET(request: NextRequest) {
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

    const { data: tutors, error } = await supabase
      .from("tutors")
      .select("tutor_id, tutor_name")
      .order("tutor_name")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      tutors: tutors || [],
      count: tutors?.length || 0
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

