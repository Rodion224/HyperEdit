const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const REG_KEYS = [
  'HKCU\\Software\\Classes\\*\\shell\\HyperEdit',
  'HKCU\\Software\\Classes\\Directory\\shell\\HyperEdit',
  'HKCU\\Software\\Classes\\Directory\\Background\\shell\\HyperEdit',
];

const APP_REG_KEY = 'HKCU\\Software\\Classes\\Applications\\HyperEdit.exe';

const BLOCKED_EXTENSIONS = [
  '.exe', '.dll', '.sys', '.com', '.scr', '.msi', '.msp', '.ocx', '.drv', '.cpl', '.efi', '.mui', '.node',
  '.bin', '.obj', '.o', '.lib', '.a', '.so', '.dylib', '.class', '.pyc', '.pyo', '.dex', '.apk', '.wasm', '.pdb',
  '.iso', '.img', '.vmdk', '.vdi', '.vhd', '.vhdx', '.dmg',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.cab', '.tgz',
  '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma', '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.tiff', '.psd',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
  '.pdf', '.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt', '.db', '.sqlite', '.sqlite3', '.dmp'
];

const APPLIES_TO_FILTER = 'NOT (' + BLOCKED_EXTENSIONS.map((ext) => `System.FileExtension:="${ext}"`).join(' OR ') + ')';

function isBinaryOrExecutable(filePath) {
  if (!filePath) return false;
  const ext = path.extname(filePath).toLowerCase();
  return BLOCKED_EXTENSIONS.includes(ext);
}

const CONTEXT_MENU_TITLES = {
  en: { file: 'Edit with HyperEdit', folder: 'Open with HyperEdit' },
  ru: { file: 'Редактировать с помощью HyperEdit', folder: 'Открыть в HyperEdit' },
  uk: { file: 'Редагувати в HyperEdit', folder: 'Відкрити в HyperEdit' },
  be: { file: 'Рэдагаваць у HyperEdit', folder: 'Адкрыць у HyperEdit' },
  kk: { file: 'HyperEdit арқылы өңдеу', folder: 'HyperEdit арқылы ашу' },
  'zh-cn': { file: '使用 HyperEdit 编辑', folder: '在 HyperEdit 中打开' },
  'zh-tw': { file: '使用 HyperEdit 編輯', folder: '在 HyperEdit 中開啟' },
  ja: { file: 'HyperEdit で編集', folder: 'HyperEdit で開く' },
  ko: { file: 'HyperEdit로 편집', folder: 'HyperEdit로 열기' },
  de: { file: 'Mit HyperEdit bearbeiten', folder: 'Mit HyperEdit öffnen' },
  fr: { file: 'Modifier avec HyperEdit', folder: 'Ouvrir avec HyperEdit' },
  es: { file: 'Editar con HyperEdit', folder: 'Abrir con HyperEdit' },
  it: { file: 'Modifica con HyperEdit', folder: 'Apri con HyperEdit' },
  'pt-br': { file: 'Editar com o HyperEdit', folder: 'Abrir com o HyperEdit' },
  'pt-pt': { file: 'Editar com o HyperEdit', folder: 'Abrir com o HyperEdit' },
  pl: { file: 'Edytuj w HyperEdit', folder: 'Otwórz w HyperEdit' },
  tr: { file: 'HyperEdit ile Düzenle', folder: 'HyperEdit ile Aç' },
  nl: { file: 'Bewerken met HyperEdit', folder: 'Openen met HyperEdit' },
  vi: { file: 'Chỉnh sửa bằng HyperEdit', folder: 'Mở bằng HyperEdit' },
  id: { file: 'Edit dengan HyperEdit', folder: 'Buka dengan HyperEdit' },
  th: { file: 'แก้ไขด้วย HyperEdit', folder: 'เปิดด้วย HyperEdit' },
  hi: { file: 'HyperEdit से संपादित करें', folder: 'HyperEdit में खोलें' },
  ar: { file: 'تحرير باستخدام HyperEdit', folder: 'فتح في HyperEdit' },
  he: { file: 'ערוך באמצעות HyperEdit', folder: 'פתח ב-HyperEdit' },
  cs: { file: 'Upravit v HyperEdit', folder: 'Otevřít v HyperEdit' },
  sv: { file: 'Redigera med HyperEdit', folder: 'Öppna med HyperEdit' },
  da: { file: 'Rediger med HyperEdit', folder: 'Åbn med HyperEdit' },
  fi: { file: 'Muokkaa HyperEditillä', folder: 'Avaa HyperEditillä' },
  no: { file: 'Rediger med HyperEdit', folder: 'Åpne med HyperEdit' },
  el: { file: 'Επεξεργασία με το HyperEdit', folder: 'Άνοιγμα με το HyperEdit' },
  ro: { file: 'Editează cu HyperEdit', folder: 'Deschide cu HyperEdit' },
  hu: { file: 'Szerkesztés a HyperEdit-tel', folder: 'Megnyitás a HyperEdit-tel' },
};

function resolveTitles(app, language) {
  let lang = (language || 'auto').toLowerCase();

  if (lang === 'auto' || lang === 'system' || !lang) {
    try {
      if (app && typeof app.getSystemLocale === 'function') {
        const sysLoc = app.getSystemLocale();
        if (sysLoc) lang = sysLoc.toLowerCase();
      }
    } catch (e) {}

    if (lang === 'auto' || lang === 'system') {
      try {
        const intlLoc = Intl.DateTimeFormat().resolvedOptions().locale;
        if (intlLoc) lang = intlLoc.toLowerCase();
      } catch (e) {}
    }
  }

  if (lang === 'zh-tw' || lang === 'zh-hk' || lang.includes('hant')) return CONTEXT_MENU_TITLES['zh-tw'];
  if (lang.startsWith('zh')) return CONTEXT_MENU_TITLES['zh-cn'];
  if (lang === 'pt-br') return CONTEXT_MENU_TITLES['pt-br'];
  if (lang.startsWith('pt')) return CONTEXT_MENU_TITLES['pt-pt'];

  let prefix = lang.split(/[-_]/)[0];
  if (prefix === 'nb' || prefix === 'nn') prefix = 'no';

  if (CONTEXT_MENU_TITLES[prefix]) {
    return CONTEXT_MENU_TITLES[prefix];
  }

  return CONTEXT_MENU_TITLES.en;
}

function runReg(args) {
  return new Promise((resolve) => {
    execFile('reg.exe', args, { windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        resolve({ success: false, error: stderr || err.message, code: err.code });
      } else {
        resolve({ success: true, stdout });
      }
    });
  });
}

async function isContextMenuInstalled() {
  if (process.platform !== 'win32') return false;
  const result = await runReg(['query', REG_KEYS[0]]);
  return result.success;
}

async function getContextMenuStatus() {
  if (process.platform !== 'win32') return { installed: false, title: '' };
  const result = await runReg(['query', REG_KEYS[0]]);
  if (!result.success || !result.stdout) return { installed: false, title: '' };
  const match = result.stdout.match(/\(Default\)\s+REG_SZ\s+(.+)/);
  const title = match ? match[1].trim() : '';
  return { installed: true, title };
}

async function installContextMenu(app, language = 'auto') {
  if (process.platform !== 'win32') return false;

  const titles = resolveTitles(app, language);
  const fileTitle = titles.file;
  const folderTitle = titles.folder;

  let iconPath = path.join(__dirname, 'icon.ico');
  if (app && app.isPackaged) {
    iconPath = process.execPath;
  } else if (!fs.existsSync(iconPath)) {
    const altIcon = path.resolve(__dirname, '../public/icon.ico');
    if (fs.existsSync(altIcon)) iconPath = altIcon;
  }

  let fileCommand = '';
  let bgCommand = '';

  if (app && app.isPackaged) {
    const exePath = process.execPath;
    fileCommand = `"${exePath}" "%1"`;
    bgCommand = `"${exePath}" "%V"`;
  } else {
    let electronExe = process.execPath;
    if (electronExe.toLowerCase().endsWith('node.exe')) {
      try {
        const electronPkg = require('electron');
        if (typeof electronPkg === 'string') {
          electronExe = electronPkg;
        }
      } catch (e) {}
    }
    const appPath = app ? app.getAppPath() : process.cwd();
    fileCommand = `"${electronExe}" "${appPath}" "%1"`;
    bgCommand = `"${electronExe}" "${appPath}" "%V"`;
  }

  try {
    await runReg(['add', REG_KEYS[0], '/ve', '/d', fileTitle, '/f']);
    if (fs.existsSync(iconPath)) {
      await runReg(['add', REG_KEYS[0], '/v', 'Icon', '/d', `"${iconPath}"`, '/f']);
    }
    await runReg(['add', REG_KEYS[0], '/v', 'AppliesTo', '/d', APPLIES_TO_FILTER, '/f']);
    await runReg(['add', `${REG_KEYS[0]}\\command`, '/ve', '/d', fileCommand, '/f']);

    await runReg(['add', REG_KEYS[1], '/ve', '/d', folderTitle, '/f']);
    if (fs.existsSync(iconPath)) {
      await runReg(['add', REG_KEYS[1], '/v', 'Icon', '/d', `"${iconPath}"`, '/f']);
    }
    await runReg(['add', `${REG_KEYS[1]}\\command`, '/ve', '/d', fileCommand, '/f']);

    await runReg(['add', REG_KEYS[2], '/ve', '/d', folderTitle, '/f']);
    if (fs.existsSync(iconPath)) {
      await runReg(['add', REG_KEYS[2], '/v', 'Icon', '/d', `"${iconPath}"`, '/f']);
    }
    await runReg(['add', `${REG_KEYS[2]}\\command`, '/ve', '/d', bgCommand, '/f']);

    await runReg(['add', APP_REG_KEY, '/v', 'FriendlyAppName', '/d', 'HyperEdit', '/f']);
    if (fs.existsSync(iconPath)) {
      await runReg(['add', `${APP_REG_KEY}\\DefaultIcon`, '/ve', '/d', `"${iconPath}"`, '/f']);
    }
    await runReg(['add', `${APP_REG_KEY}\\shell\\open\\command`, '/ve', '/d', fileCommand, '/f']);
    await runReg(['add', `${APP_REG_KEY}\\SupportedTypes`, '/v', '.txt', '/d', '', '/f']);

    return true;
  } catch (err) {
    console.error('Failed to install context menu:', err);
    return false;
  }
}

async function uninstallContextMenu() {
  if (process.platform !== 'win32') return false;

  for (const key of REG_KEYS) {
    await runReg(['delete', key, '/f']);
  }
  await runReg(['delete', APP_REG_KEY, '/f']);
  return true;
}

function parseAllPathsFromArgs(argv, app, baseDir) {
  if (!argv || !Array.isArray(argv) || argv.length === 0) return [];

  let appPath = '';
  try {
    if (app && typeof app.getAppPath === 'function') {
      appPath = path.resolve(app.getAppPath()).toLowerCase();
    }
  } catch (e) {}

  const execPath = process.execPath ? process.execPath.toLowerCase() : '';
  const cwd = baseDir || process.cwd();
  const results = [];
  const seen = new Set();

  for (let i = 1; i < argv.length; i++) {
    let raw = argv[i];
    if (typeof raw !== 'string') continue;
    raw = raw.trim();
    if (!raw) continue;

    raw = raw.replace(/^["']+|["']+$/g, '').trim();
    if (!raw) continue;

    if (raw.startsWith('--') || raw.startsWith('-') || raw.startsWith('/')) {
      continue;
    }

    const lowerRaw = raw.toLowerCase();
    if (
      lowerRaw === '.' ||
      lowerRaw === execPath ||
      lowerRaw === appPath ||
      lowerRaw.endsWith('\\electron.exe') ||
      lowerRaw.endsWith('/electron') ||
      lowerRaw.endsWith('\\node.exe')
    ) {
      continue;
    }

    try {
      const normalized = path.isAbsolute(raw) ? path.normalize(raw) : path.resolve(cwd, raw);
      if (fs.existsSync(normalized)) {
        let realPath = normalized;
        try {
          realPath = fs.realpathSync(normalized);
        } catch (e) {}

        const realLower = realPath.toLowerCase();
        if (realLower === execPath || realLower === appPath) {
          continue;
        }

        if (!seen.has(realLower)) {
          seen.add(realLower);
          const stat = fs.statSync(realPath);
          results.push({
            path: realPath,
            isDirectory: stat.isDirectory(),
          });
        }
      }
    } catch (e) {}
  }

  return results;
}

function parsePathFromArgs(argv, app, baseDir) {
  const all = parseAllPathsFromArgs(argv, app, baseDir);
  return all.length > 0 ? all[0] : null;
}

module.exports = {
  isContextMenuInstalled,
  getContextMenuStatus,
  installContextMenu,
  uninstallContextMenu,
  parsePathFromArgs,
  parseAllPathsFromArgs,
  isBinaryOrExecutable,
  BLOCKED_EXTENSIONS,
  APPLIES_TO_FILTER,
};
