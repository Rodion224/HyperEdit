import { SupportedLanguage } from '../types';
import { useNotificationStore } from '../stores/notificationStore';

export const BLOCKED_BINARY_EXTENSIONS = new Set([
  'exe', 'dll', 'sys', 'com', 'scr', 'msi', 'msp', 'ocx', 'drv', 'cpl', 'efi', 'mui', 'node',
  'bin', 'obj', 'o', 'lib', 'a', 'so', 'dylib', 'class', 'pyc', 'pyo', 'dex', 'apk', 'wasm', 'pdb',
  'iso', 'img', 'vmdk', 'vdi', 'vhd', 'vhdx', 'dmg',
  'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'cab', 'tgz',
  'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm',
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'webp', 'tiff', 'psd',
  'ttf', 'otf', 'woff', 'woff2', 'eot',
  'pdf', 'docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt', 'db', 'sqlite', 'sqlite3', 'dmp'
]);

export function isBinaryOrExecutable(fileNameOrPath: string): boolean {
  if (!fileNameOrPath) return false;
  const clean = fileNameOrPath.split('?')[0].split('#')[0];
  const parts = clean.split('.');
  if (parts.length <= 1) return false;
  const ext = parts.pop()?.toLowerCase();
  return ext ? BLOCKED_BINARY_EXTENSIONS.has(ext) : false;
}

export function notifyBinaryFileBlocked(fileNameOrPath: string) {
  const parts = fileNameOrPath.split('.');
  const ext = parts.length > 1 ? `.${parts.pop()?.toLowerCase()}` : '';
  useNotificationStore.getState().addNotification({
    title: 'HyperEdit',
    messageKey: 'notifications.binaryFileBlocked',
    messageArgs: [ext],
    type: 'warning',
  });
  useNotificationStore.getState().toggleOpen(true);
}

export function detectLanguageByExtension(fileName: string): SupportedLanguage {
  const lowerName = fileName.toLowerCase();
  if (lowerName === 'dockerfile' || lowerName.endsWith('.dockerfile')) return 'dockerfile';
  if (lowerName === 'cmakelists.txt' || lowerName.endsWith('.cmake')) return 'cmake';
  if (lowerName.endsWith('.env')) return 'ini';

  const ext = lowerName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
    case 'mts':
    case 'cts':
      return 'typescript';
    case 'json':
      return 'json';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
    case 'scss':
    case 'less':
      return 'css';
    case 'py':
    case 'pyw':
      return 'python';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'c':
    case 'h':
    case 'hpp':
    case 'hxx':
      return 'cpp';
    case 'cs':
    case 'csx':
      return 'csharp';
    case 'lua':
      return 'lua';
    case 'rs':
      return 'rust';
    case 'java':
    case 'jar':
      return 'java';
    case 'go':
      return 'go';
    case 'php':
    case 'phtml':
      return 'php';
    case 'sql':
      return 'sql';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'xml':
    case 'svg':
    case 'xaml':
    case 'plist':
    case 'xsd':
      return 'xml';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'shell';
    case 'ps1':
    case 'psm1':
    case 'psd1':
      return 'powershell';
    case 'rb':
    case 'rake':
    case 'gemspec':
      return 'ruby';
    case 'swift':
      return 'swift';
    case 'kt':
    case 'kts':
      return 'kotlin';
    case 'dart':
      return 'dart';
    case 'r':
    case 'rmd':
      return 'r';
    case 'dockerfile':
      return 'dockerfile';
    case 'toml':
      return 'toml';
    case 'cmake':
      return 'cmake';
    case 'diff':
    case 'patch':
      return 'diff';
    case 'ini':
    case 'cfg':
    case 'conf':
    case 'properties':
    case 'reg':
    case 'inf':
      return 'ini';
    case 'bat':
    case 'cmd':
      return 'bat';
    case 'vbs':
      return 'vbscript';
    default:
      return 'plaintext';
  }
}

export function detectLineEnding(content: string): 'LF' | 'CRLF' {
  return content.includes('\r\n') ? 'CRLF' : 'LF';
}

export interface OpenedFileResult {
  title: string;
  content: string;
  filePath?: string;
  fileHandle?: FileSystemFileHandle;
  language: SupportedLanguage;
  sizeBytes: number;
  lineEnding: 'LF' | 'CRLF';
}

export async function openLocalFile(): Promise<OpenedFileResult | null> {
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      const result = await window.electronAPI.openFile();
      if (!result) return null;
      if (isBinaryOrExecutable(result.title) || isBinaryOrExecutable(result.filePath)) {
        notifyBinaryFileBlocked(result.title || result.filePath);
        return null;
      }
      return {
        title: result.title,
        content: result.content,
        filePath: result.filePath,
        language: detectLanguageByExtension(result.title),
        sizeBytes: result.sizeBytes,
        lineEnding: detectLineEnding(result.content),
      };
    } catch (e) {
      console.error('Electron openFile failed:', e);
      return null;
    }
  }

  if ('showOpenFilePicker' in window) {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'All Supported Text / Code Files',
            accept: {
              'text/*': ['.txt', '.js', '.ts', '.tsx', '.jsx', '.json', '.html', '.css', '.py', '.cpp', '.h', '.md', '.yml', '.yaml', '.xml', '.ini', '.log', '.sh', '.bat']
            }
          }
        ]
      });

      const file = await handle.getFile();
      if (isBinaryOrExecutable(file.name)) {
        notifyBinaryFileBlocked(file.name);
        return null;
      }
      const content = await readFileWithChunking(file);
      const language = detectLanguageByExtension(file.name);

      return {
        title: file.name,
        content,
        fileHandle: handle,
        language,
        sizeBytes: file.size,
        lineEnding: detectLineEnding(content)
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return null;
      }
      console.warn('Native picker error, using fallback:', err);
    }
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      if (isBinaryOrExecutable(file.name)) {
        notifyBinaryFileBlocked(file.name);
        resolve(null);
        return;
      }
      const content = await readFileWithChunking(file);
      const language = detectLanguageByExtension(file.name);
      resolve({
        title: file.name,
        content,
        language,
        sizeBytes: file.size,
        lineEnding: detectLineEnding(content)
      });
    };
    input.click();
  });
}

async function readFileWithChunking(file: File): Promise<string> {
  if (file.size < 2 * 1024 * 1024) {
    return await file.text();
  }

  const stream = file.stream();
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  result += decoder.decode();
  return result;
}

export async function saveFileToDisk(
  content: string,
  handle?: FileSystemFileHandle,
  suggestedName: string = 'untitled.txt',
  filePath?: string
): Promise<{ handle?: FileSystemFileHandle; filePath?: string } | null> {
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      const result = await window.electronAPI.saveFile(content, filePath || suggestedName);
      if (!result) return null;
      return { filePath: result.filePath };
    } catch (e) {
      console.error('Electron saveFile failed:', e);
      return null;
    }
  }

  if (handle && 'createWritable' in handle) {
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    return { handle };
  }

  if ('showSaveFilePicker' in window) {
    try {
      const newHandle = await (window as any).showSaveFilePicker({
        suggestedName,
      });
      const writable = await newHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return { handle: newHandle };
    } catch (err: any) {
      if (err.name === 'AbortError') return null;
      throw err;
    }
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  a.click();
  URL.revokeObjectURL(url);
  return null;
}

export async function openFilePath(filePath: string): Promise<OpenedFileResult | null> {
  if (!filePath) return null;

  if (isBinaryOrExecutable(filePath)) {
    notifyBinaryFileBlocked(filePath);
    return null;
  }

  if (typeof window !== 'undefined' && window.electronAPI?.readFile) {
    try {
      const result = await window.electronAPI.readFile(filePath);
      return {
        title: result.title,
        content: result.content,
        filePath: result.filePath,
        language: detectLanguageByExtension(result.title),
        sizeBytes: result.sizeBytes,
        lineEnding: detectLineEnding(result.content),
      };
    } catch (e) {
      console.error('Failed to open file path:', e);
      return null;
    }
  }
  return null;
}
