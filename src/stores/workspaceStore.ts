import { create } from 'zustand';
import { FileTreeNode, ProjectFileItem } from '../types';
import { useEditorStore } from './editorStore';

const WORKSPACE_STORAGE_KEY = 'hyperedit_workspace_root_v1';

interface WorkspaceState {
  rootPath: string | null;
  rootName: string | null;
  fileTree: FileTreeNode[];
  expandedFolders: Set<string>;
  selectedTreePath: string | null;
  isScanning: boolean;
  projectFiles: ProjectFileItem[];
  isQuickOpenOpen: boolean;

  openFolder: (customPath?: string) => Promise<boolean>;
  closeWorkspace: () => void;
  toggleFolder: (folderPath: string) => Promise<void>;
  collapseAllFolders: () => void;
  refreshTree: () => Promise<void>;
  setSelectedTreePath: (path: string | null) => void;
  createFile: (parentDir: string, fileName: string) => Promise<string | null>;
  createFolder: (parentDir: string, folderName: string) => Promise<string | null>;
  renameItem: (oldPath: string, newName: string) => Promise<string | null>;
  deleteItem: (targetPath: string, isDirectory: boolean) => Promise<boolean>;
  scanAllProjectFiles: () => Promise<void>;
  toggleQuickOpen: (open?: boolean) => void;
}

async function fetchDirectoryNodes(dirPath: string): Promise<FileTreeNode[]> {
  if (typeof window !== 'undefined' && window.electronAPI?.readDirectory) {
    try {
      const items = await window.electronAPI.readDirectory(dirPath);
      return items.map((it) => ({
        name: it.name,
        path: it.path,
        isDirectory: it.isDirectory,
        extension: it.extension,
        children: it.isDirectory ? [] : undefined,
        isLoaded: false,
      }));
    } catch (e) {
      console.error(`Failed to read directory ${dirPath}:`, e);
      return [];
    }
  }
  return [];
}

function updateNodeChildren(
  nodes: FileTreeNode[],
  targetPath: string,
  children: FileTreeNode[]
): FileTreeNode[] {
  return nodes.map((node) => {
    if (node.path === targetPath) {
      return { ...node, children, isLoaded: true };
    }
    if (node.isDirectory && node.children) {
      return {
        ...node,
        children: updateNodeChildren(node.children, targetPath, children),
      };
    }
    return node;
  });
}

async function reloadSubTree(
  nodes: FileTreeNode[],
  expanded: Set<string>
): Promise<FileTreeNode[]> {
  const result: FileTreeNode[] = [];
  for (const node of nodes) {
    if (node.isDirectory && expanded.has(node.path)) {
      const children = await fetchDirectoryNodes(node.path);
      const reloadedChildren = await reloadSubTree(children, expanded);
      result.push({
        ...node,
        children: reloadedChildren,
        isLoaded: true,
      });
    } else {
      result.push(node);
    }
  }
  return result;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  rootPath: null,
  rootName: null,
  fileTree: [],
  expandedFolders: new Set<string>(),
  selectedTreePath: null,
  isScanning: false,
  projectFiles: [],
  isQuickOpenOpen: false,

  openFolder: async (customPath) => {
    let folderPath = customPath;
    let folderName = customPath ? customPath.split(/[\\/]/).pop() || customPath : '';

    if (!folderPath) {
      if (typeof window !== 'undefined' && window.electronAPI?.openFolder) {
        const res = await window.electronAPI.openFolder();
        if (!res) return false;
        folderPath = res.folderPath;
        folderName = res.folderName;
      } else {
        return false;
      }
    }

    if (!folderPath) return false;

    const rootNodes = await fetchDirectoryNodes(folderPath);
    const newExpanded = new Set<string>();

    set({
      rootPath: folderPath,
      rootName: folderName || folderPath.split(/[\\/]/).pop() || 'Project',
      fileTree: rootNodes,
      expandedFolders: newExpanded,
      selectedTreePath: null,
    });

    try {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, folderPath);
    } catch {}

    get().scanAllProjectFiles();

    return true;
  },

  closeWorkspace: () => {
    set({
      rootPath: null,
      rootName: null,
      fileTree: [],
      expandedFolders: new Set<string>(),
      selectedTreePath: null,
      projectFiles: [],
    });
    try {
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    } catch {}
  },

  toggleFolder: async (folderPath) => {
    const { expandedFolders, fileTree } = get();
    const nextExpanded = new Set(expandedFolders);

    if (nextExpanded.has(folderPath)) {
      nextExpanded.delete(folderPath);
      set({ expandedFolders: nextExpanded });
    } else {
      nextExpanded.add(folderPath);
      const children = await fetchDirectoryNodes(folderPath);
      const updatedTree = updateNodeChildren(fileTree, folderPath, children);
      set({
        expandedFolders: nextExpanded,
        fileTree: updatedTree,
      });
    }
  },

  collapseAllFolders: () => {
    set({ expandedFolders: new Set<string>() });
  },

  refreshTree: async () => {
    const { rootPath, expandedFolders } = get();
    if (!rootPath) return;

    const baseNodes = await fetchDirectoryNodes(rootPath);
    const fullyReloaded = await reloadSubTree(baseNodes, expandedFolders);
    set({ fileTree: fullyReloaded });

    get().scanAllProjectFiles();
  },

  setSelectedTreePath: (path) => {
    set({ selectedTreePath: path });
  },

  createFile: async (parentDir, fileName) => {
    if (!fileName || !fileName.trim()) return null;
    const cleanName = fileName.trim();
    const separator = parentDir.includes('\\') ? '\\' : '/';
    const filePath = `${parentDir.replace(/[\\/]+$/, '')}${separator}${cleanName}`;

    if (typeof window !== 'undefined' && window.electronAPI?.createFile) {
      try {
        await window.electronAPI.createFile(filePath, '');
        const { expandedFolders } = get();
        const nextExpanded = new Set(expandedFolders);
        nextExpanded.add(parentDir);
        set({ expandedFolders: nextExpanded });

        await get().refreshTree();
        return filePath;
      } catch (e) {
        console.error('Failed to create file:', e);
        return null;
      }
    }
    return null;
  },

  createFolder: async (parentDir, folderName) => {
    if (!folderName || !folderName.trim()) return null;
    const cleanName = folderName.trim();
    const separator = parentDir.includes('\\') ? '\\' : '/';
    const dirPath = `${parentDir.replace(/[\\/]+$/, '')}${separator}${cleanName}`;

    if (typeof window !== 'undefined' && window.electronAPI?.createDirectory) {
      try {
        await window.electronAPI.createDirectory(dirPath);
        const { expandedFolders } = get();
        const nextExpanded = new Set(expandedFolders);
        nextExpanded.add(parentDir);
        set({ expandedFolders: nextExpanded });

        await get().refreshTree();
        return dirPath;
      } catch (e) {
        console.error('Failed to create directory:', e);
        return null;
      }
    }
    return null;
  },

  renameItem: async (oldPath, newName) => {
    if (!newName || !newName.trim()) return null;
    const cleanName = newName.trim();
    const isWindows = oldPath.includes('\\');
    const separator = isWindows ? '\\' : '/';
    const parts = oldPath.split(/[\\/]/);
    parts.pop();
    const parentDir = parts.join(separator);
    const newPath = `${parentDir}${separator}${cleanName}`;

    if (oldPath === newPath) return newPath;

    if (typeof window !== 'undefined' && window.electronAPI?.renameItem) {
      try {
        await window.electronAPI.renameItem(oldPath, newPath);

        const editorStore = useEditorStore.getState();
        const matchingTab = editorStore.tabs.find((t) => t.filePath === oldPath);
        if (matchingTab) {
          editorStore.renameTab(matchingTab.id, cleanName);
          const updatedTabs = useEditorStore.getState().tabs.map((t) =>
            t.id === matchingTab.id ? { ...t, filePath: newPath } : t
          );
          useEditorStore.setState({ tabs: updatedTabs });
        }

        await get().refreshTree();
        return newPath;
      } catch (e) {
        console.error('Failed to rename item:', e);
        return null;
      }
    }
    return null;
  },

  deleteItem: async (targetPath, isDirectory) => {
    if (typeof window !== 'undefined' && window.electronAPI?.deleteItem) {
      try {
        await window.electronAPI.deleteItem(targetPath, isDirectory);

        const editorStore = useEditorStore.getState();
        const matchingTab = editorStore.tabs.find((t) => t.filePath === targetPath);
        if (matchingTab) {
          editorStore.closeTab(matchingTab.id);
        }

        await get().refreshTree();
        return true;
      } catch (e) {
        console.error('Failed to delete item:', e);
        return false;
      }
    }
    return false;
  },

  scanAllProjectFiles: async () => {
    const { rootPath } = get();
    if (!rootPath) return;

    set({ isScanning: true });
    if (typeof window !== 'undefined' && window.electronAPI?.scanProjectFiles) {
      try {
        const files = await window.electronAPI.scanProjectFiles(rootPath);
        set({ projectFiles: files, isScanning: false });
      } catch (e) {
        console.error('Failed to scan project files:', e);
        set({ isScanning: false });
      }
    } else {
      set({ isScanning: false });
    }
  },

  toggleQuickOpen: (open) => {
    set((state) => ({
      isQuickOpenOpen: open !== undefined ? open : !state.isQuickOpenOpen,
    }));
  },
}));

if (typeof window !== 'undefined') {
  try {
    const savedRoot = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (savedRoot) {
      setTimeout(() => {
        useWorkspaceStore.getState().openFolder(savedRoot);
      }, 100);
    }
  } catch {}
}
