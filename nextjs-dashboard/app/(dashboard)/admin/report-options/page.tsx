'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash2, Plus, GripVertical } from 'lucide-react'
import { toast } from 'sonner'

interface FocusOption {
  option_id: string
  category: string
  option_text: string
  display_order: number
  is_active: boolean
}

const CATEGORIES = [
  { value: 'broad_focus', label: 'Broad Appointment Focus' },
  { value: 'resources', label: 'Equipment / Resources' },
  { value: 'wrc_detailed', label: 'WRC Detailed Focus' },
  { value: 'wrc_categories', label: 'WRC Student Categories' },
  { value: 'missing_info', label: 'Missing Information' },
]

export default function ReportOptionsPage() {
  const [optionsByCategory, setOptionsByCategory] = useState<Record<string, FocusOption[]>>({})
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('broad_focus')

  // New option state
  const [newOptionText, setNewOptionText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchOptions()
  }, [])

  const fetchOptions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reports/focus-options')
      if (response.ok) {
        const data = await response.json()
        setOptionsByCategory(data.options || {})
      } else {
        toast.error('Failed to load options')
      }
    } catch (error) {
      console.error('Error fetching options:', error)
      toast.error('Failed to load options')
    } finally {
      setLoading(false)
    }
  }

  const handleAddOption = async () => {
    if (!newOptionText.trim()) {
      toast.error('Option text is required')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/reports/focus-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeCategory,
          option_text: newOptionText,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add option')
      }

      toast.success('Option added successfully')
      setNewOptionText('')
      fetchOptions()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add option')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateOption = async (id: string, updates: Partial<FocusOption>) => {
    try {
      const response = await fetch(`/api/reports/focus-options/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update option')
      }

      toast.success('Option updated')
      fetchOptions()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update option')
    }
  }

  const handleDeleteOption = async (id: string) => {
    if (!confirm('Are you sure you want to delete this option?')) return

    try {
      const response = await fetch(`/api/reports/focus-options/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete option')
      }

      toast.success('Option deleted')
      fetchOptions()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete option')
    }
  }

  const handleToggleActive = async (option: FocusOption) => {
    await handleUpdateOption(option.option_id, { is_active: !option.is_active })
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">Loading report options...</p>
      </div>
    )
  }

  const currentOptions = optionsByCategory[activeCategory] || []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Client Report Form Options</h1>
        <p className="text-gray-600 mt-2">
          Manage checkbox options for client report forms
        </p>
      </div>

      <Tabs defaultValue={activeCategory} value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="mb-6">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((cat) => (
          <TabsContent key={cat.value} value={cat.value}>
            <Card>
              <CardHeader>
                <CardTitle>{cat.label} Options</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Existing Options */}
                <div className="space-y-3 mb-6">
                  {currentOptions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No options yet. Add one below.</p>
                  ) : (
                    currentOptions.map((option) => (
                      <div
                        key={option.option_id}
                        className={`flex items-center gap-3 p-3 border rounded-md ${
                          !option.is_active ? 'bg-gray-50 opacity-60' : ''
                        }`}
                      >
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <Input
                            value={option.option_text}
                            onChange={(e) =>
                              handleUpdateOption(option.option_id, {
                                option_text: e.target.value,
                              })
                            }
                            className={!option.is_active ? 'bg-gray-100' : ''}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={option.is_active ? 'active' : 'inactive'}
                            onValueChange={(value) =>
                              handleUpdateOption(option.option_id, {
                                is_active: value === 'active',
                              })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOption(option.option_id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add New Option */}
                <div className="border-t pt-4">
                  <Label htmlFor="new-option">Add New Option</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="new-option"
                      value={newOptionText}
                      onChange={(e) => setNewOptionText(e.target.value)}
                      placeholder="Enter new option text..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddOption()
                        }
                      }}
                    />
                    <Button onClick={handleAddOption} disabled={saving}>
                      <Plus className="h-4 w-4 mr-2" />
                      {saving ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
