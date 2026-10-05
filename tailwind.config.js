export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        editor: {
          bg: 'var(--color-editor-bg, #1e1e1e)',
          sidebar: 'var(--color-editor-sidebar, #181818)',
          tabActive: 'var(--color-editor-tabActive, #1e1e1e)',
          tabInactive: 'var(--color-editor-tabInactive, #181818)',
          border: 'var(--color-editor-border, #2b2b2b)',
          lineHighlight: 'var(--color-editor-lineHighlight, #282828)',
          selection: 'var(--color-editor-selection, #264f78)',
          text: 'var(--color-editor-text, #cccccc)',
          muted: 'var(--color-editor-muted, #858585)',
          accent: 'var(--color-editor-accent, #0078d4)',
          statusBar: 'var(--color-editor-statusBar, #181818)',
        }
      },
      borderColor: {
        DEFAULT: 'var(--color-editor-border, #2b2b2b)',
      },
      fontFamily: {
        mono: ['"Cascadia Code"', '"JetBrains Mono"', 'Consolas', '"Courier New"', 'monospace'],
        sans: ['"Segoe UI"', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
