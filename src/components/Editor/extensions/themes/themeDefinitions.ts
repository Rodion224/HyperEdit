import { ThemeColors, ThemeId, EditorSettings } from '../../../../types/settings';

export const THEME_LIST: ThemeColors[] = [
  {
    id: 'dark',
    name: 'Dark Modern',
    description: 'Default modern dark theme inspired by VS Code and Obsidian',
    isDark: true,
    colors: {
      bg: '#1e1e1e',
      sidebar: '#181818',
      tabActive: '#1e1e1e',
      tabInactive: '#181818',
      border: '#2b2b2b',
      lineHighlight: '#282828',
      selection: '#264f78',
      text: '#cccccc',
      muted: '#858585',
      accent: '#0078d4',
      statusBar: '#181818',
    },
  },
  {
    id: 'light',
    name: 'Light Modern',
    description: 'Clean, eye-friendly light theme designed for bright workspaces',
    isDark: false,
    colors: {
      bg: '#ffffff',
      sidebar: '#f3f4f6',
      tabActive: '#ffffff',
      tabInactive: '#f8fafc',
      border: '#e2e8f0',
      lineHighlight: '#f1f5f9',
      selection: '#bae6fd',
      text: '#0f172a',
      muted: '#64748b',
      accent: '#0284c7',
      statusBar: '#f1f5f9',
    },
  },
  {
    id: 'blue',
    name: 'Cobalt Night',
    description: 'Deep oceanic blue palette inspired by Night Owl & Cobalt2',
    isDark: true,
    colors: {
      bg: '#011627',
      sidebar: '#010e1a',
      tabActive: '#0b2942',
      tabInactive: '#011627',
      border: '#0b3252',
      lineHighlight: '#0a2540',
      selection: '#1d3b5a',
      text: '#d6deeb',
      muted: '#5f7e97',
      accent: '#82aaff',
      statusBar: '#01111d',
    },
  },
  {
    id: 'purple',
    name: 'Dracula Velvet',
    description: 'Legendary gothic dark theme with vibrant purple and pastel accents',
    isDark: true,
    colors: {
      bg: '#282a36',
      sidebar: '#21222c',
      tabActive: '#343746',
      tabInactive: '#282a36',
      border: '#44475a',
      lineHighlight: '#343746',
      selection: '#44475a',
      text: '#f8f8f2',
      muted: '#6272a4',
      accent: '#bd93f9',
      statusBar: '#191a21',
    },
  },
  {
    id: 'pink',
    name: 'Synthwave Neon',
    description: 'Retro 80s cyberpunk theme with neon magenta and glowing highlights',
    isDark: true,
    colors: {
      bg: '#262335',
      sidebar: '#1f1c2b',
      tabActive: '#342f48',
      tabInactive: '#262335',
      border: '#494266',
      lineHighlight: '#2f2b42',
      selection: '#614d85',
      text: '#fdfdfd',
      muted: '#84799e',
      accent: '#ff7edb',
      statusBar: '#1b1826',
    },
  },
  {
    id: 'green',
    name: 'Matrix Forest',
    description: 'Deep emerald forest theme with soothing green code accents',
    isDark: true,
    colors: {
      bg: '#0d1a14',
      sidebar: '#08120d',
      tabActive: '#142920',
      tabInactive: '#0d1a14',
      border: '#1d3b2e',
      lineHighlight: '#13261e',
      selection: '#1b4332',
      text: '#dcfce7',
      muted: '#52796f',
      accent: '#4ade80',
      statusBar: '#07100b',
    },
  },
  {
    id: 'monokai',
    name: 'Monokai Pro',
    description: 'Iconic warm charcoal theme with vivid yellow, green and orange highlights',
    isDark: true,
    colors: {
      bg: '#272822',
      sidebar: '#1e1f1c',
      tabActive: '#34352f',
      tabInactive: '#272822',
      border: '#3e3d32',
      lineHighlight: '#3e3d32',
      selection: '#49483e',
      text: '#f8f8f2',
      muted: '#75715e',
      accent: '#e6db74',
      statusBar: '#1e1f1c',
    },
  },
  {
    id: 'nord',
    name: 'Arctic Nord',
    description: 'Soothing arctic bluish-gray palette with arctic frost accents',
    isDark: true,
    colors: {
      bg: '#2e3440',
      sidebar: '#242933',
      tabActive: '#3b4252',
      tabInactive: '#2e3440',
      border: '#434c5e',
      lineHighlight: '#3b4252',
      selection: '#4c566a',
      text: '#eceff4',
      muted: '#7b88a1',
      accent: '#88c0d0',
      statusBar: '#242933',
    },
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    description: 'Legendary designer warm cream light theme with oceanic cyan accents',
    isDark: false,
    colors: {
      bg: '#fdf6e3',
      sidebar: '#eee8d5',
      tabActive: '#fdf6e3',
      tabInactive: '#eee8d5',
      border: '#d5cebb',
      lineHighlight: '#eee8d5',
      selection: '#e0dac8',
      text: '#073642',
      muted: '#93a1a1',
      accent: '#268bd2',
      statusBar: '#eee8d5',
    },
  },
  {
    id: 'system',
    name: 'System Default',
    description: 'Automatically synchronizes with your Windows Light/Dark preference',
    isDark: true,
    colors: {
      bg: '#1e1e1e',
      sidebar: '#181818',
      tabActive: '#1e1e1e',
      tabInactive: '#181818',
      border: '#2b2b2b',
      lineHighlight: '#282828',
      selection: '#264f78',
      text: '#cccccc',
      muted: '#858585',
      accent: '#0078d4',
      statusBar: '#181818',
    },
  },
];

export function getThemeById(id: ThemeId): ThemeColors {
  if (id === 'system') {
    const isSystemDark =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true;
    return getThemeById(isSystemDark ? 'dark' : 'light');
  }
  return THEME_LIST.find((t) => t.id === id) || THEME_LIST[0];
}

export function applyThemeToDOM(themeId: ThemeId) {
  if (typeof document === 'undefined') return;
  const theme = getThemeById(themeId);
  const root = document.documentElement;

  if (theme.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  const { colors } = theme;
  root.style.setProperty('--color-editor-bg', colors.bg);
  root.style.setProperty('--color-editor-sidebar', colors.sidebar);
  root.style.setProperty('--color-editor-tabActive', colors.tabActive);
  root.style.setProperty('--color-editor-tabInactive', colors.tabInactive);
  root.style.setProperty('--color-editor-border', colors.border);
  root.style.setProperty('--color-editor-lineHighlight', colors.lineHighlight);
  root.style.setProperty('--color-editor-selection', colors.selection);
  root.style.setProperty('--color-editor-text', colors.text);
  root.style.setProperty('--color-editor-muted', colors.muted);
  root.style.setProperty('--color-editor-accent', colors.accent);
  root.style.setProperty('--color-editor-statusBar', colors.statusBar);
  root.style.colorScheme = theme.isDark ? 'dark' : 'light';
}

export function applyTypographyToDOM(settings: Pick<EditorSettings, 'fontSize' | 'fontFamily' | 'lineHeight' | 'cursorBlinking'>) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--editor-font-size', `${settings.fontSize}px`);
  root.style.setProperty('--editor-font-family', `"${settings.fontFamily}", Consolas, monospace`);
  root.style.setProperty('--editor-line-height', `${settings.lineHeight}`);
  root.setAttribute('data-cursor', settings.cursorBlinking);
}
