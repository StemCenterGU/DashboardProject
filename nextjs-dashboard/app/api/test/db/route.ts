import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Test database connection and permissions
 * GET /api/test/db
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const config = {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey,
    }

    if (!supabaseUrl) {
      return NextResponse.json({
        error: 'NEXT_PUBLIC_SUPABASE_URL not set',
        config,
      }, { status: 503 })
    }

    // Test with service role key (if available)
    if (supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      // Test read
      const { data: users, error: readError } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      // Test write (insert a test user, then delete it)
      const testEmail = `test-${Date.now()}@test.com`
      const { data: testInsert, error: insertError } = await supabase
        .from('users')
        .insert({
          email: testEmail,
          full_name: 'Test User',
          role: 'tutor',
          active: true,
        })
        .select('user_id')
        .single()

      if (testInsert) {
        // Clean up test user
        await supabase
          .from('users')
          .delete()
          .eq('user_id', testInsert.user_id)
      }

      return NextResponse.json({
        success: true,
        config,
        tests: {
          read: readError ? { error: readError.message } : { success: true },
          write: insertError 
            ? { error: insertError.message, code: insertError.code, details: insertError.details }
            : { success: true, testUserCreated: !!testInsert },
        },
        message: insertError 
          ? `Database connection works, but INSERT failed: ${insertError.message}`
          : 'Database connection and permissions are working correctly',
      })
    }

    // Test with anon key
    if (supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      const { data: users, error: readError } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      return NextResponse.json({
        success: true,
        config,
        tests: {
          read: readError ? { error: readError.message } : { success: true },
          write: { skipped: 'No service role key - cannot test writes' },
        },
        message: 'Using anon key - writes may be blocked by RLS policies',
        recommendation: 'Set SUPABASE_SERVICE_ROLE_KEY for user registration',
      })
    }

    return NextResponse.json({
      error: 'No Supabase keys configured',
      config,
    }, { status: 503 })

  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Test failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}

