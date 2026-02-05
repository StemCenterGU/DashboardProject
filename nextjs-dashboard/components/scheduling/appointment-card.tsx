"use client"

import { cn } from "@/lib/utils"

interface AppointmentCardProps {
    studentName: string
    tutorName: string
    courseName?: string
    date?: string
    startTime: string
    endTime: string
    status: string
    variant?: "default" | "today" | "compact"
    className?: string
}

const statusColors: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    missed: "bg-yellow-100 text-yellow-800",
    no_show: "bg-yellow-100 text-yellow-800",
    scheduled: "bg-blue-100 text-blue-800"
}

export function AppointmentCard({
    studentName,
    tutorName,
    courseName,
    date,
    startTime,
    endTime,
    status,
    variant = "default",
    className
}: AppointmentCardProps) {
    const statusColor = statusColors[status] || "bg-gray-100 text-gray-800"

    if (variant === "compact" || variant === "today") {
        return (
            <div className={cn(
                "border rounded-lg p-4 space-y-2",
                variant === "today" && "bg-orange-50/50",
                className
            )}>
                <div className="flex items-center justify-between">
                    <p className="font-medium">{studentName}</p>
                    <span className={cn("text-xs px-2 py-1 rounded", statusColor)}>
                        {status}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground">{tutorName}</p>
                <p className="text-sm font-medium">{startTime} - {endTime}</p>
            </div>
        )
    }

    return (
        <div className={cn("border rounded-lg p-4 space-y-2", className)}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-medium">{studentName}</p>
                    <p className="text-sm text-muted-foreground">
                        {tutorName} • {courseName || "No course"}
                    </p>
                </div>
                {date && (
                    <div className="text-right">
                        <p className="text-sm font-medium">{date}</p>
                        <p className="text-xs text-muted-foreground">
                            {startTime} - {endTime}
                        </p>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                <span className={cn("text-xs px-2 py-1 rounded", statusColor)}>
                    {status}
                </span>
            </div>
        </div>
    )
}
