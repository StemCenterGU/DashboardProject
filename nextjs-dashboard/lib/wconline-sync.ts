/**
 * WCOnline Data Sync Service
 * Transforms and syncs WCOnline data to Supabase
 */

import { WCOnlineService, WCOnlineAppointment, WCOnlineTutor } from './wconline'
import { createServerClient } from './supabase-server'

export interface SyncResult {
  success: boolean
  appointments: {
    fetched: number
    synced: number
    errors: number
  }
  availableSlots: {
    fetched: number
    synced: number
    errors: number
  }
  tutors: {
    fetched: number
    synced: number
    errors: number
  }
  courses: {
    fetched: number
    synced: number
    errors: number
  }
  errors: string[]
  syncTime: string
}

export class WCOnlineSyncService {
  private wconline: WCOnlineService
  private supabase: any

  constructor(supabase: any) {
    this.wconline = new WCOnlineService()
    this.supabase = supabase
  }

  /**
   * Normalize tutor name/email for matching
   */
  private normalizeTutorIdentifier(tutorName?: string, tutorEmail?: string): string {
    return (tutorEmail || tutorName || '').toLowerCase().trim()
  }

  /**
   * Find or create tutor in Supabase
   */
  private async findOrCreateTutor(
    wconlineTutor: WCOnlineTutor | { tutor_name?: string; tutor_email?: string }
  ): Promise<string | null> {
    const t = wconlineTutor as { tutor_name?: string; tutor_email?: string; name?: string; full_name?: string; email?: string }
    const tutorName = t.tutor_name || t.name || t.full_name
    const tutorEmail = t.tutor_email || t.email

    if (!tutorName && !tutorEmail) {
      console.warn('⚠️ No tutor name or email provided')
      return null
    }
    
    console.log(`🔍 Finding/creating tutor: ${tutorName || 'no name'} (${tutorEmail || 'no email'})`)

    // Try to find existing tutor by email first
    if (tutorEmail) {
      const { data: users, error: emailError } = await this.supabase
        .from('users')
        .select('user_id, email, full_name')
        .eq('email', tutorEmail.toLowerCase())
        .limit(1)

      if (emailError) {
        console.error('❌ Error finding user by email:', emailError)
      }

      if (users && users.length > 0) {
        const userId = users[0].user_id
        console.log(`✅ Found user by email: ${userId}`)

        // Check if tutor record exists
        const { data: tutors } = await this.supabase
          .from('tutors')
          .select('tutor_id')
          .eq('user_id', userId)
          .limit(1)

        if (tutors && tutors.length > 0) {
          console.log(`✅ Found existing tutor: ${tutors[0].tutor_id}`)
          return tutors[0].tutor_id
        }

        // Create tutor record
        console.log(`📝 Creating tutor record for user ${userId}`)
        const { data: newTutor, error } = await this.supabase
          .from('tutors')
          .insert({
            user_id: userId,
            is_available: true,
          })
          .select('tutor_id')
          .single()

        if (!error && newTutor) {
          console.log(`✅ Created tutor: ${newTutor.tutor_id}`)
          return newTutor.tutor_id
        } else if (error) {
          console.error('❌ Error creating tutor:', error)
        }
      } else {
        console.log(`ℹ️ No user found with email: ${tutorEmail}`)
      }
    }

    // Try to find by name (if no email or email search failed)
    if (tutorName) {
      console.log(`🔍 Searching for tutor by name: ${tutorName}`)
      const { data: users, error: nameError } = await this.supabase
        .from('users')
        .select('user_id, full_name')
        .ilike('full_name', `%${tutorName}%`)
        .limit(1)

      if (nameError) {
        console.error('❌ Error finding user by name:', nameError)
      }

      if (users && users.length > 0) {
        const userId = users[0].user_id
        console.log(`✅ Found user by name: ${userId}`)

        const { data: tutors } = await this.supabase
          .from('tutors')
          .select('tutor_id')
          .eq('user_id', userId)
          .limit(1)

        if (tutors && tutors.length > 0) {
          console.log(`✅ Found existing tutor: ${tutors[0].tutor_id}`)
          return tutors[0].tutor_id
        } else {
          // Create tutor record
          console.log(`📝 Creating tutor record for user ${userId}`)
          const { data: newTutor, error } = await this.supabase
            .from('tutors')
            .insert({
              user_id: userId,
              is_available: true,
            })
            .select('tutor_id')
            .single()

          if (!error && newTutor) {
            console.log(`✅ Created tutor: ${newTutor.tutor_id}`)
            return newTutor.tutor_id
          } else if (error) {
            console.error('❌ Error creating tutor:', error)
          }
        }
      } else {
        console.warn(`⚠️ No user found with name matching: ${tutorName}`)
        
        // If no user found and we have a tutor name, create a user for the tutor
        // This is needed for CUSTOM data which only has names, not emails
        if (tutorName && !tutorEmail) {
          console.log(`📝 Creating user for tutor: ${tutorName}`)
          
          // Generate a placeholder email (won't be used for login, just for database)
          const placeholderEmail = `${tutorName.toLowerCase().replace(/[^a-z0-9]/g, '')}@tutor.gannon.edu`
          
          // Check if placeholder email already exists
          const { data: existingUser } = await this.supabase
            .from('users')
            .select('user_id')
            .eq('email', placeholderEmail)
            .single()
          
          if (existingUser) {
            // User exists, create tutor record
            const { data: newTutor, error } = await this.supabase
              .from('tutors')
              .insert({
                user_id: existingUser.user_id,
                is_available: true,
              })
              .select('tutor_id')
              .single()
            
            if (!error && newTutor) {
              console.log(`✅ Created tutor for existing user: ${newTutor.tutor_id}`)
              return newTutor.tutor_id
            }
          } else {
            // Create new user and tutor
            const { data: newUser, error: userError } = await this.supabase
              .from('users')
              .insert({
                email: placeholderEmail,
                full_name: tutorName,
                role: 'tutor',
                active: true,
              })
              .select('user_id')
              .single()
            
            if (!userError && newUser) {
              console.log(`✅ Created user: ${newUser.user_id}`)
              
              // Create tutor record
              const { data: newTutor, error: tutorError } = await this.supabase
                .from('tutors')
                .insert({
                  user_id: newUser.user_id,
                  is_available: true,
                })
                .select('tutor_id')
                .single()
              
              if (!tutorError && newTutor) {
                console.log(`✅ Created tutor: ${newTutor.tutor_id}`)
                return newTutor.tutor_id
              }
            }
          }
        }
      }
    }

    // Could not find or create tutor
    console.warn(`❌ Could not find or create tutor for: ${tutorName || tutorEmail}`)
    return null
  }

  /**
   * Find or create course in Supabase
   */
  private async findOrCreateCourse(
    courseCode?: string,
    courseName?: string
  ): Promise<string | null> {
    if (!courseCode && !courseName) {
      return null
    }

    // Try to find by course code
    if (courseCode) {
      const { data: courses } = await this.supabase
        .from('courses')
        .select('course_id')
        .eq('course_code', courseCode.toUpperCase())
        .limit(1)

      if (courses && courses.length > 0) {
        return courses[0].course_id
      }
    }

    // Try to find by name
    if (courseName) {
      const { data: courses } = await this.supabase
        .from('courses')
        .select('course_id')
        .ilike('course_name', `%${courseName}%`)
        .limit(1)

      if (courses && courses.length > 0) {
        return courses[0].course_id
      }
    }

    // Create new course
    const courseData: any = {
      active: true,
    }

    if (courseCode) {
      courseData.course_code = courseCode.toUpperCase()
    }
    if (courseName) {
      courseData.course_name = courseName
    } else if (courseCode) {
      courseData.course_name = courseCode
    }

    const { data: newCourse, error } = await this.supabase
      .from('courses')
      .insert(courseData)
      .select('course_id')
      .single()

    if (!error && newCourse) {
      return newCourse.course_id
    }

    return null
  }

  /**
   * Transform WCOnline appointment to Supabase format
   */
  private async transformAppointment(
    wcAppt: WCOnlineAppointment
  ): Promise<any | null> {
    // Extract data from WCOnline format (handle both snake_case and "Title Case" field names)
    const studentName = wcAppt.student_name || (wcAppt as any)['Student Name'] || ''
    const tutorName = wcAppt.tutor_name || (wcAppt as any)['Staff or Resource'] || ''
    const tutorEmail = wcAppt.tutor_email || (wcAppt as any)['Staff Email'] || ''
    const courseCode = wcAppt.course_code || (wcAppt as any)['Course Code'] || wcAppt.course || (wcAppt as any)['Course'] || ''
    const courseName = wcAppt.course_name || (wcAppt as any)['Course Name'] || wcAppt.course || (wcAppt as any)['Course'] || ''
    
    // Parse date and time (handle field name variations)
    const dateStr = wcAppt.date || wcAppt.appointment_date || (wcAppt as any)['Appointment Date'] || ''
    const timeStr = wcAppt.time || wcAppt.start_time || (wcAppt as any)['Start Time'] || ''
    const endTimeStr = wcAppt.end_time || (wcAppt as any)['End Time'] || ''
    const duration = wcAppt.duration || 0
    
    console.log(`📝 Extracted appointment data:`, {
      student: studentName || 'no student',
      tutor: tutorName || 'no tutor',
      course: courseCode || courseName || 'no course',
      date: dateStr || 'no date',
      start: timeStr || 'no start time',
      end: endTimeStr || 'no end time'
    })

    // Find or create tutor
    const tutorId = await this.findOrCreateTutor({
      tutor_name: tutorName,
      tutor_email: tutorEmail,
    })

    if (!tutorId) {
      console.warn(`Could not find/create tutor for: ${tutorName || tutorEmail}`)
      return null
    }

    // Find or create course
    const courseId = await this.findOrCreateCourse(courseCode, courseName)

    if (!courseId) {
      console.warn(`Could not find/create course for: ${courseCode || courseName}`)
      return null
    }

    // Parse date (handle different formats)
    let appointmentDate = dateStr
    if (dateStr && dateStr.length === 8) {
      // YYYYMMDD format
      appointmentDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
    }

    // Parse time - convert to 24-hour format if needed
    let startTime = this.convertTo24Hour(timeStr)
    let endTime = this.convertTo24Hour(endTimeStr)
    
    console.log(`⏰ Time conversion:`, {
      original: { start: timeStr, end: endTimeStr },
      converted: { start: startTime, end: endTime }
    })

    // If we have duration but no end time, calculate it
    if (startTime && duration && !endTime) {
      const [hours, minutes] = startTime.split(':').map(Number)
      const startDate = new Date()
      startDate.setHours(hours, minutes, 0, 0)
      startDate.setMinutes(startDate.getMinutes() + duration)
      endTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`
      console.log(`⏰ Calculated end time from duration: ${endTime}`)
    }
    
    if (!startTime || !endTime) {
      console.warn('⚠️ Missing start or end time after conversion')
      return null
    }

    // Map status
    const statusMap: Record<string, string> = {
      scheduled: 'scheduled',
      confirmed: 'confirmed',
      completed: 'completed',
      cancelled: 'cancelled',
      canceled: 'cancelled',
      no_show: 'cancelled',
    }
    const status = statusMap[wcAppt.status?.toLowerCase() || ''] || 'scheduled'

    // Generate unique appointment ID from WCOnline data
    const appointmentId = wcAppt.id || wcAppt.appointment_id || 
      `${tutorId}-${appointmentDate}-${startTime}`.replace(/[^a-zA-Z0-9-]/g, '-')

    return {
      appointment_id: appointmentId,
      tutor_id: tutorId,
      student_name: studentName,
      course_id: courseId,
      appointment_date: appointmentDate,
      start_time: startTime,
      end_time: endTime || startTime,
      duration: duration || 1, // Default to 1 hour if not specified
      status: status,
      notes: wcAppt.notes || '',
      source: 'wconline', // Mark as coming from WCOnline
    }
  }

  /**
   * Transform available slot from WCOnline CUSTOM format
   */
  /**
   * Convert 12-hour time format to 24-hour format
   * Examples: "4:00 pm" -> "16:00", "9:00 am" -> "09:00"
   */
  private convertTo24Hour(timeStr: string): string {
    if (!timeStr) return timeStr
    
    // If already in 24-hour format (HH:MM), return as is
    if (/^\d{1,2}:\d{2}$/.test(timeStr.trim())) {
      const [hours, minutes] = timeStr.trim().split(':')
      return `${hours.padStart(2, '0')}:${minutes}`
    }
    
    // Handle 12-hour format with am/pm
    const timeLower = timeStr.toLowerCase().trim()
    const isPM = timeLower.includes('pm')
    const isAM = timeLower.includes('am')
    
    // Extract hours and minutes
    const timeMatch = timeLower.match(/(\d{1,2}):(\d{2})/)
    if (!timeMatch) {
      console.warn(`⚠️ Could not parse time format: ${timeStr}`)
      return timeStr // Return original if can't parse
    }
    
    let hours = parseInt(timeMatch[1])
    const minutes = timeMatch[2]
    
    // Convert to 24-hour
    if (isPM && hours !== 12) {
      hours += 12
    } else if (isAM && hours === 12) {
      hours = 0
    }
    
    return `${String(hours).padStart(2, '0')}:${minutes}`
  }

  private async transformAvailableSlot(
    slot: any,
    date: Date
  ): Promise<any | null> {
    // Extract tutor info
    const tutorName = slot['Staff or Resource'] || slot.staff_name || slot.tutor_name || ''
    const tutorEmail = slot['Staff Email'] || slot.tutor_email || ''
    
    console.log(`👤 Tutor info:`, { name: tutorName, email: tutorEmail || 'no email' })
    
    // Extract time info (save original for validation)
    const rawStartTime = slot['Start Time'] || slot.start_time || ''
    const rawEndTime = slot['End Time'] || slot.end_time || ''
    
    console.log(`⏰ Raw time info:`, { start: rawStartTime, end: rawEndTime })
    
    if (!rawStartTime || !rawEndTime) {
      console.warn('⚠️ Missing start or end time in raw data')
      return null
    }
    
    // Convert to 24-hour format
    const startTime = this.convertTo24Hour(rawStartTime)
    const endTime = this.convertTo24Hour(rawEndTime)
    
    console.log(`⏰ Converted time info:`, { start: startTime, end: endTime })
    
    // Validate conversion (check if it's in 24-hour format)
    if (!startTime || !endTime || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      console.warn(`⚠️ Time conversion failed or invalid format:`, { 
        original: { start: rawStartTime, end: rawEndTime },
        converted: { start: startTime, end: endTime }
      })
      return null
    }

    // Find tutor
    const tutorId = await this.findOrCreateTutor({
      tutor_name: tutorName,
      tutor_email: tutorEmail,
    })

    if (!tutorId) {
      console.warn(`⚠️ Could not find/create tutor for: ${tutorName || tutorEmail || 'unknown'}`)
      return null
    }
    
    console.log(`✅ Tutor ID: ${tutorId}`)

    // Format date (use from slot if available, otherwise use provided date)
    let slotDate: string
    const dateStr = slot['Appointment Date'] || slot.appointment_date || slot.date || ''
    if (dateStr && dateStr.length === 8) {
      // YYYYMMDD format
      slotDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
    } else if (dateStr && dateStr.includes('-')) {
      // Already in YYYY-MM-DD format
      slotDate = dateStr
    } else {
      // Use provided date
      slotDate = date.toISOString().split('T')[0]
    }
    
    console.log(`📅 Slot date: ${slotDate}`)

    return {
      tutor_id: tutorId,
      slot_date: slotDate,
      start_time: startTime,
      end_time: endTime,
      is_booked: false, // Available slots are not booked
      source: 'wconline',
    }
  }

  /**
   * Sync available slots from WCOnline CUSTOM type
   */
  async syncAvailableSlots(date?: Date): Promise<{ fetched: number; synced: number; errors: number }> {
    const result = { fetched: 0, synced: 0, errors: 0 }
    const syncDate = date || new Date()
    const failureReasons = { tutorError: 0, timeError: 0, dbError: 0, transformError: 0 }

    try {
      console.log(`📅 Syncing available slots for date: ${syncDate.toISOString().split('T')[0]}`)
      
      // Fetch available slots using CUSTOM type
      const customData = await this.wconline.getCustomData(syncDate)
      
      console.log('📦 Raw CUSTOM data type:', typeof customData, Array.isArray(customData) ? `(array with ${customData.length} items)` : '(object)')
      
      // Handle different response formats
      let slots: any[] = []
      if (Array.isArray(customData)) {
        slots = customData
        console.log(`✅ Got ${slots.length} slots from array`)
      } else if (customData && typeof customData === 'object') {
        slots = customData.data || customData.slots || customData.results || []
        console.log(`✅ Got ${slots.length} slots from object`)
      } else {
        console.warn('⚠️ Unexpected data format:', customData)
      }

      if (slots.length === 0) {
        console.warn('⚠️ No slots found in CUSTOM data')
        return result
      }

      console.log(`📋 Total slots before filtering: ${slots.length}`)
      console.log(`📋 Sample slot:`, slots[0])

      // Filter for STEM CENTER (handles "STEM Center 24/FA", "STEM CENTER", etc.)
      const stemSlots = slots.filter((item: any) => {
        const scheduleTitle = item['Schedule Title'] || item.schedule_title || item.scheduleTitle
        if (!scheduleTitle) {
          console.log(`⚠️ Slot missing Schedule Title:`, item)
          return false
        }
        
        const titleUpper = scheduleTitle.toUpperCase()
        // Check if contains "STEM CENTER" (handles variations)
        const matches = titleUpper.includes('STEM CENTER')
        if (!matches) {
          console.log(`ℹ️ Slot filtered out (not STEM CENTER): "${scheduleTitle}"`)
        }
        return matches
      })

      console.log(`🔍 Filtered ${stemSlots.length} STEM Center slots from ${slots.length} total slots`)
      result.fetched = stemSlots.length

      if (stemSlots.length === 0) {
        console.warn('⚠️ No STEM Center slots found after filtering')
        return result
      }

      // Transform and sync each slot
      for (let i = 0; i < stemSlots.length; i++) {
        const slot = stemSlots[i]
        try {
          console.log(`\n🔄 [${i + 1}/${stemSlots.length}] Transforming slot:`, {
            tutor: slot['Staff or Resource'],
            date: slot['Appointment Date'],
            start: slot['Start Time'],
            end: slot['End Time'],
            schedule: slot['Schedule Title']
          })
          
          const transformed = await this.transformAvailableSlot(slot, syncDate)

          if (!transformed) {
            console.warn(`⚠️ [${i + 1}/${stemSlots.length}] Slot transformation returned null`)
            failureReasons.transformError++
            result.errors++
            continue
          }
          
          console.log(`✅ [${i + 1}/${stemSlots.length}] Transformed slot:`, transformed)

          // Upsert available slot
          console.log(`💾 [${i + 1}/${stemSlots.length}] Inserting slot into database`)
          const { data: insertedData, error } = await this.supabase
            .from('available_slots')
            .upsert(
              transformed,
              {
                onConflict: 'tutor_id,slot_date,start_time,end_time',
                ignoreDuplicates: false,
              }
            )
            .select()

          if (error) {
            console.error(`❌ [${i + 1}/${stemSlots.length}] Error syncing available slot:`, {
              error: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
              transformed
            })
            failureReasons.dbError++
            result.errors++
          } else {
            console.log(`✅ [${i + 1}/${stemSlots.length}] Slot synced successfully`)
            result.synced++
          }
        } catch (error: any) {
          console.error(`❌ [${i + 1}/${stemSlots.length}] Exception transforming available slot:`, error)
          failureReasons.transformError++
          result.errors++
        }
      }
      
      // Log summary
      console.log(`\n📊 Slot Sync Summary for ${syncDate.toISOString().split('T')[0]}:`)
      console.log(`   ✅ Synced: ${result.synced}`)
      console.log(`   ❌ Errors: ${result.errors}`)
      console.log(`   📥 Fetched: ${result.fetched}`)
      if (result.errors > 0) {
        console.log(`   🔍 Failure reasons:`, failureReasons)
      }
      console.log('')
    } catch (error: any) {
      console.error('❌ Error syncing available slots:', error)
      result.errors++
    }

    return result
  }

  /**
   * Sync booked appointments from WCOnline AVAIL type
   */
  async syncBookedAppointments(date?: Date): Promise<{ fetched: number; synced: number; errors: number }> {
    const result = { fetched: 0, synced: 0, errors: 0 }

    try {
      // Use AVAIL type to get booked appointments
      const availabilityData = await this.wconline.getAvailability(date)
      
      // Filter for STEM CENTER and extract booked appointments (handles "STEM Center 24/FA", etc.)
      const bookedAppointments = availabilityData.filter((item: any) => {
        const scheduleTitle = item['Schedule Title'] || item.schedule_title || item.scheduleTitle
        const isBooked = item['Booked'] || item.is_booked || item.status === 'booked'
        if (!scheduleTitle) return false
        
        const titleUpper = scheduleTitle.toUpperCase()
        // Check if contains "STEM CENTER" (handles variations like "STEM Center 24/FA")
        return titleUpper.includes('STEM CENTER') && isBooked
      })

      result.fetched = bookedAppointments.length

      // Transform and sync each booked appointment
      for (const wcAppt of bookedAppointments) {
        try {
          console.log(`🔄 Transforming appointment:`, {
            tutor: wcAppt['Staff or Resource'] || wcAppt.tutor_name,
            student: wcAppt['Student Name'] || wcAppt.student_name,
            date: wcAppt['Appointment Date'] || wcAppt.date,
            time: wcAppt['Start Time'] || wcAppt.start_time
          })
          
          const transformed = await this.transformAppointment(wcAppt)

          if (!transformed) {
            console.warn('⚠️ Appointment transformation returned null')
            result.errors++
            continue
          }
          
          console.log(`✅ Transformed appointment:`, transformed)

          // Upsert appointment
          console.log(`💾 Inserting appointment into database`)
          const { data: insertedData, error } = await this.supabase
            .from('appointments')
            .upsert(
              transformed,
              {
                onConflict: 'appointment_id',
                ignoreDuplicates: false,
              }
            )
            .select()

          if (error) {
            console.error('❌ Error syncing booked appointment:', {
              error: error.message,
              code: error.code,
              details: error.details,
              transformed
            })
            result.errors++
          } else {
            console.log(`✅ Appointment synced successfully:`, insertedData)
            result.synced++
          }

          // Mark corresponding slot as booked
          if (transformed.tutor_id && transformed.appointment_date && transformed.start_time && transformed.end_time) {
            await this.supabase
              .from('available_slots')
              .update({ is_booked: true })
              .eq('tutor_id', transformed.tutor_id)
              .eq('slot_date', transformed.appointment_date)
              .eq('start_time', transformed.start_time)
              .eq('end_time', transformed.end_time)
          }
        } catch (error: any) {
          console.error('Error transforming booked appointment:', error)
          result.errors++
        }
      }
    } catch (error: any) {
      console.error('Error syncing booked appointments:', error)
      result.errors++
    }

    return result
  }

  /**
   * Sleep/delay helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Complete sync: Booked appointments (AVAIL) + Available slots (CUSTOM)
   */
  async syncAll(date?: Date): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      appointments: { fetched: 0, synced: 0, errors: 0 },
      availableSlots: { fetched: 0, synced: 0, errors: 0 },
      tutors: { fetched: 0, synced: 0, errors: 0 },
      courses: { fetched: 0, synced: 0, errors: 0 },
      errors: [],
      syncTime: new Date().toISOString(),
    }

    try {
      // Step 1: Sync booked appointments from AVAIL type
      console.log('📅 Syncing booked appointments (AVAIL type)...')
      const bookedResult = await this.syncBookedAppointments(date)
      result.appointments = bookedResult

      // Add delay between API calls to avoid rate limiting
      console.log('⏳ Waiting 2 seconds before next API call...')
      await this.sleep(2000)

      // Step 2: Sync available slots from CUSTOM type
      console.log('⏰ Syncing available slots (CUSTOM type)...')
      const slotsResult = await this.syncAvailableSlots(date)
      result.availableSlots = slotsResult

      // Step 3: Sync tutors (skip if STAFF endpoint returns 422)
      console.log('👥 Syncing tutors...')
      try {
        const wconlineTutors = await this.wconline.getTutors()
        result.tutors.fetched = wconlineTutors.length

        for (const wcTutor of wconlineTutors) {
          try {
            const tutorId = await this.findOrCreateTutor(wcTutor)
            if (tutorId) {
              result.tutors.synced++
            } else {
              result.tutors.errors++
            }
          } catch (error: any) {
            console.error('Error syncing tutor:', error)
            result.tutors.errors++
            result.errors.push(`Tutor sync error: ${error.message}`)
          }
        }
      } catch (error: any) {
        console.warn('⚠️ Skipping tutor sync (STAFF endpoint may not be available):', error.message)
        result.errors.push(`Tutor sync skipped: ${error.message}`)
      }

      // Step 4: Extract courses from appointments
      console.log('📚 Extracting courses from appointments...')
      const allAppointments = [...bookedResult.synced > 0 ? await this.wconline.getAvailability(date) : []]
      
      const courseSet = new Set<string>()
      allAppointments.forEach((appt: any) => {
        const courseCode = appt['Course Code'] || appt.course_code || appt.course
        const courseName = appt['Course Name'] || appt.course_name || appt.course
        if (courseCode) courseSet.add(courseCode)
        if (courseName) courseSet.add(courseName)
      })

      for (const courseIdentifier of courseSet) {
        try {
          const courseId = await this.findOrCreateCourse(courseIdentifier, courseIdentifier)
          if (courseId) {
            result.courses.synced++
          } else {
            result.courses.errors++
          }
        } catch (error: any) {
          result.courses.errors++
        }
      }
      result.courses.fetched = courseSet.size

      if (result.errors.length > 0) {
        result.success = false
      }

      console.log('✅ Sync completed:', {
        appointments: `${result.appointments.synced}/${result.appointments.fetched}`,
        slots: `${result.availableSlots.synced}/${result.availableSlots.synced}`,
        tutors: `${result.tutors.synced}/${result.tutors.fetched}`,
        courses: `${result.courses.synced}/${result.courses.fetched}`,
      })

      return result
    } catch (error: any) {
      console.error('WCOnline sync error:', error)
      result.success = false
      result.errors.push(`Sync failed: ${error.message}`)
      return result
    }
  }

  /**
   * Legacy method: Sync appointments from WCOnline to Supabase (using APPTS type)
   * @deprecated Use syncAll() instead for complete sync
   */
  async syncAppointments(date?: Date): Promise<SyncResult> {
    // Redirect to syncAll for backward compatibility
    return this.syncAll(date)
  }
}

