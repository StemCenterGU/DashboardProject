'use client'

import { parseFormField } from '@/lib/form-parser'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface DynamicFormFieldProps {
  questionId: string
  questionText: string
  possibleAnswers: string | null
  isRequired: boolean
  value: string | string[]
  onChange: (value: string | string[]) => void
}

export function DynamicFormField({
  questionId,
  questionText,
  possibleAnswers,
  isRequired,
  value,
  onChange,
}: DynamicFormFieldProps) {
  const parsed = parseFormField(possibleAnswers)

  const renderField = () => {
    switch (parsed.type) {
      case 'FILL_IN':
        return (
          <Input
            id={questionId}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
          />
        )

      case 'TEXTAREA':
        return (
          <Textarea
            id={questionId}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
            rows={4}
          />
        )

      case 'LIKERT':
        return (
          <RadioGroup
            value={value as string}
            onValueChange={onChange}
            required={isRequired}
          >
            <div className="flex gap-4 flex-wrap">
              {['1', '2', '3', '4', '5', 'N/A'].map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${questionId}-${option}`} />
                  <Label htmlFor={`${questionId}-${option}`} className="font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              1 = Strongly Disagree, 5 = Strongly Agree
            </div>
          </RadioGroup>
        )

      case 'SINGLE_CHECKBOX':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={questionId}
              checked={value === 'true' || value === 'checked'}
              onCheckedChange={(checked) =>
                onChange(checked ? 'checked' : 'unchecked')
              }
            />
            <Label htmlFor={questionId} className="font-normal">
              {parsed.checkboxLabel || 'Check this option'}
            </Label>
          </div>
        )

      case 'CHECKBOX_GROUP':
        const selectedOptions = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            {parsed.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${questionId}-${option}`}
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValue = checked
                      ? [...selectedOptions, option]
                      : selectedOptions.filter((o) => o !== option)
                    onChange(newValue)
                  }}
                />
                <Label htmlFor={`${questionId}-${option}`} className="font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )

      case 'DROPDOWN':
        return (
          <Select
            value={value as string}
            onValueChange={onChange}
            required={isRequired}
          >
            <SelectTrigger id={questionId}>
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {parsed.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      default:
        return (
          <Input
            id={questionId}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={questionId}>
        {questionText}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
    </div>
  )
}
