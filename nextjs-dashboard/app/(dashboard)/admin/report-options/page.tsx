'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowUp, ArrowDown, Info } from 'lucide-react'
import { toast } from 'sonner'

// Import RichTextEditor as client-only to avoid SSR hydration issues
const RichTextEditor = dynamic(() => import('@/components/rich-text-editor'), {
  ssr: false,
  loading: () => <div className="border rounded-md p-4 text-gray-500">Loading editor...</div>,
})

interface ReportQuestion {
  id?: number
  question_number: number
  question_text: string
  possible_answers: string | null
  is_required: boolean
}

// Default email template matching the image
const DEFAULT_EMAIL_TEMPLATE = `<p><strong>Automated Tutoring Report Form</strong></p>
<p></p>
<p><strong>Tutoring Department:</strong> [q26_response]</p>
<p></p>
<p><strong>Client:</strong> [username]</p>
<p></p>
<p><strong>Tutor/consultant:</strong> [resource]</p>
<p></p>
<p><strong>Date:</strong> [date], [start] - [end]</p>
<p></p>
<p><strong>Course:</strong> [q73_response]</p>
<p></p>
<p><strong>Instructor:</strong> [q27_response]</p>
<p></p>
<p><strong>Writing &amp; Research Center Only | Appointment Topics:</strong> [q71_response]</p>
<p></p>
<p><strong>Appointment Summary:</strong> [q30_response]</p>
<p></p>
<p style="color: red;">If you believe you may have been sent this in error (such as if [username] is not your student), please consider replying to this email so that appointment records can be rectified; most likely, the incorrect instructor was selected from an internal listing.</p>`

export default function ReportOptionsPage() {
  const [emailBody, setEmailBody] = useState(DEFAULT_EMAIL_TEMPLATE)
  const [emailSubject, setEmailSubject] = useState('Automated Tutoring Report - [username], [date]')
  const [questions, setQuestions] = useState<ReportQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  // New question state
  const [newQuestion, setNewQuestion] = useState<ReportQuestion>({
    question_number: 1,
    question_text: '',
    possible_answers: null,
    is_required: false,
  })

  useEffect(() => {
    fetchReportConfig()
  }, [])

  const fetchReportConfig = async () => {
    setLoading(true)
    try {
      // Fetch email config and questions
      const response = await fetch('/api/admin/report-config')
      if (response.ok) {
        const data = await response.json()
        setEmailBody(data.email_body || '')
        setEmailSubject(data.email_subject || 'Automated Tutoring Report - [username], [date]')
        setQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Error fetching report config:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuestion = (index: number, updates: Partial<ReportQuestion>) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], ...updates }
    setQuestions(updated)
    setHasChanges(true)
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === questions.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const updated = [...questions]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp

    // Update question numbers
    updated.forEach((q, i) => {
      q.question_number = i + 1
    })

    setQuestions(updated)
    setHasChanges(true)
  }

  const addNewQuestion = () => {
    if (!newQuestion.question_text.trim()) {
      toast.error('Question text is required')
      return
    }

    if (questions.length >= 20) {
      toast.error('Maximum of 20 questions allowed')
      return
    }

    const questionToAdd = {
      ...newQuestion,
      question_number: questions.length + 1,
    }

    setQuestions([...questions, questionToAdd])
    setNewQuestion({
      question_number: questions.length + 2,
      question_text: '',
      possible_answers: null,
      is_required: false,
    })
    setHasChanges(true)
    toast.success('Question added. Click "Save Changes" to persist.')
  }

  const handleSaveChanges = async () => {
    try {
      const response = await fetch('/api/admin/report-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_body: emailBody,
          email_subject: emailSubject,
          questions,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save changes')
      }

      toast.success('Changes saved successfully')
      setHasChanges(false)
      fetchReportConfig()
    } catch (error) {
      console.error('Error saving changes:', error)
      toast.error('Failed to save changes')
    }
  }

  const handleResetToDefault = () => {
    if (confirm('Are you sure you want to reset the email template to default? This will discard any custom changes.')) {
      setEmailBody(DEFAULT_EMAIL_TEMPLATE)
      setEmailSubject('Automated Tutoring Report - [username], [date]')
      setHasChanges(true)
      toast.success('Template reset to default. Click "Save Changes" to apply.')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">Loading report configuration...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-4">
          <strong>Use the options below to configure the questions asked on the client report form.</strong>{' '}
          The form is not accessible by the client and collects post-session information from staff.{' '}
          <strong>Have questions?</strong> More information is available{' '}
          <a href="#" className="text-blue-600 underline">
            in the manual
          </a>
          .
        </p>
      </div>

      {/* Client Report Email */}
      <div className="mb-8 p-6 border rounded-lg bg-white">
        <h2 className="text-xl font-semibold mb-2 text-blue-700">Client Report Email</h2>
        <p className="text-sm text-gray-600 mb-4">
          To disable this email, leave the subject blank. To use variable or appointment-specific information
          in this email, insert any of the available codes into the email.{' '}
          <Info className="inline h-4 w-4" />
        </p>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <Label>Email Body</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetToDefault}
            >
              Reset to Default Template
            </Button>
          </div>
          <RichTextEditor
            content={emailBody}
            onChange={(content) => {
              setEmailBody(content)
              setHasChanges(true)
            }}
            showVariableInsertion={true}
            placeholder="Enter email template..."
          />
          <p className="mt-2 text-xs text-gray-500">
            <strong>Available variables:</strong> [date], [start], [end], [username], [q73_response], [q27_response], [q71_response], [q30_response]
          </p>
        </div>
      </div>

      {/* Client Report Email Subject */}
      <div className="mb-8 p-6 border rounded-lg bg-white">
        <h2 className="text-xl font-semibold mb-2">Client Report Email Subject</h2>
        <Input
          value={emailSubject}
          onChange={(e) => {
            setEmailSubject(e.target.value)
            setHasChanges(true)
          }}
          className="mt-2"
          placeholder="Automated Tutoring Report - [username], [date]"
        />
      </div>

      {/* Client Report Questions */}
      <div className="mb-8 p-6 border rounded-lg bg-white">
        <h2 className="text-xl font-semibold mb-2">Client Report Questions</h2>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm font-semibold mb-2">
            Considering making major revisions to your form questions, answers, and answer types?{' '}
            <a href="#" className="text-blue-600 underline">
              Visit our manual
            </a>{' '}
            to view our recommendations.
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-gray-50 border rounded text-sm space-y-2">
          <p>
            <strong>FILL-IN:</strong> To have a question answered with a fill-in response, leave "possible
            answers" blank.
          </p>
          <p>
            <strong>DROP-DOWN:</strong> To have a question answered through a drop-down selection, enter the
            possible selections as a comma separated list in "possible answers."
          </p>
          <p>
            <strong>CHECKBOX:</strong> To have a question answered by checking a single checkbox, enter the
            word <em>CHECKBOX</em> in "possible answers."
          </p>
          <p>
            <strong>MULTIPLE CHECKBOXES:</strong> To have a question answered with the selection of multiple
            checkboxes, enter the word <em>CHECKBOX</em> in "possible answers" and follow that word with a
            comma separated list of the possible answers.
          </p>
          <p>
            <strong>LIKERT:</strong> To have a question answered with the selection of a Likert response,
            enter the word <em>LIKERT</em> in "possible answers." Likert answers span from "strongly agree" to
            "strongly disagree" and offer a "not applicable" choice.
          </p>
          <p>
            <strong>LARGE TEXT AREA:</strong> To have a question answered by entering text in a large text
            area, enter the word <em>TEXTAREA</em> in "possible answers."
          </p>
          <p>
            <strong>AUTOMATIC EMAIL:</strong> Some centers prefer to have the client report form email
            automatically emailed to a client's instructor, professor, or advisor (for example). To set up this
            functionality, enter the word <em>AUTOEMAIL</em> in the "possible answers" field and then follow
            that word with a comma separated list of email addresses (such as "AUTOEMAIL,instructor@institution.edu,faculty@institution.edu").
            Only one question can have this functionality.
          </p>
        </div>

        {/* Question List */}
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start gap-4">
                {/* Question Number & Controls */}
                <div className="flex flex-col items-center gap-1 pt-2">
                  <span className="text-sm font-semibold text-blue-600">
                    Question #{question.question_number}
                  </span>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveQuestion(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveQuestion(index, 'down')}
                      disabled={index === questions.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Question Fields */}
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Question Text</Label>
                    <Input
                      value={question.question_text}
                      onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Possible Answers</Label>
                    <Input
                      value={question.possible_answers || ''}
                      onChange={(e) =>
                        updateQuestion(index, { possible_answers: e.target.value || null })
                      }
                      className="mt-1"
                      placeholder="Leave blank for fill-in"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Required?</Label>
                    <Select
                      value={question.is_required ? 'Required' : 'Optional'}
                      onValueChange={(value) =>
                        updateQuestion(index, { is_required: value === 'Required' })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Required">Required</SelectItem>
                        <SelectItem value="Optional">Optional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Question Section */}
        <div className="mt-8 p-6 border-2 border-blue-300 rounded-lg bg-blue-50">
          <h3 className="font-semibold mb-4">
            The client report form accommodates up to twenty questions. To add a new question to the survey,
            fill in the information below and then select 'save changes.' Once you add a new question and save
            your changes, you'll be prompted to add another new question.
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>New Question</Label>
              <Input
                value={newQuestion.question_text}
                onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                placeholder="Enter question text"
              />
            </div>
            <div>
              <Label>Possible Answers</Label>
              <Input
                value={newQuestion.possible_answers || ''}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, possible_answers: e.target.value || null })
                }
                placeholder="Leave blank for fill-in"
              />
            </div>
            <div>
              <Label>Required?</Label>
              <Select
                value={newQuestion.is_required ? 'Required' : 'Optional'}
                onValueChange={(value) =>
                  setNewQuestion({ ...newQuestion, is_required: value === 'Required' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Required">Required</SelectItem>
                  <SelectItem value="Optional">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addNewQuestion} className="mt-4">
            Add Question
          </Button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button onClick={handleSaveChanges} disabled={!hasChanges} size="lg" className="px-8">
          Save Changes
        </Button>
      </div>

      {hasChanges && (
        <p className="text-sm text-orange-600 mt-2 text-right">You have unsaved changes</p>
      )}
    </div>
  )
}
