import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import { useI18nStore } from '../../stores/i18nStore';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotificationStore();
  const { t } = useI18nStore();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-6 z-50 flex flex-col space-y-2.5 pointer-events-none max-w-md w-full">
      {toasts.map((toast) => {
        let Icon = Info;
        let iconColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'text-amber-400 bg-amber-500/15 border-amber-500/30';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          iconColor = 'text-rose-400 bg-rose-500/15 border-rose-500/30';
        }

        const displayTitle = toast.titleKey ? t(toast.titleKey) : toast.title;
        let displayMessage = toast.messageKey ? t(toast.messageKey) : (toast.message || '');
        if (toast.messageKey && toast.messageArgs) {
          toast.messageArgs.forEach((arg, i) => {
            displayMessage = displayMessage.replace(`{${i}}`, String(arg));
          });
        }

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start space-x-3 p-3 rounded-lg bg-editor-sidebar border border-editor-border shadow-2xl shadow-black/80 transition-all duration-150 animate-in slide-in-from-bottom-2 fade-in group"
          >
            <div className={`p-1.5 rounded-md border flex-shrink-0 mt-0.5 ${iconColor}`}>
              <Icon size={16} />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-editor-text truncate">
                  {displayTitle}
                </span>
                <span className="text-[10px] text-editor-muted ml-2">
                  {toast.timestamp}
                </span>
              </div>
              {displayMessage && (
                <p className="text-[12px] text-editor-muted mt-1 leading-snug break-words">
                  {displayMessage}
                </p>
              )}
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-editor-muted hover:text-editor-text p-1 rounded-md hover:bg-editor-border/40 transition-colors flex-shrink-0"
              title="Close"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
