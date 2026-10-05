import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pipette, X, RefreshCw } from 'lucide-react';
import {
  ParsedColor,
  clamp,
  hsvToRgb,
  rgbToHsv,
  rgbToHsl,
  hslToRgb,
  formatColor,
  colorToCssString,
  parseColor,
} from './colorUtils';

export interface ColorPickerPopupProps {
  x: number;
  y: number;
  initialColorText: string;
  onColorChange: (newColorText: string) => void;
  onClose: () => void;
}

const PRESET_PALETTE = [
  '#000000',
  '#ffffff',
  '#64748b',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

export const ColorPickerPopup: React.FC<ColorPickerPopupProps> = ({
  x,
  y,
  initialColorText,
  onColorChange,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spectrumRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);
  const alphaSliderRef = useRef<HTMLDivElement>(null);

  const initialParsed = parseColor(initialColorText) || {
    r: 59,
    g: 130,
    b: 246,
    a: 1,
    format: 'hex',
    originalHasAlpha: false,
  };

  const [format, setFormat] = useState<'hex' | 'rgb' | 'hsl'>(initialParsed.format);
  const formatRef = useRef<'hex' | 'rgb' | 'hsl'>(initialParsed.format);
  const originalHasAlpha = useRef(initialParsed.originalHasAlpha).current;

  const initialHsv = rgbToHsv(initialParsed.r, initialParsed.g, initialParsed.b);
  const [hsv, setHsv] = useState({ h: initialHsv.h, s: initialHsv.s, v: initialHsv.v });
  const hsvRef = useRef({ h: initialHsv.h, s: initialHsv.s, v: initialHsv.v });
  const [alpha, setAlpha] = useState(initialParsed.a);
  const alphaRef = useRef(initialParsed.a);

  const [position, setPosition] = useState({ x, y });

  const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width || 250;
      const height = rect.height || 330;

      let adjustedX = x;
      let adjustedY = y;

      if (x + width > window.innerWidth - 12) {
        adjustedX = Math.max(12, window.innerWidth - width - 12);
      }
      if (y + height > window.innerHeight - 12) {
        adjustedY = Math.max(12, y - height - 24);
      }

      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('blur', onClose);
    window.addEventListener('resize', onClose);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('blur', onClose);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  const notifyChange = useCallback(
    (rgb: { r: number; g: number; b: number }, a: number, fmt = formatRef.current) => {
      const formatted = formatColor(
        { r: rgb.r, g: rgb.g, b: rgb.b, a },
        fmt,
        originalHasAlpha
      );
      onColorChange(formatted);
    },
    [onColorChange, originalHasAlpha]
  );

  const handleSpectrumMove = useCallback(
    (e: MouseEvent) => {
      if (!spectrumRef.current) return;
      const rect = spectrumRef.current.getBoundingClientRect();
      const s = clamp(Math.round(((e.clientX - rect.left) / rect.width) * 100), 0, 100);
      const v = clamp(Math.round((1 - (e.clientY - rect.top) / rect.height) * 100), 0, 100);

      const nextHsv = { ...hsvRef.current, s, v };
      hsvRef.current = nextHsv;
      setHsv(nextHsv);

      const rgb = hsvToRgb(nextHsv.h, nextHsv.s, nextHsv.v);
      notifyChange(rgb, alphaRef.current);
    },
    [notifyChange]
  );

  const startSpectrumDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSpectrumMove(e.nativeEvent);

    const onMouseMove = (ev: MouseEvent) => handleSpectrumMove(ev);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleHueMove = useCallback(
    (e: MouseEvent) => {
      if (!hueSliderRef.current) return;
      const rect = hueSliderRef.current.getBoundingClientRect();
      const h = clamp(Math.round(((e.clientX - rect.left) / rect.width) * 360), 0, 360);

      const nextHsv = { ...hsvRef.current, h };
      hsvRef.current = nextHsv;
      setHsv(nextHsv);

      const rgb = hsvToRgb(nextHsv.h, nextHsv.s, nextHsv.v);
      notifyChange(rgb, alphaRef.current);
    },
    [notifyChange]
  );

  const startHueDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    handleHueMove(e.nativeEvent);

    const onMouseMove = (ev: MouseEvent) => handleHueMove(ev);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleAlphaMove = useCallback(
    (e: MouseEvent) => {
      if (!alphaSliderRef.current) return;
      const rect = alphaSliderRef.current.getBoundingClientRect();
      const a = clamp(
        Math.round(((e.clientX - rect.left) / rect.width) * 100) / 100,
        0,
        1
      );

      alphaRef.current = a;
      setAlpha(a);

      const rgb = hsvToRgb(hsvRef.current.h, hsvRef.current.s, hsvRef.current.v);
      notifyChange(rgb, a);
    },
    [notifyChange]
  );

  const startAlphaDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    handleAlphaMove(e.nativeEvent);

    const onMouseMove = (ev: MouseEvent) => handleAlphaMove(ev);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          const parsed = parseColor(result.sRGBHex);
          if (parsed) {
            const nextHsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
            hsvRef.current = nextHsv;
            alphaRef.current = 1;
            setHsv(nextHsv);
            setAlpha(1);
            notifyChange({ r: parsed.r, g: parsed.g, b: parsed.b }, 1);
          }
        }
      } catch (e) {}
    }
  };

  const handlePresetClick = (hexStr: string) => {
    const parsed = parseColor(hexStr);
    if (!parsed) return;
    const nextHsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
    hsvRef.current = nextHsv;
    alphaRef.current = 1;
    setHsv(nextHsv);
    setAlpha(1);
    notifyChange({ r: parsed.r, g: parsed.g, b: parsed.b }, 1);
  };

  const cycleFormat = () => {
    const nextFormat = format === 'hex' ? 'rgb' : format === 'rgb' ? 'hsl' : 'hex';
    formatRef.current = nextFormat;
    setFormat(nextFormat);
    notifyChange(currentRgb, alpha, nextFormat);
  };

  const hsl = rgbToHsl(currentRgb.r, currentRgb.g, currentRgb.b);
  const cssColor = colorToCssString(currentRgb.r, currentRgb.g, currentRgb.b, alpha);
  const hueColor = `hsl(${hsv.h}, 100%, 50%)`;

  return (
    <div
      ref={containerRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className="fixed z-[9999] w-[248px] bg-editor-sidebar border border-editor-border text-editor-text rounded-lg shadow-2xl shadow-black/80 p-2.5 font-sans select-none animate-smooth-pop"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-editor-border relative overflow-hidden shadow-inner flex-shrink-0"
            style={{
              background: `linear-gradient(${cssColor}, ${cssColor}), repeating-conic-gradient(#808080 0% 25%, #ffffff 0% 50%) 50% / 6px 6px`,
            }}
          />
          <span className="text-[11px] font-mono font-medium truncate max-w-[120px] text-editor-text">
            {formatColor(
              { r: currentRgb.r, g: currentRgb.g, b: currentRgb.b, a: alpha },
              format,
              originalHasAlpha
            )}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {'EyeDropper' in window && (
            <button
              onClick={handleEyeDropper}
              title="Pick color from screen"
              className="p-1 rounded text-editor-muted hover:text-editor-text hover:bg-editor-tabActive active:scale-90 transition-all"
            >
              <Pipette size={13} />
            </button>
          )}

          <button
            onClick={onClose}
            title="Close"
            className="p-1 rounded text-editor-muted hover:text-red-400 hover:bg-editor-tabActive active:scale-90 transition-all"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div
        ref={spectrumRef}
        onMouseDown={startSpectrumDrag}
        className="w-full h-28 rounded relative cursor-crosshair overflow-hidden border border-editor-border/50 mb-2.5 shadow-inner"
        style={{
          backgroundColor: hueColor,
          backgroundImage: `
            linear-gradient(to top, #000000, transparent),
            linear-gradient(to right, #ffffff, transparent)
          `,
        }}
      >
        <div
          className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_2px_rgba(0,0,0,0.8)] absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            backgroundColor: cssColor,
          }}
        />
      </div>

      <div className="mb-2">
        <div
          ref={hueSliderRef}
          onMouseDown={startHueDrag}
          className="w-full h-2.5 rounded-full relative cursor-pointer border border-editor-border/40 shadow-inner"
          style={{
            background:
              'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
          }}
        >
          <div
            className="w-3.5 h-3.5 rounded-full bg-white border border-gray-400 shadow absolute top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${(hsv.h / 360) * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-2.5">
        <div
          ref={alphaSliderRef}
          onMouseDown={startAlphaDrag}
          className="w-full h-2.5 rounded-full relative cursor-pointer border border-editor-border/40 shadow-inner overflow-hidden"
          style={{
            background: `
              linear-gradient(to right, transparent, rgb(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b})),
              repeating-conic-gradient(#808080 0% 25%, #ffffff 0% 50%) 50% / 6px 6px
            `,
          }}
        >
          <div
            className="w-3.5 h-3.5 rounded-full bg-white border border-gray-400 shadow absolute top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${alpha * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-2.5">
        <button
          onClick={cycleFormat}
          title="Switch Color Format (HEX / RGB / HSL)"
          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-editor-tabActive text-editor-muted hover:text-editor-text hover:bg-editor-border flex items-center gap-1 transition-all"
        >
          <span>{format.toUpperCase()}</span>
          <RefreshCw size={10} />
        </button>

        {format === 'hex' && (
          <input
            type="text"
            value={formatColor(
              { r: currentRgb.r, g: currentRgb.g, b: currentRgb.b, a: alpha },
              'hex',
              originalHasAlpha
            )}
            onChange={(e) => {
              const val = e.target.value.trim();
              const parsed = parseColor(val);
              if (parsed) {
                const nextHsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
                setHsv(nextHsv);
                setAlpha(parsed.a);
                notifyChange({ r: parsed.r, g: parsed.g, b: parsed.b }, parsed.a);
              }
            }}
            className="flex-1 bg-editor-bg border border-editor-border rounded px-1.5 py-0.5 text-[11px] font-mono text-editor-text outline-none focus:border-editor-accent text-center"
          />
        )}

        {format === 'rgb' && (
          <div className="flex-1 grid grid-cols-4 gap-1 text-[11px] font-mono">
            {['R', 'G', 'B', 'A'].map((label, idx) => {
              const val =
                idx === 0
                  ? currentRgb.r
                  : idx === 1
                  ? currentRgb.g
                  : idx === 2
                  ? currentRgb.b
                  : alpha;

              return (
                <div key={label} className="flex flex-col items-center">
                  <input
                    type="number"
                    min={0}
                    max={idx === 3 ? 1 : 255}
                    step={idx === 3 ? 0.05 : 1}
                    value={val}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      if (isNaN(num)) return;
                      const r = idx === 0 ? clamp(num, 0, 255) : currentRgb.r;
                      const g = idx === 1 ? clamp(num, 0, 255) : currentRgb.g;
                      const b = idx === 2 ? clamp(num, 0, 255) : currentRgb.b;
                      const a = idx === 3 ? clamp(num, 0, 1) : alpha;

                      const nextHsv = rgbToHsv(r, g, b);
                      setHsv(nextHsv);
                      setAlpha(a);
                      notifyChange({ r, g, b }, a);
                    }}
                    className="w-full bg-editor-bg border border-editor-border rounded px-0.5 py-0.5 text-center text-editor-text outline-none focus:border-editor-accent text-[10px]"
                  />
                  <span className="text-[9px] text-editor-muted">{label}</span>
                </div>
              );
            })}
          </div>
        )}

        {format === 'hsl' && (
          <div className="flex-1 grid grid-cols-4 gap-1 text-[11px] font-mono">
            {['H', 'S', 'L', 'A'].map((label, idx) => {
              const val =
                idx === 0 ? hsl.h : idx === 1 ? hsl.s : idx === 2 ? hsl.l : alpha;

              return (
                <div key={label} className="flex flex-col items-center">
                  <input
                    type="number"
                    min={0}
                    max={idx === 0 ? 360 : idx === 3 ? 1 : 100}
                    step={idx === 3 ? 0.05 : 1}
                    value={val}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      if (isNaN(num)) return;
                      const h = idx === 0 ? clamp(num, 0, 360) : hsl.h;
                      const s = idx === 1 ? clamp(num, 0, 100) : hsl.s;
                      const l = idx === 2 ? clamp(num, 0, 100) : hsl.l;
                      const a = idx === 3 ? clamp(num, 0, 1) : alpha;

                      const nextRgb = hslToRgb(h, s, l);
                      const nextHsv = rgbToHsv(nextRgb.r, nextRgb.g, nextRgb.b);
                      setHsv(nextHsv);
                      setAlpha(a);
                      notifyChange(nextRgb, a);
                    }}
                    className="w-full bg-editor-bg border border-editor-border rounded px-0.5 py-0.5 text-center text-editor-text outline-none focus:border-editor-accent text-[10px]"
                  />
                  <span className="text-[9px] text-editor-muted">{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-editor-border/60">
        <div className="flex items-center justify-between gap-1">
          {PRESET_PALETTE.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetClick(preset)}
              title={preset}
              style={{ backgroundColor: preset }}
              className="w-4 h-4 rounded border border-editor-border hover:scale-125 active:scale-95 transition-all duration-150 shadow-sm"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
