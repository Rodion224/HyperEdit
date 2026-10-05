import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EditorState, Compartment, Extension } from '@codemirror/state';
import {
  EditorView,
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  lineNumbers,
  highlightActiveLineGutter,
  highlightWhitespace,
  highlightTrailingWhitespace,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  searchKeymap,
  highlightSelectionMatches,
  search,
} from '@codemirror/search';
import {
  autocompletion,
  acceptCompletion,
  closeCompletion,
  startCompletion,
  moveCompletionSelection,
  closeBrackets,
  closeBracketsKeymap,
  nextSnippetField,
  prevSnippetField,
  clearSnippet,
} from '@codemirror/autocomplete';
import {
  foldGutter,
  foldKeymap,
  indentOnInput,
  bracketMatching,
  indentUnit,
} from '@codemirror/language';
import { lintKeymap, lintGutter } from '@codemirror/lint';
import { showMinimap } from '@replit/codemirror-minimap';

import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { SupportedLanguage } from '../../types';
import { getLanguageExtension } from './extensions/languages';
import { getCodeMirrorTheme } from './extensions/themes/cmThemes';
import { gutterLineSelectionExtension } from './extensions/selectionFix';
import { createColorDecoratorsExtension } from './extensions/colorPicker/colorDecoratorsExtension';
import { ColorPickerPopup } from './extensions/colorPicker/ColorPickerPopup';
import { createCodeLinterExtension } from './extensions/linter/codeLinter';
import { createCustomAutocomplete } from './extensions/autocomplete/codeAutocomplete';
import { createSmoothScrollExtension } from './extensions/smoothScroll';
import { EmptyEditorState } from './EmptyEditorState';
import { setActiveEditorView } from '../../services/activeViewService';

export const CodeMirrorEditor: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const tabStatesRef = useRef<Map<string, EditorState>>(new Map());
  const tabScrollRef = useRef<Map<string, { top: number; left: number }>>(new Map());
  const prevTabIdRef = useRef<string | null>(null);

  const [activeColorPicker, setActiveColorPicker] = useState<{
    from: number;
    to: number;
    colorText: string;
    coords: { x: number; y: number };
  } | null>(null);

  const rafCursorRef = useRef<number | null>(null);

  const handleSwatchClickRef = useRef<(from: number, to: number, colorText: string, rect: DOMRect) => void>(() => {});

  const languageCompartment = useRef(new Compartment()).current;
  const themeCompartment = useRef(new Compartment()).current;
  const typographyCompartment = useRef(new Compartment()).current;
  const tabSizeCompartment = useRef(new Compartment()).current;
  const lineNumbersCompartment = useRef(new Compartment()).current;
  const wrapCompartment = useRef(new Compartment()).current;
  const minimapCompartment = useRef(new Compartment()).current;
  const bracketMatchingCompartment = useRef(new Compartment()).current;
  const closeBracketsCompartment = useRef(new Compartment()).current;
  const activeLineCompartment = useRef(new Compartment()).current;
  const foldingCompartment = useRef(new Compartment()).current;
  const whitespaceCompartment = useRef(new Compartment()).current;
  const trailingWhitespaceCompartment = useRef(new Compartment()).current;
  const colorDecoratorsCompartment = useRef(new Compartment()).current;
  const linterCompartment = useRef(new Compartment()).current;
  const autocompleteCompartment = useRef(new Compartment()).current;

  const activeTabId = useEditorStore((state) => state.activeTabId);
  const hasActiveTab = useEditorStore((state) => !!state.activeTabId && state.tabs.some((t) => t.id === state.activeTabId));
  const activeTabLanguage = useEditorStore((state) => state.tabs.find((t) => t.id === state.activeTabId)?.language ?? 'plaintext');
  const updateActiveTabContent = useEditorStore((state) => state.updateActiveTabContent);
  const updateCursorPosition = useEditorStore((state) => state.updateCursorPosition);
  const updateDiagnostics = useEditorStore((state) => state.updateDiagnostics);

  const activeTabIdRef = useRef(activeTabId);
  activeTabIdRef.current = activeTabId;

  const { settings } = useSettingsStore();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe((state) => {
      const activeIds = new Set(state.tabs.map((t) => t.id));
      for (const id of tabStatesRef.current.keys()) {
        if (!activeIds.has(id)) {
          tabStatesRef.current.delete(id);
          tabScrollRef.current.delete(id);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const getMinimapExtension = (enabled: boolean) => {
    if (!enabled) return [];
    return showMinimap.compute(['doc'], () => ({
      create: () => ({ dom: document.createElement('div') }),
      showOverlay: 'always',
    }));
  };

  const getFoldingExtension = (enabled: boolean) => {
    if (!enabled) return [];
    return foldGutter({
      markerDOM: (open) => {
        const marker = document.createElement('span');
        marker.className = `cm-fold-marker ${open ? 'cm-fold-open' : 'cm-fold-closed'}`;
        marker.setAttribute('aria-label', open ? 'Fold code block' : 'Unfold code block');
        marker.innerHTML = `<svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        return marker;
      },
    });
  };

  const getTypographyExtension = (size: number, family: string, height: number) => {
    return EditorView.theme({
      '&': {
        fontSize: `${size}px`,
        fontFamily: `"${family}", Consolas, monospace`,
        lineHeight: `${height}`,
      },
      '.cm-scroller': {
        fontFamily: `"${family}", Consolas, monospace`,
      },
      '.cm-content': {
        fontFamily: `"${family}", Consolas, monospace`,
        fontSize: `${size}px`,
        lineHeight: `${height}`,
      },
      '.cm-line': {
        fontFamily: `"${family}", Consolas, monospace`,
        lineHeight: `${height}`,
      },
      '.cm-gutters': {
        fontFamily: `"${family}", Consolas, monospace`,
        fontSize: `${Math.max(10, size - 2)}px`,
        lineHeight: `${height}`,
      },
    });
  };

  const getTabSizeExtension = (tabSize: number) => [
    EditorState.tabSize.of(tabSize),
    indentUnit.of(' '.repeat(tabSize)),
  ];

  const getColorDecoratorsExtension = useCallback(
    (enabled: boolean) => {
      if (!enabled) return [];
      return createColorDecoratorsExtension((from, to, colorText, rect) => {
        handleSwatchClickRef.current(from, to, colorText, rect);
      });
    },
    []
  );

  const colorRangeRef = useRef<{ from: number; to: number; colorText: string } | null>(null);

  handleSwatchClickRef.current = (from, to, colorText, rect) => {
    colorRangeRef.current = { from, to, colorText };
    setActiveColorPicker({
      from,
      to,
      colorText,
      coords: {
        x: rect.left,
        y: rect.bottom + 4,
      },
    });
  };

  const handleColorChange = useCallback(
    (newColorText: string) => {
      if (!colorRangeRef.current || !viewRef.current) return;
      const view = viewRef.current;
      const doc = view.state.doc;
      const { from, to } = colorRangeRef.current;

      const safeFrom = Math.max(0, Math.min(from, doc.length));
      const safeTo = Math.max(safeFrom, Math.min(to, doc.length));

      view.dispatch({
        changes: { from: safeFrom, to: safeTo, insert: newColorText },
      });

      const newTo = safeFrom + newColorText.length;
      colorRangeRef.current = {
        from: safeFrom,
        to: newTo,
        colorText: newColorText,
      };
    },
    []
  );

  const buildExtensions = useCallback((initialLang: SupportedLanguage): Extension[] => {
    const s = settingsRef.current;
    return [
      highlightSpecialChars(),
      history(),
      gutterLineSelectionExtension,
      drawSelection({ cursorBlinkRate: 1200 }),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      lintGutter(),
      rectangularSelection(),
      crosshairCursor(),
      highlightSelectionMatches({
        minSelectionLength: 2,
        maxMatches: 200,
      }),
      search({ top: true }),
      createSmoothScrollExtension(),

      languageCompartment.of(getLanguageExtension(initialLang)),
      themeCompartment.of(getCodeMirrorTheme(s.theme)),
      typographyCompartment.of(getTypographyExtension(s.fontSize, s.fontFamily, s.lineHeight)),
      tabSizeCompartment.of(getTabSizeExtension(s.tabSize)),
      lineNumbersCompartment.of(
        s.lineNumbers === 'on' ? [lineNumbers(), highlightActiveLineGutter()] : []
      ),
      wrapCompartment.of(s.wordWrap ? EditorView.lineWrapping : []),
      minimapCompartment.of(getMinimapExtension(s.minimap)),
      bracketMatchingCompartment.of(s.bracketMatching ? bracketMatching() : []),
      closeBracketsCompartment.of(s.closeBrackets ? closeBrackets() : []),
      activeLineCompartment.of(s.highlightActiveLine ? highlightActiveLine() : []),
      foldingCompartment.of(getFoldingExtension(s.codeFolding)),
      whitespaceCompartment.of(
        s.renderWhitespace === 'all' ? highlightWhitespace() : []
      ),
      trailingWhitespaceCompartment.of(
        s.trimTrailingWhitespace ? highlightTrailingWhitespace() : []
      ),
      colorDecoratorsCompartment.of(getColorDecoratorsExtension(s.colorDecorators)),
      linterCompartment.of(
        createCodeLinterExtension(initialLang, (errors, warnings) => {
          if (activeTabIdRef.current) {
            updateDiagnostics(activeTabIdRef.current, errors, warnings);
          }
        })
      ),
      autocompleteCompartment.of(
        autocompletion({
          override: [createCustomAutocomplete(initialLang)],
          defaultKeymap: false,
          icons: true,
        })
      ),

      keymap.of([
        {
          key: 'Tab',
          run: (view) => {
            if (acceptCompletion(view)) return true;
            if (nextSnippetField(view)) return true;
            return false;
          },
          shift: prevSnippetField,
        },
        {
          key: 'Enter',
          run: (view) => {
            if (acceptCompletion(view)) return true;
            return false;
          },
        },
        {
          key: 'Escape',
          run: (view) => {
            if (closeCompletion(view)) return true;
            if (clearSnippet(view)) return true;
            return false;
          },
        },
        { key: 'ArrowDown', run: moveCompletionSelection(true) },
        { key: 'ArrowUp', run: moveCompletionSelection(false) },
        { key: 'PageDown', run: moveCompletionSelection(true, 'page') },
        { key: 'PageUp', run: moveCompletionSelection(false, 'page') },
        { key: 'Ctrl-Space', run: startCompletion },
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...lintKeymap,
        indentWithTab,
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newContent = update.state.doc.toString();
          updateActiveTabContent(newContent);
        }

        if (update.selectionSet || update.docChanged) {
          const mainSelection = update.state.selection.main;
          const line = update.state.doc.lineAt(mainSelection.head);
          const col = mainSelection.head - line.from + 1;
          const selLen = Math.abs(mainSelection.to - mainSelection.from);
          if (rafCursorRef.current) cancelAnimationFrame(rafCursorRef.current);
          rafCursorRef.current = requestAnimationFrame(() => {
            updateCursorPosition(line.number, col, selLen);
          });
        }
      }),
    ];
  }, [getColorDecoratorsExtension, updateActiveTabContent, updateCursorPosition, updateDiagnostics]);

  useEffect(() => {
    if (!containerRef.current) return;

    const initialTab = useEditorStore.getState().tabs.find((t) => t.id === activeTabIdRef.current);
    const initialText = initialTab?.content ?? '';
    const initialLang = (initialTab?.language ?? 'plaintext') as SupportedLanguage;

    const startState = EditorState.create({
      doc: initialText,
      extensions: buildExtensions(initialLang),
    });

    if (activeTabIdRef.current) {
      tabStatesRef.current.set(activeTabIdRef.current, startState);
      prevTabIdRef.current = activeTabIdRef.current;
    }

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    viewRef.current = view;
    setActiveEditorView(view);

    return () => {
      if (rafCursorRef.current) cancelAnimationFrame(rafCursorRef.current);
      setActiveEditorView(null);
      view.destroy();
      viewRef.current = null;
    };
  }, [buildExtensions]);

  useEffect(() => {
    setActiveColorPicker(null);
    const view = viewRef.current;
    if (!view) return;

    const prevId = prevTabIdRef.current;
    if (prevId && prevId !== activeTabId) {
      tabStatesRef.current.set(prevId, view.state);
      tabScrollRef.current.set(prevId, {
        top: view.scrollDOM.scrollTop,
        left: view.scrollDOM.scrollLeft,
      });
    }
    prevTabIdRef.current = activeTabId;

    if (!activeTabId) return;

    const currentTab = useEditorStore.getState().tabs.find((t) => t.id === activeTabId);
    if (!currentTab) return;

    const tabLanguage = (currentTab.language ?? 'plaintext') as SupportedLanguage;

    let targetState = tabStatesRef.current.get(activeTabId);
    if (!targetState || targetState.doc.toString() !== currentTab.content) {
      targetState = EditorState.create({
        doc: currentTab.content,
        extensions: buildExtensions(tabLanguage),
      });
      tabStatesRef.current.set(activeTabId, targetState);
    }

    if (view.state !== targetState) {
      view.setState(targetState);
      const scrollPos = tabScrollRef.current.get(activeTabId);
      if (scrollPos) {
        view.scrollDOM.scrollTop = scrollPos.top;
        view.scrollDOM.scrollLeft = scrollPos.left;
      }
    }

    view.dispatch({
      effects: [
        languageCompartment.reconfigure(getLanguageExtension(tabLanguage)),
        themeCompartment.reconfigure(getCodeMirrorTheme(settingsRef.current.theme)),
        linterCompartment.reconfigure(
          createCodeLinterExtension(tabLanguage, (errors, warnings) => {
            if (activeTabIdRef.current) {
              updateDiagnostics(activeTabIdRef.current, errors, warnings);
            }
          })
        ),
        autocompleteCompartment.reconfigure(
          autocompletion({
            override: [createCustomAutocomplete(tabLanguage)],
            defaultKeymap: false,
            icons: true,
          })
        ),
      ],
    });

    view.requestMeasure();
  }, [activeTabId, buildExtensions, updateDiagnostics]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !activeTabIdRef.current) return;
    view.dispatch({
      effects: [
        languageCompartment.reconfigure(getLanguageExtension(activeTabLanguage)),
        linterCompartment.reconfigure(
          createCodeLinterExtension(activeTabLanguage, (errors, warnings) => {
            if (activeTabIdRef.current) {
              updateDiagnostics(activeTabIdRef.current, errors, warnings);
            }
          })
        ),
        autocompleteCompartment.reconfigure(
          autocompletion({
            override: [createCustomAutocomplete(activeTabLanguage)],
            defaultKeymap: false,
            icons: true,
          })
        ),
      ],
    });
  }, [activeTabLanguage, updateDiagnostics]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: themeCompartment.reconfigure(getCodeMirrorTheme(settings.theme)),
    });
  }, [settings.theme]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: typographyCompartment.reconfigure(
        getTypographyExtension(settings.fontSize, settings.fontFamily, settings.lineHeight)
      ),
    });
    view.requestMeasure();
  }, [settings.fontSize, settings.fontFamily, settings.lineHeight]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: tabSizeCompartment.reconfigure(getTabSizeExtension(settings.tabSize)),
    });
    view.requestMeasure();
  }, [settings.tabSize]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: lineNumbersCompartment.reconfigure(
        settings.lineNumbers === 'on' ? [lineNumbers(), highlightActiveLineGutter()] : []
      ),
    });
    view.requestMeasure();
  }, [settings.lineNumbers]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: wrapCompartment.reconfigure(settings.wordWrap ? EditorView.lineWrapping : []),
    });
    view.requestMeasure();
  }, [settings.wordWrap]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: minimapCompartment.reconfigure(getMinimapExtension(settings.minimap)),
    });
    view.requestMeasure();
  }, [settings.minimap]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: bracketMatchingCompartment.reconfigure(
        settings.bracketMatching ? bracketMatching() : []
      ),
    });
  }, [settings.bracketMatching]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: closeBracketsCompartment.reconfigure(
        settings.closeBrackets ? closeBrackets() : []
      ),
    });
  }, [settings.closeBrackets]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: activeLineCompartment.reconfigure(
        settings.highlightActiveLine ? highlightActiveLine() : []
      ),
    });
  }, [settings.highlightActiveLine]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: foldingCompartment.reconfigure(getFoldingExtension(settings.codeFolding)),
    });
  }, [settings.codeFolding]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: whitespaceCompartment.reconfigure(
        settings.renderWhitespace === 'all' ? highlightWhitespace() : []
      ),
    });
  }, [settings.renderWhitespace]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: trailingWhitespaceCompartment.reconfigure(
        settings.trimTrailingWhitespace ? highlightTrailingWhitespace() : []
      ),
    });
  }, [settings.trimTrailingWhitespace]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: colorDecoratorsCompartment.reconfigure(
        getColorDecoratorsExtension(settings.colorDecorators)
      ),
    });
  }, [settings.colorDecorators, getColorDecoratorsExtension]);

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-editor-bg">
      <div
        ref={containerRef}
        className={hasActiveTab ? "w-full h-full overflow-hidden" : "hidden"}
      />

      {!hasActiveTab && <EmptyEditorState />}

      {activeColorPicker && (
        <ColorPickerPopup
          x={activeColorPicker.coords.x}
          y={activeColorPicker.coords.y}
          initialColorText={activeColorPicker.colorText}
          onColorChange={handleColorChange}
          onClose={() => {
            colorRangeRef.current = null;
            setActiveColorPicker(null);
          }}
        />
      )}
    </div>
  );
};
