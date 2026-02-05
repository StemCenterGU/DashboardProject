"use client"

import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description?: string
    className?: string
    children?: React.ReactNode
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    className,
    children
}: EmptyStateProps) {
    return (
        <div className={cn("text-center py-8 text-muted-foreground", className)}>
            <Icon className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">{title}</p>
            {description && <p className="text-sm mt-1">{description}</p>}
            {children && <div className="mt-4">{children}</div>}
        </div>
    )
}
