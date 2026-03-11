"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function ManageClientAccountPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string

  return (
    <div className="container mx-auto py-10">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex flex-col items-center justify-center min-h-[400px] border rounded-lg bg-gray-50">
        <h1 className="text-3xl font-bold text-gray-700 mb-4">
          Manage Client Account
        </h1>
        <p className="text-gray-500 text-lg mb-2">
          Client ID: {clientId}
        </p>
        <p className="text-gray-400">
          This feature is coming soon.
        </p>
      </div>
    </div>
  )
}
