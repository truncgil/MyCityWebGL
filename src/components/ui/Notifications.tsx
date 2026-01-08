'use client'

import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

const ICONS = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
}

export function Notifications() {
  const notifications = useUIStore((state) => state.notifications)
  const removeNotification = useUIStore((state) => state.removeNotification)

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            'panel p-4 pr-10 max-w-sm animate-slide-up pointer-events-auto',
            notification.type === 'success' && 'border-l-4 border-l-green-500',
            notification.type === 'error' && 'border-l-4 border-l-red-500',
            notification.type === 'warning' && 'border-l-4 border-l-yellow-500',
            notification.type === 'info' && 'border-l-4 border-l-blue-500'
          )}
        >
          <button
            onClick={() => removeNotification(notification.id)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
          >
            ×
          </button>
          
          <div className="flex items-start gap-3">
            <span className="text-xl">{ICONS[notification.type]}</span>
            <div>
              <h4 className="font-semibold text-white">{notification.title}</h4>
              <p className="text-sm text-gray-400">{notification.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
