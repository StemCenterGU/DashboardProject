"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

interface Prediction {
  predicted: number
  confidence: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export function PredictiveAnalytics() {
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPrediction()
  }, [])

  const fetchPrediction = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/analytics/predict?type=appointments&days=7')
      if (response.ok) {
        const data = await response.json()
        setPrediction(data.prediction)
      }
    } catch (error) {
      console.error('Error fetching prediction:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = () => {
    if (!prediction) return null
    switch (prediction.trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = () => {
    if (!prediction) return 'text-gray-500'
    switch (prediction.trend) {
      case 'increasing':
        return 'text-green-500'
      case 'decreasing':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Predictive Analytics
          {getTrendIcon()}
        </CardTitle>
        <CardDescription>7-day appointment forecast</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : prediction ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Predicted Appointments</p>
              <p className="text-3xl font-bold">{prediction.predicted}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="text-lg font-semibold">
                  {Math.round(prediction.confidence * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trend</p>
                <p className={`text-lg font-semibold capitalize ${getTrendColor()}`}>
                  {prediction.trend}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No prediction available</p>
        )}
      </CardContent>
    </Card>
  )
}

