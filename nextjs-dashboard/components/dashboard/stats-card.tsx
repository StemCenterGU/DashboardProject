"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
    title: string
    value: string | number
    description?: string
    icon?: LucideIcon
    iconColor?: string
    trend?: {
        value: number
        label: string
        isPositive?: boolean
    }
    className?: string
}

export function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    iconColor = "text-gray-500",
    trend,
    className
}: StatsCardProps) {
    return (
        <Card className={cn("", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {Icon && <Icon className={cn("h-4 w-4", iconColor)} />}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                )}
                {trend && (
                    <p className={cn(
                        "text-xs mt-1",
                        trend.isPositive ? "text-green-600" : "text-red-600"
                    )}>
                        {trend.isPositive ? "+" : ""}{trend.value}% {trend.label}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
