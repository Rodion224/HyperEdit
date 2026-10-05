import {
  WidgetType,
  EditorView,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { Extension, Range } from '@codemirror/state';
import {
  HEX_COLOR_REGEX,
  RGB_COLOR_REGEX,
  HSL_COLOR_REGEX,
  parseColor,
  ParsedColor,
  colorToCssString,
} from './colorUtils';

export type OnColorSwatchClick = (
  from: number,
  to: number,
  colorText: string,
  rect: DOMRect
) => void;

class ColorSwatchWidget extends WidgetType {
  constructor(
    readonly colorText: string,
    readonly parsedColor: ParsedColor,
    readonly from: number,
    readonly to: number,
    readonly onClick: OnColorSwatchClick
  ) {
    super();
  }

  eq(other: ColorSwatchWidget): boolean {
    return (
      this.colorText === other.colorText &&
      this.from === other.from &&
      this.to === other.to &&
      this.parsedColor.r === other.parsedColor.r &&
      this.parsedColor.g === other.parsedColor.g &&
      this.parsedColor.b === other.parsedColor.b &&
      this.parsedColor.a === other.parsedColor.a
    );
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-color-swatch-wrapper';
    span.style.display = 'inline-block';
    span.style.verticalAlign = 'middle';
    span.style.lineHeight = '0';
    span.style.userSelect = 'none';

    const swatch = document.createElement('span');
    swatch.className = 'cm-color-swatch';
    swatch.title = `${this.colorText} (Click to open color picker)`;
    swatch.setAttribute('role', 'button');
    swatch.setAttribute('tabindex', '-1');

    swatch.style.display = 'inline-block';
    swatch.style.width = '10px';
    swatch.style.height = '10px';
    swatch.style.margin = '0 3px 0 1px';
    swatch.style.verticalAlign = 'middle';
    swatch.style.cursor = 'pointer';
    swatch.style.border = '1px solid rgba(128, 128, 128, 0.5)';
    swatch.style.borderRadius = '2px';
    swatch.style.boxSizing = 'border-box';
    swatch.style.boxShadow = '0 0 1px rgba(0, 0, 0, 0.4)';
    swatch.style.transition = 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.15s ease, box-shadow 0.15s ease';

    const cssColor = colorToCssString(
      this.parsedColor.r,
      this.parsedColor.g,
      this.parsedColor.b,
      this.parsedColor.a
    );

    swatch.style.background = `linear-gradient(${cssColor}, ${cssColor}), repeating-conic-gradient(#808080 0% 25%, #ffffff 0% 50%) 50% / 6px 6px`;

    swatch.onmouseenter = () => {
      swatch.style.transform = 'scale(1.25)';
      swatch.style.borderColor = 'rgba(255, 255, 255, 0.9)';
      swatch.style.boxShadow = '0 0 6px rgba(0, 0, 0, 0.6)';
    };

    swatch.onmouseleave = () => {
      swatch.style.transform = 'scale(1)';
      swatch.style.borderColor = 'rgba(128, 128, 128, 0.5)';
      swatch.style.boxShadow = '0 0 1px rgba(0, 0, 0, 0.4)';
    };

    swatch.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = swatch.getBoundingClientRect();
      this.onClick(this.from, this.to, this.colorText, rect);
    });

    swatch.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    span.appendChild(swatch);
    return span;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

function buildColorDecorations(
  view: EditorView,
  onClick: OnColorSwatchClick
): DecorationSet {
  const decorations: Range<Decoration>[] = [];

  for (const { from, to } of view.visibleRanges) {
    const startLine = view.state.doc.lineAt(from);
    const endLine = view.state.doc.lineAt(to);

    for (let l = startLine.number; l <= endLine.number; l++) {
      const line = view.state.doc.line(l);
      const text = line.text;

      HEX_COLOR_REGEX.lastIndex = 0;
      let hexMatch: RegExpExecArray | null;
      while ((hexMatch = HEX_COLOR_REGEX.exec(text)) !== null) {
        const colorStr = hexMatch[0];
        const matchFrom = line.from + hexMatch.index;
        const matchTo = matchFrom + colorStr.length;
        const parsed = parseColor(colorStr);
        if (parsed) {
          decorations.push(
            Decoration.widget({
              widget: new ColorSwatchWidget(colorStr, parsed, matchFrom, matchTo, onClick),
              side: -1,
            }).range(matchFrom)
          );
        }
      }

      RGB_COLOR_REGEX.lastIndex = 0;
      let rgbMatch: RegExpExecArray | null;
      while ((rgbMatch = RGB_COLOR_REGEX.exec(text)) !== null) {
        const colorStr = rgbMatch[0];
        const matchFrom = line.from + rgbMatch.index;
        const matchTo = matchFrom + colorStr.length;
        const parsed = parseColor(colorStr);
        if (parsed) {
          decorations.push(
            Decoration.widget({
              widget: new ColorSwatchWidget(colorStr, parsed, matchFrom, matchTo, onClick),
              side: -1,
            }).range(matchFrom)
          );
        }
      }

      HSL_COLOR_REGEX.lastIndex = 0;
      let hslMatch: RegExpExecArray | null;
      while ((hslMatch = HSL_COLOR_REGEX.exec(text)) !== null) {
        const colorStr = hslMatch[0];
        const matchFrom = line.from + hslMatch.index;
        const matchTo = matchFrom + colorStr.length;
        const parsed = parseColor(colorStr);
        if (parsed) {
          decorations.push(
            Decoration.widget({
              widget: new ColorSwatchWidget(colorStr, parsed, matchFrom, matchTo, onClick),
              side: -1,
            }).range(matchFrom)
          );
        }
      }
    }
  }

  decorations.sort((a, b) => a.from - b.from);
  return Decoration.set(decorations, true);
}

export function createColorDecoratorsExtension(onClick: OnColorSwatchClick): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildColorDecorations(view, onClick);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.geometryChanged
        ) {
          this.decorations = buildColorDecorations(update.view, onClick);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}
