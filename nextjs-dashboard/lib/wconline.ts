/**
 * WCOnline API Service
 * Fetches appointment and tutor data from Gannon University's WCOnline system
 */

export interface WCOnlineAppointment {
  // These fields need to be verified with actual API response
  id?: string
  appointment_id?: string
  student_name?: string
  student_email?: string
  tutor_name?: string
  tutor_email?: string
  course?: string
  course_code?: string
  course_name?: string
  date?: string
  appointment_date?: string
  time?: string
  start_time?: string
  end_time?: string
  duration?: number
  status?: string
  schedule_title?: string
  'Schedule Title'?: string
  notes?: string
  [key: string]: any // Allow for unknown fields
}

export interface WCOnlineTutor {
  id?: string
  name?: string
  email?: string
  full_name?: string
  is_available?: boolean
  [key: string]: any
}

export interface WCOnlineResponse {
  data?: any[]
  appointments?: WCOnlineAppointment[]
  tutors?: WCOnlineTutor[]
  [key: string]: any
}

export class WCOnlineService {
  private apiKey: string
  private baseUrl: string
  private scheduleTitle: string

  constructor() {
    this.apiKey = process.env.WCONLINE_API_KEY || ''
    this.baseUrl = process.env.WCONLINE_BASE_URL || 'https://gannon.mywconline.com/api'
    this.scheduleTitle = process.env.WCONLINE_SCHEDULE_TITLE || 'STEM CENTER'

    if (!this.apiKey) {
      console.warn('⚠️ WCONLINE_API_KEY not set in environment variables')
    }
  }

  /**
   * Format date to WCOnline format (YYYYMMDD)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }

  /**
   * Sleep/delay helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Fetch data from WCOnline API with retry logic
   */
  private async fetchWCOnlineData(
    requestType: 'AVAIL' | 'SCHED' | 'APPTS' | 'STAFF' | 'CUSTOM',
    date?: Date,
    retries: number = 3
  ): Promise<any> {
    if (!this.apiKey) {
      throw new Error('WCOnline API key not configured')
    }

    const requestDate = date ? this.formatDate(date) : this.formatDate(new Date())
    const url = `${this.baseUrl}?type=${requestType}&date=${requestDate}`

    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, { headers })

        // Handle rate limiting (429) with retry
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000
          
          if (attempt < retries) {
            console.log(`⏳ Rate limited (429). Waiting ${waitTime}ms before retry ${attempt + 1}/${retries}...`)
            await this.sleep(waitTime)
            continue
          } else {
            throw new Error(`WCOnline API error: ${response.status} ${response.statusText} - Rate limit exceeded after ${retries} attempts`)
          }
        }

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`WCOnline API error: ${response.status} ${response.statusText} - ${errorText}`)
        }

        const data = await response.json()
        return data
      } catch (error: any) {
        // If it's the last attempt, throw the error
        if (attempt === retries) {
          console.error(`❌ WCOnline API fetch error (attempt ${attempt}/${retries}):`, error)
          throw new Error(`Failed to fetch from WCOnline: ${error.message}`)
        }
        
        // For other errors, wait and retry
        const waitTime = Math.pow(2, attempt) * 1000
        console.log(`⚠️ API error (attempt ${attempt}/${retries}). Waiting ${waitTime}ms before retry...`)
        await this.sleep(waitTime)
      }
    }
    
    throw new Error('Failed to fetch from WCOnline: Max retries exceeded')
  }

  /**
   * Filter data for STEM CENTER schedule
   * Handles variations like "STEM Center 24/FA", "STEM CENTER", etc.
   */
  private filterSTEMCenter(data: any[]): any[] {
    if (!Array.isArray(data)) {
      return []
    }

    return data.filter((item) => {
      const scheduleTitle = item['Schedule Title'] || item.schedule_title || item.scheduleTitle
      if (!scheduleTitle) return false
      
      // Check if schedule title contains "STEM CENTER" (case-insensitive)
      // This handles "STEM Center 24/FA", "STEM CENTER", "STEM Center", etc.
      const titleUpper = scheduleTitle.toUpperCase()
      const filterUpper = this.scheduleTitle.toUpperCase()
      
      // Try exact match first, then contains match
      return titleUpper === filterUpper || titleUpper.includes(filterUpper)
    })
  }

  /**
   * Get appointments from WCOnline
   */
  async getAppointments(date?: Date): Promise<WCOnlineAppointment[]> {
    try {
      const data = await this.fetchWCOnlineData('APPTS', date)
      
      // Handle different response formats
      let appointments: any[] = []
      
      if (Array.isArray(data)) {
        appointments = data
      } else if (data && typeof data === 'object') {
        // Try common keys
        appointments = data.appointments || data.data || data.results || []
      }

      // Filter for STEM CENTER
      const stemAppointments = this.filterSTEMCenter(appointments)
      
      return stemAppointments as WCOnlineAppointment[]
    } catch (error: any) {
      console.error('Error fetching WCOnline appointments:', error)
      return []
    }
  }

  /**
   * Get tutors/staff from WCOnline
   */
  async getTutors(): Promise<WCOnlineTutor[]> {
    try {
      const data = await this.fetchWCOnlineData('STAFF')
      
      let tutors: any[] = []
      
      if (Array.isArray(data)) {
        tutors = data
      } else if (data && typeof data === 'object') {
        tutors = data.staff || data.tutors || data.data || data.results || []
      }

      // Filter for STEM CENTER if applicable
      const stemTutors = this.filterSTEMCenter(tutors)
      
      return stemTutors as WCOnlineTutor[]
    } catch (error: any) {
      console.error('Error fetching WCOnline tutors:', error)
      return []
    }
  }

  /**
   * Get schedule data from WCOnline
   */
  async getSchedule(date?: Date): Promise<any[]> {
    try {
      const data = await this.fetchWCOnlineData('SCHED', date)
      
      let schedule: any[] = []
      
      if (Array.isArray(data)) {
        schedule = data
      } else if (data && typeof data === 'object') {
        schedule = data.schedule || data.data || data.results || []
      }

      return this.filterSTEMCenter(schedule)
    } catch (error: any) {
      console.error('Error fetching WCOnline schedule:', error)
      return []
    }
  }

  /**
   * Get availability data from WCOnline
   */
  async getAvailability(date?: Date): Promise<any[]> {
    try {
      const data = await this.fetchWCOnlineData('AVAIL', date)
      
      let availability: any[] = []
      
      if (Array.isArray(data)) {
        availability = data
      } else if (data && typeof data === 'object') {
        availability = data.availability || data.data || data.results || []
      }

      return this.filterSTEMCenter(availability)
    } catch (error: any) {
      console.error('Error fetching WCOnline availability:', error)
      return []
    }
  }

  /**
   * Get custom data from WCOnline
   */
  async getCustomData(date?: Date): Promise<any> {
    try {
      const data = await this.fetchWCOnlineData('CUSTOM', date)
      return data
    } catch (error: any) {
      console.error('Error fetching WCOnline custom data:', error)
      return null
    }
  }
}

