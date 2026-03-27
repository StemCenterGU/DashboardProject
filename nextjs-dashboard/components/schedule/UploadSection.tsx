"use client"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, X, Loader2 } from "lucide-react"
import { parseScheduleFile, ParseResult } from "@/lib/scheduleParser"
import { PreviewDialog } from "./PreviewDialog"

interface UploadSectionProps {
  onUploadSuccess: () => void
}

export function UploadSection({ onUploadSuccess }: UploadSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleFileSelect = async (file: File) => {
    setError(null)
    setSelectedFile(file)

    // Auto-parse the file
    setParsing(true)
    try {
      const result = await parseScheduleFile(file)
      setParseResult(result)

      if (!result.success || result.errors.length > 0) {
        setError(result.errors.join(", "))
      } else if (result.slots.length === 0) {
        setError("No availability slots found in file")
      } else {
        // Show preview dialog
        setShowPreview(true)
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse file")
    } finally {
      setParsing(false)
    }
  }

  const handleConfirmUpload = async () => {
    if (!selectedFile || !parseResult) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/schedule/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      // Success
      setShowPreview(false)
      setSelectedFile(null)
      setParseResult(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Trigger parent refresh
      onUploadSuccess()

    } catch (err: any) {
      setError(err.message || "Failed to upload file")
      setShowPreview(false)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setParseResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Schedule</h2>

        {/* Drag and Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            // File selected
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="h-12 w-12 text-green-600" />
                <div className="text-left">
                  <p className="font-semibold text-lg">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="ml-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {parsing && (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Parsing file...</span>
                </div>
              )}

              {parseResult && !parsing && parseResult.success && (
                <div className="text-green-600">
                  <p className="font-semibold">✓ File parsed successfully</p>
                  <p className="text-sm">
                    Found {parseResult.tutors.length} tutors, {parseResult.slots.length} slots
                  </p>
                </div>
              )}
            </div>
          ) : (
            // No file selected
            <div className="space-y-3">
              <Upload className="h-16 w-16 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-semibold">Drop your schedule file here</p>
                <p className="text-sm text-gray-600">or click to browse</p>
              </div>
              <p className="text-xs text-gray-500">Supports CSV, XLS, and XLSX files</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleChange}
          />
        </div>

        {/* Browse Button */}
        {!selectedFile && (
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="mr-2 h-4 w-4" />
            Browse Files
          </Button>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800 font-semibold">Import Behavior:</p>
          <ul className="text-xs text-blue-700 mt-1 list-disc list-inside">
            <li>Schedules will be replaced for tutors found in the file</li>
            <li>Other tutors' schedules will not be affected</li>
            <li>Only cells marked with 'X' are imported as available slots</li>
          </ul>
        </div>
      </Card>

      {/* Preview Dialog */}
      {parseResult && (
        <PreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          slots={parseResult.slots}
          tutors={parseResult.tutors}
          warnings={parseResult.warnings}
          onConfirm={handleConfirmUpload}
          loading={uploading}
        />
      )}
    </>
  )
}
