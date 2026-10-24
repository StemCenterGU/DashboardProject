'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowUp, ArrowDown, Info } from 'lucide-react'
import { toast } from 'sonner'

interface RegistrationQuestion {
  id?: number
  question_number: number
  question_text: string
  possible_answers: string | null
  is_required: boolean
  display_on_appointment: boolean
}

// Default registration questions matching the provided data
const DEFAULT_QUESTIONS: RegistrationQuestion[] = [
  {
    question_number: 1,
    question_text: 'What is your class standing?',
    possible_answers: 'Dual-Enrollment,Freshman,Sophomore,Junior,Senior,Graduate,N/A',
    is_required: true,
    display_on_appointment: false,
  },
  {
    question_number: 2,
    question_text: 'Graduation Year',
    possible_answers: '2026,2027,2028,2029,2030,2031,N/A',
    is_required: true,
    display_on_appointment: false,
  },
  {
    question_number: 3,
    question_text: 'Primary Major/Program',
    possible_answers: 'Not Listed,Undergraduate | Accounting | B.S.,Undergraduate | Accounting | A.S.,Undergraduate | Accounting | Minor,Undergraduate | Advertising Communications | B.S.,Undergraduate | Advertising Communications | Minor,Undergraduate | Archaeology and Culture | Minor,Undergraduate | Athletic Coaching | Minor,Undergraduate | Bioinformatics | B.S.,Undergraduate | Biology | B.S.,Undergraduate | Biology | Teaching Certificate,Undergraduate | Biology | Minor,Undergraduate | Biomedical Engineering | B.S.,Undergraduate | Business Administration | B.S.,Undergraduate | Business Administration | A.S.,Undergraduate | Business Administration | Certificate,Undergraduate | Business Administration | Minor,Undergraduate | Chemical Engineering | B.S. (Gannon),Undergraduate | Chemical Engineering | B.S. (Pittsburgh),Undergraduate | Chemistry | B.S.,Undergraduate | Communication and Rhetorical Studies | Minor,Undergraduate | Communication Arts-Electronic Media | B.A.,Undergraduate | Computer Science | B.S.,Undergraduate | Computer Science | Minor,Undergraduate | Corrections | Minor,Undergraduate | Criminal Justice | B.A.,Undergraduate | Criminal Justice | A.A.,Undergraduate | Criminal Justice | Certificate,Undergraduate | Criminal Justice | Minor,Undergraduate | Early Childhood Ed./Early Interv. | A.A.,Undergraduate | Early Childhood Education PreK-4 | B.S.,Undergraduate | Early Childhood Ed. PreK-4/Spec. Ed. PreK-8 | B.S.,Undergraduate | Earth Science | Minor,Undergraduate | Electrical and Computer Engineering | B.S.,Undergraduate | English | B.A.,Undergraduate | English | Teaching Certificate,Undergraduate | English | Minor,Undergraduate | Entrepreneurship | B.S.,Undergraduate | Entrepreneurship | Minor,Undergraduate | Environmental Engineering | B.S.,Undergraduate | Environmental Science | B.S.,Undergraduate | Exercise Science | Minor,Undergraduate | Finance | B.S.,Undergraduate | Finance | Minor,Undergraduate | Fine Arts | Minor,Undergraduate | Foreign Language and International Studies | B.A.,Undergraduate | Foreign Language and Literature | B.A.,Undergraduate | Foreign Language and Literature | Teaching Certificate,Undergraduate | Forensic Investigation | Minor,Undergraduate | French | Minor,Undergraduate | German | Minor,Undergraduate | Gerontology | Certificate,Undergraduate | Gerontology | Minor,Undergraduate | Health Science | B.S.,Undergraduate | History | B.A.,Undergraduate | History | Teaching Certificate,Undergraduate | History | Minor,Undergraduate | Human Resource Management | Minor,Undergraduate | Human Resources | Certificate,Undergraduate | Industrial Engineering | B.S.,Undergraduate | Information Systems | B.S.,Undergraduate | Information Systems | Minor,Undergraduate | International Business | B.S.,Undergraduate | International Business | Minor,Undergraduate | International Studies | B.A.,Undergraduate | International Studies | Minor,Undergraduate | Journalism Communications | B.A.,Undergraduate | Journalism Communications | Minor,Undergraduate | Juvenile Justice | Certificate,Undergraduate | Juvenile Justice | Minor,Undergraduate | Leadership Studies | B.S.,Undergraduate | Leadership Studies | Certificate,Undergraduate | Leadership Studies | Minor,Undergraduate | Legal Studies | B.A.,Undergraduate | Legal Studies | A.A.,Undergraduate | Legal Studies | Certificate,Undergraduate | Liberal Arts | B.A.,Undergraduate | Liberal Arts | A.A.,Undergraduate | Management | B.S.,Undergraduate | Marketing | B.S.,Undergraduate | Marketing | Minor,Undergraduate | Mathematics | B.S.,Undergraduate | Mathematics | Teaching Certificate,Undergraduate | Mathematics | Minor,Undergraduate | Mechanical Engineering | B.S.,Undergraduate | Medical Program | B.S. (Gannon); D.O. (LECOM),Undergraduate | Medical Program | B.S. (Gannon); D.O. (PCOM),Undergraduate | Medical Program | B.S. (Gannon); M.D. (Ross),Undergraduate | Medical Technology | B.S.,Undergraduate | Microcomputer Applications | Certificate,Undergraduate | Middle Level Education 4-8 | B.S.,Undergraduate | Middle Level Ed. 4-8/Spec. Ed. PreK-8 | B.S.,Undergraduate | Mortuary Science | B.S.,Undergraduate | Nanotechnology | Minor,Undergraduate | Nursing | B.S.,Undergraduate | Nursing RN-BSN | B.S.,Undergraduate | Nursing RN-BSN (Online) | B.S.,Undergraduate | Nutrition and Human Performance | B.S.,Undergraduate | Occupational Therapy | M.S.,Undergraduate | Optometry | B.S.,Undergraduate | Optometry | B.S. (Salus),Undergraduate | Philosophy | B.A.,Undergraduate | Philosophy | Minor,Undergraduate | Physical Therapy | D.P.T.,Undergraduate | Physician Assistant | M.P.A.S.,Undergraduate | Podiatry Medicine | B.S. (Gannon); D.P.M. (Temple),Undergraduate | Podiatry Medicine | B.S. (Gannon); D.O. (LECOM),Undergraduate | Political Science | B.A.,Undergraduate | Political Science | Minor,Undergraduate | Polysomnography | Certificate,Undergraduate | Pre-Law | 3/3 Early Admissions,Undergraduate | Pre-Law | Minor,Undergraduate | Pre-Pharmacy | Pharm.D. (Charleston),Undergraduate | Pre-Pharmacy | Pharm.D. (Duquesne),Undergraduate | Pre-Pharmacy | Pharm.D. (LECOM),Undergraduate | Pre-Pharm. Dual Deg. | B.S. (GU); Pharm.D. (Charleston),Undergraduate | Pre-Professional Medical (various fields),Undergraduate | Process Management | Minor,Undergraduate | Psychology | B.A.,Undergraduate | Psychology | Minor,Undergraduate | Radiologic Sciences | A.S.,Undergraduate | Respiratory Care | B.S.,Undergraduate | Respiratory Care | A.S.,Undergraduate | Risk Management and Insurance | B.S.,Undergraduate | Risk Management and Insurance | Certificate,Undergraduate | Risk Management and Insurance | Minor,Undergraduate | School Nurse Certification | Certificate,Undergraduate | Science | B.S.,Undergraduate | Secondary Education and K12 | B.S.,Undergraduate | Social Work | B.A.,Undergraduate | Social Work | Minor,Undergraduate | Software Engineering | B.S.,Undergraduate | Spanish | Minor,Undergraduate | Sport and Exercise Science | B.S.,Undergraduate | Sports Behavior | Minor,Undergraduate | Sports Management and Marketing | B.S.,Undergraduate | Statistics | Minor,Undergraduate | Theatre | B.A.,Undergraduate | Theatre | Minor,Undergraduate | Theatre and Communication Arts | B.A.,Undergraduate | Theology | B.A.,Undergraduate | Theology | Minor,Undergraduate | Undeclared,Undergraduate | Veterinary Program | B.S. (Gannon); D.V.M. (Ross),Undergraduate | Womens Studies | Minor,Graduate | Advanced Counselor Studies | Graduate Certificate,Graduate | Business Administration | M.B.A.,Graduate | Business Administration (Online) | M.B.A.,Graduate | Community Counseling | M.S.,Graduate | Computer and Information Science | M.S.,Graduate | Counseling Psychology | Ph.D.,Graduate | Curriculum and Instruction-Cohort Option | M.Ed.,Graduate | Curriculum and Instruction-On Campus | M.Ed.,Graduate | Educational Leadership | M.Ed.,Graduate | Electrical Engineering | M.S.,Graduate | Embedded Software Engineering | M.S.,Graduate | Engineering Management | M.S.,Graduate | Engineering Management (Online) | M.S.,Graduate | English | M.A.,Graduate | ESL Program Specialist | Graduate Certificate,Graduate | Environmental Health and Engineering | M.S.,Graduate | Environmental Health and Safety | Graduate Certificate,Graduate | Finance | Graduate Certificate,Graduate | Gerontology | Graduate Certificate,Graduate | Human Resource Management | Graduate Certificate,Graduate | Marketing | Graduate Certificate,Graduate | Mechanical Engineering | M.S.,Graduate | Nat. Board for Prof. Teach. Standards | Graduate Certificate,Graduate | Natural and Environmental Sciences | M.Ed.,Graduate | Nurse Anesthesia | M.S.N.,Graduate | Nurse Practitioner | M.S.N.,Graduate | Nursing Administration | M.S.N.,Graduate | Nursing RN to MSN | M.S.N.,Graduate | Occupational Therapy | M.S.,Graduate | Organizational Leadership | Graduate Certificate,Graduate | Organizational Learning and Leadership | Ph.D.,Graduate | Pastoral Leadership | Graduate Certificate,Graduate | Pastoral Ministry | Graduate Certificate,Graduate | Pastoral Studies | M.A.,Graduate | Physical Therapy | D.P.T.,Graduate | Physician Assistant | M.P.A.S.,Graduate | Principal K-12 | Graduate Certificate,Graduate | Public Administration | M.P.A.,Graduate | Public Administration | Graduate Certificate,Graduate | Public Administration (Online) | M.P.A.,Graduate | Reading | M.Ed.,Graduate | Reading Specialist | Graduate Certificate,Graduate | Religious Education | Graduate Certificate,Graduate | Secondary Teaching Certification | Graduate Certificate,Graduate | Superintendent Letter of Eligibility | Graduate Certificate,Graduate | Supervisor of Curriculum | Graduate Certificate,Graduate | Supervisor of Special Education | Graduate Certificate,Other – Please list in comments section below,N/A – Gannon Employee',
    is_required: true,
    display_on_appointment: false,
  },
  {
    question_number: 4,
    question_text: 'Additional Major/Program',
    possible_answers: 'Undergraduate | Accounting | B.S.,Undergraduate | Accounting | A.S.,Undergraduate | Accounting | Minor,Undergraduate | Advertising Communications | B.S.,Undergraduate | Advertising Communications | Minor,Undergraduate | Archaeology and Culture | Minor,Undergraduate | Athletic Coaching | Minor,Undergraduate | Bioinformatics | B.S.,Undergraduate | Biology | B.S.,Undergraduate | Biology | Teaching Certificate,Undergraduate | Biology | Minor,Undergraduate | Biomedical Engineering | B.S.,Undergraduate | Business Administration | B.S.,Undergraduate | Business Administration | A.S.,Undergraduate | Business Administration | Certificate,Undergraduate | Business Administration | Minor,Undergraduate | Chemical Engineering | B.S. (Gannon),Undergraduate | Chemical Engineering | B.S. (Pittsburgh),Undergraduate | Chemistry | B.S.,Undergraduate | Communication and Rhetorical Studies | Minor,Undergraduate | Communication Arts-Electronic Media | B.A.,Undergraduate | Computer Science | B.S.,Undergraduate | Computer Science | Minor,Undergraduate | Corrections | Minor,Undergraduate | Criminal Justice | B.A.,Undergraduate | Criminal Justice | A.A.,Undergraduate | Criminal Justice | Certificate,Undergraduate | Criminal Justice | Minor,Undergraduate | Early Childhood Ed./Early Interv. | A.A.,Undergraduate | Early Childhood Education PreK-4 | B.S.,Undergraduate | Early Childhood Ed. PreK-4/Spec. Ed. PreK-8 | B.S.,Undergraduate | Earth Science | Minor,Undergraduate | Electrical and Computer Engineering | B.S.,Undergraduate | English | B.A.,Undergraduate | English | Teaching Certificate,Undergraduate | English | Minor,Undergraduate | Entrepreneurship | B.S.,Undergraduate | Entrepreneurship | Minor,Undergraduate | Environmental Engineering | B.S.,Undergraduate | Environmental Science | B.S.,Undergraduate | Exercise Science | Minor,Undergraduate | Finance | B.S.,Undergraduate | Finance | Minor,Undergraduate | Fine Arts | Minor,Undergraduate | Foreign Language and International Studies | B.A.,Undergraduate | Foreign Language and Literature | B.A.,Undergraduate | Foreign Language and Literature | Teaching Certificate,Undergraduate | Forensic Investigation | Minor,Undergraduate | French | Minor,Undergraduate | German | Minor,Undergraduate | Gerontology | Certificate,Undergraduate | Gerontology | Minor,Undergraduate | Health Science | B.S.,Undergraduate | History | B.A.,Undergraduate | History | Teaching Certificate,Undergraduate | History | Minor,Undergraduate | Human Resource Management | Minor,Undergraduate | Human Resources | Certificate,Undergraduate | Industrial Engineering | B.S.,Undergraduate | Information Systems | B.S.,Undergraduate | Information Systems | Minor,Undergraduate | International Business | B.S.,Undergraduate | International Business | Minor,Undergraduate | International Studies | B.A.,Undergraduate | International Studies | Minor,Undergraduate | Journalism Communications | B.A.,Undergraduate | Journalism Communications | Minor,Undergraduate | Juvenile Justice | Certificate,Undergraduate | Juvenile Justice | Minor,Undergraduate | Leadership Studies | B.S.,Undergraduate | Leadership Studies | Certificate,Undergraduate | Leadership Studies | Minor,Undergraduate | Legal Studies | B.A.,Undergraduate | Legal Studies | A.A.,Undergraduate | Legal Studies | Certificate,Undergraduate | Liberal Arts | B.A.,Undergraduate | Liberal Arts | A.A.,Undergraduate | Management | B.S.,Undergraduate | Marketing | B.S.,Undergraduate | Marketing | Minor,Undergraduate | Mathematics | B.S.,Undergraduate | Mathematics | Teaching Certificate,Undergraduate | Mathematics | Minor,Undergraduate | Mechanical Engineering | B.S.,Undergraduate | Medical Program | B.S. (Gannon); D.O. (LECOM),Undergraduate | Medical Program | B.S. (Gannon); D.O. (PCOM),Undergraduate | Medical Program | B.S. (Gannon); M.D. (Ross),Undergraduate | Medical Technology | B.S.,Undergraduate | Microcomputer Applications | Certificate,Undergraduate | Middle Level Education 4-8 | B.S.,Undergraduate | Middle Level Ed. 4-8/Spec. Ed. PreK-8 | B.S.,Undergraduate | Mortuary Science | B.S.,Undergraduate | Nanotechnology | Minor,Undergraduate | Nursing | B.S.,Undergraduate | Nursing RN-BSN | B.S.,Undergraduate | Nursing RN-BSN (Online) | B.S.,Undergraduate | Nutrition and Human Performance | B.S.,Undergraduate | Occupational Therapy | M.S.,Undergraduate | Optometry | B.S.,Undergraduate | Optometry | B.S. (Salus),Undergraduate | Philosophy | B.A.,Undergraduate | Philosophy | Minor,Undergraduate | Physical Therapy | D.P.T.,Undergraduate | Physician Assistant | M.P.A.S.,Undergraduate | Podiatry Medicine | B.S. (Gannon); D.P.M. (Temple),Undergraduate | Podiatry Medicine | B.S. (Gannon); D.O. (LECOM),Undergraduate | Political Science | B.A.,Undergraduate | Political Science | Minor,Undergraduate | Polysomnography | Certificate,Undergraduate | Pre-Law | 3/3 Early Admissions,Undergraduate | Pre-Law | Minor,Undergraduate | Pre-Pharmacy | Pharm.D. (Charleston),Undergraduate | Pre-Pharmacy | Pharm.D. (Duquesne),Undergraduate | Pre-Pharmacy | Pharm.D. (LECOM),Undergraduate | Pre-Pharm. Dual Deg. | B.S. (GU); Pharm.D. (Charleston),Undergraduate | Pre-Professional Medical (various fields),Undergraduate | Process Management | Minor,Undergraduate | Psychology | B.A.,Undergraduate | Psychology | Minor,Undergraduate | Radiologic Sciences | A.S.,Undergraduate | Respiratory Care | B.S.,Undergraduate | Respiratory Care | A.S.,Undergraduate | Risk Management and Insurance | B.S.,Undergraduate | Risk Management and Insurance | Certificate,Undergraduate | Risk Management and Insurance | Minor,Undergraduate | School Nurse Certification | Certificate,Undergraduate | Science | B.S.,Undergraduate | Secondary Education and K12 | B.S.,Undergraduate | Social Work | B.A.,Undergraduate | Social Work | Minor,Undergraduate | Software Engineering | B.S.,Undergraduate | Spanish | Minor,Undergraduate | Sport and Exercise Science | B.S.,Undergraduate | Sports Behavior | Minor,Undergraduate | Sports Management and Marketing | B.S.,Undergraduate | Statistics | Minor,Undergraduate | Theatre | B.A.,Undergraduate | Theatre | Minor,Undergraduate | Theatre and Communication Arts | B.A.,Undergraduate | Theology | B.A.,Undergraduate | Theology | Minor,Undergraduate | Undeclared,Undergraduate | Veterinary Program | B.S. (Gannon); D.V.M. (Ross),Undergraduate | Womens Studies | Minor,Graduate | Advanced Counselor Studies | Graduate Certificate,Graduate | Business Administration | M.B.A.,Graduate | Business Administration (Online) | M.B.A.,Graduate | Community Counseling | M.S.,Graduate | Computer and Information Science | M.S.,Graduate | Counseling Psychology | Ph.D.,Graduate | Curriculum and Instruction-Cohort Option | M.Ed.,Graduate | Curriculum and Instruction-On Campus | M.Ed.,Graduate | Educational Leadership | M.Ed.,Graduate | Electrical Engineering | M.S.,Graduate | Embedded Software Engineering | M.S.,Graduate | Engineering Management | M.S.,Graduate | Engineering Management (Online) | M.S.,Graduate | English | M.A.,Graduate | ESL Program Specialist | Graduate Certificate,Graduate | Environmental Health and Engineering | M.S.,Graduate | Environmental Health and Safety | Graduate Certificate,Graduate | Finance | Graduate Certificate,Graduate | Gerontology | Graduate Certificate,Graduate | Human Resource Management | Graduate Certificate,Graduate | Marketing | Graduate Certificate,Graduate | Mechanical Engineering | M.S.,Graduate | Nat. Board for Prof. Teach. Standards | Graduate Certificate,Graduate | Natural and Environmental Sciences | M.Ed.,Graduate | Nurse Anesthesia | M.S.N.,Graduate | Nurse Practitioner | M.S.N.,Graduate | Nursing Administration | M.S.N.,Graduate | Nursing RN to MSN | M.S.N.,Graduate | Occupational Therapy | M.S.,Graduate | Organizational Leadership | Graduate Certificate,Graduate | Organizational Learning and Leadership | Ph.D.,Graduate | Pastoral Leadership | Graduate Certificate,Graduate | Pastoral Ministry | Graduate Certificate,Graduate | Pastoral Studies | M.A.,Graduate | Physical Therapy | D.P.T.,Graduate | Physician Assistant | M.P.A.S.,Graduate | Principal K-12 | Graduate Certificate,Graduate | Public Administration | M.P.A.,Graduate | Public Administration | Graduate Certificate,Graduate | Public Administration (Online) | M.P.A.,Graduate | Reading | M.Ed.,Graduate | Reading Specialist | Graduate Certificate,Graduate | Religious Education | Graduate Certificate,Graduate | Secondary Teaching Certification | Graduate Certificate,Graduate | Superintendent Letter of Eligibility | Graduate Certificate,Graduate | Supervisor of Curriculum | Graduate Certificate,Graduate | Supervisor of Special Education | Graduate Certificate,Other – Please list in comments section below,N/A – Gannon Employee',
    is_required: false,
    display_on_appointment: false,
  },
  {
    question_number: 5,
    question_text: 'Is English your primary language?',
    possible_answers: 'Yes,No',
    is_required: true,
    display_on_appointment: false,
  },
  {
    question_number: 6,
    question_text: 'Applicable Programs/Services',
    possible_answers: 'CHECKBOX,SSS,Commuter Student,International Student,ODS,None of these',
    is_required: true,
    display_on_appointment: false,
  },
  {
    question_number: 7,
    question_text: 'Please provide your location',
    possible_answers: 'CHECKBOX,Erie PA,Ruskin FL,Online',
    is_required: true,
    display_on_appointment: false,
  },
]

export default function RegistrationFormsPage() {
  const [questions, setQuestions] = useState<RegistrationQuestion[]>(DEFAULT_QUESTIONS)
  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  // New question state
  const [newQuestion, setNewQuestion] = useState<RegistrationQuestion>({
    question_number: 8,
    question_text: '',
    possible_answers: null,
    is_required: false,
    display_on_appointment: false,
  })

  // Fetch programs from database on mount
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        // Fetch both Primary and Additional programs lists
        const [primaryResponse, additionalResponse] = await Promise.all([
          fetch('/api/admin/programs?type=primary'),
          fetch('/api/admin/programs?type=additional')
        ])

        if (primaryResponse.ok && additionalResponse.ok) {
          const primaryData = await primaryResponse.json()
          const additionalData = await additionalResponse.json()

          // Update questions with respective programs lists
          const updatedQuestions = questions.map((q, index) => {
            if (index === 2) { // Question 3: Primary Major/Program
              return {
                ...q,
                possible_answers: primaryData.programsList
              }
            } else if (index === 3) { // Question 4: Additional Major/Program
              return {
                ...q,
                possible_answers: additionalData.programsList
              }
            }
            return q
          })

          setQuestions(updatedQuestions)
        }
      } catch (error) {
        console.error('Error fetching programs:', error)
        toast.error('Failed to load programs list')
      } finally {
        setLoading(false)
      }
    }

    fetchPrograms()
  }, [])

  const updateQuestion = (index: number, updates: Partial<RegistrationQuestion>) => {
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
      display_on_appointment: false,
    })
    setHasChanges(true)
    toast.success('Question added. Click "Save Changes" to persist.')
  }

  const handleSaveChanges = async () => {
    try {
      // TODO: Implement API call to save registration questions
      // const response = await fetch('/api/admin/registration-questions', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ questions }),
      // })

      toast.success('Changes saved successfully')
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving changes:', error)
      toast.error('Failed to save changes')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">Loading registration form configuration...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-4">
          <strong>Use the options below to configure the questions asked on the registration form.</strong>{' '}
          The registration form collects demographic information when a client registers for an account.{' '}
          <strong>Have questions?</strong> More information is available{' '}
          <a href="#" className="text-blue-600 underline">
            in the manual
          </a>
          .
        </p>
      </div>

      {/* Registration Form Questions */}
      <div className="mb-8 p-6 border rounded-lg bg-white">
        <h2 className="text-xl font-semibold mb-2">Registration Form Questions</h2>

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
                <div className="flex-1 grid grid-cols-4 gap-4">
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
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      Display on Appointment?{' '}
                      <span title="Show this data to tutors on appointment details"><Info className="h-3 w-3 text-gray-400" /></span>
                    </Label>
                    <Select
                      value={question.display_on_appointment ? 'Yes' : 'No'}
                      onValueChange={(value) =>
                        updateQuestion(index, { display_on_appointment: value === 'Yes' })
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
              </div>
            </div>
          ))}
        </div>

        {/* Add New Question Section */}
        <div className="mt-8 p-6 border-2 border-blue-300 rounded-lg bg-blue-50">
          <h3 className="font-semibold mb-4">
            The registration form accommodates up to twenty questions. To add a new question to the
            registration form, fill in the information below and then select 'save changes.' Once you add a
            new question and save your changes, you'll be prompted to add another new question.
          </h3>
          <div className="grid grid-cols-4 gap-4">
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
            <div>
              <Label className="flex items-center gap-1">
                Display on Appointment?{' '}
                <span title="Show this data to tutors"><Info className="h-3 w-3 text-gray-400" /></span>
              </Label>
              <Select
                value={newQuestion.display_on_appointment ? 'Yes' : 'No'}
                onValueChange={(value) =>
                  setNewQuestion({ ...newQuestion, display_on_appointment: value === 'Yes' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
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
