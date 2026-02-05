"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
    currentPage: number
    totalPages: number
    totalCount: number
    itemsPerPage: number
    onPageChange: (page: number) => void
    showInfo?: boolean
}

export function Pagination({
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    onPageChange,
    showInfo = true
}: PaginationProps) {
    if (totalPages <= 1) return null

    const startItem = ((currentPage - 1) * itemsPerPage) + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalCount)

    return (
        <div className="flex items-center justify-between pt-4 border-t mt-4">
            {showInfo && (
                <p className="text-sm text-muted-foreground">
                    Showing {startItem} - {endItem} of {totalCount}
                </p>
            )}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
