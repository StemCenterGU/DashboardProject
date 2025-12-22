import { NextRequest, NextResponse } from 'next/server'
import { WCOnlineService } from '@/lib/wconline'

/**
 * Inspect WCOnline API Response Structure
 * 
 * GET /api/sync/wconline/inspect?type=APPTS&date=2025-01-15
 * 
 * This endpoint helps you see what fields WCOnline actually returns
 * so we can update the field mapping accordingly.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const requestType = (searchParams.get('type') || 'APPTS') as 'AVAIL' | 'SCHED' | 'APPTS' | 'STAFF' | 'CUSTOM'
    const dateParam = searchParams.get('date')
    
    let inspectDate: Date | undefined
    if (dateParam) {
      inspectDate = new Date(dateParam)
      if (isNaN(inspectDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        )
      }
    }

    const wconline = new WCOnlineService()

    // Fetch raw data
    let rawData: any = null
    let filteredData: any[] = []
    let allFields: Set<string> = new Set()

    try {
      switch (requestType) {
        case 'APPTS':
          filteredData = await wconline.getAppointments(inspectDate)
          break
        case 'STAFF':
          filteredData = await wconline.getTutors()
          break
        case 'SCHED':
          filteredData = await wconline.getSchedule(inspectDate)
          break
        case 'AVAIL':
          filteredData = await wconline.getAvailability(inspectDate)
          break
        case 'CUSTOM':
          rawData = await wconline.getCustomData(inspectDate)
          break
      }

      // Collect all field names from filtered data
      if (Array.isArray(filteredData)) {
        filteredData.forEach((item: any) => {
          if (item && typeof item === 'object') {
            Object.keys(item).forEach(key => allFields.add(key))
          }
        })
      }

      // Get sample record
      const sampleRecord = filteredData.length > 0 ? filteredData[0] : null

      return NextResponse.json({
        success: true,
        request_type: requestType,
        date: inspectDate ? inspectDate.toISOString().split('T')[0] : 'today',
        summary: {
          total_records: filteredData.length,
          total_fields: allFields.size,
          fields: Array.from(allFields).sort(),
        },
        sample_record: sampleRecord,
        all_records: filteredData.slice(0, 5), // First 5 records
        field_analysis: sampleRecord ? Object.keys(sampleRecord).map(key => ({
          field_name: key,
          field_type: typeof sampleRecord[key],
          sample_value: sampleRecord[key],
          is_empty: !sampleRecord[key] || sampleRecord[key] === '',
        })) : [],
        notes: [
          'This shows the actual structure returned by WCOnline API',
          'Use this to verify field names and update mapping if needed',
          'Check which fields are required vs optional',
        ],
      })
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: error.message,
        message: 'Failed to fetch from WCOnline. Check API key and IP whitelisting.',
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to inspect WCOnline data' },
      { status: 500 }
    )
  }
}

