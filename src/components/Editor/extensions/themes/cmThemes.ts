import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { ThemeId } from '../../../../types/settings';
import { getThemeById } from './themeDefinitions';

export function getCodeMirrorTheme(themeId: ThemeId): Extension {
  const theme = getThemeById(themeId);
  const { colors, isDark } = theme;

  const editorTheme = EditorView.theme(
    {
      '&': {
        color: colors.text,
        backgroundColor: colors.bg,
        height: '100%',
      },
      '.cm-content': {
        caretColor: colors.accent,
        padding: '8px 0',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: colors.accent,
        borderLeftWidth: '2px',
      },
      '.cm-selectionLayer': {
        zIndex: -1,
      },
      '&.cm-focused .cm-selectionBackground': {
        backgroundColor: colors.selection,
        borderRadius: '0px',
        opacity: '0.92',
      },
      '.cm-selectionBackground': {
        backgroundColor: colors.selection,
        borderRadius: '0px',
        opacity: '0.92',
      },
      '.cm-editor:not(.cm-focused) .cm-selectionBackground': {
        backgroundColor: colors.selection,
        borderRadius: '0px',
        opacity: '0.45',
      },
      '.cm-panels': {
        backgroundColor: colors.sidebar,
        color: colors.text,
      },
      '.cm-panels.cm-panels-top': {
        borderBottom: `1px solid ${colors.border}`,
      },
      '.cm-panels.cm-panels-bottom': {
        borderTop: `1px solid ${colors.border}`,
      },
      '.cm-searchMatch': {
        backgroundColor: isDark ? '#613214' : '#fed7aa',
        outline: isDark ? '1px solid #ea580c' : '1px solid #f97316',
      },
      '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: isDark ? '#225577' : '#bae6fd',
        outline: `1px solid ${colors.accent}`,
      },
      '.cm-activeLine': {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.045)' : 'rgba(0, 0, 0, 0.04)',
      },
      '.cm-selectionMatch': {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)',
        outline: isDark ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid rgba(0, 0, 0, 0.18)',
        borderRadius: '2px',
      },
      '.cm-matchingBracket, .cm-nonmatchingBracket': {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        outline: `1px solid ${colors.accent}`,
      },
      '.cm-gutters': {
        backgroundColor: colors.bg,
        color: colors.muted,
        border: 'none',
        borderRight: `1px solid ${colors.border}`,
      },
      '.cm-lineNumbers .cm-gutterElement': {
        color: colors.muted,
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent',
        color: isDark ? '#c6c6c6' : colors.accent,
        fontWeight: '600',
      },
      '.cm-foldPlaceholder': {
        backgroundColor: colors.lineHighlight,
        border: 'none',
        color: colors.muted,
        padding: '0 4px',
        borderRadius: '3px',
      },
    },
    { dark: isDark }
  );

  const isVSCodeDark = themeId === 'dark' || themeId === 'system';

  const highlightTokens = isDark
    ? [
        {
          tag: [t.keyword, t.modifier],
          color:
            themeId === 'pink'
              ? '#ff7edb'
              : themeId === 'purple'
              ? '#ff79c6'
              : themeId === 'green'
              ? '#4ade80'
              : themeId === 'monokai'
              ? '#f92672'
              : themeId === 'nord'
              ? '#81a1c1'
              : isVSCodeDark
              ? '#569cd6'
              : '#f43f5e',
          fontWeight: '500',
        },
        {
          tag: t.controlKeyword,
          color: isVSCodeDark ? '#c586c0' : undefined,
        },
        {
          tag: [t.name, t.deleted, t.character, t.macroName],
          color: isVSCodeDark ? '#9cdcfe' : colors.text,
        },
        {
          tag: t.propertyName,
          color: isVSCodeDark ? '#9cdcfe' : colors.text,
        },
        {
          tag: [t.function(t.variableName), t.labelName],
          color:
            themeId === 'green'
              ? '#86efac'
              : themeId === 'purple'
              ? '#50fa7b'
              : themeId === 'blue'
              ? '#82aaff'
              : themeId === 'monokai'
              ? '#a6e22e'
              : themeId === 'nord'
              ? '#88c0d0'
              : isVSCodeDark
              ? '#dcdcaa'
              : '#38bdf8',
        },
        {
          tag: [t.color, t.constant(t.name), t.standard(t.name)],
          color:
            themeId === 'purple'
              ? '#bd93f9'
              : themeId === 'monokai'
              ? '#ae81ff'
              : themeId === 'nord'
              ? '#d08770'
              : isVSCodeDark
              ? '#4fc1ff'
              : '#f59e0b',
        },
        { tag: [t.definition(t.name), t.separator], color: isVSCodeDark ? '#d4d4d4' : colors.text },
        {
          tag: [t.typeName, t.className, t.changed, t.annotation, t.self, t.namespace],
          color:
            themeId === 'purple'
              ? '#ffb86c'
              : themeId === 'monokai'
              ? '#ae81ff'
              : themeId === 'nord'
              ? '#b48ead'
              : isVSCodeDark
              ? '#4ec9b0'
              : '#fb923c',
        },
        {
          tag: t.number,
          color:
            themeId === 'purple'
              ? '#ffb86c'
              : themeId === 'monokai'
              ? '#ae81ff'
              : themeId === 'nord'
              ? '#b48ead'
              : isVSCodeDark
              ? '#b5cea8'
              : '#fb923c',
        },
        {
          tag: [t.operator, t.operatorKeyword, t.punctuation],
          color:
            themeId === 'green'
              ? '#34d399'
              : themeId === 'monokai'
              ? '#f92672'
              : themeId === 'nord'
              ? '#81a1c1'
              : isVSCodeDark
              ? '#d4d4d4'
              : '#a855f7',
        },
        {
          tag: [t.url, t.escape, t.regexp, t.link],
          color: isVSCodeDark ? '#d7ba7d' : '#a855f7',
        },
        {
          tag: [t.meta, t.comment, t.lineComment, t.blockComment],
          color: isVSCodeDark ? '#6a9955' : colors.muted,
          fontStyle: 'italic',
        },
        { tag: t.strong, fontWeight: 'bold' },
        { tag: t.emphasis, fontStyle: 'italic' },
        { tag: t.link, color: colors.accent, textDecoration: 'underline' },
        { tag: t.heading, fontWeight: 'bold', color: colors.accent },
        {
          tag: [t.atom, t.bool, t.special(t.variableName)],
          color:
            themeId === 'monokai'
              ? '#ae81ff'
              : isVSCodeDark
              ? '#569cd6'
              : '#a78bfa',
        },
        {
          tag: [t.processingInstruction, t.string, t.inserted, t.special(t.string)],
          color:
            themeId === 'green'
              ? '#22c55e'
              : themeId === 'purple'
              ? '#f1fa8c'
              : themeId === 'monokai'
              ? '#e6db74'
              : themeId === 'nord'
              ? '#a3be8c'
              : isVSCodeDark
              ? '#ce9178'
              : '#4ade80',
        },
        { tag: t.invalid, color: '#ef4444' },
      ]
    : [
        {
          tag: t.keyword,
          color: themeId === 'solarized-light' ? '#859900' : '#cf222e',
          fontWeight: '600',
        },
        { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: colors.text },
        {
          tag: [t.function(t.variableName), t.labelName],
          color: themeId === 'solarized-light' ? '#268bd2' : '#8250df',
          fontWeight: '500',
        },
        {
          tag: [t.color, t.constant(t.name), t.standard(t.name)],
          color: themeId === 'solarized-light' ? '#cb4b16' : '#953800',
        },
        { tag: [t.definition(t.name), t.separator], color: colors.text },
        {
          tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace],
          color: themeId === 'solarized-light' ? '#b58900' : '#0550ae',
        },
        {
          tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)],
          color: themeId === 'solarized-light' ? '#6c71c4' : '#bf3989',
        },
        { tag: [t.meta, t.comment], color: colors.muted, fontStyle: 'italic' },
        { tag: t.strong, fontWeight: 'bold' },
        { tag: t.emphasis, fontStyle: 'italic' },
        { tag: t.link, color: colors.accent, textDecoration: 'underline' },
        { tag: t.heading, fontWeight: 'bold', color: colors.accent },
        {
          tag: [t.atom, t.bool, t.special(t.variableName)],
          color: themeId === 'solarized-light' ? '#d33682' : '#953800',
        },
        {
          tag: [t.processingInstruction, t.string, t.inserted],
          color: themeId === 'solarized-light' ? '#2aa198' : '#116329',
        },
        { tag: t.invalid, color: '#cf222e' },
      ];

  const highlightStyle = HighlightStyle.define(highlightTokens);

  return [editorTheme, syntaxHighlighting(highlightStyle)];
}
