'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  ChevronDown,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useState, useEffect } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  showVariableInsertion?: boolean
}

// Available variable codes for email templates
const VARIABLE_CODES = [
  { code: '[date]', description: 'Appointment date' },
  { code: '[start]', description: 'Start time' },
  { code: '[end]', description: 'End time' },
  { code: '[username]', description: 'Student name/username' },
  { code: '[q73_response]', description: 'Question 3 response (Course)' },
  { code: '[q27_response]', description: 'Question 4 response (Instructor)' },
  { code: '[q71_response]', description: 'Question 7 response (Topics)' },
  { code: '[q30_response]', description: 'Question 11 response (Summary)' },
]

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  showVariableInsertion = false,
}: RichTextEditorProps) {
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [selectedHighlight, setSelectedHighlight] = useState('#ffff00')

  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration mismatch
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[200px] max-h-[400px] overflow-y-auto p-4 border rounded-b-md focus:outline-none',
      },
    },
  })

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  const insertVariable = (code: string) => {
    editor.chain().focus().insertContent(code + ' ').run()
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="border rounded-md">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
        {/* Font Family Dropdown */}
        <Select
          value="System Font"
          onValueChange={(value) => {
            // Font family change logic here
          }}
        >
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="System Font">System Font</SelectItem>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
          </SelectContent>
        </Select>

        <div className="h-6 w-px bg-gray-300 mx-1" />

        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-gray-200' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-gray-200' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-gray-200' : ''}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-gray-300 mx-1" />

        {/* Text Color */}
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => {
              setSelectedColor(e.target.value)
              editor.chain().focus().setColor(e.target.value).run()
            }}
            className="h-8 w-8 cursor-pointer rounded border"
            title="Text Color"
          />
          <span className="text-xs">A</span>
        </div>

        {/* Highlight */}
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={selectedHighlight}
            onChange={(e) => {
              setSelectedHighlight(e.target.value)
              editor.chain().focus().toggleHighlight({ color: e.target.value }).run()
            }}
            className="h-8 w-8 cursor-pointer rounded border"
            title="Highlight"
          />
        </div>

        <div className="h-6 w-px bg-gray-300 mx-1" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-gray-300 mx-1" />

        {/* Font Size */}
        <Select
          value="12pt"
          onValueChange={(value) => {
            // Font size logic
          }}
        >
          <SelectTrigger className="w-[80px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="8pt">8pt</SelectItem>
            <SelectItem value="10pt">10pt</SelectItem>
            <SelectItem value="12pt">12pt</SelectItem>
            <SelectItem value="14pt">14pt</SelectItem>
            <SelectItem value="16pt">16pt</SelectItem>
            <SelectItem value="18pt">18pt</SelectItem>
            <SelectItem value="24pt">24pt</SelectItem>
          </SelectContent>
        </Select>

        <div className="h-6 w-px bg-gray-300 mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-gray-300 mx-1" />

        {/* Link */}
        <Button type="button" variant="ghost" size="sm" onClick={setLink}>
          <LinkIcon className="h-4 w-4" />
        </Button>

        {/* Image Upload */}
        <Button type="button" variant="ghost" size="sm">
          <ImageIcon className="h-4 w-4" />
        </Button>

        {/* Variable Insertion */}
        {showVariableInsertion && (
          <>
            <div className="h-6 w-px bg-gray-300 mx-1" />
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-1">
                  Insert Variable <ChevronDown className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Insert Dynamic Variable</p>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {VARIABLE_CODES.map((variable) => (
                      <button
                        key={variable.code}
                        type="button"
                        onClick={() => insertVariable(variable.code)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex flex-col"
                      >
                        <span className="font-mono text-blue-600">{variable.code}</span>
                        <span className="text-xs text-gray-500">{variable.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Help Icon */}
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="sm">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96">
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Available Variable Codes</p>
                  <div className="space-y-2 text-sm max-h-80 overflow-y-auto">
                    {VARIABLE_CODES.map((variable) => (
                      <div key={variable.code} className="border-b pb-2">
                        <p className="font-mono text-blue-600">{variable.code}</p>
                        <p className="text-xs text-gray-600">{variable.description}</p>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t">
                      <p className="text-xs text-gray-500">
                        Variables will be automatically replaced with actual values when the email is sent.
                      </p>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  )
}
