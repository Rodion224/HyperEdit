import React from 'react';
import {
  FileCode,
  FileText,
  FileJson,
  FileType,
  Image,
  Terminal,
  Settings,
  Database,
  Hash,
  Globe,
  File,
  Code2,
} from 'lucide-react';

interface FileIconProps {
  fileName: string;
  isDirectory?: boolean;
  isOpen?: boolean;
  size?: number;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({
  fileName,
  size = 14,
  className = '',
}) => {
  const lower = fileName.toLowerCase();
  const ext = lower.split('.').pop() || '';

  if (lower === 'package.json' || lower === 'package-lock.json') {
    return <FileJson size={size} className={`text-red-400 ${className}`} />;
  }
  if (lower === 'dockerfile' || lower.endsWith('.dockerfile')) {
    return <Globe size={size} className={`text-sky-400 ${className}`} />;
  }
  if (lower === 'cmakelists.txt' || lower.endsWith('.cmake')) {
    return <Settings size={size} className={`text-blue-400 ${className}`} />;
  }
  if (lower.startsWith('.env') || lower.endsWith('.env')) {
    return <Settings size={size} className={`text-yellow-500 ${className}`} />;
  }
  if (lower.startsWith('.git') || lower === '.gitignore') {
    return <Hash size={size} className={`text-orange-500 ${className}`} />;
  }

  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'mts':
    case 'cts':
      return <FileCode size={size} className={`text-blue-400 ${className}`} />;

    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return <FileCode size={size} className={`text-yellow-400 ${className}`} />;

    case 'json':
      return <FileJson size={size} className={`text-amber-300 ${className}`} />;

    case 'lua':
      return <Code2 size={size} className={`text-cyan-400 ${className}`} />;

    case 'py':
    case 'pyw':
      return <FileCode size={size} className={`text-emerald-400 ${className}`} />;

    case 'cs':
    case 'csx':
      return <FileCode size={size} className={`text-purple-400 ${className}`} />;

    case 'cpp':
    case 'c':
    case 'cc':
    case 'h':
    case 'hpp':
      return <FileCode size={size} className={`text-blue-500 ${className}`} />;

    case 'rs':
      return <FileCode size={size} className={`text-amber-600 ${className}`} />;

    case 'go':
      return <FileCode size={size} className={`text-sky-400 ${className}`} />;

    case 'java':
      return <FileCode size={size} className={`text-rose-400 ${className}`} />;

    case 'php':
      return <FileCode size={size} className={`text-indigo-400 ${className}`} />;

    case 'html':
    case 'htm':
      return <Globe size={size} className={`text-orange-400 ${className}`} />;

    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return <FileType size={size} className={`text-pink-400 ${className}`} />;

    case 'sql':
      return <Database size={size} className={`text-amber-500 ${className}`} />;

    case 'sh':
    case 'bash':
    case 'zsh':
    case 'ps1':
    case 'bat':
    case 'cmd':
      return <Terminal size={size} className={`text-emerald-400 ${className}`} />;

    case 'md':
    case 'markdown':
      return <FileText size={size} className={`text-sky-300 ${className}`} />;

    case 'yml':
    case 'yaml':
    case 'toml':
    case 'xml':
    case 'svg':
      return <Settings size={size} className={`text-teal-400 ${className}`} />;

    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'ico':
      return <Image size={size} className={`text-purple-300 ${className}`} />;

    case 'txt':
    case 'log':
      return <FileText size={size} className={`text-editor-muted ${className}`} />;

    default:
      return <File size={size} className={`text-editor-muted ${className}`} />;
  }
};
