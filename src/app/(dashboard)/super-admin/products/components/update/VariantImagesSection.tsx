import { useEffect, useState } from "react";
import { VariantList } from "../VariantList";

export default function FormUpdateVariantImages({
  initialData,
  onSubmit,
  isSubmitting,
}: {
  initialData?: any;
  onSubmit: (payload: any) => void;
  isSubmitting: boolean;
}) {
  // State untuk metadata (featured, altText per variant)
  const [variantMeta, setVariantMeta] = useState<any[]>([]);
  // State untuk file upload per variant
  const [variantFiles, setVariantFiles] = useState<File[][]>([]);
  // Data lama (prefill)
  const [existingImagesMap, setExistingImagesMap] = useState<any[][]>([]);
  const [existingMetas, setExistingMetas] = useState<any[]>([]);

  // Load initialData hanya sekali
  useEffect(() => {
    if (!initialData?.productVariants) return;

    const variants = initialData.productVariants;

    // 1. Extract old uploaded images per variant
    const imgMap = variants.map((v: any) => v.images || []);

    // 2. Extract meta per variant
    const metas = variants.map((v: any, idx: number) => {
      const featured = v.images?.find((img: any) => img.isFeatured);
      return {
        variantIndex: idx,
        isFeatured: featured ? true : false,
        altText: featured?.altText || "",
      };
    });

    setExistingImagesMap(imgMap);
    setExistingMetas(metas);

    // Set initial variantFiles in empty array format
    setVariantFiles(variants.map(() => []));

    // Initial meta (editable)
    setVariantMeta(metas);
  }, [initialData]);

  // Callback dari VariantList
  const handleMetaChange = (metas: any[], files: File[][]) => {
    setVariantMeta(metas); // update metadata
    setVariantFiles(files); // update file map
  };

  const handleSubmit = () => {
    onSubmit({
      metadata: variantMeta,
      files: variantFiles,
      existingImages: existingImagesMap, // ini penting untuk backend menentukan delete/update
    });
  };

  return (
    <div className="border p-4 rounded-md space-y-4">
      <h3 className="text-lg font-semibold">Update Variant Images</h3>

      <VariantList
        combinations={initialData?.combinations ?? []}
        existingMetas={existingMetas}
        existingImages={existingImagesMap}
        onChangeMeta={handleMetaChange}
      />

      <button className="btn" disabled={isSubmitting} onClick={handleSubmit}>
        {isSubmitting ? "Updating..." : "Update Variant Images"}
      </button>
    </div>
  );
}
