"use client";

import React, { useRef, useState, useEffect } from "react";
import { Plus, Trash2, Layers, Tag, Ruler, Loader2 } from "lucide-react";

export interface MockupArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  description?: string;
  physicalWidth?: number | null;
  physicalHeight?: number | null;
  unit?: "cm" | "mm";
}

interface MockupAreaSelectorProps {
  imageUrl: string;
  areas: MockupArea[];
  onChange: (areas: MockupArea[]) => void;
}

export function MockupAreaSelector({ imageUrl, areas = [], onChange }: MockupAreaSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<"drag" | "resize" | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, areaX: 0, areaY: 0, areaW: 0, areaH: 0 });

  // Auto-select the first area if available and none selected yet
  useEffect(() => {
    if (areas.length > 0 && !selectedId) {
      setSelectedId(areas[0].id);
    } else if (areas.length === 0) {
      setSelectedId(null);
    }
  }, [areas, selectedId]);

  // Keyboard controls for adjustment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId || areas.length === 0) return;
      const area = areas.find((a) => a.id === selectedId);
      if (!area) return;

      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      const step = e.shiftKey ? 5.0 : 1.0;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const nextX = Math.max(0, area.x - step);
        handleUpdateField(area.id, "x", nextX);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextX = Math.max(0, Math.min(area.x + step, 100 - area.width));
        handleUpdateField(area.id, "x", nextX);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const nextY = Math.max(0, area.y - step);
        handleUpdateField(area.id, "y", nextY);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextY = Math.max(0, Math.min(area.y + step, 100 - area.height));
        handleUpdateField(area.id, "y", nextY);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedId, areas]);

  const handleAddArea = () => {
    const newId = `temp_${Date.now()}`;
    const newArea: MockupArea = {
      id: newId,
      x: 25,
      y: 25,
      width: 50,
      height: 50,
      label: `Mockup Area ${areas.length + 1}`,
      description: "",
      physicalWidth: null,
      physicalHeight: null,
      unit: "cm",
    };
    const updated = [...areas, newArea];
    onChange(updated);
    setSelectedId(newId);
  };

  const handleDeleteArea = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = areas.filter((a) => a.id !== id);
    onChange(updated);
    if (selectedId === id) {
      setSelectedId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleUpdateField = (id: string, field: keyof MockupArea, val: string | number | null) => {
    const updated = areas.map((a) => {
      if (a.id === id) {
        return { ...a, [field]: val };
      }
      return a;
    });
    onChange(updated);
  };

  const handlePointerDown = (e: React.PointerEvent, id: string, action: "drag" | "resize") => {
    e.stopPropagation();
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    setSelectedId(id);
    const targetArea = areas.find((a) => a.id === id);
    if (!targetArea) return;

    container.setPointerCapture(e.pointerId);
    setActiveAction(action);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      areaX: targetArea.x,
      areaY: targetArea.y,
      areaW: targetArea.width,
      areaH: targetArea.height,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeAction || !selectedId || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    const updated = areas.map((area) => {
      if (area.id === selectedId) {
        if (activeAction === "drag") {
          let nextX = Math.max(0, Math.min(dragStart.areaX + deltaX, 100 - area.width));
          let nextY = Math.max(0, Math.min(dragStart.areaY + deltaY, 100 - area.height));
          return { ...area, x: nextX, y: nextY };
        } else if (activeAction === "resize") {
          let nextWidth = Math.max(5, Math.min(dragStart.areaW + deltaX, 100 - area.x));
          let nextHeight = Math.max(5, Math.min(dragStart.areaH + deltaY, 100 - area.y));
          return { ...area, width: nextWidth, height: nextHeight };
        }
      }
      return area;
    });

    onChange(updated);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setActiveAction(null);
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const activeArea = areas.find((a) => a.id === selectedId);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full items-start bg-white dark:bg-stone-900 rounded-xl p-4 border border-stone-200 dark:border-stone-800 shadow-sm">
      {/* Kiri: Area Visual Canvas */}
      <div className="flex flex-col items-center gap-3 w-full lg:max-w-md">
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full aspect-square bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden select-none touch-none shadow-inner flex items-center justify-center"
        >
          <img
            src={imageUrl}
            alt="Mockup Reference"
            className="object-contain w-full h-full p-1 pointer-events-none select-none"
          />

          {areas.map((area) => {
            const isSelected = area.id === selectedId;
            const hasPhysical = area.physicalWidth && area.physicalHeight;
            return (
              <div
                key={area.id}
                onPointerDown={(e) => handlePointerDown(e, area.id, "drag")}
                style={{
                  position: "absolute",
                  left: `${area.x}%`,
                  top: `${area.y}%`,
                  width: `${area.width}%`,
                  height: `${area.height}%`,
                  zIndex: isSelected ? 20 : 10,
                }}
                className={`border-2 cursor-move flex items-center justify-center transition-all ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-500/20 shadow-lg ring-2 ring-indigo-500/20"
                    : "border-dashed border-sky-500 bg-sky-500/10 hover:border-sky-600 hover:bg-sky-500/15"
                }`}
              >
                <div
                  className={`text-[8px] font-bold px-1 py-0.5 rounded shadow-sm select-none pointer-events-none text-center leading-tight ${
                    isSelected ? "bg-indigo-600 text-white" : "bg-sky-600 text-white"
                  }`}
                >
                  {area.label || "Mockup Zone"}
                  {hasPhysical ? (
                    <div className="text-[7px] font-semibold opacity-90 flex items-center gap-0.5 justify-center">
                      <Ruler className="w-2 h-2" />
                      {area.physicalWidth}×{area.physicalHeight}{area.unit}
                    </div>
                  ) : (
                    <div className="text-[7px] font-normal opacity-75">
                      {Math.round(area.width)}% × {Math.round(area.height)}%
                    </div>
                  )}
                </div>

                {/* Resize handle bottom-right */}
                {isSelected && (
                  <div
                    onPointerDown={(e) => handlePointerDown(e, area.id, "resize")}
                    className="absolute right-0 bottom-0 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-tl cursor-se-resize shadow-md hover:bg-indigo-700 transition-colors"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Tool Control Panel */}
        {activeArea && (
          <div className="w-full flex flex-col gap-2 p-2 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900/60 animate-fade-in max-w-xs">
            {/* Row 1: Align */}
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider ml-1">Align:</span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => handleUpdateField(activeArea.id, "x", 0)}
                  className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 transition-colors"
                  title="Rata Kiri"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22V2M8 4h12M8 12h8M8 20h12"/></svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateField(activeArea.id, "x", (100 - activeArea.width) / 2)}
                  className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 transition-colors"
                  title="Tengah Horizontal"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M8 5h8M6 12h12M8 19h8"/></svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateField(activeArea.id, "x", 100 - activeArea.width)}
                  className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 transition-colors"
                  title="Rata Kanan"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 22V2M4 4h12M8 12h8M4 20h12"/></svg>
                </button>
                <div className="w-[1px] h-4 bg-stone-300 dark:bg-stone-700 mx-0.5" />
                <button
                  type="button"
                  onClick={() => handleUpdateField(activeArea.id, "y", 0)}
                  className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 transition-colors"
                  title="Rata Atas"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 4H2M4 8v12M12 8v8M20 8v12"/></svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateField(activeArea.id, "y", (100 - activeArea.height) / 2)}
                  className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 transition-colors"
                  title="Tengah Vertikal"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h20M5 8v8M12 6v12M19 8v8"/></svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateField(activeArea.id, "y", 100 - activeArea.height)}
                  className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 transition-colors"
                  title="Rata Bawah"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 20H2M4 4v12M12 8v8M20 4v12"/></svg>
                </button>
              </div>
            </div>

            {/* Row 2: Nudge, Resize, Copy */}
            <div className="flex items-center justify-between gap-1 flex-wrap border-t border-stone-200/50 dark:border-stone-805/50 pt-1.5">
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider ml-1">Geser:</span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => handleUpdateField(activeArea.id, "x", Math.max(0, activeArea.x - 1))}
                  className="h-6 w-6 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 transition-colors font-bold text-xs"
                  title="Geser Kiri (Keyboard: ←)"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateField(activeArea.id, "y", Math.max(0, activeArea.y - 1))}
                  className="h-6 w-6 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 transition-colors font-bold text-xs"
                  title="Geser Atas (Keyboard: ↑)"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateField(activeArea.id, "y", Math.min(100 - activeArea.height, activeArea.y + 1))}
                  className="h-6 w-6 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 transition-colors font-bold text-xs"
                  title="Geser Bawah (Keyboard: ↓)"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateField(activeArea.id, "x", Math.min(100 - activeArea.width, activeArea.x + 1))}
                  className="h-6 w-6 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 transition-colors font-bold text-xs"
                  title="Geser Kanan (Keyboard: →)"
                >
                  →
                </button>
              </div>

              <div className="w-[1px] h-4 bg-stone-300 dark:bg-stone-700 mx-0.5" />

              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Size:</span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => handleUpdateField(activeArea.id, "width", Math.max(5, activeArea.width - 1))}
                  className="px-1.5 h-6 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 transition-colors text-[10px] font-bold"
                  title="Kecilkan Lebar"
                >
                  W-
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateField(activeArea.id, "width", Math.min(100 - activeArea.x, activeArea.width + 1))}
                  className="px-1.5 h-6 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 transition-colors text-[10px] font-bold"
                  title="Lebarkan Lebar"
                >
                  W+
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateField(activeArea.id, "height", Math.max(5, activeArea.height - 1))}
                  className="px-1.5 h-6 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 transition-colors text-[10px] font-bold"
                  title="Kecilkan Tinggi"
                >
                  H-
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateField(activeArea.id, "height", Math.min(100 - activeArea.y, activeArea.height + 1))}
                  className="px-1.5 h-6 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 transition-colors text-[10px] font-bold"
                  title="Lebarkan Tinggi"
                >
                  H+
                </button>
              </div>

              <div className="w-[1px] h-4 bg-stone-300 dark:bg-stone-700 mx-0.5" />

              <button
                type="button"
                onClick={() => {
                  const newId = `temp_${Date.now()}`;
                  const newArea = {
                    ...activeArea,
                    id: newId,
                    x: Math.min(100 - activeArea.width, activeArea.x + 3),
                    y: Math.min(100 - activeArea.height, activeArea.y + 3),
                    label: `${activeArea.label} (Copy)`
                  };
                  onChange([...areas, newArea]);
                  setSelectedId(newId);
                }}
                className="px-2 h-6 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 rounded text-indigo-700 dark:text-indigo-350 transition-colors text-[10px] font-bold flex items-center gap-1"
                title="Duplikat Area"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Duplikat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Kanan: Sidebar Detail & Pengaturan */}
      <div className="flex-1 w-full flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-500" />
            <h4 className="font-semibold text-sm text-stone-800 dark:text-stone-200">
              Mockup Zones ({areas.length})
            </h4>
          </div>
          <button
            type="button"
            onClick={handleAddArea}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-semibold text-xs transition-all duration-150"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Area
          </button>
        </div>

        {/* List Areas */}
        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
          {areas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50/50 dark:bg-stone-900/50">
              <Layers className="h-8 w-8 text-stone-300 dark:text-stone-700 mb-2" />
              <p className="text-xs text-stone-500 dark:text-stone-400 italic">
                Belum ada area mockup. Klik &quot;Tambah Area&quot; untuk membuat area penempatan logo custom.
              </p>
            </div>
          ) : (
            areas.map((area) => {
              const isSelected = area.id === selectedId;
              return (
                <div
                  key={area.id}
                  onClick={() => setSelectedId(area.id)}
                  className={`border rounded-lg p-3 transition-all cursor-pointer ${
                    isSelected
                      ? "border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/30 dark:bg-indigo-950/20 shadow-sm"
                      : "border-stone-200 dark:border-stone-800 hover:bg-stone-50/50 dark:hover:bg-stone-900/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-semibold text-xs text-stone-800 dark:text-stone-200 truncate flex items-center gap-1.5">
                      <Tag className={`h-3.5 w-3.5 ${isSelected ? "text-indigo-500" : "text-stone-400"}`} />
                      {area.label || "Mockup Zone"}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {area.physicalWidth && area.physicalHeight ? (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5 flex items-center gap-1">
                          <Ruler className="w-2.5 h-2.5" />
                          {area.physicalWidth}×{area.physicalHeight}{area.unit}
                        </span>
                      ) : (
                        <span className="text-[9px] text-stone-400 italic">Ukuran fisik belum diisi</span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteArea(area.id, e)}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-stone-400 hover:text-red-600 rounded transition-colors"
                        title="Hapus area ini"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Form Detail Input (Hanya tampil jika terpilih) */}
                  {isSelected && (
                    <div className="space-y-3 mt-2 pt-2 border-t border-indigo-100/50 dark:border-indigo-900/20 animate-fade-in">
                      {/* Label */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                          Label Area
                        </label>
                        <input
                          type="text"
                          value={area.label}
                          onChange={(e) => handleUpdateField(area.id, "label", e.target.value)}
                          placeholder="Contoh: Dada Kiri, Lengan Kanan"
                          className="w-full text-xs px-2.5 py-1.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Physical size */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1 flex items-center gap-1">
                          <Ruler className="w-3 h-3" />
                          Ukuran Fisik Area Cetak
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={area.physicalWidth ?? ""}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleUpdateField(area.id, "physicalWidth", e.target.value === "" ? null : parseFloat(e.target.value))}
                              placeholder="Lebar"
                              className="w-full text-xs px-2 py-1.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                            />
                            <span className="text-stone-400 text-xs font-bold shrink-0">×</span>
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={area.physicalHeight ?? ""}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleUpdateField(area.id, "physicalHeight", e.target.value === "" ? null : parseFloat(e.target.value))}
                              placeholder="Tinggi"
                              className="w-full text-xs px-2 py-1.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                            />
                          </div>
                          {/* Unit selector */}
                          <select
                            value={area.unit ?? "cm"}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleUpdateField(area.id, "unit", e.target.value)}
                            className="text-xs px-2 py-1.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shrink-0"
                          >
                            <option value="cm">cm</option>
                            <option value="mm">mm</option>
                          </select>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1 leading-snug">
                          Ukuran nyata area cetak pada produk. Digunakan untuk menghitung ukuran logo yang diunggah.
                        </p>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                          Panduan Upload (Opsional)
                        </label>
                        <input
                          type="text"
                          value={area.description || ""}
                          onChange={(e) => handleUpdateField(area.id, "description", e.target.value)}
                          placeholder="Contoh: Resolusi min 300dpi, area cetak 10×10cm"
                          className="w-full text-xs px-2.5 py-1.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
