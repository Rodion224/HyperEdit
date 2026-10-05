import { EditorView } from '@codemirror/view';
import { Diagnostic, linter } from '@codemirror/lint';
import { syntaxTree } from '@codemirror/language';
import { SupportedLanguage } from '../../../../types';

export type OnDiagnosticsUpdated = (errors: number, warnings: number) => void;

const LEZER_LANGUAGES = new Set<SupportedLanguage>([
  'javascript',
  'typescript',
  'python',
  'cpp',
  'rust',
  'java',
  'html',
  'css',
  'json',
  'sql',
  'php',
  'xml',
  'yaml',
  'go',
  'markdown',
]);

function stripLuaCommentsAndStrings(text: string): string {
  let stripped = text.replace(/--\[\[[\s\S]*?\]\]/g, (m) => ' '.repeat(m.length));
  stripped = stripped.replace(/--[^\r\n]*/g, (m) => ' '.repeat(m.length));
  stripped = stripped.replace(/\[\[[\s\S]*?\]\]/g, (m) => ' '.repeat(m.length));
  stripped = stripped.replace(/"(?:[^"\\]|\\.)*"/g, (m) => ' '.repeat(m.length));
  stripped = stripped.replace(/'(?:[^'\\]|\\.)*'/g, (m) => ' '.repeat(m.length));

  return stripped;
}

function stripGenericCommentsAndStrings(text: string, language: SupportedLanguage): string {
  let stripped = text;

  if (['csharp', 'kotlin', 'dart', 'swift'].includes(language)) {
    stripped = stripped.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length));
    stripped = stripped.replace(/\/\/[^\r\n]*/g, (m) => ' '.repeat(m.length));
  } else if (['shell', 'powershell', 'ruby', 'r', 'toml', 'dockerfile', 'cmake'].includes(language)) {
    stripped = stripped.replace(/#[^\r\n]*/g, (m) => ' '.repeat(m.length));
  } else if (['bat', 'cmd'].includes(language)) {
    stripped = stripped.replace(/^\s*(?:rem|::)[^\r\n]*/gim, (m) => ' '.repeat(m.length));
  } else if (['ini', 'properties'].includes(language)) {
    stripped = stripped.replace(/^[;#][^\r\n]*/gm, (m) => ' '.repeat(m.length));
  }

  stripped = stripped.replace(/"(?:[^"\\]|\\.)*"/g, (m) => ' '.repeat(m.length));
  if (language !== 'rust') {
    stripped = stripped.replace(/'(?:[^'\\]|\\.)*'/g, (m) => ' '.repeat(m.length));
  }

  return stripped;
}

export function computeDiagnostics(
  view: EditorView,
  language: SupportedLanguage
): Diagnostic[] {
  const doc = view.state.doc;
  const text = doc.toString();
  const diagnostics: Diagnostic[] = [];

  const addDiag = (
    from: number,
    to: number,
    severity: 'error' | 'warning',
    message: string,
    quickFix?: { name: string; replacement: string }
  ) => {
    const safeFrom = Math.max(0, Math.min(doc.length, from));
    const safeTo = Math.max(safeFrom, Math.min(doc.length, to));
    if (safeFrom >= safeTo) return;

    const diag: Diagnostic = {
      from: safeFrom,
      to: safeTo,
      severity,
      message,
      source: `HyperEdit (${language})`,
    };

    if (quickFix) {
      diag.actions = [
        {
          name: quickFix.name,
          apply(v, f, t) {
            v.dispatch({ changes: { from: f, to: t, insert: quickFix.replacement } });
          },
        },
      ];
    }

    diagnostics.push(diag);
  };

  if (language === 'json') {
    if (text.trim().length > 0) {
      try {
        JSON.parse(text);
      } catch (err: any) {
        const msg = err.message || 'JSON Syntax Error';
        const match = msg.match(/position (\d+)/i) || msg.match(/line (\d+) column (\d+)/i);
        let pos = 0;
        if (match && match[1]) {
          const rawPos = parseInt(match[1], 10);
          if (match[2]) {
            const lineNum = rawPos;
            const colNum = parseInt(match[2], 10);
            if (lineNum <= doc.lines) {
              const line = doc.line(lineNum);
              pos = Math.min(doc.length, line.from + colNum - 1);
            }
          } else {
            pos = Math.min(doc.length, rawPos);
          }
        } else {
          pos = Math.max(0, doc.length - 1);
        }

        const from = Math.max(0, pos > 0 ? pos - 1 : 0);
        const to = Math.min(doc.length, pos + 1);
        addDiag(from, to, 'error', `JSON Syntax Error: ${msg}`);
      }
    }
    return diagnostics;
  }

  if (LEZER_LANGUAGES.has(language)) {
    try {
      const tree = syntaxTree(view.state);
      if (tree && tree.length > 0) {
        let errorCount = 0;
        tree.iterate({
          enter(node) {
            if (node.type.isError && errorCount < 30) {
              errorCount++;
              const from = Math.max(0, node.from);
              const to = Math.max(from + 1, Math.min(doc.length, node.to));
              const tokenText = doc.sliceString(from, to).trim();
              const parentName = node.node.parent?.name || '';

              let message = 'Syntax error';
              if (tokenText) {
                message = `Syntax error: unexpected '${tokenText}'`;
              } else if (parentName && parentName !== 'Script' && parentName !== 'Program') {
                message = `Syntax error in ${parentName}`;
              }

              addDiag(from, to, 'error', message);
            }
          },
        });
      }
    } catch (e) {}

    return diagnostics;
  }

  if (language === 'lua') {
    const stripped = stripLuaCommentsAndStrings(text);

    const regex = /\b(function|if|while|for|do|end|repeat|until)\b/g;
    let match: RegExpExecArray | null;
    const stack: { kw: string; pos: number; needsDo?: boolean }[] = [];

    while ((match = regex.exec(stripped)) !== null) {
      const kw = match[1];
      const pos = match.index;

      if (kw === 'function' || kw === 'if' || kw === 'repeat') {
        stack.push({ kw, pos });
      } else if (kw === 'while' || kw === 'for') {
        stack.push({ kw, pos, needsDo: true });
      } else if (kw === 'do') {
        if (stack.length > 0 && stack[stack.length - 1].needsDo) {
          stack[stack.length - 1].needsDo = false;
        } else {
          stack.push({ kw: 'do', pos });
        }
      } else if (kw === 'end') {
        if (stack.length === 0) {
          addDiag(pos, pos + 3, 'error', "Unexpected 'end' with no matching opening statement");
        } else {
          const top = stack[stack.length - 1];
          if (top.kw === 'repeat') {
            addDiag(pos, pos + 3, 'error', "'repeat' block in Lua must be closed with 'until', not 'end'");
          } else {
            stack.pop();
          }
        }
      } else if (kw === 'until') {
        if (stack.length > 0 && stack[stack.length - 1].kw === 'repeat') {
          stack.pop();
        } else {
          addDiag(pos, pos + 5, 'error', "Unexpected 'until' with no matching 'repeat'");
        }
      }
    }

    for (const unclosed of stack) {
      addDiag(
        unclosed.pos,
        unclosed.pos + unclosed.kw.length,
        'error',
        `Unclosed '${unclosed.kw}' block (missing matching 'end')`
      );
    }

    const notEqRegex = /!=/g;
    while ((match = notEqRegex.exec(stripped)) !== null) {
      addDiag(
        match.index,
        match.index + 2,
        'error',
        "Invalid inequality operator '!=' in Lua. In Lua, inequality is written as '~='",
        { name: "Replace with '~='", replacement: '~=' }
      );
    }

    const badLocalAssign = /\blocal\s+([a-zA-Z_]\w*)\s*(==)\s*/g;
    while ((match = badLocalAssign.exec(stripped)) !== null) {
      const opIndex = match.index + match[0].indexOf('==');
      addDiag(
        opIndex,
        opIndex + 2,
        'error',
        "Invalid assignment operator '==' in variable declaration. Did you mean '='?",
        { name: "Replace with '='", replacement: '=' }
      );
    }

    const capStart = /(?:^|[;\n\r])\s*(Local|Function|While|Repeat)\b/g;
    while ((match = capStart.exec(stripped)) !== null) {
      const word = match[1];
      const from = match.index + match[0].indexOf(word);
      const to = from + word.length;
      const correct = word.toLowerCase();
      addDiag(
        from,
        to,
        'error',
        `Lua keywords must be lowercase: '${correct}' (found '${word}')`,
        { name: `Replace with '${correct}'`, replacement: correct }
      );
    }

    return diagnostics;
  }

  if (!LEZER_LANGUAGES.has(language) && language !== 'plaintext' && language !== 'bat' && language !== 'diff') {
    const stripped = stripGenericCommentsAndStrings(text, language);
    const bracketStack: { char: string; pos: number }[] = [];
    const bracketPairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' };

    for (let pos = 0; pos < stripped.length; pos++) {
      const ch = stripped[pos];
      if (ch === '(' || ch === '{' || ch === '[') {
        bracketStack.push({ char: ch, pos });
      } else if (ch === ')' || ch === '}' || ch === ']') {
        const expected = bracketPairs[ch];
        if (bracketStack.length === 0) {
          addDiag(pos, pos + 1, 'error', `Unmatched closing bracket '${ch}'`);
        } else {
          const top = bracketStack.pop()!;
          if (top.char !== expected) {
            addDiag(
              pos,
              pos + 1,
              'error',
              `Mismatched bracket: expected closing for '${top.char}' but found '${ch}'`
            );
          }
        }
      }
    }

    for (const unclosed of bracketStack) {
      addDiag(unclosed.pos, unclosed.pos + 1, 'error', `Unclosed bracket '${unclosed.char}'`);
    }
  }

  return diagnostics;
}

export function createCodeLinterExtension(
  language: SupportedLanguage,
  onDiagnosticsUpdated?: OnDiagnosticsUpdated
) {
  return linter(
    (view) => {
      const diags = computeDiagnostics(view, language);
      if (onDiagnosticsUpdated) {
        const errors = diags.filter((d) => d.severity === 'error').length;
        const warnings = diags.filter((d) => d.severity === 'warning').length;
        onDiagnosticsUpdated(errors, warnings);
      }
      return diags;
    },
    { delay: 300 }
  );
}
