import { useEffect, useState } from "react";

export function VariantList({
  combinations,
  onChangeMeta,
  existingMetas = [],
  existingImages = [],
}: {
  combinations: { label: string; valueIds: string[] }[];
  onChangeMeta: (
    metas: {
      variantIndex: number;
      isFeatured?: boolean;
      altText?: string;
    }[],
    filesMap: File[][],
    deletedImages: { variantIndex: number; imageIds: string[] }[]
  ) => void;
  existingMetas?: {
    variantIndex: number;
    isFeatured?: boolean;
    altText?: string;
  }[];
  existingImages?: any[][];
}) {
  const [metas, setMetas] = useState<
    { variantIndex: number; isFeatured?: boolean; altText?: string }[]
  >(() => {
    return combinations.map((_, idx) => {
      const found = existingMetas.find((m) => m.variantIndex === idx);
      return (
        found ?? {
          variantIndex: idx,
          isFeatured: false,
          altText: "",
        }
      );
    });
  });

  const [filesMap, setFilesMap] = useState<File[][]>(() =>
    combinations.map(() => [])
  );

  const [deletedImages, setDeletedImages] = useState<
    { variantIndex: number; imageIds: string[] }[]
  >([]);

  useEffect(() => {
    onChangeMeta(metas, filesMap, deletedImages);
  }, [metas, filesMap, deletedImages]);

  // Remove image lama
  const deleteExistingImage = (variantIdx: number, imageId: string) => {
    setDeletedImages((prev) => {
      const existing = prev.find((p) => p.variantIndex === variantIdx);

      if (existing) {
        return prev.map((p) =>
          p.variantIndex === variantIdx
            ? { ...p, imageIds: [...p.imageIds, imageId] }
            : p
        );
      }

      return [...prev, { variantIndex: variantIdx, imageIds: [imageId] }];
    });
  };

  const onFilesChange = (idx: number, fileList: FileList | null) => {
    setFilesMap((s) =>
      s.map((f, i) => (i === idx ? (fileList ? Array.from(fileList) : []) : f))
    );
  };

  const setMetaField = (
    idx: number,
    patch: Partial<{ isFeatured?: boolean; altText?: string }>
  ) => {
    setMetas((s) => s.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };

  return (
    <div className="space-y-3">
      <h4 className="text-lg font-semibold">
        Generated Variants ({combinations.length})
      </h4>

      {combinations.map((comb, idx) => {
        const oldImages = existingImages[idx] || [];

        return (
          <div
            key={idx}
            className="border rounded p-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-start"
          >
            {/* Label */}
            <div className="md:col-span-1">
              <div className="text-sm font-medium">Variant #{idx + 1}</div>
              <div className="text-sm text-muted-foreground font-medium">
                {comb.label.split("|").join(" • ")}
              </div>
            </div>

            {/* Upload section */}
            <div className="md:col-span-1">
              <label className="text-sm block mb-1">Upload new images</label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => onFilesChange(idx, e.target.files)}
              />

              {/* New images preview */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {(filesMap[idx] || []).map((f, fi) => (
                  <div
                    key={fi}
                    className="text-xs py-1 px-2 rounded bg-muted border"
                  >
                    {f.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="md:col-span-1 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={metas[idx]?.isFeatured ?? false}
                  onChange={(e) =>
                    setMetaField(idx, { isFeatured: e.target.checked })
                  }
                />
                <span className="text-sm">Featured</span>
              </label>

              <label className="block">
                <div className="text-sm mb-1">Alt text (optional)</div>
                <input
                  type="text"
                  value={metas[idx]?.altText ?? ""}
                  onChange={(e) =>
                    setMetaField(idx, { altText: e.target.value })
                  }
                  className="w-full input border px-2 py-1 rounded"
                  placeholder="e.g. Red - Small"
                />
              </label>
            </div>

            {/* Existing images */}
            <div className="md:col-span-3 border-t pt-3">
              <div className="text-sm font-medium mb-2">Existing Images</div>
              <div className="flex gap-3 flex-wrap">
                {oldImages.length > 0 ? (
                  oldImages.map((img: any) => (
                    <div key={img.id} className="relative">
                      <img
                        src={img.url}
                        className="w-20 h-20 object-cover rounded border"
                      />
                      <button
                        className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-6 h-6"
                        onClick={() => deleteExistingImage(idx, img.id)}
                      >
                        X
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No existing images.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
