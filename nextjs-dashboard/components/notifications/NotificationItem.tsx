"use client"

import { useRouter } from "next/navigation"
import { Clock, CheckCircle2, XCircle, Bell, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  notification_id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  created_at: string
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onClose: () => void
}

export function NotificationItem({ notification, onMarkAsRead, onClose }: NotificationItemProps) {
  const router = useRouter()

  const getIcon = (type: string) => {
    switch (type) {
      case 'schedule_submitted':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'schedule_approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'schedule_rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'schedule_reminder':
        return <Calendar className="h-4 w-4 text-blue-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.notification_id)
    }
    if (notification.link) {
      router.push(notification.link)
      onClose()
    }
  }

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  return (
    <div
      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.read ? 'bg-blue-50/50' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
            </p>
            {!notification.read && (
              <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-1">{getTimeAgo(notification.created_at)}</p>
        </div>
      </div>
    </div>
  )
}
