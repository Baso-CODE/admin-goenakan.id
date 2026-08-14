"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Images, Download, Trash2, RefreshCw, Upload, Eye, Plus, Layers } from "lucide-react";
import { toast } from "sonner";

interface MockupArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  description?: string | null;
  physicalWidth?: number | null;
  physicalHeight?: number | null;
  unit?: string | null;
}

/**
 * Given a logo's size% relative to the canvas, and the placement area's
 * physical dimensions and its own size% on the canvas, calculates the
 * real physical print size of the logo.
 *
 * logoSize%     → fraction of canvas width the logo occupies
 * area.width%   → fraction of canvas width the area occupies
 * area.physicalWidth → real width of the area in cm/mm
 *
 * Real logo width  = (logoSize% / area.width%) * area.physicalWidth
 * Real logo height = ratio * area.physicalHeight (maintain logo aspect via size prop)
 */
function calcRealSize(
  logoSizePct: number,
  area: MockupArea,
  aspectRatio?: number
): { w: number; h: number; unit: string } | null {
  if (!area.physicalWidth || !area.physicalHeight || !area.width) return null;
  const ratio = logoSizePct / area.width; // e.g. logo is 60% of area width
  const realW = parseFloat((ratio * area.physicalWidth).toFixed(2));
  const aspect = aspectRatio || (area.physicalWidth / area.physicalHeight);
  const realH = parseFloat((realW / aspect).toFixed(2));
  return { w: realW, h: realH, unit: area.unit ?? "cm" };
}

interface LogoLayer {
  id: string;
  url: string;
  name: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  aspectRatio?: number;
}

interface ProductMockupModalProps {
  productName: string;
  productSku: string;
  imageUrl?: string;
  images?: {
    id: string;
    url: string;
    isFeatured: boolean;
    mockupAreas?: MockupArea[];
  }[];
  isMultiFace?: boolean;
  mockupFrontImageId?: string | null;
  mockupBackImageId?: string | null;
  triggerLabel?: string;
}

export function ProductMockupModal({
  productName,
  productSku,
  imageUrl,
  images,
  isMultiFace = false,
  mockupFrontImageId,
  mockupBackImageId,
  triggerLabel,
}: ProductMockupModalProps) {
  const [open, setOpen] = useState(false);
  const [activeFace, setActiveFace] = useState<"front" | "back">("front");

  // Selection states
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  // Multi logo layers: mapping mockupAreaId (or "fallback") to array of LogoLayer
  const [areaLayers, setAreaLayers] = useState<Record<string, LogoLayer[]>>({});

  // ONE ref map — keys are areaId. Inputs are rendered once at root level.
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Draft string for the physical-size (cm/mm) input — allows free typing
  // without React overwriting it on every render.
  const [cmDraft, setCmDraft] = useState<string>("");

  const [localImageUrl, setLocalImageUrl] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Retrieve active image and areas
  const activeImageObj =
    activeFace === "front"
      ? images?.find((img) => img.id === mockupFrontImageId) ||
        images?.find((img) => img.isFeatured) ||
        images?.[0]
      : images?.find((img) => img.id === mockupBackImageId);

  const activeImageUrl = activeImageObj?.url || imageUrl;

  const hasMockupAreas = !!(
    activeImageObj?.mockupAreas && activeImageObj.mockupAreas.length > 0
  );

  // Unified list of mockup areas (from DB or single virtual fallback)
  const activeMockupAreas: MockupArea[] = hasMockupAreas
    ? activeImageObj!.mockupAreas!
    : [
        {
          id: "fallback",
          x: 35,
          y: 35,
          width: 30,
          height: 30,
          label: "Custom Logo",
          description: "Posisikan logo secara bebas",
        },
      ];

  const backImageExists = !!images?.find((img) => img.id === mockupBackImageId);

  // Reset states on open/close
  useEffect(() => {
    if (!open) {
      setAreaLayers({});
      setActiveAreaId(null);
      setActiveLayerId(null);
      setActiveFace("front");
      setCmDraft("");
      setIsDownloading(false);
    }
  }, [open]);

  // Load product image as a local object URL to bypass CORS taint in html2canvas
  useEffect(() => {
    if (!activeImageUrl) {
      setLocalImageUrl("");
      return;
    }

    if (
      activeImageUrl.startsWith("data:") ||
      activeImageUrl.startsWith("blob:") ||
      !activeImageUrl.startsWith("http")
    ) {
      setLocalImageUrl(activeImageUrl);
      return;
    }

    // Instantly reset so we don't display a revoked/stale blob URL from the previous face
    setLocalImageUrl("");

    let active = true;
    let localUrl = "";

    fetch(activeImageUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Image download failed");
        return res.blob();
      })
      .then((blob) => {
        if (!active) return;
        localUrl = URL.createObjectURL(blob);
        setLocalImageUrl(localUrl);
      })
      .catch((err) => {
        console.warn("CORS fetch failed, using fallback URL:", err);
        if (active) {
          setLocalImageUrl(activeImageUrl);
        }
      });

    return () => {
      active = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [activeImageUrl]);

  // Keep cmDraft in sync when the slider / drag / external change moves the size
  useEffect(() => {
    if (!activeLayerId || !activeAreaId) {
      setCmDraft("");
      return;
    }
    const layers = areaLayers[activeAreaId] || [];
    const layer = layers.find((l) => l.id === activeLayerId);
    const area = activeMockupAreas.find((a) => a.id === activeAreaId);
    if (!layer || !area) return;
    const rs = calcRealSize(layer.size, area, layer.aspectRatio);
    if (rs) setCmDraft(String(rs.w));
    else setCmDraft("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayerId, activeAreaId,
      // Watch the actual size value of the active layer so drag + slider update the draft
      activeLayerId && activeAreaId
        ? (areaLayers[activeAreaId] || []).find((l) => l.id === activeLayerId)?.size
        : undefined,
  ]);

  /**
   * Process multiple files uploaded to a single placement area.
   * Each file becomes its own LogoLayer stacked within the area.
   */
  const handleAreaLogoUpload = useCallback(
    (areaId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const area = activeMockupAreas.find((a) => a.id === areaId);
      if (!area) return;

      const invalidFiles = files.filter((f) => !f.type.startsWith("image/"));
      if (invalidFiles.length > 0) {
        toast.error(
          `${invalidFiles.length} file bukan gambar dan dilewati.`
        );
      }

      const validFiles = files.filter((f) => f.type.startsWith("image/"));
      if (validFiles.length === 0) return;

      validFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result;
          if (!result) return;

          const img = new Image();
          img.onload = () => {
            const aspect = img.naturalWidth / img.naturalHeight;
            const offset = index * 2;

            // Calculate safe initial size that fits in the area bounds (both width and height)
            let initialSize = area.width;
            if (area.id !== "fallback") {
              initialSize = Math.min(area.width, area.height * aspect);
            }

            // Clamp initial coordinates so they don't push the logo out of the area bounds
            const maxXOffset = Math.max(0, area.width - initialSize);
            const maxYOffset = Math.max(0, area.height - (initialSize / aspect));
            const clampedXOffset = Math.min(offset, maxXOffset);
            const clampedYOffset = Math.min(offset, maxYOffset);

            const newLayer: LogoLayer = {
              id: `${areaId}-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              url: result as string,
              name: file.name,
              x: area.x + clampedXOffset,
              y: area.y + clampedYOffset,
              size: initialSize,
              rotation: 0,
              opacity: 100,
              aspectRatio: aspect,
            };

            setAreaLayers((prev) => ({
              ...prev,
              [areaId]: [...(prev[areaId] || []), newLayer],
            }));

            // Auto-select the last uploaded file
            if (index === validFiles.length - 1) {
              setActiveAreaId(areaId);
              setActiveLayerId(newLayer.id);
            }
          };
          img.src = result as string;
        };
        reader.readAsDataURL(file);
      });

      toast.success(
        `${validFiles.length} logo berhasil ditambahkan ke area "${area.label}"!`
      );

      // Reset so the same files can be re-selected
      if (fileInputRefs.current[areaId]) {
        fileInputRefs.current[areaId]!.value = "";
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeMockupAreas]
  );

  const triggerUpload = (areaId: string) => {
    fileInputRefs.current[areaId]?.click();
  };

  // ─── Drag / Move ────────────────────────────────────────────────────────────

  const handlePointerDown = (
    areaId: string,
    layerId: string,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    setActiveAreaId(areaId);
    setActiveLayerId(layerId);
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    setIsDragging(true);

    const logoRect = el.getBoundingClientRect();
    setDragStart({
      x: e.clientX - logoRect.left,
      y: e.clientY - logoRect.top,
    });
  };

  const handlePointerMove = (
    areaId: string,
    layerId: string,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isDragging) return;
    const el = e.currentTarget;
    const parentEl = el.parentElement;
    if (!parentEl) return;

    const parentRect = parentEl.getBoundingClientRect();

    let newX = e.clientX - parentRect.left - dragStart.x;
    let newY = e.clientY - parentRect.top - dragStart.y;

    // Default bounds: full canvas
    let minX = 0, minY = 0;
    let maxX = parentRect.width - el.clientWidth;
    let maxY = parentRect.height - el.clientHeight;

    // Tighten bounds to the placement area rectangle
    const dragArea = activeMockupAreas.find((a) => a.id === areaId);
    if (dragArea && dragArea.id !== "fallback") {
      const aLeft   = (dragArea.x / 100) * parentRect.width;
      const aTop    = (dragArea.y / 100) * parentRect.height;
      const aRight  = ((dragArea.x + dragArea.width)  / 100) * parentRect.width  - el.clientWidth;
      const aBottom = ((dragArea.y + dragArea.height) / 100) * parentRect.height - el.clientHeight;
      minX = Math.max(minX, aLeft);
      minY = Math.max(minY, aTop);
      maxX = Math.min(maxX, Math.max(aLeft, aRight));
      maxY = Math.min(maxY, Math.max(aTop,  aBottom));
    }

    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));

    const pctX = (newX / parentRect.width) * 100;
    const pctY = (newY / parentRect.height) * 100;

    setAreaLayers((prev) => ({
      ...prev,
      [areaId]: (prev[areaId] || []).map((layer) =>
        layer.id === layerId ? { ...layer, x: pctX, y: pctY } : layer
      ),
    }));
  };

  const handlePointerUp = (
    _areaId: string,
    _layerId: string,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // ─── Active Layer Helpers ────────────────────────────────────────────────────

  const activeLayers = activeAreaId ? areaLayers[activeAreaId] || [] : [];
  const activeLayer = activeLayerId
    ? activeLayers.find((l) => l.id === activeLayerId) ?? null
    : null;

  const updateActiveSetting = (
    key: "size" | "rotation" | "opacity",
    value: number
  ) => {
    if (!activeAreaId || !activeLayerId) return;
    
    setAreaLayers((prev) => {
      const layers = prev[activeAreaId] || [];
      const updatedLayers = layers.map((layer) => {
        if (layer.id !== activeLayerId) return layer;
        
        let updated = { ...layer, [key]: value };
        
        if (key === "size") {
          const area = activeMockupAreas.find((a) => a.id === activeAreaId);
          if (area && area.id !== "fallback") {
            const aspect = layer.aspectRatio || 1.0;
            // Max allowed size based on area width and area height
            const maxAllowedSize = Math.min(area.width, area.height * aspect);
            const clampedSize = Math.max(5, Math.min(maxAllowedSize, value));
            
            updated.size = clampedSize;
            
            // Now shift x & y if the resized logo exceeds the area bounds
            const maxX = area.x + area.width - clampedSize;
            const maxY = area.y + area.height - (clampedSize / aspect);
            
            updated.x = Math.max(area.x, Math.min(layer.x, maxX));
            updated.y = Math.max(area.y, Math.min(layer.y, maxY));
          } else {
            updated.size = Math.max(5, Math.min(100, value));
          }
        }
        
        return updated;
      });
      
      return {
        ...prev,
        [activeAreaId]: updatedLayers,
      };
    });
  };

  const resetActiveSettings = () => {
    if (!activeAreaId || !activeLayerId) return;
    const area = activeMockupAreas.find((a) => a.id === activeAreaId);
    if (!area) return;

    setAreaLayers((prev) => ({
      ...prev,
      [activeAreaId]: (prev[activeAreaId] || []).map((layer) => {
        if (layer.id !== activeLayerId) return layer;
        
        const aspect = layer.aspectRatio || 1.0;
        const defaultSize = area.id !== "fallback" 
          ? Math.min(area.width, area.height * aspect)
          : area.width;

        return {
          ...layer,
          x: area.x,
          y: area.y,
          size: defaultSize,
          rotation: 0,
          opacity: 100,
        };
      }),
    }));
    toast.info("Posisi logo terpilih direset ke default.");
  };

  const deleteLayer = (areaId: string, layerId: string) => {
    setAreaLayers((prev) => ({
      ...prev,
      [areaId]: (prev[areaId] || []).filter((l) => l.id !== layerId),
    }));
    if (activeLayerId === layerId) {
      setActiveLayerId(null);
      setActiveAreaId(null);
    }
  };

  const deleteActiveLogo = () => {
    if (!activeAreaId || !activeLayerId) return;
    deleteLayer(activeAreaId, activeLayerId);
  };

  const downloadPreview = async () => {
    if (!canvasRef.current) return;
    try {
      toast.loading("Sedang merender mockup...", { id: "mockup-download" });
      setIsDownloading(true);

      // Wait a moment for React to process state updates and repaint the canvas DOM
      await new Promise((resolve) => setTimeout(resolve, 100));

      const html2canvas = (await import("html2canvas-pro")).default;
      const canvasEl = await html2canvas(canvasRef.current, {
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#f8fafc",
      });

      const dataUrl = canvasEl.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${productSku || "produk"}-mockup-${activeFace}-preview.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Mockup berhasil diunduh!", { id: "mockup-download" });
    } catch (error) {
      console.error("Error downloading mockup:", error);
      toast.error("Gagal mengunduh file mockup.", { id: "mockup-download" });
    } finally {
      setIsDownloading(false);
    }
  };

  const totalUploadsCount = Object.values(areaLayers).reduce(
    (acc, curr) => acc + curr.length,
    0
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* ── Hidden file inputs – ONE per area, rendered once ── */}
      {activeMockupAreas.map((area) => (
        <input
          key={`file-input-${area.id}`}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          ref={(el) => {
            fileInputRefs.current[area.id] = el;
          }}
          onChange={(e) => handleAreaLogoUpload(area.id, e)}
        />
      ))}

      <DialogTrigger asChild>
        {triggerLabel ? (
          <Button variant="outline" size="sm" className="gap-2">
            <Images className="h-4 w-4" />
            {triggerLabel}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
            title="Mockup Preview"
          >
            <Eye className="h-4.5 w-4.5" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
            <Images className="h-5 w-5 text-blue-500" />
            Mockup Preview Builder
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4">
          {/* ── LEFT: CANVAS ── */}
          <div className="md:col-span-7 flex flex-col items-center justify-center">
            {/* Front / Back tabs */}
            {isMultiFace && backImageExists && (
              <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-lg self-start">
                <Button
                  type="button"
                  variant={activeFace === "front" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setActiveFace("front");
                    setActiveAreaId(null);
                    setActiveLayerId(null);
                  }}
                  className="text-xs font-semibold"
                >
                  Tampak Depan
                </Button>
                <Button
                  type="button"
                  variant={activeFace === "back" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setActiveFace("back");
                    setActiveAreaId(null);
                    setActiveLayerId(null);
                  }}
                  className="text-xs font-semibold"
                >
                  Tampak Belakang
                </Button>
              </div>
            )}

            {/* Canvas */}
            <div
              ref={canvasRef}
              id="mockup-canvas-area"
              className="relative w-full aspect-square border rounded-xl bg-slate-50 overflow-hidden shadow-inner flex items-center justify-center select-none touch-none"
            >
              {/* Product image */}
              {localImageUrl || activeImageUrl ? (
                <img
                  src={localImageUrl || activeImageUrl}
                  alt={productName}
                  className="object-contain w-full h-full p-2 select-none pointer-events-none"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Images className="h-12 w-12 stroke-1" />
                  <span className="text-sm">Produk tidak memiliki gambar</span>
                </div>
              )}

              {/* Placement zone guides – clickable to add logo */}
              {!isDownloading && activeMockupAreas.map((area) => {
                const layerCount = (areaLayers[area.id] || []).length;
                return (
                  <div
                    key={`guide-${area.id}`}
                    style={{
                      position: "absolute",
                      left: `${area.x}%`,
                      top: `${area.y}%`,
                      width: `${area.width}%`,
                      height: `${area.height}%`,
                    }}
                    onClick={() => triggerUpload(area.id)}
                    className="border-2 border-dashed border-blue-400/70 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer flex flex-col items-center justify-center gap-0.5 rounded-sm group transition-colors"
                    title={`Klik untuk tambah logo ke area: ${area.label}`}
                  >
                    <Plus className="w-3 h-3 text-blue-500/60 group-hover:text-blue-600 transition-colors" />
                    <span className="text-[7px] font-bold text-blue-600/80 uppercase tracking-widest leading-none px-1 text-center">
                      {area.label}
                    </span>
                    {area.physicalWidth && area.physicalHeight ? (
                      <span className="text-[6px] text-blue-500/60 font-semibold leading-none">
                        {area.physicalWidth}×{area.physicalHeight} {area.unit || "cm"}
                      </span>
                    ) : (
                      <span className="text-[6px] text-blue-500/60 font-semibold leading-none">
                        {area.width}×{area.height}%
                      </span>
                    )}
                    {layerCount > 0 && (
                      <span className="text-[6px] text-blue-500 font-semibold leading-none">
                        {layerCount} logo
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Render logo layers (draggable) */}
              {activeMockupAreas.map((area) =>
                (areaLayers[area.id] || []).map((layer) => {
                  const isActive = activeLayerId === layer.id;
                  return (
                    <div
                      key={`logo-${layer.id}`}
                      onPointerDown={(e) =>
                        handlePointerDown(area.id, layer.id, e)
                      }
                      onPointerMove={(e) =>
                        handlePointerMove(area.id, layer.id, e)
                      }
                      onPointerUp={(e) =>
                        handlePointerUp(area.id, layer.id, e)
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveAreaId(area.id);
                        setActiveLayerId(layer.id);
                      }}
                      style={{
                        position: "absolute",
                        left: `${layer.x}%`,
                        top: `${layer.y}%`,
                        width: `${layer.size}%`,
                        transform: `rotate(${layer.rotation}deg)`,
                        opacity: layer.opacity / 100,
                        cursor:
                          isDragging && isActive ? "grabbing" : "grab",
                        touchAction: "none",
                        zIndex: isActive ? 20 : 10,
                      }}
                      className={`group p-0.5 border-2 transition-shadow ${
                        isActive && !isDownloading
                          ? "border-blue-500 shadow-lg shadow-blue-500/20"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={layer.url}
                        alt={layer.name}
                        className="w-full h-auto object-contain select-none pointer-events-none"
                      />
                      {/* Area label badge on active layer */}
                      {isActive && hasMockupAreas && !isDownloading && (
                        <div className="absolute -top-5 left-0 bg-blue-600 text-white text-[7px] font-bold px-1.5 py-0.5 rounded uppercase select-none pointer-events-none leading-none whitespace-nowrap">
                          {area.label}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <p className="text-xs text-slate-400 mt-2 text-center">
              {hasMockupAreas
                ? "* Klik zona untuk tambah logo · Drag logo untuk memposisikan"
                : "* Klik area untuk tambah logo · Bisa pilih beberapa sekaligus"}
            </p>
          </div>

          {/* ── RIGHT: CONTROLS ── */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-5">
            <div className="space-y-5">
              {/* Product info */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Detail Produk
                </h3>
                <p className="text-lg font-bold text-slate-900 truncate mt-0.5">
                  {productName}
                </p>
                <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  {productSku}
                </span>
              </div>

              {/* ── Area + Layer list ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    Logo per Area
                  </label>
                </div>

                <div className="space-y-3 max-h-[32vh] overflow-y-auto pr-1">
                  {activeMockupAreas.map((area) => {
                    const layers = areaLayers[area.id] || [];
                    return (
                      <div
                        key={area.id}
                        className="border rounded-lg overflow-hidden"
                      >
                        {/* Area header */}
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-slate-700 truncate">
                              {area.label}
                            </span>
                            {area.physicalWidth && area.physicalHeight ? (
                              <span className="text-[10px] text-slate-400 shrink-0">
                                ({area.physicalWidth}×{area.physicalHeight} {area.unit || "cm"})
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 shrink-0">
                                ({area.width}×{area.height}%)
                              </span>
                            )}
                            {layers.length > 0 && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 font-semibold rounded-full px-1.5 py-0.5 leading-none shrink-0">
                                {layers.length}
                              </span>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => triggerUpload(area.id)}
                            className="h-6 text-[10px] px-2 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Tambah logo (bisa pilih banyak sekaligus)"
                          >
                            <Plus className="w-3 h-3" /> Tambah
                          </Button>
                        </div>

                        {/* Layer list */}
                        {layers.length > 0 ? (
                          <div className="divide-y">
                            {layers.map((layer) => {
                              const isSelected = activeLayerId === layer.id;
                              return (
                                <div
                                  key={layer.id}
                                  onClick={() => {
                                    setActiveAreaId(area.id);
                                    setActiveLayerId(layer.id);
                                  }}
                                  className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-blue-50 border-l-2 border-blue-500"
                                      : "hover:bg-slate-50 border-l-2 border-transparent"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 rounded bg-slate-100 border flex items-center justify-center overflow-hidden shrink-0">
                                      <img
                                        src={layer.url}
                                        alt={layer.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                                        {layer.name}
                                      </p>
                                      <p className="text-[9px] text-slate-400 mt-0.5">
                                        {isSelected ? (
                                          <>
                                            {layer.size}% · {layer.rotation}° · {layer.opacity}%
                                            {(() => {
                                              const rs = calcRealSize(layer.size, area, layer.aspectRatio);
                                              return rs ? (
                                                <span className="ml-1 text-emerald-600 font-semibold">
                                                  ≈ {rs.w}×{rs.h}{rs.unit}
                                                </span>
                                              ) : null;
                                            })()}
                                          </>
                                        ) : "Klik untuk atur"}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteLayer(area.id, layer.id);
                                    }}
                                    className="text-slate-300 hover:text-red-500 p-1 transition-colors shrink-0"
                                    title="Hapus logo ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div
                            onClick={() => triggerUpload(area.id)}
                            className="flex items-center gap-2 px-3 py-3 cursor-pointer text-slate-400 hover:text-blue-500 hover:bg-blue-50/50 transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5 shrink-0" />
                            <p className="text-[10px] italic">
                              Klik untuk unggah logo (bisa banyak sekaligus)
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Active layer controls ── */}
              {activeLayer ? (
                <div className="space-y-3 pt-2 border-t">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    Modifikasi Logo Terpilih
                    {hasMockupAreas && activeAreaId && (
                      <span className="bg-blue-100 text-blue-700 text-[9px] rounded-full px-1.5 py-0.5 font-semibold leading-none normal-case tracking-normal">
                        {activeMockupAreas.find((a) => a.id === activeAreaId)
                          ?.label}
                      </span>
                    )}
                  </h4>

                  {/* ── Size ── */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-medium">Ukuran Logo</span>
                      {activeAreaId && (() => {
                        const area = activeMockupAreas.find(a => a.id === activeAreaId);
                        const rs = area ? calcRealSize(activeLayer.size, area, activeLayer.aspectRatio) : null;
                        return rs ? (
                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5 leading-none">
                            ≈ {rs.w} × {rs.h} {rs.unit}
                          </span>
                        ) : null;
                      })()}
                    </div>

                    {/* Slider + % input — max clamped to area width & height constraints */}
                    {(() => {
                      const sa = activeAreaId ? activeMockupAreas.find(a => a.id === activeAreaId) : null;
                      const aspect = activeLayer.aspectRatio || 1.0;
                      const maxSize = sa && sa.id !== "fallback"
                        ? Math.round(Math.min(sa.width, sa.height * aspect))
                        : 100;
                      const isLimited = maxSize < 100;
                      return (
                        <>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 -mb-0.5">
                            <span>5%</span>
                            <span className={isLimited ? "text-amber-600 font-semibold" : ""}>
                              maks {maxSize}%{isLimited ? " — batas area" : ""}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max={maxSize}
                            value={activeLayer.size}
                            onChange={(e) => updateActiveSetting("size", Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </>
                      );
                    })()}

                    {/* Manual inputs row */}
                    <div className="flex items-center gap-2 mt-1">
                      {/* Percent input */}
                      {(() => {
                        const pa = activeAreaId ? activeMockupAreas.find(a => a.id === activeAreaId) : null;
                        const aspect = activeLayer.aspectRatio || 1.0;
                        const maxPct = pa && pa.id !== "fallback"
                          ? Math.round(Math.min(pa.width, pa.height * aspect))
                          : 100;
                        return (
                          <div className="flex items-center gap-1 flex-1 border border-slate-200 rounded-md overflow-hidden">
                            <input
                              type="number"
                              min="5"
                              max={maxPct}
                              step="1"
                              value={activeLayer.size}
                              onChange={(e) => {
                                const v = Math.max(5, Math.min(maxPct, Number(e.target.value) || 5));
                                updateActiveSetting("size", v);
                              }}
                              className="w-full text-xs px-2 py-1.5 bg-white text-slate-800 focus:outline-none text-center"
                            />
                            <span className="text-[10px] text-slate-400 font-semibold px-1.5 bg-slate-50 h-full flex items-center border-l border-slate-200">%</span>
                          </div>
                        );
                      })()}

                      {/* Physical size input (only when area has dimensions) */}
                      {activeAreaId && (() => {
                        const area = activeMockupAreas.find(a => a.id === activeAreaId);
                        if (!area?.physicalWidth || !area?.physicalHeight) return null;
                        const unit = area.unit ?? "cm";

                        const commitCm = (raw: string) => {
                          const physVal = parseFloat(raw);
                          if (isNaN(physVal) || physVal <= 0) return;
                          const aspect = activeLayer.aspectRatio || 1.0;
                          const maxPhysWidth = Math.min(area.physicalWidth!, area.physicalHeight! * aspect);
                          const clampedPhys = Math.min(physVal, maxPhysWidth);
                          const newPct = Math.round((clampedPhys / area.physicalWidth!) * area.width);
                          updateActiveSetting("size", newPct);
                        };

                        return (
                          <div className="flex items-center gap-1 flex-1 border border-slate-200 rounded-md overflow-hidden">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={cmDraft}
                              onChange={(e) => setCmDraft(e.target.value)}
                              onBlur={(e) => commitCm(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.currentTarget.blur();
                                  commitCm(e.currentTarget.value);
                                }
                              }}
                              className="w-full text-xs px-2 py-1.5 bg-white text-slate-800 focus:outline-none text-center"
                            />
                            <span className="text-[10px] text-slate-400 font-semibold px-1.5 bg-slate-50 h-full flex items-center border-l border-slate-200">{unit}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* ── Rotation ── */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-medium">Rotasi</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={activeLayer.rotation}
                      onChange={(e) => updateActiveSetting("rotation", Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex items-center gap-1 border border-slate-200 rounded-md overflow-hidden">
                      <input
                        type="number"
                        min="0"
                        max="360"
                        step="1"
                        value={activeLayer.rotation}
                        onChange={(e) => {
                          const v = ((Number(e.target.value) || 0) % 361 + 360) % 361;
                          updateActiveSetting("rotation", v);
                        }}
                        className="w-full text-xs px-2 py-1.5 bg-white text-slate-800 focus:outline-none text-center"
                      />
                      <span className="text-[10px] text-slate-400 font-semibold px-1.5 bg-slate-50 h-full flex items-center border-l border-slate-200">°</span>
                    </div>
                  </div>

                  {/* ── Opacity ── */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-medium">Opasitas</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={activeLayer.opacity}
                      onChange={(e) => updateActiveSetting("opacity", Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex items-center gap-1 border border-slate-200 rounded-md overflow-hidden">
                      <input
                        type="number"
                        min="10"
                        max="100"
                        step="1"
                        value={activeLayer.opacity}
                        onChange={(e) => {
                          const v = Math.max(10, Math.min(100, Number(e.target.value) || 10));
                          updateActiveSetting("opacity", v);
                        }}
                        className="w-full text-xs px-2 py-1.5 bg-white text-slate-800 focus:outline-none text-center"
                      />
                      <span className="text-[10px] text-slate-400 font-semibold px-1.5 bg-slate-50 h-full flex items-center border-l border-slate-200">%</span>
                    </div>
                  </div>
                </div>
              ) : (
                totalUploadsCount > 0 && (
                  <div className="p-4 bg-slate-50 border rounded-lg text-center text-xs text-slate-400">
                    Pilih logo dari daftar di atas untuk mengatur posisi,
                    ukuran, rotasi, dan opasitas.
                  </div>
                )
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={resetActiveSettings}
                disabled={!activeLayerId}
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={deleteActiveLogo}
                disabled={!activeLayerId}
                title="Hapus logo terpilih"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={downloadPreview}
                disabled={totalUploadsCount === 0}
              >
                <Download className="h-4 w-4" />
                Unduh PNG
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
