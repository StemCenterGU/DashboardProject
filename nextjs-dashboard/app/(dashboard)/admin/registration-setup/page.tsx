'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowUp, ArrowDown, Trash2, Plus, Info } from 'lucide-react'
import { toast } from 'sonner'

interface RegistrationQuestion {
  id: string
  question_number: number
  question_text: string
  possible_answers: string | null
  is_required: boolean
  display_on_appointment: boolean
}

export default function RegistrationSetupPage() {
  const [questions, setQuestions] = useState<RegistrationQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    possible_answers: '',
    is_required: false,
    display_on_appointment: false,
  })

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/registration/questions')
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      } else {
        toast.error('Failed to load questions')
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast.error('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  // Note: Reusing the same API endpoints structure as appointment forms
  // but pointing to registration_form_questions table

  const handleAddQuestion = async () => {
    if (!newQuestion.question_text.trim()) {
      toast.error('Question text is required')
      return
    }

    if (questions.length >= 20) {
      toast.error('Maximum of 20 questions reached')
      return
    }

    setSaving(true)
    try {
      // Using the admin form-questions API (would need to create registration-specific one)
      // For now, this is a placeholder showing the structure
      toast.info('Registration form API endpoints need to be created')

      setNewQuestion({
        question_text: '',
        possible_answers: '',
        is_required: false,
        display_on_appointment: false,
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to add question')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">Loading registration form setup...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Registration Form Setup</h1>
        <p className="text-gray-600 mt-2">
          Configure demographic questions for new student registration
        </p>
      </div>

      {/* Instructions Banner */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Registration Form Notes:</strong>
          <ul className="list-disc ml-4 mt-2 space-y-1">
            <li>These questions are asked once during student account creation</li>
            <li>Students can update their answers later in their profile</li>
            <li><strong>"Display on Appointment?"</strong> - Shows this data to tutors on appointment details</li>
            <li>Uses the same syntax rules as the Appointment Form (FILL-IN, TEXTAREA, DROPDOWN, etc.)</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Existing Questions */}
      <div className="space-y-4 mb-8">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-gray-500">
                No registration questions configured yet. Add one below.
              </p>
            </CardContent>
          </Card>
        ) : (
          questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Question {question.question_number}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Question Text</Label>
                  <Input value={question.question_text} readOnly />
                </div>

                <div>
                  <Label>Possible Answers (Syntax)</Label>
                  <Input value={question.possible_answers || ''} readOnly />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Required?</Label>
                    <Input value={question.is_required ? 'Required' : 'Optional'} readOnly />
                  </div>

                  <div>
                    <Label>Display on Appointment?</Label>
                    <Input value={question.display_on_appointment ? 'Yes' : 'No'} readOnly />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add New Question */}
      {questions.length < 20 && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Question Text *</Label>
              <Input
                value={newQuestion.question_text}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, question_text: e.target.value })
                }
                placeholder="e.g., Primary Major"
              />
            </div>

            <div>
              <Label>Possible Answers (Syntax)</Label>
              <Input
                value={newQuestion.possible_answers}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, possible_answers: e.target.value })
                }
                placeholder="Leave empty for fill-in, or use dropdown syntax"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Required?</Label>
                <Select
                  value={newQuestion.is_required ? 'required' : 'optional'}
                  onValueChange={(value) =>
                    setNewQuestion({ ...newQuestion, is_required: value === 'required' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="required">Required</SelectItem>
                    <SelectItem value="optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Display on Appointment?</Label>
                <Select
                  value={newQuestion.display_on_appointment ? 'yes' : 'no'}
                  onValueChange={(value) =>
                    setNewQuestion({ ...newQuestion, display_on_appointment: value === 'yes' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleAddQuestion} disabled={saving} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {saving ? 'Adding...' : 'Add Question'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Alert className="mt-6 bg-yellow-50 border-yellow-200">
        <Info className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Note:</strong> Full CRUD API endpoints for registration questions need to be implemented.
          This page currently shows read-only data. Contact the development team to enable editing.
        </AlertDescription>
      </Alert>
    </div>
  )
}
