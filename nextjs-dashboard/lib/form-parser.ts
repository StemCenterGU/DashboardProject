/**
 * Form Syntax Parser Utility
 * Interprets the `possible_answers` string and determines the UI component to render
 *
 * Parser Logic Rules:
 * 1. FILL-IN: If `possible_answers` is empty -> Render standard text input
 * 2. LARGE TEXT AREA: If `possible_answers` exactly matches "TEXTAREA" -> Render textarea
 * 3. LIKERT: If `possible_answers` exactly matches "LIKERT" -> Render 5-point radio group + N/A
 * 4. SINGLE CHECKBOX: If `possible_answers` starts with "CHECKBOX" but has no commas -> Render single checkbox
 * 5. MULTIPLE CHECKBOXES: If `possible_answers` starts with "CHECKBOX," followed by comma-separated values -> Render checkbox group
 * 6. DROP-DOWN: If `possible_answers` contains commas but does NOT start with "CHECKBOX" -> Render select dropdown
 */

export type FormFieldType =
  | 'FILL_IN'
  | 'TEXTAREA'
  | 'LIKERT'
  | 'SINGLE_CHECKBOX'
  | 'CHECKBOX_GROUP'
  | 'DROPDOWN'

export interface ParsedFormField {
  type: FormFieldType
  options?: string[]
  checkboxLabel?: string
}

/**
 * Parse the possible_answers syntax string
 * @param possibleAnswers - The syntax string from the database
 * @returns ParsedFormField object with type and optional data
 */
export function parseFormField(possibleAnswers: string | null | undefined): ParsedFormField {
  // Rule 1: FILL-IN (empty string or null)
  if (!possibleAnswers || possibleAnswers.trim() === '') {
    return { type: 'FILL_IN' }
  }

  const trimmed = possibleAnswers.trim()

  // Rule 2: LARGE TEXT AREA (exact match "TEXTAREA")
  if (trimmed.toUpperCase() === 'TEXTAREA') {
    return { type: 'TEXTAREA' }
  }

  // Rule 3: LIKERT (exact match "LIKERT")
  if (trimmed.toUpperCase() === 'LIKERT') {
    return { type: 'LIKERT' }
  }

  // Rule 4 & 5: CHECKBOX variants
  if (trimmed.toUpperCase().startsWith('CHECKBOX')) {
    // Rule 4: SINGLE CHECKBOX (no commas after "CHECKBOX")
    if (!trimmed.includes(',')) {
      // Extract label if provided (e.g., "CHECKBOX Check this box")
      const label = trimmed.substring(8).trim() || 'Check this option'
      return {
        type: 'SINGLE_CHECKBOX',
        checkboxLabel: label
      }
    }

    // Rule 5: MULTIPLE CHECKBOXES (has commas)
    const options = trimmed
      .substring(trimmed.indexOf(',') + 1) // Remove "CHECKBOX," prefix
      .split(',')
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0)

    return {
      type: 'CHECKBOX_GROUP',
      options
    }
  }

  // Rule 6: DROP-DOWN (contains commas but not CHECKBOX)
  if (trimmed.includes(',')) {
    const options = trimmed
      .split(',')
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0)

    return {
      type: 'DROPDOWN',
      options
    }
  }

  // Fallback: treat as fill-in
  return { type: 'FILL_IN' }
}

/**
 * Validate a user's answer against the parsed field type
 * @param answer - The user's submitted answer
 * @param fieldType - The parsed field type
 * @returns True if valid, false otherwise
 */
export function validateAnswer(answer: string | string[], fieldType: FormFieldType): boolean {
  if (!answer) return false

  switch (fieldType) {
    case 'FILL_IN':
    case 'TEXTAREA':
      return typeof answer === 'string' && answer.trim().length > 0

    case 'LIKERT':
      return typeof answer === 'string' &&
        ['1', '2', '3', '4', '5', 'N/A'].includes(answer)

    case 'SINGLE_CHECKBOX':
      return typeof answer === 'string' &&
        (answer === 'true' || answer === 'false' || answer === 'checked' || answer === 'unchecked')

    case 'CHECKBOX_GROUP':
      return Array.isArray(answer) && answer.length > 0

    case 'DROPDOWN':
      return typeof answer === 'string' && answer.trim().length > 0

    default:
      return false
  }
}

/**
 * Format checkbox group answers for storage
 * @param selectedOptions - Array of selected option values
 * @returns Comma-separated string for database storage
 */
export function formatCheckboxGroupAnswer(selectedOptions: string[]): string {
  return selectedOptions.join(', ')
}

/**
 * Parse checkbox group answer from storage
 * @param storedAnswer - Comma-separated string from database
 * @returns Array of selected options
 */
export function parseCheckboxGroupAnswer(storedAnswer: string): string[] {
  if (!storedAnswer || storedAnswer.trim() === '') return []
  return storedAnswer.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0)
}
