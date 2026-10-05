import { Completion, CompletionContext, CompletionResult, snippetCompletion } from '@codemirror/autocomplete';
import { SupportedLanguage } from '../../../../types';

const LANGUAGE_COMPLETIONS: Partial<Record<SupportedLanguage, Completion[]>> = {
  lua: [
    { label: 'local', type: 'keyword', detail: 'keyword', info: 'Declares a local variable or function in Lua', boost: 95 },
    { label: 'function', type: 'keyword', detail: 'keyword', info: 'Begins a function definition', boost: 95 },
    { label: 'return', type: 'keyword', detail: 'keyword', info: 'Returns values from a function or script', boost: 95 },
    { label: 'if', type: 'keyword', detail: 'keyword', info: 'Conditional statement', boost: 95 },
    { label: 'then', type: 'keyword', detail: 'keyword', info: 'Executes block if condition is true', boost: 95 },
    { label: 'else', type: 'keyword', detail: 'keyword', info: 'Alternative branch of if statement', boost: 95 },
    { label: 'elseif', type: 'keyword', detail: 'keyword', info: 'Chained conditional statement', boost: 95 },
    { label: 'end', type: 'keyword', detail: 'keyword', info: 'Closes a function, if, while, for, or block', boost: 95 },
    { label: 'while', type: 'keyword', detail: 'keyword', info: 'While loop', boost: 95 },
    { label: 'do', type: 'keyword', detail: 'keyword', info: 'Block opener for while/for loops', boost: 95 },
    { label: 'for', type: 'keyword', detail: 'keyword', info: 'For loop', boost: 95 },
    { label: 'in', type: 'keyword', detail: 'keyword', info: 'Iterates through an iterator function', boost: 95 },
    { label: 'repeat', type: 'keyword', detail: 'keyword', info: 'Loop with condition at end', boost: 95 },
    { label: 'until', type: 'keyword', detail: 'keyword', info: 'Loop termination condition', boost: 95 },
    { label: 'break', type: 'keyword', detail: 'keyword', info: 'Breaks loop execution', boost: 95 },
    { label: 'nil', type: 'keyword', detail: 'value', info: 'Lua non-value literal', boost: 95 },
    { label: 'true', type: 'keyword', detail: 'boolean', info: 'Boolean true', boost: 95 },
    { label: 'false', type: 'keyword', detail: 'boolean', info: 'Boolean false', boost: 95 },
    { label: 'and', type: 'keyword', detail: 'operator', info: 'Logical AND operator', boost: 95 },
    { label: 'or', type: 'keyword', detail: 'operator', info: 'Logical OR operator', boost: 95 },
    { label: 'not', type: 'keyword', detail: 'operator', info: 'Logical NOT operator', boost: 95 },

    snippetCompletion('local ${1:varName} = ${0}', {
      label: 'local',
      detail: 'local var = value',
      type: 'keyword',
      boost: 93,
      info: 'Declares an initialized local variable',
    }),
    snippetCompletion('local function ${1:name}(${2:params})\n\t${0}\nend', {
      label: 'local function',
      detail: 'local function name(params) ... end',
      type: 'function',
      boost: 88,
      info: 'Creates a scoped local function in Lua',
    }),
    snippetCompletion('local function ${1:name}(${2:params})\n\t${0}\nend', {
      label: 'locfunc',
      detail: 'local function snippet',
      type: 'snippet',
      boost: 87,
      info: 'Shortcut snippet for local function',
    }),
    snippetCompletion('function ${1:name}(${2:params})\n\t${0}\nend', {
      label: 'function',
      detail: 'function name(params) ... end',
      type: 'function',
      boost: 92,
      info: 'Creates a function definition in Lua',
    }),
    snippetCompletion('function ${1:name}(${2:params})\n\t${0}\nend', {
      label: 'func',
      detail: 'function snippet',
      type: 'snippet',
      boost: 91,
      info: 'Quick snippet to create a function in Lua',
    }),
    snippetCompletion('if ${1:condition} then\n\t${0}\nend', {
      label: 'if',
      detail: 'if condition then ... end',
      type: 'snippet',
      boost: 90,
      info: 'If conditional statement',
    }),
    snippetCompletion('if ${1:condition} then\n\t${2}\nelse\n\t${0}\nend', {
      label: 'ifelse',
      detail: 'if ... else ... end',
      type: 'snippet',
      boost: 90,
      info: 'If-Else branch statement',
    }),
    snippetCompletion('for ${1:i} = ${2:1}, ${3:10} do\n\t${0}\nend', {
      label: 'for',
      detail: 'for i = 1, N do ... end',
      type: 'snippet',
      boost: 90,
      info: 'Numeric for loop',
    }),
    snippetCompletion('for ${1:k}, ${2:v} in pairs(${3:tbl}) do\n\t${0}\nend', {
      label: 'forp',
      detail: 'for k, v in pairs(tbl) do ... end',
      type: 'snippet',
      boost: 90,
      info: 'Iterates key-value pairs of a table',
    }),
    snippetCompletion('for ${1:i}, ${2:v} in ipairs(${3:tbl}) do\n\t${0}\nend', {
      label: 'fori',
      detail: 'for i, v in ipairs(tbl) do ... end',
      type: 'snippet',
      boost: 90,
      info: 'Iterates indexed elements of an array table',
    }),
    snippetCompletion('while ${1:condition} do\n\t${0}\nend', {
      label: 'while',
      detail: 'while condition do ... end',
      type: 'snippet',
      boost: 90,
      info: 'While loop',
    }),
    snippetCompletion('print(${1:value})', {
      label: 'print',
      detail: 'print(value)',
      type: 'function',
      boost: 86,
      info: 'Prints arguments to console output',
    }),

    { label: 'table.insert', type: 'function', detail: 'table.insert(t, [pos,] value)', info: 'Inserts element into table', boost: 85 },
    { label: 'table.remove', type: 'function', detail: 'table.remove(t [, pos])', info: 'Removes element from table', boost: 85 },
    { label: 'table.concat', type: 'function', detail: 'table.concat(t [, sep [, i [, j]]])', info: 'Concatenates table elements to string', boost: 85 },
    { label: 'string.format', type: 'function', detail: 'string.format(fmt, ...)', info: 'Formats string', boost: 85 },
    { label: 'string.len', type: 'function', detail: 'string.len(s)', info: 'Returns string length', boost: 85 },
    { label: 'string.sub', type: 'function', detail: 'string.sub(s, i [, j])', info: 'Returns substring', boost: 85 },
    { label: 'math.floor', type: 'function', detail: 'math.floor(x)', info: 'Rounds number down', boost: 85 },
    { label: 'math.ceil', type: 'function', detail: 'math.ceil(x)', info: 'Rounds number up', boost: 85 },
    { label: 'math.random', type: 'function', detail: 'math.random([m [, n]])', info: 'Generates random number', boost: 85 },
    { label: 'require', type: 'function', detail: 'require(modname)', info: 'Loads a module', boost: 85 },
    { label: 'pcall', type: 'function', detail: 'pcall(f, ...)', info: 'Calls function in protected mode', boost: 85 },
    { label: 'type', type: 'function', detail: 'type(v)', info: 'Returns value type name', boost: 85 },
    { label: 'tostring', type: 'function', detail: 'tostring(e)', info: 'Converts expression to string', boost: 85 },
    { label: 'tonumber', type: 'function', detail: 'tonumber(e [, base])', info: 'Converts expression to number', boost: 85 },
    { label: 'setmetatable', type: 'function', detail: 'setmetatable(table, metatable)', info: 'Sets metatable for table', boost: 85 },
    { label: 'getmetatable', type: 'function', detail: 'getmetatable(object)', info: 'Returns metatable of object', boost: 85 },
  ],

  javascript: [
    { label: 'const', type: 'keyword', detail: 'keyword', info: 'Declares a block-scoped constant' },
    { label: 'let', type: 'keyword', detail: 'keyword', info: 'Declares a block-scoped variable' },
    { label: 'var', type: 'keyword', detail: 'keyword', info: 'Declares a variable' },
    { label: 'function', type: 'keyword', detail: 'keyword', info: 'Declares a function' },
    { label: 'return', type: 'keyword', detail: 'keyword', info: 'Returns from function' },
    { label: 'async', type: 'keyword', detail: 'keyword', info: 'Declares async function' },
    { label: 'await', type: 'keyword', detail: 'keyword', info: 'Waits for promise' },
    { label: 'import', type: 'keyword', detail: 'keyword', info: 'Imports modules' },
    { label: 'export', type: 'keyword', detail: 'keyword', info: 'Exports values' },
    { label: 'class', type: 'keyword', detail: 'keyword', info: 'Declares class' },
    { label: 'try', type: 'keyword', detail: 'keyword', info: 'Try block' },
    { label: 'catch', type: 'keyword', detail: 'keyword', info: 'Catch block' },
    { label: 'finally', type: 'keyword', detail: 'keyword', info: 'Finally block' },
    { label: 'throw', type: 'keyword', detail: 'keyword', info: 'Throws an exception' },
    { label: 'typeof', type: 'keyword', detail: 'keyword', info: 'Type operator' },

    snippetCompletion('console.log(${1:item});', {
      label: 'clg',
      detail: 'console.log()',
      type: 'snippet',
      info: 'Logs output to console',
    }),
    snippetCompletion('function ${1:name}(${2:params}) {\n\t${0}\n}', {
      label: 'func',
      detail: 'function name() {}',
      type: 'snippet',
      info: 'Function definition',
    }),
    snippetCompletion('(${1:params}) => {\n\t${0}\n}', {
      label: 'af',
      detail: '() => {}',
      type: 'snippet',
      info: 'Arrow function expression',
    }),
    snippetCompletion('try {\n\t${1}\n} catch (err) {\n\t${0}\n}', {
      label: 'tryc',
      detail: 'try ... catch',
      type: 'snippet',
      info: 'Try-catch block',
    }),
    snippetCompletion('new Promise((resolve, reject) => {\n\t${0}\n});', {
      label: 'prom',
      detail: 'new Promise(...)',
      type: 'snippet',
      info: 'Creates new Promise',
    }),
    snippetCompletion('for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${0}\n}', {
      label: 'for',
      detail: 'for loop',
      type: 'snippet',
      info: 'Indexed for loop',
    }),

    { label: 'console.log', type: 'function', detail: 'console.log(...data)', info: 'Prints to console' },
    { label: 'console.error', type: 'function', detail: 'console.error(...data)', info: 'Prints error to console' },
    { label: 'console.warn', type: 'function', detail: 'console.warn(...data)', info: 'Prints warning to console' },
    { label: 'document.getElementById', type: 'function', detail: 'document.getElementById(id)', info: 'Finds element by ID' },
    { label: 'window.addEventListener', type: 'function', detail: 'addEventListener(event, listener)', info: 'Adds event listener' },
    { label: 'JSON.stringify', type: 'function', detail: 'JSON.stringify(value)', info: 'Converts value to JSON string' },
    { label: 'JSON.parse', type: 'function', detail: 'JSON.parse(text)', info: 'Parses JSON string' },
    { label: 'fetch', type: 'function', detail: 'fetch(url, options)', info: 'Performs network request' },
  ],

  typescript: [
    { label: 'interface', type: 'keyword', detail: 'keyword', info: 'Declares TypeScript interface' },
    { label: 'type', type: 'keyword', detail: 'keyword', info: 'Declares TypeScript type alias' },
    { label: 'enum', type: 'keyword', detail: 'keyword', info: 'Declares enum' },
    { label: 'namespace', type: 'keyword', detail: 'keyword', info: 'Declares namespace' },
    { label: 'implements', type: 'keyword', detail: 'keyword', info: 'Implements interface' },
    { label: 'extends', type: 'keyword', detail: 'keyword', info: 'Extends class or interface' },
    { label: 'as', type: 'keyword', detail: 'keyword', info: 'Type assertion' },
    { label: 'keyof', type: 'keyword', detail: 'keyword', info: 'Keyof type operator' },
    { label: 'readonly', type: 'keyword', detail: 'keyword', info: 'Readonly modifier' },

    snippetCompletion('interface ${1:Name} {\n\t${0}\n}', {
      label: 'interface',
      detail: 'interface Name {}',
      type: 'snippet',
      info: 'TypeScript interface',
    }),
    snippetCompletion('type ${1:Name} = ${0};', {
      label: 'type',
      detail: 'type Name = ...',
      type: 'snippet',
      info: 'TypeScript type alias',
    }),
    snippetCompletion('console.log(${1:item});', {
      label: 'clg',
      detail: 'console.log()',
      type: 'snippet',
      info: 'Logs output to console',
    }),
    snippetCompletion('function ${1:name}(${2:params}): ${3:void} {\n\t${0}\n}', {
      label: 'func',
      detail: 'function name(): void {}',
      type: 'snippet',
      info: 'TypeScript function with return type',
    }),
  ],

  python: [
    { label: 'def', type: 'keyword', detail: 'keyword', info: 'Defines a function' },
    { label: 'class', type: 'keyword', detail: 'keyword', info: 'Defines a class' },
    { label: 'import', type: 'keyword', detail: 'keyword', info: 'Imports modules' },
    { label: 'from', type: 'keyword', detail: 'keyword', info: 'Imports symbols from module' },
    { label: 'return', type: 'keyword', detail: 'keyword', info: 'Returns from function' },
    { label: 'yield', type: 'keyword', detail: 'keyword', info: 'Yields generator value' },
    { label: 'lambda', type: 'keyword', detail: 'keyword', info: 'Anonymous function' },
    { label: 'if', type: 'keyword', detail: 'keyword', info: 'Conditional statement' },
    { label: 'elif', type: 'keyword', detail: 'keyword', info: 'Else-if condition' },
    { label: 'else', type: 'keyword', detail: 'keyword', info: 'Else branch' },
    { label: 'for', type: 'keyword', detail: 'keyword', info: 'For loop' },
    { label: 'while', type: 'keyword', detail: 'keyword', info: 'While loop' },
    { label: 'try', type: 'keyword', detail: 'keyword', info: 'Try block' },
    { label: 'except', type: 'keyword', detail: 'keyword', info: 'Except block' },
    { label: 'finally', type: 'keyword', detail: 'keyword', info: 'Finally block' },
    { label: 'with', type: 'keyword', detail: 'keyword', info: 'Context manager' },
    { label: 'as', type: 'keyword', detail: 'keyword', info: 'Alias or binding' },
    { label: 'async', type: 'keyword', detail: 'keyword', info: 'Async function or loop' },
    { label: 'await', type: 'keyword', detail: 'keyword', info: 'Await coroutine' },
    { label: 'True', type: 'keyword', detail: 'bool', info: 'Boolean True' },
    { label: 'False', type: 'keyword', detail: 'bool', info: 'Boolean False' },
    { label: 'None', type: 'keyword', detail: 'NoneType', info: 'None literal' },

    snippetCompletion('def ${1:name}(${2:params}):\n\t${0}', {
      label: 'def',
      detail: 'def name(params):',
      type: 'snippet',
      info: 'Function definition',
    }),
    snippetCompletion('def ${1:name}(${2:params}):\n\t${0}', {
      label: 'func',
      detail: 'def name(params):',
      type: 'snippet',
      info: 'Function definition shortcut',
    }),
    snippetCompletion('class ${1:ClassName}:\n\tdef __init__(self${2:, args}):\n\t\t${0}', {
      label: 'class',
      detail: 'class ClassName:',
      type: 'snippet',
      info: 'Class definition with __init__',
    }),
    snippetCompletion('if __name__ == "__main__":\n\t${0}', {
      label: 'main',
      detail: 'if __name__ == "__main__":',
      type: 'snippet',
      info: 'Main entry point guard',
    }),
    snippetCompletion('print(${1:item})', {
      label: 'print',
      detail: 'print(item)',
      type: 'function',
      info: 'Prints to standard output',
    }),

    { label: 'len', type: 'function', detail: 'len(s)', info: 'Returns length of object' },
    { label: 'range', type: 'function', detail: 'range(stop)', info: 'Generates range of numbers' },
    { label: 'enumerate', type: 'function', detail: 'enumerate(iterable)', info: 'Returns indexed tuples' },
    { label: 'isinstance', type: 'function', detail: 'isinstance(object, classinfo)', info: 'Checks type' },
  ],

  csharp: [
    { label: 'using', type: 'keyword', detail: 'keyword', info: 'Imports namespace' },
    { label: 'namespace', type: 'keyword', detail: 'keyword', info: 'Declares namespace' },
    { label: 'class', type: 'keyword', detail: 'keyword', info: 'Declares class' },
    { label: 'struct', type: 'keyword', detail: 'keyword', info: 'Declares struct' },
    { label: 'interface', type: 'keyword', detail: 'keyword', info: 'Declares interface' },
    { label: 'public', type: 'keyword', detail: 'keyword', info: 'Public access modifier' },
    { label: 'private', type: 'keyword', detail: 'keyword', info: 'Private access modifier' },
    { label: 'protected', type: 'keyword', detail: 'keyword', info: 'Protected access modifier' },
    { label: 'static', type: 'keyword', detail: 'keyword', info: 'Static modifier' },
    { label: 'void', type: 'keyword', detail: 'keyword', info: 'Void return type' },
    { label: 'string', type: 'keyword', detail: 'type', info: 'String type' },
    { label: 'int', type: 'keyword', detail: 'type', info: '32-bit signed integer' },
    { label: 'bool', type: 'keyword', detail: 'type', info: 'Boolean type' },
    { label: 'var', type: 'keyword', detail: 'keyword', info: 'Implicitly typed variable' },
    { label: 'async', type: 'keyword', detail: 'keyword', info: 'Async method' },
    { label: 'await', type: 'keyword', detail: 'keyword', info: 'Await Task' },

    snippetCompletion('Console.WriteLine(${1});', {
      label: 'cw',
      detail: 'Console.WriteLine()',
      type: 'snippet',
      info: 'Writes line to standard output',
    }),
    snippetCompletion('public ${1:int} ${2:MyProperty} { get; set; }', {
      label: 'prop',
      detail: 'public Type Name { get; set; }',
      type: 'snippet',
      info: 'Auto-implemented property',
    }),
    snippetCompletion('for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++)\n{\n\t${0}\n}', {
      label: 'for',
      detail: 'for loop',
      type: 'snippet',
      info: 'For loop',
    }),
    snippetCompletion('foreach (var ${1:item} in ${2:collection})\n{\n\t${0}\n}', {
      label: 'foreach',
      detail: 'foreach loop',
      type: 'snippet',
      info: 'Foreach loop',
    }),
  ],

  cpp: [
    { label: '#include <iostream>', type: 'keyword', detail: 'preprocessor', info: 'Includes standard IO stream' },
    { label: '#include <vector>', type: 'keyword', detail: 'preprocessor', info: 'Includes std::vector' },
    { label: '#include <string>', type: 'keyword', detail: 'preprocessor', info: 'Includes std::string' },
    snippetCompletion('std::cout << ${1} << std::endl;', {
      label: 'cout',
      detail: 'std::cout << ... << std::endl;',
      type: 'snippet',
      info: 'Outputs to console',
    }),
    snippetCompletion('int main(int argc, char* argv[]) {\n\t${0}\n\treturn 0;\n}', {
      label: 'main',
      detail: 'int main()',
      type: 'snippet',
      info: 'Main entry point for C++',
    }),
  ],

  rust: [
    snippetCompletion('fn ${1:name}(${2:params}) -> ${3:()} {\n\t${0}\n}', {
      label: 'fn',
      detail: 'fn name() -> () {}',
      type: 'snippet',
      info: 'Function definition in Rust',
    }),
    snippetCompletion('println!("${1:format}", ${2});', {
      label: 'println',
      detail: 'println!(...)',
      type: 'snippet',
      info: 'Prints formatted text to stdout',
    }),
    { label: 'let', type: 'keyword', detail: 'keyword', info: 'Variable binding' },
    { label: 'mut', type: 'keyword', detail: 'keyword', info: 'Mutable modifier' },
    { label: 'pub', type: 'keyword', detail: 'keyword', info: 'Public visibility' },
    { label: 'struct', type: 'keyword', detail: 'keyword', info: 'Struct declaration' },
    { label: 'enum', type: 'keyword', detail: 'keyword', info: 'Enum declaration' },
    { label: 'impl', type: 'keyword', detail: 'keyword', info: 'Implementation block' },
    { label: 'match', type: 'keyword', detail: 'keyword', info: 'Pattern matching' },
  ],

  go: [
    snippetCompletion('func ${1:name}(${2:params}) ${3:error} {\n\t${0}\n}', {
      label: 'func',
      detail: 'func name() {}',
      type: 'snippet',
      info: 'Function declaration in Go',
    }),
    snippetCompletion('fmt.Println(${1})', {
      label: 'fp',
      detail: 'fmt.Println()',
      type: 'snippet',
      info: 'Prints line using fmt',
    }),
    snippetCompletion('if err != nil {\n\treturn ${1:err}\n}', {
      label: 'iferr',
      detail: 'if err != nil',
      type: 'snippet',
      info: 'Error check snippet',
    }),
    { label: 'package', type: 'keyword', detail: 'keyword', info: 'Package declaration' },
    { label: 'import', type: 'keyword', detail: 'keyword', info: 'Imports package' },
    { label: 'type', type: 'keyword', detail: 'keyword', info: 'Type definition' },
    { label: 'struct', type: 'keyword', detail: 'keyword', info: 'Struct definition' },
    { label: 'interface', type: 'keyword', detail: 'keyword', info: 'Interface definition' },
    { label: 'go', type: 'keyword', detail: 'keyword', info: 'Starts goroutine' },
    { label: 'defer', type: 'keyword', detail: 'keyword', info: 'Defers execution' },
  ],

  html: [
    snippetCompletion('<div className="${1}">\n\t${0}\n</div>', { label: 'div', type: 'snippet', detail: '<div> tag' }),
    snippetCompletion('<button onClick={${1}}>\n\t${0}\n</button>', { label: 'button', type: 'snippet', detail: '<button> tag' }),
    snippetCompletion('<input type="${1:text}" placeholder="${2}" />', { label: 'input', type: 'snippet', detail: '<input> tag' }),
    snippetCompletion('<span className="${1}">${0}</span>', { label: 'span', type: 'snippet', detail: '<span> tag' }),
  ],

  css: [
    { label: 'display: flex;', type: 'property', detail: 'css', info: 'Flexbox display' },
    { label: 'display: grid;', type: 'property', detail: 'css', info: 'Grid display' },
    { label: 'justify-content: center;', type: 'property', detail: 'css', info: 'Center alignment' },
    { label: 'align-items: center;', type: 'property', detail: 'css', info: 'Center cross-axis alignment' },
    { label: 'background-color:', type: 'property', detail: 'css' },
    { label: 'color:', type: 'property', detail: 'css' },
    { label: 'font-size:', type: 'property', detail: 'css' },
    { label: 'border-radius:', type: 'property', detail: 'css' },
    { label: 'transition:', type: 'property', detail: 'css' },
  ],
};

export function createCustomAutocomplete(language: SupportedLanguage) {
  const langCompletions = LANGUAGE_COMPLETIONS[language] || [];
  const knownLabels = new Set(langCompletions.map((c) => c.label.toLowerCase()));

  return function customAutocompleteSource(context: CompletionContext): CompletionResult | null {
    const word = context.matchBefore(/[a-zA-Z_#$@][\w$-]*/);
    if (!word && !context.explicit) return null;

    const from = word ? word.from : context.pos;
    const to = word ? word.to : context.pos;
    const currentPrefix = word ? word.text.toLowerCase() : '';

    const docText = context.state.doc.toString();
    const docWords = new Set<string>();
    const docWordRegex = /\b[a-zA-Z_]\w{2,}\b/g;
    let m: RegExpExecArray | null;

    const scanChunk = docText.slice(0, 25000);
    while ((m = docWordRegex.exec(scanChunk)) !== null) {
      const matchStart = m.index;
      const matchEnd = m.index + m[0].length;

      if (matchStart <= to && matchEnd >= from) {
        continue;
      }
      if (m[0].toLowerCase() === currentPrefix) {
        continue;
      }
      if (knownLabels.has(m[0].toLowerCase())) {
        continue;
      }

      docWords.add(m[0]);
    }

    const documentCompletions: Completion[] = Array.from(docWords)
      .slice(0, 80)
      .map((w) => ({
        label: w,
        type: 'variable',
        detail: 'identifier',
        boost: 5,
      }));

    return {
      from,
      options: [...langCompletions, ...documentCompletions],
      validFor: /^[\w$-]*$/,
    };
  };
}
