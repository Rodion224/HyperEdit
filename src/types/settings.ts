export type ThemeId =
  | 'dark'
  | 'light'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'green'
  | 'monokai'
  | 'nord'
  | 'solarized-light'
  | 'system';

import { LocaleId } from './i18n';

export type CursorBlinking = 'smooth' | 'blink' | 'solid';
export type LineNumbersMode = 'on' | 'off';
export type RenderWhitespaceMode = 'none' | 'selection' | 'all';

export interface EditorSettings {
  locale: LocaleId;

  theme: ThemeId;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  cursorBlinking: CursorBlinking;

  tabSize: number;
  insertSpaces: boolean;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: LineNumbersMode;
  bracketMatching: boolean;
  closeBrackets: boolean;
  highlightActiveLine: boolean;
  renderWhitespace: RenderWhitespaceMode;
  codeFolding: boolean;
  colorDecorators: boolean;

  sessionRestore: boolean;
  trimTrailingWhitespace: boolean;
  defaultLineEnding: 'LF' | 'CRLF';

  contextMenuEnabled: boolean;
  contextMenuLanguage: 'auto' | 'app';
}

export interface ThemeColors {
  id: ThemeId;
  name: string;
  description: string;
  isDark: boolean;
  colors: {
    bg: string;
    sidebar: string;
    tabActive: string;
    tabInactive: string;
    border: string;
    lineHighlight: string;
    selection: string;
    text: string;
    muted: string;
    accent: string;
    statusBar: string;
  };
}
