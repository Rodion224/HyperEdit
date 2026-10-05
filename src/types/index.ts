export type SupportedLanguage =
  | 'plaintext'
  | 'javascript'
  | 'typescript'
  | 'json'
  | 'html'
  | 'css'
  | 'python'
  | 'cpp'
  | 'csharp'
  | 'lua'
  | 'rust'
  | 'java'
  | 'go'
  | 'php'
  | 'sql'
  | 'yaml'
  | 'xml'
  | 'markdown'
  | 'shell'
  | 'powershell'
  | 'ruby'
  | 'swift'
  | 'kotlin'
  | 'dart'
  | 'r'
  | 'dockerfile'
  | 'toml'
  | 'cmake'
  | 'diff'
  | 'ini'
  | 'bat'
  | 'vbscript';

export interface EditorTab {
  id: string;
  title: string;
  filePath?: string;
  fileHandle?: FileSystemFileHandle;
  content: string;
  originalContent: string;
  isDirty: boolean;
  language: SupportedLanguage;
  encoding: string;
  lineEnding: 'LF' | 'CRLF';
  sizeBytes: number;
  cursorPosition: {
    line: number;
    column: number;
    selectionLength: number;
  };
  diagnostics?: {
    errors: number;
    warnings: number;
  };
}

export interface CommandItem {
  id: string;
  title: string;
  shortcut?: string;
  category: string;
  action: () => void;
}

export interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  extension?: string;
  children?: FileTreeNode[];
  isLoaded?: boolean;
}

export interface ProjectFileItem {
  name: string;
  fullPath: string;
  relativePath: string;
  isDirectory: boolean;
}

export interface ElectronAPI {
  openFile: () => Promise<{ title: string; filePath: string; content: string; sizeBytes: number } | null>;
  openFolder: () => Promise<{ folderPath: string; folderName: string } | null>;
  saveFile: (content: string, defaultPath?: string) => Promise<{ title: string; filePath: string } | null>;
  readFile: (filePath: string) => Promise<{ title: string; filePath: string; content: string; sizeBytes: number }>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  readDirectory: (dirPath: string) => Promise<{ name: string; path: string; isDirectory: boolean; extension: string }[]>;
  scanProjectFiles: (rootPath: string) => Promise<ProjectFileItem[]>;
  createFile: (filePath: string, content?: string) => Promise<boolean>;
  createDirectory: (dirPath: string) => Promise<boolean>;
  renameItem: (oldPath: string, newPath: string) => Promise<boolean>;
  deleteItem: (targetPath: string, isDirectory: boolean) => Promise<boolean>;
  loadSettings: () => Promise<any | null>;
  saveSettings: (settings: any) => Promise<boolean>;
  loadSession: () => Promise<any | null>;
  saveSession: (sessionData: any) => Promise<boolean>;
  revealInExplorer: (filePath: string) => Promise<boolean>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;

  runCode: (options: { code: string; language: string; filePath?: string; cwd?: string }) => Promise<{ started: boolean; error?: string }>;
  stopCode: () => Promise<boolean>;
  onCodeOutput: (callback: (payload: { type: 'stdout' | 'stderr'; text: string }) => void) => () => void;
  onCodeExit: (callback: (payload: { exitCode: number | null; durationMs: number }) => void) => () => void;
  initTerminal: (options: { cwd?: string }) => Promise<{ success: boolean; prompt?: string }>;
  writeTerminal: (input: string) => Promise<boolean>;
  onTerminalData: (callback: (data: string) => void) => () => void;
  onTerminalExit: (callback: (code: number | null) => void) => () => void;
  killTerminal: () => Promise<boolean>;

  isContextMenuInstalled: () => Promise<boolean>;
  getContextMenuStatus: () => Promise<{ installed: boolean; title: string }>;
  installContextMenu: (language?: string) => Promise<boolean>;
  uninstallContextMenu: () => Promise<boolean>;
  getInitialPath: () => Promise<{ path: string; isDirectory: boolean } | null>;
  onOpenExternalPath: (callback: (data: { path: string; isDirectory: boolean }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

