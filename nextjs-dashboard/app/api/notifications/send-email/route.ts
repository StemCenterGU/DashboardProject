import { NextRequest, NextResponse } from "next/server"

/**
 * Send email notification to student about appointment
 * POST /api/notifications/send-email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      to,
      student_name,
      tutor_name,
      appointment_date,
      start_time,
      end_time,
      is_online,
    } = body

    // Validate required fields
    if (!to || !student_name || !appointment_date || !start_time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Format date and time for email
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr + "T00:00:00")
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    }

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number)
      const period = hours >= 12 ? "PM" : "AM"
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
      return `${displayHours}:${String(minutes || 0).padStart(2, "0")} ${period}`
    }

    // Prepare email content
    const emailSubject = "Appointment Confirmation - STEM Center"
    const emailBody = `
Dear ${student_name},

This is to confirm your tutoring appointment at the STEM Center.

Appointment Details:
- Date: ${formatDate(appointment_date)}
- Time: ${formatTime(start_time)} - ${formatTime(end_time || start_time)}
- Tutor: ${tutor_name || "STEM Center Tutor"}
- Location: ${is_online ? "Online (via video conference)" : "STEM Center (in-person)"}

${is_online ?
  "To join your online appointment, please log back into the STEM Face Dashboard approximately 5-10 minutes before your scheduled time and click 'Start or Join Online Consultation.'" :
  "Please arrive on time at the STEM Center for your appointment."
}

If you need to cancel or reschedule, please contact the STEM Center as soon as possible.

Best regards,
STEM Center Team
Gannon University
    `.trim()

    // TODO: Integrate with actual email service (SendGrid, AWS SES, Resend, etc.)
    // For now, we'll just log the email and return success
    console.log("=== EMAIL NOTIFICATION ===")
    console.log("To:", to)
    console.log("Subject:", emailSubject)
    console.log("Body:", emailBody)
    console.log("========================")

    // In production, you would integrate with an email service here:
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'STEM Center <noreply@stemcenter.gannon.edu>',
    //   to: [to],
    //   subject: emailSubject,
    //   text: emailBody,
    // })

    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail')
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    // await sgMail.send({
    //   to,
    //   from: 'noreply@stemcenter.gannon.edu',
    //   subject: emailSubject,
    //   text: emailBody,
    // })

    return NextResponse.json({
      success: true,
      message: "Email notification sent successfully",
      // In development, return the email content for debugging
      debug: process.env.NODE_ENV === "development" ? {
        to,
        subject: emailSubject,
        body: emailBody,
      } : undefined,
    })
  } catch (error: any) {
    console.error("Email notification error:", error)
    return NextResponse.json(
      { error: "Failed to send email notification", details: error.message },
      { status: 500 }
    )
  }
}
