'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowUp, ArrowDown, Trash2, Plus, Info } from 'lucide-react'
import { toast } from 'sonner'

interface FormQuestion {
  id: string
  question_number: number
  question_text: string
  possible_answers: string | null
  is_required: boolean
  visibility: string
  send_to_staff: boolean
  schedule_restrictions: string[]
}

const SCHEDULES = [
  'Graduate Writing SP26',
  'Main Menu',
  'OAS - Office of Accessibility Services',
  'Palumbo - Student Success Center',
  'Sanner Presentation Studio',
  'STEM Center',
  'STEM Center Proctored Exams',
  'Writing Center/Humanities Tutoring SP26',
]

export default function FormSetupPage() {
  const [questions, setQuestions] = useState<FormQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    possible_answers: '',
    is_required: false,
    visibility: 'Normal Visibility',
    send_to_staff: false,
    schedule_restrictions: [] as string[],
  })

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/form-questions')
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
      const response = await fetch('/api/admin/form-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newQuestion,
          question_number: questions.length + 1,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add question')
      }

      toast.success('Question added successfully')
      setNewQuestion({
        question_text: '',
        possible_answers: '',
        is_required: false,
        visibility: 'Normal Visibility',
        send_to_staff: false,
        schedule_restrictions: [],
      })
      fetchQuestions()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add question')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateQuestion = async (id: string, updates: Partial<FormQuestion>) => {
    try {
      const response = await fetch(`/api/admin/form-questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update question')
      }

      toast.success('Question updated')
      fetchQuestions()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update question')
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    try {
      const response = await fetch(`/api/admin/form-questions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete question')
      }

      toast.success('Question deleted')
      fetchQuestions()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete question')
    }
  }

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= questions.length) return

    const reordered = [...questions]
    const [movedQuestion] = reordered.splice(index, 1)
    reordered.splice(newIndex, 0, movedQuestion)

    // Update question numbers
    const updates = reordered.map((q, idx) => ({
      id: q.id,
      question_number: idx + 1,
    }))

    try {
      const response = await fetch('/api/admin/form-questions/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: updates }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder questions')
      }

      toast.success('Question reordered')
      fetchQuestions()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reorder questions')
    }
  }

  const handleScheduleToggle = (questionId: string, currentRestrictions: string[], schedule: string) => {
    const newRestrictions = currentRestrictions.includes(schedule)
      ? currentRestrictions.filter(s => s !== schedule)
      : [...currentRestrictions, schedule]

    handleUpdateQuestion(questionId, { schedule_restrictions: newRestrictions })
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">Loading form setup...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Appointment Form Setup</h1>
        <p className="text-gray-600 mt-2">
          Configure dynamic questions for the client appointment booking form
        </p>
      </div>

      {/* Instructions Banner */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Syntax Rules for "Possible Answers" field:</strong>
          <ul className="list-disc ml-4 mt-2 space-y-1">
            <li><strong>FILL-IN:</strong> Leave empty for a standard text input</li>
            <li><strong>TEXTAREA:</strong> Enter exactly "TEXTAREA" for a large text area</li>
            <li><strong>LIKERT:</strong> Enter exactly "LIKERT" for a 5-point scale + N/A</li>
            <li><strong>SINGLE CHECKBOX:</strong> Enter "CHECKBOX" (no commas)</li>
            <li><strong>CHECKBOX GROUP:</strong> Enter "CHECKBOX,Option1,Option2,Option3"</li>
            <li><strong>DROPDOWN:</strong> Enter comma-separated values: "Option1,Option2,Option3"</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Existing Questions */}
      <div className="space-y-4 mb-8">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Question {question.question_number}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveQuestion(index, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveQuestion(index, 'down')}
                    disabled={index === questions.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Question Text</Label>
                <Input
                  value={question.question_text}
                  onChange={(e) =>
                    handleUpdateQuestion(question.id, { question_text: e.target.value })
                  }
                  onBlur={() => {}}
                />
              </div>

              <div>
                <Label>Possible Answers (Syntax)</Label>
                <Input
                  value={question.possible_answers || ''}
                  onChange={(e) =>
                    handleUpdateQuestion(question.id, { possible_answers: e.target.value })
                  }
                  placeholder="Leave empty for fill-in, or see syntax rules above"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Required?</Label>
                  <Select
                    value={question.is_required ? 'required' : 'optional'}
                    onValueChange={(value) =>
                      handleUpdateQuestion(question.id, { is_required: value === 'required' })
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
                  <Label>Visibility</Label>
                  <Select
                    value={question.visibility}
                    onValueChange={(value) =>
                      handleUpdateQuestion(question.id, { visibility: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal Visibility">Normal Visibility</SelectItem>
                      <SelectItem value="Administrators Only">Administrators Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Send to Staff?</Label>
                  <Select
                    value={question.send_to_staff ? 'yes' : 'no'}
                    onValueChange={(value) =>
                      handleUpdateQuestion(question.id, { send_to_staff: value === 'yes' })
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

              <div>
                <Label>Schedule Restriction (leave all unchecked for "All schedules")</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {SCHEDULES.map((schedule) => (
                    <div key={schedule} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${question.id}-${schedule}`}
                        checked={question.schedule_restrictions.includes(schedule)}
                        onCheckedChange={() =>
                          handleScheduleToggle(question.id, question.schedule_restrictions, schedule)
                        }
                      />
                      <Label
                        htmlFor={`${question.id}-${schedule}`}
                        className="text-sm font-normal"
                      >
                        {schedule}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
                placeholder="Enter your question..."
              />
            </div>

            <div>
              <Label>Possible Answers (Syntax)</Label>
              <Input
                value={newQuestion.possible_answers}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, possible_answers: e.target.value })
                }
                placeholder="Leave empty for fill-in, or see syntax rules above"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                <Label>Visibility</Label>
                <Select
                  value={newQuestion.visibility}
                  onValueChange={(value) =>
                    setNewQuestion({ ...newQuestion, visibility: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal Visibility">Normal Visibility</SelectItem>
                    <SelectItem value="Administrators Only">Administrators Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Send to Staff?</Label>
                <Select
                  value={newQuestion.send_to_staff ? 'yes' : 'no'}
                  onValueChange={(value) =>
                    setNewQuestion({ ...newQuestion, send_to_staff: value === 'yes' })
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

      {questions.length >= 20 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Maximum of 20 questions reached. Delete a question to add a new one.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
