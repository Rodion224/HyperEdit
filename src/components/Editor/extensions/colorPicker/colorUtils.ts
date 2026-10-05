export interface ParsedColor {
  r: number;
  g: number;
  b: number;
  a: number;
  format: 'hex' | 'rgb' | 'hsl';
  originalHasAlpha: boolean;
}

export const HEX_COLOR_REGEX = /(?<![0-9a-zA-Z])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g;
export const RGB_COLOR_REGEX = /\brgba?\([^)]*\)/gi;
export const HSL_COLOR_REGEX = /\bhsla?\([^)]*\)/gi;

export function parseColor(input: string): ParsedColor | null {
  const str = input.trim();

  if (str.startsWith('#')) {
    const raw = str.slice(1);
    let r = 0, g = 0, b = 0, a = 1;
    let hasAlpha = false;

    if (raw.length === 3) {
      r = parseInt(raw[0] + raw[0], 16);
      g = parseInt(raw[1] + raw[1], 16);
      b = parseInt(raw[2] + raw[2], 16);
    } else if (raw.length === 4) {
      r = parseInt(raw[0] + raw[0], 16);
      g = parseInt(raw[1] + raw[1], 16);
      b = parseInt(raw[2] + raw[2], 16);
      a = Math.round((parseInt(raw[3] + raw[3], 16) / 255) * 100) / 100;
      hasAlpha = true;
    } else if (raw.length === 6) {
      r = parseInt(raw.slice(0, 2), 16);
      g = parseInt(raw.slice(2, 4), 16);
      b = parseInt(raw.slice(4, 6), 16);
    } else if (raw.length === 8) {
      r = parseInt(raw.slice(0, 2), 16);
      g = parseInt(raw.slice(2, 4), 16);
      b = parseInt(raw.slice(4, 6), 16);
      a = Math.round((parseInt(raw.slice(6, 8), 16) / 255) * 100) / 100;
      hasAlpha = true;
    } else {
      return null;
    }

    if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) return null;

    return {
      r: clamp(r, 0, 255),
      g: clamp(g, 0, 255),
      b: clamp(b, 0, 255),
      a: clamp(a, 0, 1),
      format: 'hex',
      originalHasAlpha: hasAlpha,
    };
  }

  if (str.toLowerCase().startsWith('rgb')) {
    const isRgba = str.toLowerCase().startsWith('rgba');
    const openIdx = str.indexOf('(');
    const closeIdx = str.lastIndexOf(')');
    const content = openIdx !== -1 && closeIdx > openIdx
      ? str.substring(openIdx + 1, closeIdx).trim()
      : '';

    if (content.includes('var(') || content.includes('$')) {
      return null;
    }

    if (content === '') {
      return {
        r: 0,
        g: 0,
        b: 0,
        a: 1,
        format: 'rgb',
        originalHasAlpha: isRgba,
      };
    }

    let parts: string[] = [];
    if (content.includes(',')) {
      parts = content.split(',').map((p) => p.trim()).filter(Boolean);
    } else if (content.includes('/')) {
      const [rgbPart, aPart] = content.split('/').map((p) => p.trim());
      parts = [...rgbPart.split(/\s+/).map((p) => p.trim()).filter(Boolean), aPart];
    } else {
      parts = content.split(/\s+/).map((p) => p.trim()).filter(Boolean);
    }

    const parseComponent = (val: string | undefined, max: number, defaultVal = 0): number => {
      if (!val) return defaultVal;
      if (val.endsWith('%')) {
        return Math.round((parseFloat(val) / 100) * max);
      }
      const num = parseFloat(val);
      return isNaN(num) ? defaultVal : num;
    };

    const r = parseComponent(parts[0], 255, 0);
    const g = parseComponent(parts[1], 255, 0);
    const b = parseComponent(parts[2], 255, 0);

    let a = 1;
    let hasAlpha = isRgba || parts.length >= 4;
    if (parts.length >= 4 && parts[3]) {
      const alphaVal = parts[3];
      if (alphaVal.endsWith('%')) {
        a = parseFloat(alphaVal) / 100;
      } else {
        const num = parseFloat(alphaVal);
        a = isNaN(num) ? 1 : num;
      }
    }

    return {
      r: clamp(Math.round(r), 0, 255),
      g: clamp(Math.round(g), 0, 255),
      b: clamp(Math.round(b), 0, 255),
      a: clamp(Math.round(a * 100) / 100, 0, 1),
      format: 'rgb',
      originalHasAlpha: hasAlpha,
    };
  }

  if (str.toLowerCase().startsWith('hsl')) {
    const isHsla = str.toLowerCase().startsWith('hsla');
    const openIdx = str.indexOf('(');
    const closeIdx = str.lastIndexOf(')');
    const content = openIdx !== -1 && closeIdx > openIdx
      ? str.substring(openIdx + 1, closeIdx).trim()
      : '';

    if (content.includes('var(') || content.includes('$')) {
      return null;
    }

    if (content === '') {
      return {
        r: 0,
        g: 0,
        b: 0,
        a: 1,
        format: 'hsl',
        originalHasAlpha: isHsla,
      };
    }

    let parts: string[] = [];
    if (content.includes(',')) {
      parts = content.split(',').map((p) => p.trim()).filter(Boolean);
    } else if (content.includes('/')) {
      const [hslPart, aPart] = content.split('/').map((p) => p.trim());
      parts = [...hslPart.split(/\s+/).map((p) => p.trim()).filter(Boolean), aPart];
    } else {
      parts = content.split(/\s+/).map((p) => p.trim()).filter(Boolean);
    }

    let h = 0;
    if (parts[0]) {
      const hRaw = parts[0].toLowerCase();
      if (hRaw.endsWith('deg')) h = parseFloat(hRaw);
      else if (hRaw.endsWith('rad')) h = (parseFloat(hRaw) * 180) / Math.PI;
      else if (hRaw.endsWith('turn')) h = parseFloat(hRaw) * 360;
      else {
        const num = parseFloat(hRaw);
        h = isNaN(num) ? 0 : num;
      }
    }

    const s = parts[1] ? parseFloat(parts[1]) : 0;
    const l = parts[2] ? parseFloat(parts[2]) : 0;

    let a = 1;
    let hasAlpha = isHsla || parts.length >= 4;
    if (parts.length >= 4 && parts[3]) {
      const alphaVal = parts[3];
      a = alphaVal.endsWith('%') ? parseFloat(alphaVal) / 100 : parseFloat(alphaVal);
      if (isNaN(a)) a = 1;
    }

    const safeH = isNaN(h) ? 0 : h;
    const safeS = isNaN(s) ? 0 : s;
    const safeL = isNaN(l) ? 0 : l;

    const rgb = hslToRgb(safeH, safeS, safeL);
    return {
      ...rgb,
      a: clamp(Math.round(a * 100) / 100, 0, 1),
      format: 'hsl',
      originalHasAlpha: hasAlpha,
    };
  }

  return null;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function colorToCssString(r: number, g: number, b: number, a: number): string {
  if (a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

export function rgbToHex(r: number, g: number, b: number, a = 1, includeAlpha = false): string {
  const hexR = clamp(Math.round(r), 0, 255).toString(16).padStart(2, '0');
  const hexG = clamp(Math.round(g), 0, 255).toString(16).padStart(2, '0');
  const hexB = clamp(Math.round(b), 0, 255).toString(16).padStart(2, '0');

  if (includeAlpha || a < 1) {
    const hexA = clamp(Math.round(a * 255), 0, 255).toString(16).padStart(2, '0');
    return `#${hexR}${hexG}${hexB}${hexA}`;
  }
  return `#${hexR}${hexG}${hexB}`;
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h = (((h % 360) + 360) % 360) / 60;
  s = clamp(s, 0, 100) / 100;
  v = clamp(v, 0, 100) / 100;

  const i = Math.floor(h);
  const f = h - i;
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));

  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return {
    r: clamp(Math.round(r * 255), 0, 255),
    g: clamp(Math.round(g * 255), 0, 255),
    b: clamp(Math.round(b * 255), 0, 255),
  };
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = (((h % 360) + 360) % 360) / 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return {
    r: clamp(r, 0, 255),
    g: clamp(g, 0, 255),
    b: clamp(b, 0, 255),
  };
}

export function formatColor(
  color: { r: number; g: number; b: number; a: number },
  format: 'hex' | 'rgb' | 'hsl',
  originalHasAlpha = false
): string {
  const hasAlpha = color.a < 1;

  if (format === 'hex') {
    return rgbToHex(color.r, color.g, color.b, color.a, hasAlpha);
  }

  if (format === 'rgb') {
    if (hasAlpha) {
      return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
    }
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }

  if (format === 'hsl') {
    const { h, s, l } = rgbToHsl(color.r, color.g, color.b);
    if (hasAlpha) {
      return `hsla(${h}, ${s}%, ${l}%, ${color.a})`;
    }
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  return rgbToHex(color.r, color.g, color.b, color.a, hasAlpha);
}
