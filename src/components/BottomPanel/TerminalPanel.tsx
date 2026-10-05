import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Trash2,
  RotateCcw,
  CornerDownLeft,
  ChevronRight,
} from 'lucide-react';
import { useTerminalStore } from '../../stores/terminalStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useI18nStore } from '../../stores/i18nStore';

export const TerminalPanel: React.FC = () => {
  const { t } = useI18nStore();
  const {
    terminalOutput,
    terminalHistory,
    sendTerminalCommand,
    clearTerminal,
    initTerminalSession,
  } = useTerminalStore();

  const { rootName } = useWorkspaceStore();

  const [inputVal, setInputVal] = useState('');
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputVal.trim()) {
        sendTerminalCommand(inputVal);
        setInputVal('');
        setHistoryPointer(-1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (terminalHistory.length === 0) return;
      const nextIndex = historyPointer + 1;
      if (nextIndex < terminalHistory.length) {
        setHistoryPointer(nextIndex);
        setInputVal(terminalHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const prevIndex = historyPointer - 1;
      if (prevIndex >= 0) {
        setHistoryPointer(prevIndex);
        setInputVal(terminalHistory[prevIndex]);
      } else {
        setHistoryPointer(-1);
        setInputVal('');
      }
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="flex-1 flex flex-col h-full bg-[#121316] select-text overflow-hidden font-mono text-[12px] cursor-text"
    >
      <div className="h-7 px-3 bg-editor-sidebar border-b border-editor-border flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-2">
          <TerminalIcon size={12} className="text-editor-accent" />
          <span className="text-[11px] text-editor-text font-medium">{t('bottompanel.terminalTitle')}</span>
          {rootName && (
            <span className="text-[10px] text-editor-muted bg-editor-border/40 px-1.5 py-0.5 rounded truncate max-w-[150px]">
              {rootName}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <div className="hidden sm:flex items-center space-x-1 mr-2">
            {['dir', 'git status', 'node -v'].map((cmd) => (
              <button
                key={cmd}
                onClick={(e) => {
                  e.stopPropagation();
                  sendTerminalCommand(cmd);
                }}
                className="px-1.5 py-0.5 rounded bg-editor-tabActive hover:bg-editor-border text-editor-muted hover:text-editor-text text-[10px] transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              initTerminalSession(true);
            }}
            title={t('bottompanel.restartTerminal')}
            className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text transition-colors"
          >
            <RotateCcw size={12} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              clearTerminal();
            }}
            title={t('bottompanel.clearTerminal')}
            className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-1 text-editor-text selection:bg-editor-selection">
        {terminalOutput.map((chunk, idx) => (
          <div key={idx} className="whitespace-pre-wrap break-all leading-relaxed">
            {chunk.startsWith('>') ? (
              <span className="text-editor-accent font-semibold">{chunk}</span>
            ) : chunk.toLowerCase().includes('error') ? (
              <span className="text-rose-400">{chunk}</span>
            ) : (
              <span className="text-editor-text/90">{chunk}</span>
            )}
          </div>
        ))}

        <div className="flex items-center space-x-1.5 pt-1">
          <ChevronRight size={14} className="text-editor-accent flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('bottompanel.inputPlaceholder')}
            className="flex-1 bg-transparent text-editor-text text-[12px] font-mono outline-none border-none placeholder-editor-muted/50 p-0"
            autoFocus
          />
          <CornerDownLeft size={11} className="text-editor-muted/40 mr-1 flex-shrink-0" />
        </div>

        <div ref={outputEndRef} />
      </div>
    </div>
  );
};
