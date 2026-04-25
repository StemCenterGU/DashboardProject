/**
 * Email Queue System
 * Handles asynchronous email sending to prevent blocking API responses
 *
 * In production, this should be replaced with a proper queue system like:
 * - Inngest
 * - Upstash QStash
 * - Redis Queue
 * - Supabase Edge Functions with Database Webhooks
 */

interface EmailJob {
  id: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
  metadata?: Record<string, any>
  createdAt: Date
  attempts: number
  maxAttempts: number
}

class EmailQueue {
  private queue: EmailJob[] = []
  private processing = false
  private processingInterval: NodeJS.Timeout | null = null

  /**
   * Add an email to the queue
   * Returns immediately without waiting for email to send
   */
  async enqueue(params: {
    to: string | string[]
    subject: string
    html?: string
    text?: string
    metadata?: Record<string, any>
  }): Promise<string> {
    const job: EmailJob = {
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...params,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
    }

    this.queue.push(job)

    // Start processing if not already running
    if (!this.processing) {
      this.startProcessing()
    }

    console.log(`[EmailQueue] Enqueued email ${job.id} to ${params.to}`)
    return job.id
  }

  /**
   * Start processing the queue
   */
  private startProcessing() {
    if (this.processing) return

    this.processing = true
    console.log('[EmailQueue] Started processing queue')

    // Process queue every 5 seconds
    this.processingInterval = setInterval(() => {
      this.processNext()
    }, 5000)
  }

  /**
   * Process the next email in the queue
   */
  private async processNext() {
    if (this.queue.length === 0) {
      // Stop processing if queue is empty
      if (this.processingInterval) {
        clearInterval(this.processingInterval)
        this.processingInterval = null
      }
      this.processing = false
      console.log('[EmailQueue] Queue empty, stopped processing')
      return
    }

    const job = this.queue[0]

    try {
      console.log(`[EmailQueue] Processing email ${job.id} (attempt ${job.attempts + 1}/${job.maxAttempts})`)

      // TODO: Replace with actual email sending logic
      // For now, just simulate sending
      await this.sendEmail(job)

      // Remove from queue on success
      this.queue.shift()
      console.log(`[EmailQueue] Successfully sent email ${job.id}`)
    } catch (error) {
      console.error(`[EmailQueue] Failed to send email ${job.id}:`, error)

      job.attempts++

      if (job.attempts >= job.maxAttempts) {
        // Remove from queue after max attempts
        this.queue.shift()
        console.error(`[EmailQueue] Gave up on email ${job.id} after ${job.maxAttempts} attempts`)

        // TODO: Store failed emails in database for manual review
      } else {
        // Move to end of queue for retry
        this.queue.shift()
        this.queue.push(job)
      }
    }
  }

  /**
   * Send email (to be implemented with actual email service)
   */
  private async sendEmail(job: EmailJob): Promise<void> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // TODO: Implement actual email sending
    // Example integrations:
    // - Resend
    // - SendGrid
    // - AWS SES
    // - Postmark

    console.log(`[EmailQueue] Simulated sending email to ${job.to}`)
    console.log(`[EmailQueue] Subject: ${job.subject}`)
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      oldestJob: this.queue[0]?.createdAt,
    }
  }
}

// Singleton instance
export const emailQueue = new EmailQueue()

/**
 * Helper function to send email asynchronously
 * Use this instead of direct email sending in API routes
 */
export async function sendEmailAsync(params: {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  metadata?: Record<string, any>
}): Promise<string> {
  return emailQueue.enqueue(params)
}
