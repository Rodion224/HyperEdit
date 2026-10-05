import React, { useRef, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Trash2,
  X,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import { useI18nStore } from '../../stores/i18nStore';

export const NotificationCenter: React.FC = () => {
  const { notifications, isOpen, toggleOpen, clearAll, removeNotification } = useNotificationStore();
  const { t } = useI18nStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-notification-toggle]')) {
          toggleOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, toggleOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed right-2 bottom-7 w-80 sm:w-96 max-h-[420px] bg-editor-sidebar border border-editor-border rounded-lg shadow-2xl shadow-black/80 z-50 flex flex-col overflow-hidden text-xs select-none animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="h-9 px-3.5 bg-editor-tabActive border-b border-editor-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Bell size={13} className="text-editor-accent" />
          <span className="font-semibold text-editor-text">
            {t('statusbar.notifications')}
          </span>
          {notifications.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-editor-accent/20 text-editor-accent font-mono font-medium">
              {notifications.length}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              title={t('bottompanel.clear')}
              className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
          <button
            onClick={() => toggleOpen(false)}
            title={t('tabmenu.close')}
            className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[360px]">
        {notifications.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center text-editor-muted space-y-2">
            <BellOff size={28} className="text-editor-muted/30" />
            <p className="font-medium text-xs text-editor-text/80">
              {t('statusbar.notifications')}
            </p>
            <p className="text-[11px] text-editor-muted max-w-[200px]">
              {t('notifications.noNotifications')}
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            let Icon = Info;
            let iconColor = 'text-sky-400 bg-sky-500/10 border-sky-500/20';

            if (n.type === 'success') {
              Icon = CheckCircle2;
              iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            } else if (n.type === 'warning') {
              Icon = AlertTriangle;
              iconColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            } else if (n.type === 'error') {
              Icon = AlertCircle;
              iconColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            }

            const displayTitle = n.titleKey ? t(n.titleKey) : n.title;
            let displayMessage = n.messageKey ? t(n.messageKey) : (n.message || '');
            if (n.messageKey && n.messageArgs) {
              n.messageArgs.forEach((arg, i) => {
                displayMessage = displayMessage.replace(`{${i}}`, String(arg));
              });
            }

            return (
              <div
                key={n.id}
                className="group relative flex items-start space-x-2.5 p-2.5 rounded-lg bg-editor-bg/60 border border-editor-border/60 hover:border-editor-accent/40 hover:bg-editor-tabActive/40 transition-all duration-150"
              >
                <div className={`p-1.5 rounded-md border flex-shrink-0 mt-0.5 ${iconColor}`}>
                  <Icon size={13} />
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-editor-text truncate text-[11px]">
                      {displayTitle}
                    </span>
                    <span className="text-[10px] text-editor-muted/60 font-mono flex-shrink-0 ml-1">
                      {n.timestamp}
                    </span>
                  </div>
                  {displayMessage && (
                    <p className="text-[11px] text-editor-muted leading-relaxed break-words">
                      {displayMessage}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeNotification(n.id)}
                  title={t('tabmenu.close')}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-editor-border text-editor-muted hover:text-rose-400 transition-all absolute top-2 right-2"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
