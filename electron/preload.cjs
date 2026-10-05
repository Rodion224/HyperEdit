const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  saveFile: (content, defaultPath) => ipcRenderer.invoke('dialog:saveFile', { content, defaultPath }),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', { filePath, content }),
  readDirectory: (dirPath) => ipcRenderer.invoke('fs:readDirectory', dirPath),
  scanProjectFiles: (rootPath) => ipcRenderer.invoke('fs:scanProjectFiles', rootPath),
  createFile: (filePath, content) => ipcRenderer.invoke('fs:createFile', { filePath, content }),
  createDirectory: (dirPath) => ipcRenderer.invoke('fs:createDirectory', dirPath),
  renameItem: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', { oldPath, newPath }),
  deleteItem: (targetPath, isDirectory) => ipcRenderer.invoke('fs:delete', { targetPath, isDirectory }),
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  loadSession: () => ipcRenderer.invoke('session:load'),
  saveSession: (sessionData) => ipcRenderer.invoke('session:save', sessionData),
  revealInExplorer: (filePath) => ipcRenderer.invoke('shell:revealInExplorer', filePath),
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  runCode: (options) => ipcRenderer.invoke('code:run', options),
  stopCode: () => ipcRenderer.invoke('code:stop'),
  onCodeOutput: (callback) => {
    const handler = (event, payload) => callback(payload);
    ipcRenderer.on('code:output', handler);
    return () => ipcRenderer.removeListener('code:output', handler);
  },
  onCodeExit: (callback) => {
    const handler = (event, payload) => callback(payload);
    ipcRenderer.on('code:exit', handler);
    return () => ipcRenderer.removeListener('code:exit', handler);
  },
  initTerminal: (options) => ipcRenderer.invoke('terminal:init', options),
  writeTerminal: (input) => ipcRenderer.invoke('terminal:write', input),
  onTerminalData: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('terminal:data', handler);
    return () => ipcRenderer.removeListener('terminal:data', handler);
  },
  onTerminalExit: (callback) => {
    const handler = (event, code) => callback(code);
    ipcRenderer.on('terminal:exit', handler);
    return () => ipcRenderer.removeListener('terminal:exit', handler);
  },
  killTerminal: () => ipcRenderer.invoke('terminal:kill'),

  isContextMenuInstalled: () => ipcRenderer.invoke('contextMenu:isInstalled'),
  getContextMenuStatus: () => ipcRenderer.invoke('contextMenu:getStatus'),
  installContextMenu: (language) => ipcRenderer.invoke('contextMenu:install', language),
  uninstallContextMenu: () => ipcRenderer.invoke('contextMenu:uninstall'),
  getInitialPath: () => ipcRenderer.invoke('app:getInitialPath'),
  onOpenExternalPath: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('app:openExternalPath', handler);
    return () => ipcRenderer.removeListener('app:openExternalPath', handler);
  },
});
