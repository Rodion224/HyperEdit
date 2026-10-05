import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  FolderPlus,
  RefreshCw,
  FolderMinus,
  X,
  FilePlus,
  Pencil,
  Trash2,
  FolderTree,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { FileTreeNode } from '../../types';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useEditorStore } from '../../stores/editorStore';
import { useI18nStore } from '../../stores/i18nStore';
import { FileIcon } from './FileIcon';
import { openFilePath, isBinaryOrExecutable } from '../../services/fileService';
import { editorActions } from '../../services/activeViewService';

interface CreationState {
  parentDir: string;
  type: 'file' | 'folder';
}

interface RenameState {
  path: string;
  currentName: string;
  isDirectory: boolean;
}

interface ContextMenuState {
  x: number;
  y: number;
  node: FileTreeNode;
}

export const WorkspaceTree: React.FC = () => {
  const {
    rootPath,
    rootName,
    fileTree,
    expandedFolders,
    toggleFolder,
    collapseAllFolders,
    refreshTree,
    closeWorkspace,
    createFile,
    createFolder,
    renameItem,
    deleteItem,
  } = useWorkspaceStore();

  const { tabs, activeTabId, setActiveTab, openFileTab } = useEditorStore();
  const { t } = useI18nStore();

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const activeFilePath = activeTab?.filePath;

  const [creation, setCreation] = useState<CreationState | null>(null);
  const [creationName, setCreationName] = useState('');
  const creationInputRef = useRef<HTMLInputElement>(null);

  const [renaming, setRenaming] = useState<RenameState | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    if (creation) {
      setCreationName('');
      setTimeout(() => creationInputRef.current?.focus(), 50);
    }
  }, [creation]);

  useEffect(() => {
    if (renaming) {
      setRenameValue(renaming.currentName);
      setTimeout(() => {
        if (renameInputRef.current) {
          renameInputRef.current.focus();
          const dotIdx = renaming.currentName.lastIndexOf('.');
          if (!renaming.isDirectory && dotIdx > 0) {
            renameInputRef.current.setSelectionRange(0, dotIdx);
          } else {
            renameInputRef.current.select();
          }
        }
      }, 50);
    }
  }, [renaming]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleOpenFile = async (filePath: string) => {
    const existing = tabs.find((t) => t.filePath === filePath);
    if (existing) {
      setActiveTab(existing.id);
      editorActions.focus();
      return;
    }

    const fileResult = await openFilePath(filePath);
    if (fileResult) {
      openFileTab(fileResult);
      editorActions.focus();
    }
  };

  const handleConfirmCreation = async () => {
    if (!creation || !creationName.trim()) {
      setCreation(null);
      return;
    }
    const name = creationName.trim();
    const parent = creation.parentDir;
    const type = creation.type;
    setCreation(null);

    if (type === 'file') {
      const createdPath = await createFile(parent, name);
      if (createdPath) {
        handleOpenFile(createdPath);
      }
    } else {
      await createFolder(parent, name);
    }
  };

  const handleConfirmRename = async () => {
    if (!renaming || !renameValue.trim()) {
      setRenaming(null);
      return;
    }
    const name = renameValue.trim();
    const oldPath = renaming.path;
    setRenaming(null);
    await renameItem(oldPath, name);
  };

  const handleDelete = async (node: FileTreeNode) => {
    const isDir = node.isDirectory;
    const confirmMessage = isDir
      ? `Are you sure you want to permanently delete folder "${node.name}" and all its contents?`
      : `Are you sure you want to permanently delete file "${node.name}"?`;

    if (window.confirm(confirmMessage)) {
      await deleteItem(node.path, isDir);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileTreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 220),
      node,
    });
  };

  const renderNode = (node: FileTreeNode, depth = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isNodeRenaming = renaming?.path === node.path;
    const isCreatingInside = creation?.parentDir === node.path;
    const isActive = !node.isDirectory && activeFilePath === node.path;
    const isBinary = !node.isDirectory && isBinaryOrExecutable(node.name);
    const rowTitle = isBinary
      ? (t('notifications.binaryFileBlocked') || 'Cannot open binary file in text editor').replace('{0}', node.name.split('.').pop() ? '.' + node.name.split('.').pop()?.toLowerCase() : '')
      : node.name;

    return (
      <div key={node.path} className="flex flex-col select-none">
        <div
          title={rowTitle}
          onClick={() => {
            if (node.isDirectory) {
              toggleFolder(node.path);
            } else {
              handleOpenFile(node.path);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`group flex items-center justify-between pr-2 py-1 cursor-pointer text-[12px] font-sans transition-all duration-100 relative ${
            isBinary ? 'opacity-60 hover:opacity-85' : ''
          } ${
            isActive
              ? 'bg-editor-accent/20 text-editor-text font-medium border-l-2 border-editor-accent'
              : 'text-editor-text hover:bg-editor-border/30 hover:text-editor-text'
          }`}
        >
          <div className="flex items-center space-x-1.5 truncate flex-1 min-w-0 mr-1">
            {node.isDirectory ? (
              <>
                <span className="text-editor-muted hover:text-editor-text transition-colors flex items-center justify-center w-3.5 h-3.5 flex-shrink-0">
                  <ChevronRight
                    size={12}
                    className={`transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isExpanded ? 'rotate-90 text-editor-accent' : 'rotate-0 text-editor-muted'
                    }`}
                  />
                </span>
                {isExpanded ? (
                  <FolderOpen size={14} className="text-amber-400 flex-shrink-0 transition-all duration-150" />
                ) : (
                  <Folder size={14} className="text-amber-400/90 flex-shrink-0 transition-all duration-150" />
                )}
              </>
            ) : (
              <>
                <span className="w-3 flex-shrink-0" />
                <FileIcon fileName={node.name} size={14} className="flex-shrink-0" />
              </>
            )}

            {isNodeRenaming ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleConfirmRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRename();
                  if (e.key === 'Escape') setRenaming(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-editor-bg border border-editor-accent px-1.5 py-0.5 rounded text-xs text-editor-text focus:outline-none w-full font-mono"
              />
            ) : (
              <span className="truncate font-mono text-[12px]" title={node.name}>
                {node.name}
              </span>
            )}
          </div>

          {!isNodeRenaming && (
            <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {node.isDirectory && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isExpanded) toggleFolder(node.path);
                      setCreation({ parentDir: node.path, type: 'file' });
                    }}
                    title={t('workspace.newFile')}
                    className="p-1 rounded hover:bg-editor-tabActive text-editor-muted hover:text-editor-text"
                  >
                    <Plus size={11} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isExpanded) toggleFolder(node.path);
                      setCreation({ parentDir: node.path, type: 'folder' });
                    }}
                    title={t('workspace.newFolder')}
                    className="p-1 rounded hover:bg-editor-tabActive text-editor-muted hover:text-editor-text"
                  >
                    <FolderPlus size={11} />
                  </button>
                </>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenaming({
                    path: node.path,
                    currentName: node.name,
                    isDirectory: node.isDirectory,
                  });
                }}
                title={t('workspace.rename')}
                className="p-1 rounded hover:bg-editor-tabActive text-editor-muted hover:text-editor-text"
              >
                <Pencil size={11} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(node);
                }}
                title={t('workspace.delete')}
                className="p-1 rounded hover:bg-editor-tabActive text-editor-muted hover:text-red-400"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        {node.isDirectory && isExpanded && isCreatingInside && (
          <div
            style={{ paddingLeft: `${(depth + 1) * 14 + 10}px` }}
            className="flex items-center space-x-1.5 py-1 pr-2 bg-editor-tabActive/50 border-l border-editor-accent"
          >
            {creation.type === 'folder' ? (
              <Folder size={14} className="text-amber-400 flex-shrink-0" />
            ) : (
              <FileIcon fileName={creationName || 'untitled'} size={14} className="flex-shrink-0" />
            )}
            <input
              ref={creationInputRef}
              type="text"
              value={creationName}
              placeholder={creation.type === 'folder' ? 'folder_name' : 'filename.ext'}
              onChange={(e) => setCreationName(e.target.value)}
              onBlur={handleConfirmCreation}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreation();
                if (e.key === 'Escape') setCreation(null);
              }}
              className="bg-editor-bg border border-editor-accent px-1.5 py-0.5 rounded text-xs text-editor-text focus:outline-none w-full font-mono"
            />
          </div>
        )}

        {node.isDirectory && isExpanded && node.children && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  if (!rootPath) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center select-none text-editor-muted">
        <FolderTree size={36} className="text-editor-muted/60 mb-3" />
        <h4 className="text-xs font-semibold text-editor-text mb-1">
          {t('workspace.noFolderOpened', 'No Folder Opened')}
        </h4>
        <p className="text-[11px] text-editor-muted mb-4 max-w-[170px] leading-relaxed">
          {t('workspace.openFolderDesc')}
        </p>
        <button
          onClick={() => useWorkspaceStore.getState().openFolder()}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-editor-accent text-editor-bg font-medium text-xs hover:brightness-110 active:scale-95 transition-all shadow-md"
        >
          <FolderOpen size={13} />
          <span>{t('workspace.openFolder', 'Open Folder')}</span>
        </button>
      </div>
    );
  }

  const isCreatingAtRoot = creation?.parentDir === rootPath;

  return (
    <div className="flex-1 flex flex-col min-h-0 select-none overflow-hidden">
      <div className="h-8 px-3 border-b border-editor-border/80 bg-editor-tabActive/30 flex items-center justify-between text-[11px] font-semibold text-editor-muted uppercase tracking-wider">
        <div className="flex items-center space-x-1.5 truncate max-w-[120px]" title={rootPath}>
          <Folder size={13} className="text-amber-400 flex-shrink-0" />
          <span className="truncate text-editor-text font-bold">{rootName}</span>
        </div>

        <div className="flex items-center space-x-0.5">
          <button
            onClick={() => setCreation({ parentDir: rootPath, type: 'file' })}
            title={t('workspace.newFile')}
            className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text transition-colors"
          >
            <FilePlus size={13} />
          </button>
          <button
            onClick={() => setCreation({ parentDir: rootPath, type: 'folder' })}
            title={t('workspace.newFolder')}
            className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text transition-colors"
          >
            <FolderPlus size={13} />
          </button>
          <button
            onClick={() => refreshTree()}
            title={t('workspace.refresh')}
            className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text transition-colors"
          >
            <RefreshCw size={12} />
          </button>
          <button
            onClick={() => collapseAllFolders()}
            title={t('workspace.collapseAll')}
            className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text transition-colors"
          >
            <FolderMinus size={12} />
          </button>
          <button
            onClick={() => closeWorkspace()}
            title={t('workspace.close')}
            className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-red-400 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {isCreatingAtRoot && (
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-editor-tabActive/50 border-l border-editor-accent">
            {creation.type === 'folder' ? (
              <Folder size={14} className="text-amber-400 flex-shrink-0" />
            ) : (
              <FileIcon fileName={creationName || 'untitled'} size={14} className="flex-shrink-0" />
            )}
            <input
              ref={creationInputRef}
              type="text"
              value={creationName}
              placeholder={creation.type === 'folder' ? 'folder_name' : 'filename.ext'}
              onChange={(e) => setCreationName(e.target.value)}
              onBlur={handleConfirmCreation}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreation();
                if (e.key === 'Escape') setCreation(null);
              }}
              className="bg-editor-bg border border-editor-accent px-1.5 py-0.5 rounded text-xs text-editor-text focus:outline-none w-full font-mono"
            />
          </div>
        )}

        {fileTree.length === 0 && !isCreatingAtRoot ? (
          <div className="px-3 py-4 text-center text-xs text-editor-muted italic">
            {t('workspace.emptyFolder')}
          </div>
        ) : (
          fileTree.map((node) => renderNode(node, 0))
        )}
      </div>

      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 min-w-[170px] bg-editor-sidebar border border-editor-border rounded-lg shadow-2xl py-1 text-xs text-editor-text animate-smooth-pop font-sans"
        >
          {contextMenu.node.isDirectory && (
            <>
              <button
                onClick={() => {
                  const node = contextMenu.node;
                  setContextMenu(null);
                  if (!expandedFolders.has(node.path)) toggleFolder(node.path);
                  setCreation({ parentDir: node.path, type: 'file' });
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-editor-accent/20 flex items-center space-x-2"
              >
                <Plus size={13} className="text-editor-accent" />
                <span>{t('workspace.newFile')}</span>
              </button>
              <button
                onClick={() => {
                  const node = contextMenu.node;
                  setContextMenu(null);
                  if (!expandedFolders.has(node.path)) toggleFolder(node.path);
                  setCreation({ parentDir: node.path, type: 'folder' });
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-editor-accent/20 flex items-center space-x-2"
              >
                <FolderPlus size={13} className="text-amber-400" />
                <span>{t('workspace.newFolder')}</span>
              </button>
              <div className="h-[1px] bg-editor-border my-1" />
            </>
          )}

          <button
            onClick={() => {
              const node = contextMenu.node;
              setContextMenu(null);
              setRenaming({
                path: node.path,
                currentName: node.name,
                isDirectory: node.isDirectory,
              });
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-editor-accent/20 flex items-center space-x-2"
          >
            <Pencil size={13} />
            <span>{t('workspace.rename')}</span>
          </button>

          <button
            onClick={() => {
              const node = contextMenu.node;
              setContextMenu(null);
              handleDelete(node);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-red-500/20 text-red-400 flex items-center space-x-2"
          >
            <Trash2 size={13} />
            <span>{t('workspace.delete')}</span>
          </button>

          <div className="h-[1px] bg-editor-border my-1" />

          <button
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.node.path);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-editor-accent/20 flex items-center space-x-2 text-editor-muted hover:text-editor-text"
          >
            <Copy size={13} />
            <span>{t('workspace.copyPath')}</span>
          </button>

          {window.electronAPI?.revealInExplorer && (
            <button
              onClick={() => {
                window.electronAPI?.revealInExplorer(contextMenu.node.path);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-editor-accent/20 flex items-center space-x-2 text-editor-muted hover:text-editor-text"
            >
              <ExternalLink size={13} />
              <span>{t('workspace.revealInExplorer')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
