import { Extension } from '@codemirror/state';
import { StreamLanguage } from '@codemirror/language';

import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { rust } from '@codemirror/lang-rust';
import { java } from '@codemirror/lang-java';
import { sql } from '@codemirror/lang-sql';
import { php } from '@codemirror/lang-php';
import { xml } from '@codemirror/lang-xml';
import { yaml } from '@codemirror/lang-yaml';
import { go } from '@codemirror/lang-go';
import { markdown } from '@codemirror/lang-markdown';

import { csharp, kotlin, dart } from '@codemirror/legacy-modes/mode/clike';
import { lua } from '@codemirror/legacy-modes/mode/lua';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { powerShell } from '@codemirror/legacy-modes/mode/powershell';
import { ruby } from '@codemirror/legacy-modes/mode/ruby';
import { swift } from '@codemirror/legacy-modes/mode/swift';
import { r } from '@codemirror/legacy-modes/mode/r';
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile';
import { toml } from '@codemirror/legacy-modes/mode/toml';
import { cmake } from '@codemirror/legacy-modes/mode/cmake';
import { diff } from '@codemirror/legacy-modes/mode/diff';
import { properties } from '@codemirror/legacy-modes/mode/properties';
import { vbScript } from '@codemirror/legacy-modes/mode/vbscript';
import { batLanguage } from './modes/bat';

import { SupportedLanguage } from '../../../types';

const streamLangMap: Partial<Record<SupportedLanguage, Extension>> = {
  csharp: StreamLanguage.define(csharp),
  lua: StreamLanguage.define(lua),
  shell: StreamLanguage.define(shell),
  powershell: StreamLanguage.define(powerShell),
  ruby: StreamLanguage.define(ruby),
  swift: StreamLanguage.define(swift),
  kotlin: StreamLanguage.define(kotlin),
  dart: StreamLanguage.define(dart),
  r: StreamLanguage.define(r),
  dockerfile: StreamLanguage.define(dockerFile),
  toml: StreamLanguage.define(toml),
  cmake: StreamLanguage.define(cmake),
  diff: StreamLanguage.define(diff),
  ini: StreamLanguage.define(properties),
  bat: batLanguage,
  vbscript: StreamLanguage.define(vbScript),
};

export function getLanguageExtension(language: SupportedLanguage): Extension {
  switch (language) {
    case 'javascript':
      return javascript({ jsx: true, typescript: false });
    case 'typescript':
      return javascript({ jsx: true, typescript: true });
    case 'html':
      return html();
    case 'css':
      return css();
    case 'json':
      return json();
    case 'python':
      return python();
    case 'cpp':
      return cpp();
    case 'rust':
      return rust();
    case 'java':
      return java();
    case 'go':
      return go();
    case 'php':
      return php();
    case 'sql':
      return sql();
    case 'xml':
      return xml();
    case 'yaml':
      return yaml();
    case 'markdown':
      return markdown();
    case 'plaintext':
      return [];
    default:
      return streamLangMap[language] || [];
  }
}

