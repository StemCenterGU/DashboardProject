'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RichTextEditor } from './RichTextEditor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, Send, Upload } from 'lucide-react'

interface FocusOption {
  option_id: string
  category: string
  option_text: string
  display_order: number
}

interface ClientReportFormProps {
  appointmentId?: string
  initialData?: any
  onSave: (data: any) => Promise<void>
  onSubmit: (data: any) => Promise<void>
}

export function ClientReportForm({
  appointmentId,
  initialData,
  onSave,
  onSubmit,
}: ClientReportFormProps) {
  const [loading, setLoading] = useState(false)
  const [focusOptions, setFocusOptions] = useState<Record<string, FocusOption[]>>({})

  // Form state
  const [formData, setFormData] = useState({
    appointment_id: appointmentId || '',
    client_name: '',
    report_date: new Date().toISOString().split('T')[0],
    location: '',
    staff_resource_id: '',
    staff_resource_name: '',
    actual_appointment_length: '',
    missing_information: [] as string[],
    department: '',
    course_id: '',
    instructor: '',
    email_automation_enabled: false,
    advisor_email: '',
    broad_appointment_focus: [] as string[],
    resources_utilized: [] as string[],
    wrc_detailed_focus: [] as string[],
    wrc_student_categories: [] as string[],
    gannon_101_credit: '',
    shared_notes: '',
    confidential_notes: '',
    email_recipients: {
      client: false,
      staff: false,
      resource: false,
    },
    attachment_paths: [] as string[],
  })

  // Load focus options from API
  useEffect(() => {
    const fetchFocusOptions = async () => {
      try {
        const response = await fetch('/api/reports/focus-options')
        if (response.ok) {
          const data = await response.json()
          setFocusOptions(data.options || {})
        }
      } catch (error) {
        console.error('Failed to fetch focus options:', error)
      }
    }
    fetchFocusOptions()
  }, [])

  // Load appointment data if creating from appointment
  useEffect(() => {
    const fetchAppointmentData = async () => {
      if (appointmentId && !initialData) {
        try {
          const response = await fetch(`/api/scheduling/appointments?appointment_id=${appointmentId}`)
          if (response.ok) {
            const data = await response.json()
            const apt = data.appointments?.[0]
            if (apt) {
              setFormData((prev) => ({
                ...prev,
                client_name: apt.student_name || '',
                report_date: apt.start_time?.split('T')[0] || prev.report_date,
                staff_resource_name: apt.tutor_name || '',
                location: apt.is_online ? 'Online' : 'In-Person',
              }))
            }
          }
        } catch (error) {
          console.error('Failed to fetch appointment data:', error)
        }
      }
    }
    fetchAppointmentData()
  }, [appointmentId, initialData])

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        report_date: initialData.report_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      })
    }
  }, [initialData])

  const handleCheckboxChange = (field: string, optionId: string, checked: boolean) => {
    setFormData((prev) => {
      const currentValues = prev[field as keyof typeof prev] as string[]
      return {
        ...prev,
        [field]: checked
          ? [...currentValues, optionId]
          : currentValues.filter((id) => id !== optionId),
      }
    })
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave(formData)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client_name">Client Name *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="report_date">Report Date *</Label>
              <Input
                id="report_date"
                type="date"
                value={formData.report_date}
                onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="actual_appointment_length">Actual Appointment Length (minutes)</Label>
              <Input
                id="actual_appointment_length"
                type="number"
                value={formData.actual_appointment_length}
                onChange={(e) => setFormData({ ...formData, actual_appointment_length: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="instructor">Instructor</Label>
              <Input
                id="instructor"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="gannon_101_credit">Gannon 101 Credit</Label>
              <Input
                id="gannon_101_credit"
                value={formData.gannon_101_credit}
                onChange={(e) => setFormData({ ...formData, gannon_101_credit: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missing Information */}
      {focusOptions.missing_info && (
        <Card>
          <CardHeader>
            <CardTitle>Missing Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {focusOptions.missing_info.map((option) => (
                <div key={option.option_id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`missing-${option.option_id}`}
                    checked={formData.missing_information.includes(option.option_id)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('missing_information', option.option_id, checked as boolean)
                    }
                  />
                  <Label htmlFor={`missing-${option.option_id}`} className="text-sm font-normal">
                    {option.option_text}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Broad Appointment Focus */}
      {focusOptions.broad_focus && (
        <Card>
          <CardHeader>
            <CardTitle>Broad Appointment Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {focusOptions.broad_focus.map((option) => (
                <div key={option.option_id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`broad-${option.option_id}`}
                    checked={formData.broad_appointment_focus.includes(option.option_id)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('broad_appointment_focus', option.option_id, checked as boolean)
                    }
                  />
                  <Label htmlFor={`broad-${option.option_id}`} className="text-sm font-normal">
                    {option.option_text}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Equipment / Resources Utilized */}
      {focusOptions.resources && (
        <Card>
          <CardHeader>
            <CardTitle>Equipment / Resources Utilized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {focusOptions.resources.map((option) => (
                <div key={option.option_id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`resources-${option.option_id}`}
                    checked={formData.resources_utilized.includes(option.option_id)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('resources_utilized', option.option_id, checked as boolean)
                    }
                  />
                  <Label htmlFor={`resources-${option.option_id}`} className="text-sm font-normal">
                    {option.option_text}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* WRC Detailed Focus */}
      {focusOptions.wrc_detailed && (
        <Card>
          <CardHeader>
            <CardTitle>WRC Detailed Focus (Check All That Apply)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {focusOptions.wrc_detailed.map((option) => (
                <div key={option.option_id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`wrc-${option.option_id}`}
                    checked={formData.wrc_detailed_focus.includes(option.option_id)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('wrc_detailed_focus', option.option_id, checked as boolean)
                    }
                  />
                  <Label htmlFor={`wrc-${option.option_id}`} className="text-sm font-normal">
                    {option.option_text}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* WRC Student Categories */}
      {focusOptions.wrc_categories && (
        <Card>
          <CardHeader>
            <CardTitle>WRC Student Categories (Check All That Apply)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {focusOptions.wrc_categories.map((option) => (
                <div key={option.option_id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cat-${option.option_id}`}
                    checked={formData.wrc_student_categories.includes(option.option_id)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('wrc_student_categories', option.option_id, checked as boolean)
                    }
                  />
                  <Label htmlFor={`cat-${option.option_id}`} className="text-sm font-normal">
                    {option.option_text}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shared Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Shared Notes (Visible to Client and Staff)</CardTitle>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={formData.shared_notes}
            onChange={(html) => setFormData({ ...formData, shared_notes: html })}
            placeholder="Enter notes that can be shared with the client..."
          />
        </CardContent>
      </Card>

      {/* Confidential Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Confidential Notes (Staff Only)</CardTitle>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={formData.confidential_notes}
            onChange={(html) => setFormData({ ...formData, confidential_notes: html })}
            placeholder="Enter confidential notes visible only to staff..."
          />
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email_automation_enabled"
              checked={formData.email_automation_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, email_automation_enabled: checked as boolean })
              }
            />
            <Label htmlFor="email_automation_enabled">Enable Email Automation</Label>
          </div>

          {formData.email_automation_enabled && (
            <>
              <div>
                <Label htmlFor="advisor_email">Advisor Email</Label>
                <Input
                  id="advisor_email"
                  type="email"
                  value={formData.advisor_email}
                  onChange={(e) => setFormData({ ...formData, advisor_email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Send Email To:</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email_client"
                      checked={formData.email_recipients.client}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          email_recipients: { ...formData.email_recipients, client: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="email_client">Client</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email_staff"
                      checked={formData.email_recipients.staff}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          email_recipients: { ...formData.email_recipients, staff: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="email_staff">Staff</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email_resource"
                      checked={formData.email_recipients.resource}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          email_recipients: { ...formData.email_recipients, resource: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="email_resource">Resource</Label>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 sticky bottom-0 bg-white p-4 border-t">
        <Button variant="outline" onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          <Send className="h-4 w-4 mr-2" />
          Submit Report
        </Button>
      </div>
    </div>
  )
}
