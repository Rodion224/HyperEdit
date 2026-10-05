import { StreamParser, StringStream, StreamLanguage } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

interface BatState {
  afterGoto: boolean;
  afterCommandSep: boolean;
}

export const batMode: StreamParser<BatState> = {
  name: 'bat',
  startState: (): BatState => ({
    afterGoto: false,
    afterCommandSep: false,
  }),
  tokenTable: {
    keyword: t.keyword,
    comment: t.comment,
    string: t.string,
    variable: t.special(t.variableName),
    label: t.labelName,
    builtin: t.standard(t.name),
    operator: t.operator,
    number: t.number,
    switch: t.meta,
    atom: t.atom,
  },
  token: (stream: StringStream, state: BatState): string | null => {
    if (stream.eatSpace()) return null;

    if (stream.sol() || state.afterCommandSep) {
      state.afterCommandSep = false;
      if (stream.match(/^::.*/)) {
        return 'comment';
      }
      if (stream.match(/^rem(?:\s.*|$)/i)) {
        return 'comment';
      }
      if (stream.match(/^@rem(?:\s.*|$)/i)) {
        return 'comment';
      }
    }

    if (stream.eat('@')) {
      return 'keyword';
    }

    if (stream.sol() && stream.match(/^:[a-zA-Z0-9_\-\.]+/)) {
      return 'label';
    }

    if (state.afterGoto) {
      state.afterGoto = false;
      if (stream.match(/^:?[a-zA-Z0-9_\-\.]+/)) {
        return 'label';
      }
    }

    if (stream.match(/^%~[a-zA-Z0-9_$:]+/)) {
      return 'variable';
    }
    if (stream.match(/^%%[a-zA-Z0-9_]/)) {
      return 'variable';
    }
    if (stream.match(/^%[a-zA-Z0-9_#$@]+%/)) {
      return 'variable';
    }
    if (stream.match(/^%[0-9*]/)) {
      return 'variable';
    }
    if (stream.match(/^![a-zA-Z0-9_#$@]+!/)) {
      return 'variable';
    }

    if (stream.peek() === '"') {
      stream.next();
      while (!stream.eol()) {
        const ch = stream.next();
        if (ch === '"') break;
        if (ch === '^') stream.next();
      }
      return 'string';
    }

    if (stream.match(/^\/[a-zA-Z0-9_?:]+/)) {
      return 'switch';
    }

    if (stream.match(/^(?:==|&&|\|\||&|\||2>&1|2>|>>|>|<|\^|\+|\-|\*|\/)/)) {
      const cur = stream.current();
      if (cur === '&' || cur === '&&' || cur === '|') {
        state.afterCommandSep = true;
      }
      return 'operator';
    }

    if (stream.match(/^(?:0x[0-9a-fA-F]+|\d+)\b/)) {
      return 'number';
    }

    if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
      const word = stream.current().toLowerCase();
      if (word === 'goto' || word === 'call') {
        state.afterGoto = true;
        return 'keyword';
      }
      if (/^(?:echo|if|else|exit|for|in|do|set|setlocal|endlocal|shift|start|pause|cls|title|color|prompt|pushd|popd)$/i.test(word)) {
        return 'keyword';
      }
      if (/^(?:equ|neq|lss|leq|gtr|geq|not|exist|defined|errorlevel|cmdextversion)$/i.test(word)) {
        return 'operator';
      }
      if (/^(?:on|off|nul|con|prn|aux)$/i.test(word)) {
        return 'atom';
      }
      if (/^(?:cd|chdir|md|mkdir|rd|rmdir|dir|del|erase|copy|xcopy|robocopy|move|ren|rename|type|find|findstr|attrib|chcp|timeout|choice|ping|curl|tar|reg|net|sc|tasklist|taskkill|shutdown|assoc|ftype|where|powershell|tree|fc|comp|mode)$/i.test(word)) {
        return 'builtin';
      }
      return null;
    }

    stream.next();
    return null;
  },
  languageData: {
    commentTokens: { line: 'REM ' },
  },
};

export const batLanguage = StreamLanguage.define(batMode);
