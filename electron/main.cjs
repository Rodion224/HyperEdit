const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const {
  isContextMenuInstalled,
  getContextMenuStatus,
  installContextMenu,
  uninstallContextMenu,
  parsePathFromArgs,
  isBinaryOrExecutable,
} = require('./contextMenuService.cjs');

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let pendingExternalPath = parsePathFromArgs(process.argv, app);

app.name = 'HyperEdit';
const userDataPath = path.join(app.getPath('appData'), 'HyperEdit');
try {
  if (app.getPath('userData') !== userDataPath) {
    app.setPath('userData', userDataPath);
  }
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
} catch (e) {
  console.error('Failed to configure userData path:', e);
}

const settingsFilePath = path.join(userDataPath, 'settings.json');
const sessionFilePath = path.join(userDataPath, 'session.json');

let mainWindow = null;

function createWindow() {
  const icoPath = path.join(__dirname, 'icon.ico');
  const pngPath = path.join(__dirname, 'icon.png');
  const iconPath = fs.existsSync(icoPath) ? icoPath : (fs.existsSync(pngPath) ? pngPath : undefined);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 720,
    minHeight: 480,
    backgroundColor: '#141416',
    frame: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const devUrl = 'http://localhost:3000';
  const distPath = path.join(__dirname, '../dist/index.html');

  if (process.env.VITE_DEV === 'true') {
    mainWindow.loadURL(devUrl);
  } else if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL(devUrl);
  }

  mainWindow.webContents.on('did-finish-load', () => {
    if (pendingExternalPath) {
      mainWindow.webContents.send('app:openExternalPath', pendingExternalPath);
      pendingExternalPath = null;
    }
  });

  mainWindow.on('closed', () => {
    stopActiveCodeProcess(false);
    mainWindow = null;
  });
}

ipcMain.on('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() || false;
});

ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open File - HyperEdit',
    properties: ['openFile'],
    filters: [
      {
        name: 'All Supported Code & Text Files',
        extensions: [
          'txt', 'js', 'ts', 'tsx', 'jsx', 'json', 'html', 'css',
          'py', 'cpp', 'c', 'h', 'hpp', 'md', 'xml', 'yaml', 'yml',
          'log', 'ini', 'cfg', 'sh', 'bat', 'cmd', 'ps1', 'sql'
        ],
      },
      { name: 'All Files (*.*)', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  if (isBinaryOrExecutable(filePath)) {
    throw new Error(`Cannot open binary or executable file: ${path.basename(filePath)}`);
  }
  try {
    const stats = await fs.promises.stat(filePath);
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    return {
      title: fileName,
      filePath,
      content,
      sizeBytes: stats.size,
    };
  } catch (error) {
    console.error('Failed to read file:', error);
    throw error;
  }
});

ipcMain.handle('dialog:saveFile', async (event, { content, defaultPath }) => {
  if (!mainWindow) return null;

  let savePath = defaultPath;

  if (!savePath || !path.isAbsolute(savePath)) {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save File - HyperEdit',
      defaultPath: defaultPath || 'untitled.txt',
      filters: [
        { name: 'All Files (*.*)', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }
    savePath = result.filePath;
  }

  try {
    await fs.promises.writeFile(savePath, content, 'utf-8');
    return {
      title: path.basename(savePath),
      filePath: savePath,
    };
  } catch (error) {
    console.error('Failed to write file:', error);
    throw error;
  }
});

ipcMain.handle('fs:readFile', async (event, filePath) => {
  if (isBinaryOrExecutable(filePath)) {
    throw new Error(`Cannot open binary or executable file: ${path.basename(filePath)}`);
  }
  const stats = await fs.promises.stat(filePath);
  const content = await fs.promises.readFile(filePath, 'utf-8');
  return {
    title: path.basename(filePath),
    filePath,
    content,
    sizeBytes: stats.size,
  };
});

ipcMain.handle('fs:writeFile', async (event, { filePath, content }) => {
  await fs.promises.writeFile(filePath, content, 'utf-8');
  return true;
});

ipcMain.handle('shell:revealInExplorer', async (event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});

ipcMain.handle('dialog:openFolder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Folder / Workspace - HyperEdit',
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const folderPath = result.filePaths[0];
  return {
    folderPath,
    folderName: path.basename(folderPath),
  };
});

ipcMain.handle('fs:readDirectory', async (event, dirPath) => {
  try {
    if (!dirPath || !fs.existsSync(dirPath)) return [];
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const items = [];

    for (const entry of entries) {
      const isDir = entry.isDirectory();
      const fullPath = path.join(dirPath, entry.name);
      const ext = isDir ? '' : path.extname(entry.name).toLowerCase();

      items.push({
        name: entry.name,
        path: fullPath,
        isDirectory: isDir,
        extension: ext,
      });
    }

    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
    });

    return items;
  } catch (error) {
    console.error('Failed to read directory:', error);
    return [];
  }
});

const IGNORED_SCAN_DIRS = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  'out',
  '.next',
  '.cache',
  '.vscode',
  '.idea',
  'bin',
  'obj',
  'target',
]);

async function walkProjectFiles(rootPath, currentDir, resultList, maxFiles = 25000) {
  if (resultList.length >= maxFiles) return;

  let entries;
  try {
    entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (resultList.length >= maxFiles) break;

    const fullPath = path.join(currentDir, entry.name);
    const relPath = path.relative(rootPath, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!IGNORED_SCAN_DIRS.has(entry.name) && !entry.name.startsWith('.git')) {
        await walkProjectFiles(rootPath, fullPath, resultList, maxFiles);
      }
    } else {
      resultList.push({
        name: entry.name,
        fullPath,
        relativePath: relPath,
        isDirectory: false,
      });
    }
  }
}

ipcMain.handle('fs:scanProjectFiles', async (event, rootPath) => {
  const resultList = [];
  try {
    if (rootPath && fs.existsSync(rootPath)) {
      await walkProjectFiles(rootPath, rootPath, resultList, 25000);
    }
  } catch (e) {
    console.error('Error walking project:', e);
  }
  return resultList;
});

ipcMain.handle('fs:createFile', async (event, { filePath, content = '' }) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Failed to create file:', error);
    throw error;
  }
});

ipcMain.handle('fs:createDirectory', async (event, dirPath) => {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    console.error('Failed to create directory:', error);
    throw error;
  }
});

ipcMain.handle('fs:rename', async (event, { oldPath, newPath }) => {
  try {
    await fs.promises.rename(oldPath, newPath);
    return true;
  } catch (error) {
    console.error('Failed to rename item:', error);
    throw error;
  }
});

ipcMain.handle('fs:delete', async (event, { targetPath, isDirectory }) => {
  try {
    if (isDirectory) {
      await fs.promises.rm(targetPath, { recursive: true, force: true });
    } else {
      await fs.promises.unlink(targetPath);
    }
    return true;
  } catch (error) {
    console.error('Failed to delete item:', error);
    throw error;
  }
});

ipcMain.handle('settings:load', async () => {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const content = await fs.promises.readFile(settingsFilePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Failed to load settings from disk:', e);
  }
  return null;
});

ipcMain.handle('settings:save', async (event, settings) => {
  try {
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    await fs.promises.writeFile(settingsFilePath, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Failed to save settings to disk:', e);
    return false;
  }
});

ipcMain.handle('session:load', async () => {
  try {
    if (fs.existsSync(sessionFilePath)) {
      const content = await fs.promises.readFile(sessionFilePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Failed to load session from disk:', e);
  }
  return null;
});

ipcMain.handle('session:save', async (event, sessionData) => {
  try {
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    await fs.promises.writeFile(sessionFilePath, JSON.stringify(sessionData, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Failed to save session to disk:', e);
    return false;
  }
});

const { spawn, exec } = require('child_process');
const os = require('os');

let activeCodeRunner = null;
let activeTerminalProcess = null;

function stopActiveCodeProcess(notifyUser = false) {
  if (!activeCodeRunner) return false;

  const runner = activeCodeRunner;
  activeCodeRunner = null;

  runner.isFinished = true;

  if (runner.flushTimer) {
    clearTimeout(runner.flushTimer);
    runner.flushTimer = null;
  }
  runner.outputBuf = '';

  const proc = runner.proc;
  const pid = runner.pid;

  if (proc) {
    try {
      if (proc.stdout) {
        proc.stdout.removeAllListeners();
        proc.stdout.destroy();
      }
      if (proc.stderr) {
        proc.stderr.removeAllListeners();
        proc.stderr.destroy();
      }
      if (proc.stdin) {
        proc.stdin.destroy();
      }
      proc.removeAllListeners();
    } catch (e) {}

    if (process.platform === 'win32' && pid) {
      try {
        exec(`taskkill /pid ${pid} /f /t`, () => {});
      } catch (e) {}
    }

    try {
      proc.kill('SIGKILL');
    } catch (e) {}
    try {
      proc.kill('SIGTERM');
    } catch (e) {}
  }

  if (runner.isTemp && runner.runFile) {
    fs.promises.unlink(runner.runFile).catch(() => {});
  }

  if (notifyUser && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('code:output', {
      type: 'stderr',
      text: '\n[Process stopped by user]\n',
    });
    mainWindow.webContents.send('code:exit', {
      exitCode: 137,
      durationMs: 0,
    });
  }

  return true;
}

const runnerTempDir = path.join(os.tmpdir(), 'hyperedit_runner');
if (!fs.existsSync(runnerTempDir)) {
  try {
    fs.mkdirSync(runnerTempDir, { recursive: true });
  } catch (e) {}
}

const RUNNER_EXTENSIONS = {
  javascript: '.js',
  typescript: '.ts',
  python: '.py',
  lua: '.lua',
  powershell: '.ps1',
  shell: '.sh',
  cmd: '.bat',
  bat: '.bat',
  vbscript: '.vbs',
  csharp: '.cs',
  go: '.go',
  rust: '.rs',
  html: '.html',
  cpp: '.cpp',
  c: '.c',
};

ipcMain.handle('code:run', async (event, { code, language, filePath, cwd }) => {
  if (!mainWindow) return { started: false, error: 'No main window' };

  stopActiveCodeProcess(false);

  const startTime = Date.now();
  let runFile = filePath;
  let isTemp = false;

  if (!runFile || !fs.existsSync(runFile)) {
    const ext = RUNNER_EXTENSIONS[language] || '.txt';
    const tempName = `run_${Date.now()}_${Math.random().toString(36).substr(2, 4)}${ext}`;
    runFile = path.join(runnerTempDir, tempName);
    await fs.promises.writeFile(runFile, code, 'utf-8');
    isTemp = true;
  }

  const effectiveCwd = cwd || (filePath ? path.dirname(filePath) : process.cwd());

  let command = '';
  let args = [];

  switch (language) {
    case 'python':
      command = process.platform === 'win32' ? 'python' : 'python3';
      args = ['-u', runFile];
      break;
    case 'javascript':
      command = 'node';
      args = [runFile];
      break;
    case 'typescript':
      command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      args = ['tsx', runFile];
      break;
    case 'lua': {
      const localLua = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Lua', 'bin', 'lua.exe');
      if (fs.existsSync(localLua)) {
        command = localLua;
      } else {
        command = 'lua';
      }
      args = [runFile];
      break;
    }
    case 'powershell':
      command = 'powershell.exe';
      args = ['-NoLogo', '-ExecutionPolicy', 'Bypass', '-File', runFile];
      break;
    case 'shell':
      command = 'bash';
      args = [runFile];
      break;
    case 'cmd':
    case 'bat':
      command = 'cmd.exe';
      args = ['/c', runFile];
      break;
    case 'vbscript':
      command = 'cscript.exe';
      args = ['//Nologo', runFile];
      break;
    case 'go':
      command = 'go';
      args = ['run', runFile];
      break;
    case 'csharp':
      command = 'dotnet';
      args = ['run'];
      break;
    default:
      command = 'node';
      args = [runFile];
      break;
  }

  try {
    const extraPaths = [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Lua', 'bin'),
    ].filter(Boolean);
    const combinedPath = [process.env.PATH || '', ...extraPaths].join(path.delimiter);

    const proc = spawn(command, args, {
      cwd: effectiveCwd,
      env: { ...process.env, PATH: combinedPath, PYTHONUNBUFFERED: '1' },
      shell: process.platform === 'win32',
    });

    const runner = {
      proc,
      pid: proc.pid,
      isTemp,
      runFile,
      outputBuf: '',
      flushTimer: null,
      isFinished: false,
    };
    activeCodeRunner = runner;

    const flushOutput = () => {
      if (runner.isFinished) return;
      if (runner.outputBuf && mainWindow && !mainWindow.isDestroyed()) {
        const toSend = runner.outputBuf;
        runner.outputBuf = '';
        mainWindow.webContents.send('code:output', {
          type: 'stdout',
          text: toSend,
        });
      }
      runner.flushTimer = null;
    };

    proc.stdout.on('data', (chunk) => {
      if (runner.isFinished || activeCodeRunner !== runner) return;
      if (runner.outputBuf.length > 300000) {
        runner.outputBuf = runner.outputBuf.slice(-150000);
      }
      runner.outputBuf += chunk.toString();
      if (!runner.flushTimer) {
        runner.flushTimer = setTimeout(flushOutput, 40);
      }
    });

    proc.stderr.on('data', (chunk) => {
      if (runner.isFinished || activeCodeRunner !== runner) return;
      if (runner.outputBuf.length > 300000) {
        runner.outputBuf = runner.outputBuf.slice(-150000);
      }
      runner.outputBuf += chunk.toString();
      if (!runner.flushTimer) {
        runner.flushTimer = setTimeout(flushOutput, 40);
      }
    });

    const cleanupRunner = (exitCode) => {
      if (runner.isFinished) return;
      runner.isFinished = true;
      if (runner.flushTimer) {
        clearTimeout(runner.flushTimer);
        runner.flushTimer = null;
      }
      flushOutput();

      const durationMs = Date.now() - startTime;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('code:exit', {
          exitCode: exitCode !== null ? exitCode : 0,
          durationMs,
        });
      }
      if (activeCodeRunner === runner) {
        activeCodeRunner = null;
      }
      if (isTemp) {
        fs.promises.unlink(runFile).catch(() => {});
      }
    };

    proc.on('close', cleanupRunner);

    proc.on('error', (err) => {
      if (runner.isFinished) return;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('code:output', {
          type: 'stderr',
          text: `\n[Error launching ${command}]: ${err.message}\nMake sure '${command}' is installed and accessible in your system PATH.\n`,
        });
      }
      cleanupRunner(1);
    });

    return { started: true };
  } catch (err) {
    if (isTemp) {
      fs.promises.unlink(runFile).catch(() => {});
    }
    return { started: false, error: err.message };
  }
});

ipcMain.handle('code:stop', async () => {
  return stopActiveCodeProcess(true);
});

ipcMain.handle('terminal:init', async (event, { cwd }) => {
  if (!mainWindow) return { success: false };

  if (activeTerminalProcess) {
    try {
      activeTerminalProcess.kill();
    } catch (e) {}
    activeTerminalProcess = null;
  }

  const effectiveCwd = cwd || (fs.existsSync(cwd || '') ? cwd : process.cwd());
  const shellCmd = process.platform === 'win32' ? 'powershell.exe' : (process.env.SHELL || 'bash');
  const shellArgs = process.platform === 'win32' ? ['-NoLogo', '-NoExit', '-Command', '-'] : [];

  try {
    const extraPaths = [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Lua', 'bin'),
    ].filter(Boolean);
    const combinedPath = [process.env.PATH || '', ...extraPaths].join(path.delimiter);

    const termProc = spawn(shellCmd, shellArgs, {
      cwd: effectiveCwd,
      env: { ...process.env, PATH: combinedPath, TERM: 'xterm-256color' },
      shell: false,
    });

    activeTerminalProcess = termProc;

    termProc.stdout.on('data', (data) => {
      mainWindow?.webContents.send('terminal:data', data.toString());
    });

    termProc.stderr.on('data', (data) => {
      mainWindow?.webContents.send('terminal:data', data.toString());
    });

    termProc.on('close', (code) => {
      mainWindow?.webContents.send('terminal:exit', code);
      activeTerminalProcess = null;
    });

    return { success: true, prompt: effectiveCwd };
  } catch (err) {
    console.error('Failed to spawn terminal:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('terminal:write', async (event, input) => {
  if (activeTerminalProcess && activeTerminalProcess.stdin) {
    try {
      activeTerminalProcess.stdin.write(input + '\r\n');
      return true;
    } catch (e) {
      console.error('Failed to write to terminal stdin:', e);
    }
  }
  return false;
});

ipcMain.handle('terminal:kill', async () => {
  if (activeTerminalProcess) {
    try {
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${activeTerminalProcess.pid} /f /t`);
      } else {
        activeTerminalProcess.kill('SIGTERM');
      }
      activeTerminalProcess = null;
      return true;
    } catch (e) {}
  }
  return false;
});

ipcMain.handle('contextMenu:isInstalled', async () => {
  return isContextMenuInstalled();
});

ipcMain.handle('contextMenu:getStatus', async () => {
  return getContextMenuStatus();
});

ipcMain.handle('contextMenu:install', async (event, language) => {
  return installContextMenu(app, language || 'auto');
});

ipcMain.handle('contextMenu:uninstall', async () => {
  return uninstallContextMenu();
});

ipcMain.handle('app:getInitialPath', async () => {
  const target = pendingExternalPath;
  pendingExternalPath = null;
  return target;
});

app.on('second-instance', (event, commandLine) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();

    const target = parsePathFromArgs(commandLine, app);
    if (target) {
      mainWindow.webContents.send('app:openExternalPath', target);
    }
  }
});

app.whenReady().then(async () => {
  createWindow();

  try {
    if (process.platform === 'win32') {
      let savedSettings = null;
      if (fs.existsSync(settingsFilePath)) {
        try {
          const raw = fs.readFileSync(settingsFilePath, 'utf-8');
          savedSettings = JSON.parse(raw);
        } catch (e) {}
      }

      const isEnabled = savedSettings ? savedSettings.contextMenuEnabled !== false : true;
      if (!isEnabled) {
        await uninstallContextMenu();
      } else {
        const targetLang = (savedSettings && savedSettings.contextMenuLanguage === 'app')
          ? (savedSettings.locale || 'auto')
          : 'auto';
        await installContextMenu(app, targetLang);
      }
    }
  } catch (e) {
    console.warn('Auto context menu setup error:', e);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopActiveCodeProcess(false);
});
