import React, { useState, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  Square,
  X,
  Columns,
  Maximize2,
  Minimize2,
  Tv,
} from 'lucide-react';
import { useTerminalStore } from '../../stores/terminalStore';
import { useI18nStore } from '../../stores/i18nStore';
import { ConsolePanel } from './ConsolePanel';
import { TerminalPanel } from './TerminalPanel';

export const BottomPanel: React.FC = () => {
  const { t } = useI18nStore();
  const {
    isConsoleOpen,
    isTerminalOpen,
    panelHeight,
    setPanelHeight,
    toggleConsole,
    toggleTerminal,
    toggleBoth,
    closeBottomPanel,
    runCurrentCode,
    stopCurrentCode,
    isRunningCode,
    appendConsoleOutput,
    finishCodeRun,
    appendTerminalData,
  } = useTerminalStore();

  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    const unregCodeOut = window.electronAPI.onCodeOutput?.(({ type, text }) => {
      appendConsoleOutput(type, text);
    });

    const unregCodeExit = window.electronAPI.onCodeExit?.(({ exitCode, durationMs }) => {
      finishCodeRun(exitCode, durationMs);
    });

    const unregTermData = window.electronAPI.onTerminalData?.((data) => {
      appendTerminalData(data);
    });

    return () => {
      unregCodeOut?.();
      unregCodeExit?.();
      unregCodeExit?.();
      unregTermData?.();
    };
  }, [appendConsoleOutput, finishCodeRun, appendTerminalData]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY - 24;
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setPanelHeight]);

  const isPanelOpen = isConsoleOpen || isTerminalOpen;
  const isBoth = isConsoleOpen && isTerminalOpen;
  const targetHeight = isMaximized ? window.innerHeight - 80 : panelHeight;
  const effectiveHeight = isPanelOpen ? targetHeight : 0;

  return (
    <div
      style={{ height: `${effectiveHeight}px` }}
      className={`w-full bg-editor-sidebar flex flex-col relative select-none flex-shrink-0 z-20 overflow-hidden ${
        isDragging
          ? 'transition-none'
          : 'transition-[height,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
      } ${
        isPanelOpen
          ? 'border-t border-editor-border opacity-100'
          : 'border-t-0 opacity-0 pointer-events-none'
      }`}
    >
      <div style={{ height: `${targetHeight}px` }} className="w-full flex flex-col flex-shrink-0">
        {!isMaximized && isPanelOpen && (
          <div
            onMouseDown={() => setIsDragging(true)}
            className="absolute -top-1 left-0 right-0 h-2 cursor-row-resize hover:bg-editor-accent/40 z-30 transition-colors"
            title={t('bottompanel.resizeTooltip')}
          />
        )}

      <div className="h-8 bg-editor-sidebar border-b border-editor-border flex items-center justify-between px-2 text-xs flex-shrink-0">
        <div className="flex items-center space-x-1 h-full">
          <button
            onClick={() => toggleConsole()}
            className={`flex items-center space-x-1.5 px-3 h-full border-b-2 font-medium text-[11px] transition-all duration-150 ${
              isConsoleOpen
                ? 'border-editor-accent text-editor-text bg-editor-tabActive/60'
                : 'border-transparent text-editor-muted hover:text-editor-text hover:bg-editor-tabActive/30'
            }`}
          >
            <Tv size={13} className={isConsoleOpen ? 'text-editor-accent' : 'text-editor-muted'} />
            <span>{t('bottompanel.console')}</span>
            {isRunningCode && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-1" />}
          </button>

          <button
            onClick={() => toggleTerminal()}
            className={`flex items-center space-x-1.5 px-3 h-full border-b-2 font-medium text-[11px] transition-all duration-150 ${
              isTerminalOpen
                ? 'border-editor-accent text-editor-text bg-editor-tabActive/60'
                : 'border-transparent text-editor-muted hover:text-editor-text hover:bg-editor-tabActive/30'
            }`}
          >
            <TerminalIcon size={13} className={isTerminalOpen ? 'text-editor-accent' : 'text-editor-muted'} />
            <span>{t('bottompanel.terminal')}</span>
          </button>

          <button
            onClick={toggleBoth}
            title={t('bottompanel.split')}
            className={`p-1.5 rounded text-[11px] flex items-center space-x-1 transition-all ml-1 ${
              isBoth
                ? 'bg-editor-accent/20 text-editor-accent border border-editor-accent/30 font-semibold'
                : 'text-editor-muted hover:text-editor-text hover:bg-editor-tabActive'
            }`}
          >
            <Columns size={13} />
            <span className="hidden sm:inline">{t('bottompanel.split')}</span>
          </button>
        </div>

        <div className="flex items-center space-x-1.5">
          {isRunningCode ? (
            <button
              onClick={() => stopCurrentCode()}
              title={t('bottompanel.stop')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-600/25 hover:bg-rose-600/40 text-rose-300 hover:text-white border border-rose-500/40 text-[11px] font-medium transition-all shadow-sm active:scale-95"
            >
              <Square size={10} fill="currentColor" />
              <span>{t('bottompanel.stop')}</span>
            </button>
          ) : (
            <button
              onClick={() => runCurrentCode()}
              title={t('titlebar.run')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition-all shadow-sm active:scale-95"
            >
              <Play size={11} fill="currentColor" />
              <span>{t('bottompanel.run')}</span>
            </button>
          )}

          <div className="h-3 w-[1px] bg-editor-border mx-1" />

          <button
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? t('bottompanel.restore') : t('bottompanel.maximize')}
            className="p-1 rounded hover:bg-editor-tabActive text-editor-muted hover:text-editor-text transition-colors"
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          <button
            onClick={closeBottomPanel}
            title={t('bottompanel.closePanel')}
            className="p-1 rounded hover:bg-editor-tabActive hover:text-rose-400 text-editor-muted transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {isBoth ? (
          <>
            <div className="w-1/2 h-full flex flex-col border-r border-editor-border overflow-hidden">
              <ConsolePanel />
            </div>
            <div className="w-1/2 h-full flex flex-col overflow-hidden">
              <TerminalPanel />
            </div>
          </>
        ) : isConsoleOpen ? (
          <ConsolePanel />
        ) : isTerminalOpen ? (
          <TerminalPanel />
        ) : null}
      </div>
    </div>
  </div>
  );
};
