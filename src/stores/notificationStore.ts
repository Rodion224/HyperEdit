import { create } from 'zustand';
import { TranslationDictionary } from '../types/i18n';

export interface AppNotification {
  id: string;
  title: string;
  message?: string;
  titleKey?: keyof TranslationDictionary;
  messageKey?: keyof TranslationDictionary;
  messageArgs?: (string | number)[];
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  toasts: AppNotification[];
  isOpen: boolean;
  toggleOpen: (open?: boolean) => void;
  addNotification: (notification: {
    title: string;
    message?: string;
    titleKey?: keyof TranslationDictionary;
    messageKey?: keyof TranslationDictionary;
    messageArgs?: (string | number)[];
    type?: 'info' | 'success' | 'warning' | 'error';
    showToast?: boolean;
  }) => void;
  dismissToast: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
}

const formatTime = (): string => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [
    {
      id: 'init-1',
      title: 'HyperEdit',
      messageKey: 'notifications.editorReady',
      type: 'info',
      timestamp: formatTime(),
      read: false,
    },
  ],
  toasts: [],
  isOpen: false,

  toggleOpen: (open) => {
    const next = open !== undefined ? open : !get().isOpen;
    if (next) {
      get().markAllRead();
    }
    set({ isOpen: next });
  },

  addNotification: ({ title, message, titleKey, messageKey, messageArgs, type = 'info', showToast = true }) => {
    const newNotification: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title,
      message,
      titleKey,
      messageKey,
      messageArgs,
      type,
      timestamp: formatTime(),
      read: false,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50),
      toasts: showToast ? [newNotification, ...state.toasts].slice(0, 5) : state.toasts,
    }));

    if (showToast) {
      setTimeout(() => {
        get().dismissToast(newNotification.id);
      }, 5000);
    }
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  clearAll: () => {
    set({ notifications: [], toasts: [] });
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
