import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

export const obsidianDarkTheme = EditorView.theme(
  {
    '&': {
      color: '#e2e8f0',
      backgroundColor: '#141416',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#38bdf8',
      padding: '8px 0',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#38bdf8',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: '#264f78',
    },
    '.cm-panels': {
      backgroundColor: '#18191c',
      color: '#e2e8f0',
    },
    '.cm-panels.cm-panels-top': {
      borderBottom: '1px solid #2a2b33',
    },
    '.cm-panels.cm-panels-bottom': {
      borderTop: '1px solid #2a2b33',
    },
    '.cm-searchMatch': {
      backgroundColor: '#613214',
      outline: '1px solid #ea580c',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: '#225577',
      outline: '1px solid #38bdf8',
    },
    '.cm-activeLine': {
      backgroundColor: '#1b1c22',
    },
    '.cm-selectionMatch': {
      backgroundColor: '#1e3a5f',
    },
    '.cm-matchingBracket, .cm-nonmatchingBracket': {
      backgroundColor: '#2e384d',
      outline: '1px solid #38bdf8',
    },
    '.cm-gutters': {
      backgroundColor: '#141416',
      color: '#4b5563',
      border: 'none',
      borderRight: '1px solid #22232a',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: '#cbd5e1',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#22232a',
      border: 'none',
      color: '#94a3b8',
      padding: '0 4px',
      borderRadius: '3px',
    },
  },
  { dark: true }
);

export const obsidianHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#f43f5e', fontWeight: '500' },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: '#e2e8f0' },
  { tag: [t.function(t.variableName), t.labelName], color: '#38bdf8' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#f59e0b' },
  { tag: [t.definition(t.name), t.separator], color: '#e2e8f0' },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#fb923c' },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#a855f7' },
  { tag: [t.meta, t.comment], color: '#64748b', fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#38bdf8', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#38bdf8' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#a78bfa' },
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#4ade80' },
  { tag: t.invalid, color: '#ef4444' },
]);

export const modernDarkThemeExtension: Extension = [
  obsidianDarkTheme,
  syntaxHighlighting(obsidianHighlightStyle),
];
