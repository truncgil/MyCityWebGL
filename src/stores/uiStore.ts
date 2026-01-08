import { create } from 'zustand'
import { NotificationData, TooltipData } from '@/types/game.types'
import { generateId } from '@/lib/utils'
import { NOTIFICATION_DURATION } from '@/lib/constants'

interface UIStore {
  // Notifications
  notifications: NotificationData[]
  
  // Tooltip
  tooltip: TooltipData | null
  
  // Modals
  activeModal: string | null
  modalData: unknown
  
  // Loading
  isLoading: boolean
  loadingMessage: string
  
  // Sidebar
  activeSidebar: 'buildings' | 'zones' | 'roads' | 'services' | null
  
  // Actions - Notifications
  addNotification: (notification: Omit<NotificationData, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Actions - Tooltip
  showTooltip: (tooltip: TooltipData) => void
  hideTooltip: () => void
  
  // Actions - Modals
  openModal: (modalId: string, data?: unknown) => void
  closeModal: () => void
  
  // Actions - Loading
  setLoading: (isLoading: boolean, message?: string) => void
  
  // Actions - Sidebar
  setSidebar: (sidebar: UIStore['activeSidebar']) => void
  toggleSidebar: (sidebar: UIStore['activeSidebar']) => void
}

export const useUIStore = create<UIStore>((set, get) => ({
  // Initial State
  notifications: [],
  tooltip: null,
  activeModal: null,
  modalData: null,
  isLoading: false,
  loadingMessage: '',
  activeSidebar: 'buildings',
  
  // Notification Actions
  addNotification: (notification) => {
    const id = generateId()
    const newNotification: NotificationData = {
      ...notification,
      id,
      duration: notification.duration || NOTIFICATION_DURATION,
    }
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }))
    
    // Auto-remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id)
      }, newNotification.duration)
    }
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  },
  
  clearNotifications: () => {
    set({ notifications: [] })
  },
  
  // Tooltip Actions
  showTooltip: (tooltip) => {
    set({ tooltip })
  },
  
  hideTooltip: () => {
    set({ tooltip: null })
  },
  
  // Modal Actions
  openModal: (modalId, data) => {
    set({ activeModal: modalId, modalData: data })
  },
  
  closeModal: () => {
    set({ activeModal: null, modalData: null })
  },
  
  // Loading Actions
  setLoading: (isLoading, message = '') => {
    set({ isLoading, loadingMessage: message })
  },
  
  // Sidebar Actions
  setSidebar: (sidebar) => {
    set({ activeSidebar: sidebar })
  },
  
  toggleSidebar: (sidebar) => {
    set((state) => ({
      activeSidebar: state.activeSidebar === sidebar ? null : sidebar,
    }))
  },
}))
