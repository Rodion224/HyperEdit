import React, { useRef, useEffect } from 'react';
import {
  Square,
  Trash2,
  Copy,
  Check,
  Terminal,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useTerminalStore } from '../../stores/terminalStore';
import { useI18nStore } from '../../stores/i18nStore';

export const ConsolePanel: React.FC = () => {
  const { t } = useI18nStore();
  const {
    consoleEntries,
    isRunningCode,
    activeRunnerTitle,
    stopCurrentCode,
    clearConsole,
  } = useTerminalStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [consoleEntries]);

  const handleCopyAll = () => {
    const text = consoleEntries.map((e) => e.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-editor-bg select-text overflow-hidden font-mono text-[12px]">
      <div className="h-7 px-3 bg-editor-sidebar border-b border-editor-border flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-2">
          {isRunningCode ? (
            <span className="flex items-center space-x-1.5 text-amber-400 font-semibold text-[11px]">
              <Loader2 size={12} className="animate-spin" />
              <span>{activeRunnerTitle ? `${activeRunnerTitle}...` : '...'}</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 text-editor-muted text-[11px]">
              <Terminal size={12} />
              <span>{t('bottompanel.console')}</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {isRunningCode && (
            <button
              onClick={stopCurrentCode}
              title={t('bottompanel.stop')}
              className="px-2 py-0.5 rounded bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 text-[11px] font-sans flex items-center space-x-1 transition-colors"
            >
              <Square size={10} fill="currentColor" />
              <span>{t('bottompanel.stop')}</span>
            </button>
          )}

          <button
            onClick={handleCopyAll}
            title={t('bottompanel.copyAll')}
            className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>

          <button
            onClick={clearConsole}
            title={t('bottompanel.clear')}
            className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto space-y-1 leading-relaxed selection:bg-editor-selection"
      >
        {consoleEntries.map((entry) => {
          let colorClass = 'text-editor-text';
          let icon = null;

          if (entry.type === 'info') {
            colorClass = 'text-sky-400/90 font-medium';
          } else if (entry.type === 'stderr') {
            colorClass = 'text-rose-400';
            icon = <AlertCircle size={12} className="inline mr-1 text-rose-400 flex-shrink-0" />;
          } else if (entry.type === 'error') {
            colorClass = 'text-rose-400 font-semibold';
            icon = <AlertCircle size={12} className="inline mr-1 text-rose-400 flex-shrink-0" />;
          } else if (entry.type === 'success') {
            colorClass = 'text-emerald-400 font-semibold';
            icon = <CheckCircle2 size={12} className="inline mr-1 text-emerald-400 flex-shrink-0" />;
          }

          return (
            <div key={entry.id} className="flex items-start space-x-2 break-all whitespace-pre-wrap">
              <span className="text-[10px] text-editor-muted/50 select-none flex-shrink-0 pt-0.5">
                {entry.time}
              </span>
              <div className={`flex-1 ${colorClass}`}>
                {icon}
                {entry.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
