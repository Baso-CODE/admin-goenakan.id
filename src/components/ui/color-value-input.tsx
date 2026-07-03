import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  parseColorValue,
  cmykToRgb,
  cmykToHex,
  hexToCmyk,
} from "@/utils/colorConverter";

export interface ColorValueInputProps {
  value: string;
  onChange: (val: string) => void;
}

export function ColorValueInput({ value, onChange }: ColorValueInputProps) {
  const { name, hex, cmyk } = parseColorValue(value);

  const updateColor = (newName: string, newCmyk: { c: number; m: number; y: number; k: number }) => {
    const computedHex = cmykToHex(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
    onChange(`${newName}|${computedHex}|cmyk(${newCmyk.c},${newCmyk.m},${newCmyk.y},${newCmyk.k})`);
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-stone-50 border border-stone-200 rounded-md w-full">
      {/* Defined Color Name */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Color Name (Optional)</label>
        <Input
          placeholder="e.g. Navy Blue, Emerald Green"
          value={name}
          onChange={(e) => updateColor(e.target.value, cmyk)}
          className="h-8 text-xs bg-white focus-visible:ring-stone-500 text-slate-800"
        />
      </div>

      {/* CMYK Form Inputs */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex justify-between">
          <span>CMYK Color Code (Mandatory)</span>
          <span className="text-stone-400 font-normal">0 - 100%</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {/* Cyan */}
          <div className="flex items-center gap-1 border border-stone-200 rounded bg-white px-1.5 h-8">
            <span className="text-[10px] font-extrabold text-cyan-600">C</span>
            <input
              type="number"
              min="0"
              max="100"
              value={cmyk.c}
              onChange={(e) => {
                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                updateColor(name, { ...cmyk, c: val });
              }}
              className="w-full text-xs text-right outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono text-slate-800"
            />
          </div>
          {/* Magenta */}
          <div className="flex items-center gap-1 border border-stone-200 rounded bg-white px-1.5 h-8">
            <span className="text-[10px] font-extrabold text-pink-600">M</span>
            <input
              type="number"
              min="0"
              max="100"
              value={cmyk.m}
              onChange={(e) => {
                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                updateColor(name, { ...cmyk, m: val });
              }}
              className="w-full text-xs text-right outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono text-slate-800"
            />
          </div>
          {/* Yellow */}
          <div className="flex items-center gap-1 border border-stone-200 rounded bg-white px-1.5 h-8">
            <span className="text-[10px] font-extrabold text-amber-500">Y</span>
            <input
              type="number"
              min="0"
              max="100"
              value={cmyk.y}
              onChange={(e) => {
                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                updateColor(name, { ...cmyk, y: val });
              }}
              className="w-full text-xs text-right outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono text-slate-800"
            />
          </div>
          {/* Key (Black) */}
          <div className="flex items-center gap-1 border border-stone-200 rounded bg-white px-1.5 h-8">
            <span className="text-[10px] font-extrabold text-slate-800">K</span>
            <input
              type="number"
              min="0"
              max="100"
              value={cmyk.k}
              onChange={(e) => {
                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                updateColor(name, { ...cmyk, k: val });
              }}
              className="w-full text-xs text-right outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Hex and RGB Previews */}
      <div className="flex items-center justify-between gap-4 mt-1 pt-2 border-t border-stone-200">
        <div className="flex items-center gap-2">
          {/* Swatch Preview / Color Picker overlay */}
          <div className="relative w-8 h-8 rounded-full border border-stone-300 shadow-inner shrink-0 cursor-pointer overflow-hidden hover:scale-105 transition-transform duration-150">
            <input
              type="color"
              value={hex}
              onChange={(e) => {
                const newHex = e.target.value;
                const newCmyk = hexToCmyk(newHex);
                updateColor(name, newCmyk);
              }}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer scale-150"
              title="Click to pick color visually"
            />
            <div
              className="w-full h-full"
              style={{ backgroundColor: hex }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold font-mono text-slate-700">{hex.toUpperCase()}</span>
            <span className="text-[10px] text-slate-450 font-mono">
              RGB({cmykToRgb(cmyk.c, cmyk.m, cmyk.y, cmyk.k).r}, {cmykToRgb(cmyk.c, cmyk.m, cmyk.y, cmyk.k).g}, {cmykToRgb(cmyk.c, cmyk.m, cmyk.y, cmyk.k).b})
            </span>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 font-sans select-none italic shrink-0">
          💡 Click swatch to pick color
        </span>
      </div>
    </div>
  );
}
