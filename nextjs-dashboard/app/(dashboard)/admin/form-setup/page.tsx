'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowUp, ArrowDown, Trash2, Info, X } from 'lucide-react'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'

interface FormQuestion {
  id?: string
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
  'OAS - Office of Accessibility Services (Ruskin)',
  'Palumbo - Student Success Center (STEM Center satellite location)',
  'Sanner Presentation Studio',
  'STEM Center',
  'STEM Center Proctored Exams',
  'Writing Center/Humanities Tutoring SP26',
  'ZZZZ - Practice Schedule (not real!)',
  'ZZZZ - Practice Schedule 2 (not real!)',
  'WC/Humanities Tutoring PRE FA21',
  'WC/Humanities Tutoring PRE FA22',
  'WC/Humanities Tutoring PRE SP22',
  'Writing Center/Humanities Tutoring FA13',
  'Writing Center/Humanities Tutoring FA14',
  'Writing Center/Humanities Tutoring FA15',
  'Writing Center/Humanities Tutoring FA16',
  'Writing Center/Humanities Tutoring FA17',
  'Writing Center/Humanities Tutoring FA18',
  'Writing Center/Humanities Tutoring FA19',
  'Writing Center/Humanities Tutoring FA20',
  'Writing Center/Humanities Tutoring FA21',
  'Writing Center/Humanities Tutoring FA22',
  'Writing Center/Humanities Tutoring FA23',
  'Writing Center/Humanities Tutoring FA24',
  'Writing Center/Humanities Tutoring FA25',
  'Writing Center/Humanities Tutoring SM13',
  'Writing Center/Humanities Tutoring SM14',
  'Writing Center/Humanities Tutoring SM15',
  'Writing Center/Humanities Tutoring SM16',
  'Writing Center/Humanities Tutoring SM17',
  'Writing Center/Humanities Tutoring SM18',
  'Writing Center/Humanities Tutoring SM19',
  'Writing Center/Humanities Tutoring SM20',
  'Writing Center/Humanities Tutoring SM21',
  'Writing Center/Humanities Tutoring SM22',
  'Writing Center/Humanities Tutoring SM23',
  'Writing Center/Humanities Tutoring SM24',
  'Writing Center/Humanities Tutoring SM25',
  'Writing Center/Humanities Tutoring SP13',
  'Writing Center/Humanities Tutoring SP15',
  'Writing Center/Humanities Tutoring SP16',
  'Writing Center/Humanities Tutoring SP17',
  'Writing Center/Humanities Tutoring SP18',
  'Writing Center/Humanities Tutoring SP19',
  'Writing Center/Humanities Tutoring SP20',
  'Writing Center/Humanities Tutoring SP21',
  'Writing Center/Humanities Tutoring SP22',
  'Writing Center/Humanities Tutoring SP23',
  'Writing Center/Humanities Tutoring SP24',
  'Writing Center/Humanities Tutoring SP25',
  '~ WeBWorK Exams ~',
  '~ Writing and Wellness Write-In ~',
  '~ Writing and Wellness Write-In FA17~',
  '~Nogaj College Algebra Exam Retake',
  '~Nogaj MATH 111',
  '~Prier Calculus 1 Gateway Exam',
  '~WeBWorK Exams',
  '~Writing and Wellness Write-In FA18~',
  'Bookstore Drawing!',
  'Caulfield Gateway',
  'College Algebra Presentations',
  'Graduate Writing FA19',
  'Graduate Writing FA20',
  'Graduate Writing FA21',
  'Graduate Writing FA22',
  'Graduate Writing FA23',
  'Graduate Writing FA24',
  'Graduate Writing FA25',
  'Graduate Writing PRE FA22',
  'Graduate Writing SM19',
  'Graduate Writing SM20',
  'Graduate Writing SM21',
  'Graduate Writing SM22',
  'Graduate Writing SM23',
  'Graduate Writing SM24',
  'Graduate Writing SM25',
  'Graduate Writing SP20',
  'Graduate Writing SP21',
  'Graduate Writing SP22',
  'Graduate Writing SP23',
  'Graduate Writing SP24',
  'Graduate Writing SP25',
  'Graduate Writing WM20',
  'Math Center - 2012 Fall',
  'Math Center - 2013 Spring',
  'Math Center - 2013 Summer',
  'Math Center & Subject Area (FA13)',
  'Math Center & Subject Area Tutoring',
  'Math/Tutoring/Speech Fall 2014',
  'Math/Tutoring/Speech SPRING 2015',
  'Mathematics Center - 2012 Fall (Start)',
  'Mathematics Center - 2012 Spring',
  'Mathematics Center - 2012 Summer',
  'Mr. Nogaj Student Appointments',
  'Office Hours - 2012 Fall',
  'Online Tutoring -- Math - 2012 Spring',
  'Peer Mentoring',
  'Proctored Exams - 2013 Spring',
  'PSLD Exam Room Reservations - 2013Spring',
  'Speech Communication Center',
  'Speech Communication Center - 2012 Fall',
  'Speech Communication Center - 2012 Sprin',
  'Speech Communication Center - 2013Spring',
  'Speech Communication Center FA13',
  'Staff Use Only - FA25',
  'STEM Center (FA 15)',
  'STEM Center / Tutoring SUMMER 2015',
  'STEM Center 16/SP',
  'STEM Center 16FA',
  'STEM Center 16SP',
  'STEM Center 17/FA',
  'STEM Center 17/SP',
  'STEM Center 17/SU',
  'STEM Center 18/FA',
  'STEM Center 18/SP',
  'STEM Center 18/SU',
  'STEM Center 19/FA',
  'STEM Center 19/SP',
  'STEM Center 20/FA',
  'STEM Center 20/SP Physical',
  'STEM Center 20/SU Information',
  'STEM Center 21/FA',
  'STEM Center 21/SP',
  'STEM Center 22/FA',
  'STEM Center 22/SP',
  'STEM Center 23/FA',
  'STEM Center 23/SP',
  'STEM Center 24/FA',
  'STEM Center 24/SP',
  'STEM Center 25/FA',
  'STEM Center 25/SP',
  'STEM Center Finals Week',
  'STEM Center Proctored Exams (archive)',
  'STEM/WRC Spaces',
  'Test',
  'Test Schedule',
  'Tutoring Center - 2013 Spring',
  'Tutoring Summer 2014',
  'Undeclared FA13 Registration - Spring 13',
  'Welcome!!!!',
  'Wintermester Tutoring',
  'WRC TEST ZZZZ',
  'ZZ Test Schedule (not real!)',
]

// Multi-select dropdown component for schedules
function ScheduleMultiSelect({
  selectedSchedules,
  onChange,
}: {
  selectedSchedules: string[]
  onChange: (schedules: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const toggleSchedule = (schedule: string) => {
    if (selectedSchedules.includes(schedule)) {
      onChange(selectedSchedules.filter((s) => s !== schedule))
    } else {
      onChange([...selectedSchedules, schedule])
    }
  }

  const filteredSchedules = SCHEDULES.filter((schedule) =>
    schedule.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal h-auto min-h-[2.5rem]"
        >
          <span className="truncate">
            {selectedSchedules.length === 0
              ? 'Select schedules...'
              : `${selectedSchedules.length} schedule(s) selected`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Search schedules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>
        <ScrollArea className="h-64 p-2">
          {filteredSchedules.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No schedules found</p>
          ) : (
            filteredSchedules.map((schedule) => (
              <div
                key={schedule}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => toggleSchedule(schedule)}
              >
                <Checkbox
                  checked={selectedSchedules.includes(schedule)}
                  onCheckedChange={() => toggleSchedule(schedule)}
                />
                <label className="text-sm cursor-pointer flex-1">{schedule}</label>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

export default function FormSetupPage() {
  const [originalQuestions, setOriginalQuestions] = useState<FormQuestion[]>([])
  const [questions, setQuestions] = useState<FormQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // New question state
  const [newQuestion, setNewQuestion] = useState<FormQuestion>({
    question_number: 0,
    question_text: '',
    possible_answers: '',
    is_required: false,
    visibility: 'Normal Visibility',
    send_to_staff: false,
    schedule_restrictions: [],
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
        const loadedQuestions = data.questions || []
        setQuestions(loadedQuestions)
        setOriginalQuestions(JSON.parse(JSON.stringify(loadedQuestions)))
        setHasChanges(false)
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

  const updateLocalQuestion = (index: number, updates: Partial<FormQuestion>) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], ...updates }
    setQuestions(updated)
    setHasChanges(true)
  }

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= questions.length) return

    const reordered = [...questions]
    const [movedQuestion] = reordered.splice(index, 1)
    reordered.splice(newIndex, 0, movedQuestion)

    reordered.forEach((q, idx) => {
      q.question_number = idx + 1
    })

    setQuestions(reordered)
    setHasChanges(true)
  }

  const handleDeleteQuestion = (index: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    const updated = questions.filter((_, i) => i !== index)
    updated.forEach((q, idx) => {
      q.question_number = idx + 1
    })

    setQuestions(updated)
    setHasChanges(true)
  }

  const handleSaveChanges = async () => {
    setSaving(true)
    try {
      const deletePromises = originalQuestions
        .filter((q) => q.id)
        .map((q) => fetch(`/api/admin/form-questions/${q.id}`, { method: 'DELETE' }))

      await Promise.all(deletePromises)

      const insertPromises = questions.map((q, idx) =>
        fetch('/api/admin/form-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...q,
            question_number: idx + 1,
          }),
        })
      )

      await Promise.all(insertPromises)

      toast.success('All changes saved successfully')
      await fetchQuestions()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleAddNewQuestion = () => {
    if (!newQuestion.question_text.trim()) {
      toast.error('Question text is required')
      return
    }

    if (questions.length >= 20) {
      toast.error('Maximum of 20 questions reached')
      return
    }

    const questionToAdd = {
      ...newQuestion,
      question_number: questions.length + 1,
    }

    setQuestions([...questions, questionToAdd])
    setNewQuestion({
      question_number: 0,
      question_text: '',
      possible_answers: '',
      is_required: false,
      visibility: 'Normal Visibility',
      send_to_staff: false,
      schedule_restrictions: [],
    })
    setHasChanges(true)
    toast.success('Question added. Click "Save Changes" to persist.')
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
          The appointment form accommodates up to twenty questions.{' '}
          <strong>
            To add a new question to the appointment form, fill in the information below and then
            select 'save changes.'
          </strong>{' '}
          Once you add a new question and save your changes, you'll be prompted to add another new
          question.
        </p>
      </div>

      {/* Instructions Banner */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Syntax Rules for "Possible Answers" field:</strong>
          <ul className="list-disc ml-4 mt-2 space-y-1">
            <li>
              <strong>FILL-IN:</strong> Leave empty for a standard text input
            </li>
            <li>
              <strong>TEXTAREA:</strong> Enter exactly "TEXTAREA" for a large text area
            </li>
            <li>
              <strong>LIKERT:</strong> Enter exactly "LIKERT" for a 5-point scale + N/A
            </li>
            <li>
              <strong>SINGLE CHECKBOX:</strong> Enter "CHECKBOX" (no commas)
            </li>
            <li>
              <strong>CHECKBOX GROUP:</strong> Enter "CHECKBOX,Option1,Option2,Option3"
            </li>
            <li>
              <strong>DROPDOWN:</strong> Enter comma-separated values: "Option1,Option2,Option3"
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Existing Questions */}
      <div className="space-y-4 mb-6">
        {questions.map((question, index) => (
          <div key={index} className="border rounded-lg p-4 bg-white">
            {/* Header Row */}
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <h3 className="font-semibold text-base">#{question.question_number}</h3>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMoveQuestion(index, 'up')}
                  disabled={index === 0}
                  className="h-8 w-8 p-0"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMoveQuestion(index, 'down')}
                  disabled={index === questions.length - 1}
                  className="h-8 w-8 p-0"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteQuestion(index)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Column 1: Question Text & Possible Answers */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Question Text</Label>
                  <Input
                    value={question.question_text}
                    onChange={(e) =>
                      updateLocalQuestion(index, { question_text: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Possible Answers</Label>
                  <Input
                    value={question.possible_answers || ''}
                    onChange={(e) =>
                      updateLocalQuestion(index, { possible_answers: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Column 2: Required, Visibility, Send to Staff */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Required?</Label>
                  <Select
                    value={question.is_required ? 'Required' : 'Optional'}
                    onValueChange={(value) =>
                      updateLocalQuestion(index, { is_required: value === 'Required' })
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
                <div>
                  <Label className="text-sm font-medium">Visibility</Label>
                  <Select
                    value={question.visibility}
                    onValueChange={(value) => updateLocalQuestion(index, { visibility: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal Visibility">Normal Visibility</SelectItem>
                      <SelectItem value="Administrators Only">Administrators Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Send to Staff?</Label>
                  <Select
                    value={question.send_to_staff ? 'Yes' : 'No'}
                    onValueChange={(value) =>
                      updateLocalQuestion(index, { send_to_staff: value === 'Yes' })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Column 3: Schedule Restriction */}
              <div>
                <Label className="text-sm font-medium">Schedule Restriction</Label>
                <div className="mt-1">
                  <ScheduleMultiSelect
                    selectedSchedules={question.schedule_restrictions}
                    onChange={(schedules) =>
                      updateLocalQuestion(index, { schedule_restrictions: schedules })
                    }
                  />
                </div>
                {question.schedule_restrictions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {question.schedule_restrictions.map((schedule) => (
                      <span
                        key={schedule}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {schedule.length > 20 ? schedule.substring(0, 20) + '...' : schedule}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-blue-600"
                          onClick={() =>
                            updateLocalQuestion(index, {
                              schedule_restrictions: question.schedule_restrictions.filter(
                                (s) => s !== schedule
                              ),
                            })
                          }
                        />
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2 text-xs">
                  {question.schedule_restrictions.length === 0 ? (
                    <span className="text-green-600 font-medium">
                      This question currently appears on <strong>all schedules</strong>.
                    </span>
                  ) : (
                    <span className="text-red-600">
                      This question currently appears on <strong>specific schedules</strong> (as
                      selected above).{' '}
                      <button
                        onClick={() => updateLocalQuestion(index, { schedule_restrictions: [] })}
                        className="underline hover:no-underline"
                      >
                        Add question to all schedules
                      </button>
                      .
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Question Section */}
      {questions.length < 20 && (
        <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50 mb-6">
          <h3 className="font-semibold text-lg mb-4 text-blue-900">New Question</h3>

          <div className="grid grid-cols-3 gap-4">
            {/* Column 1 */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">New Question</Label>
                <Input
                  value={newQuestion.question_text}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, question_text: e.target.value })
                  }
                  className="mt-1 bg-white"
                  placeholder="Enter question text..."
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Possible Answers</Label>
                <Input
                  value={newQuestion.possible_answers || ''}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, possible_answers: e.target.value })
                  }
                  className="mt-1 bg-white"
                  placeholder="See syntax rules above"
                />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Required?</Label>
                <Select
                  value={newQuestion.is_required ? 'Required' : 'Optional'}
                  onValueChange={(value) =>
                    setNewQuestion({ ...newQuestion, is_required: value === 'Required' })
                  }
                >
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Required">Required</SelectItem>
                    <SelectItem value="Optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Visibility</Label>
                <Select
                  value={newQuestion.visibility}
                  onValueChange={(value) => setNewQuestion({ ...newQuestion, visibility: value })}
                >
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal Visibility">Normal Visibility</SelectItem>
                    <SelectItem value="Administrators Only">Administrators Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Send to Staff?</Label>
                <Select
                  value={newQuestion.send_to_staff ? 'Yes' : 'No'}
                  onValueChange={(value) =>
                    setNewQuestion({ ...newQuestion, send_to_staff: value === 'Yes' })
                  }
                >
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Column 3 */}
            <div>
              <Label className="text-sm font-medium">Schedule Restriction</Label>
              <div className="mt-1">
                <ScheduleMultiSelect
                  selectedSchedules={newQuestion.schedule_restrictions}
                  onChange={(schedules) =>
                    setNewQuestion({ ...newQuestion, schedule_restrictions: schedules })
                  }
                />
              </div>
              {newQuestion.schedule_restrictions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {newQuestion.schedule_restrictions.map((schedule) => (
                    <span
                      key={schedule}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                    >
                      {schedule.length > 20 ? schedule.substring(0, 20) + '...' : schedule}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-blue-600"
                        onClick={() =>
                          setNewQuestion({
                            ...newQuestion,
                            schedule_restrictions: newQuestion.schedule_restrictions.filter(
                              (s) => s !== schedule
                            ),
                          })
                        }
                      />
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-2 text-xs">
                {newQuestion.schedule_restrictions.length === 0 ? (
                  <span className="text-green-600 font-medium">
                    This question currently appears on <strong>all schedules</strong>.
                  </span>
                ) : (
                  <span className="text-red-600">
                    This question currently appears on <strong>specific schedules</strong> (as
                    selected above).{' '}
                    <button
                      onClick={() => setNewQuestion({ ...newQuestion, schedule_restrictions: [] })}
                      className="underline hover:no-underline"
                    >
                      Add question to all schedules
                    </button>
                    .
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button onClick={handleAddNewQuestion} className="w-full mt-4" variant="default">
            Add Question to List
          </Button>
        </div>
      )}

      {/* Save Changes Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSaveChanges}
          disabled={saving || !hasChanges}
          size="lg"
          className="px-8"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {!hasChanges && questions.length > 0 && (
        <p className="text-center text-sm text-gray-500 mt-2">No changes to save</p>
      )}
    </div>
  )
}
