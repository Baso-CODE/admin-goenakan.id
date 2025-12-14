import { useEffect, useState, useRef, useCallback } from "react";
import { X, Plus, Image as ImageIcon, Check, Star, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// --- TIPE DATA BARU ---

// Metadata yang spesifik untuk setiap gambar
type ImageMeta = {
  id?: string; // Hanya ada untuk gambar lama
  url: string;
  isNew: boolean;
  isFeatured: boolean;
  altText: string;
  file?: File; // Hanya ada untuk gambar baru
  fileIndex?: number; // Hanya ada untuk gambar baru
};

// Struktur data gambar varian yang diperluas
type VariantImageState = {
  variantIndex: number;
  // Struktur yang menyimpan metadata untuk gambar lama (berdasarkan ID)
  // dan gambar baru (berdasarkan index) sebelum dikirimkan
  imagesMeta: (Partial<ImageMeta> & { tempId: string | number })[];
};

// --- PROPS BARU ---

interface VariantListProps {
  combinations: { label: string; valueIds: string[] }[];
  onChangeMeta: (
    // Kita hapus meta per-varian, ganti dengan data Gambar
    imagesState: VariantImageState[],
    filesMap: File[][],
    deletedImages: { variantIndex: number; imageIds: string[] }[]
  ) => void;
  // existingImages sekarang harus mencakup metadata gambar (isFeatured, altText)
  existingImages?: {
    id: string;
    url: string;
    isFeatured?: boolean;
    altText?: string;
  }[][];
}

// --- KOMPONEN MODAL BARU (Diadaptasi dari VariantImageDetail) ---

interface ImageDetailModalProps {
  // State data
  imageMeta: ImageMeta;
  variantIndex: number;
  tempId: string | number;
  // Handlers dari parent
  onClose: () => void;
  setImageMetaField: (
    variantIdx: number,
    tempId: string | number,
    patch: Partial<ImageMeta>
  ) => void;
  setFeaturedImage: (
    variantIdx: number,
    tempId: string | number,
    isNew: boolean
  ) => void;
}

const ImageDetailModal = ({
  imageMeta,
  variantIndex,
  tempId,
  onClose,
  setImageMetaField,
  setFeaturedImage,
}: ImageDetailModalProps) => {
  const [altText, setAltText] = useState(imageMeta.altText);
  const [isFeatured, setIsFeatured] = useState(imageMeta.isFeatured);

  // Simpan perubahan ke state parent saat modal ditutup
  const handleSaveAndClose = useCallback(() => {
    // 1. Update Alt Text
    setImageMetaField(variantIndex, tempId, { altText });
    // 2. Update Featured status (sudah di-handle oleh handleSetFeatured)

    onClose();
  }, [altText, onClose, setImageMetaField, variantIndex, tempId]);

  // Handler untuk mengubah status Featured (Memanggil fungsi parent untuk membersihkan featured lain)
  const handleSetFeatured = (checked: boolean) => {
    setIsFeatured(checked);
    setFeaturedImage(variantIndex, tempId, checked);
  };

  // Menangani penutupan modal dengan tombol Esc
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleSaveAndClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveAndClose]);

  return (
    // Overlay Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row">
        {/* Tombol Close Absolute */}
        <button
          onClick={handleSaveAndClose}
          className="absolute top-3 right-3 p-1 rounded-full bg-black/10 hover:bg-black/20 text-gray-700 transition z-10"
          title="Save Changes & Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* --- KOLOM KIRI: PREVIEW GAMBAR --- */}
        <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center p-6 relative min-h-[300px]">
          {/* Tampilkan gambar */}
          {imageMeta.url ? (
            <img
              src={imageMeta.url}
              alt={altText || "Preview"}
              className="max-w-full max-h-[300px] object-contain shadow-md rounded-md"
            />
          ) : (
            <div className="text-gray-400 text-sm">No Image</div>
          )}

          {/* Badge Status di atas gambar */}
          {isFeatured && (
            <Badge className="absolute top-4 left-4 bg-indigo-600 hover:bg-indigo-700 gap-1 pl-1 pr-2">
              <Star className="w-3 h-3 fill-white" /> Featured Image
            </Badge>
          )}
          {imageMeta.isNew && (
            <Badge className="absolute top-4 right-4 bg-green-500 hover:bg-green-600">
              NEW
            </Badge>
          )}
        </div>

        {/* --- KOLOM KANAN: FORM EDIT --- */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h3 className="text-xl font-bold text-gray-900">Image Details</h3>
              <p className="text-sm text-gray-500">
                Edit metadata for improved SEO and display.
              </p>
            </div>

            <hr className="border-gray-100" />

            {/* Input 1: Featured Toggle */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">
                Display Setting
              </Label>
              <label
                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  isFeatured
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      isFeatured
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-400"
                    }`}
                  >
                    {isFeatured && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isFeatured ? "text-indigo-700" : "text-gray-600"
                    }`}
                  >
                    Set as Featured Image
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={!!isFeatured}
                  onChange={(e) => handleSetFeatured(e.target.checked)}
                />
              </label>
              <p className="text-xs text-gray-400 px-1">
                The featured image is the main photo displayed for this variant.
              </p>
            </div>

            {/* Input 2: Alt Text */}
            <div className="space-y-2">
              <Label
                htmlFor="alt-text"
                className="text-sm font-semibold text-gray-700"
              >
                Alt Text (SEO Description)
              </Label>
              <Textarea
                id="alt-text"
                placeholder="Describe the image, e.g. 'Men's Black Cotton T-Shirt Front View'"
                className="resize-none min-h-[100px] focus-visible:ring-indigo-500"
                value={altText ?? ""}
                onChange={(e) => setAltText(e.target.value)}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 mt-4">
            <Button
              onClick={handleSaveAndClose}
              className="w-full bg-gray-900 hover:bg-gray-800"
            >
              Save Changes & Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- KOMPONEN UTAMA ---

export function VariantList({
  combinations,
  onChangeMeta,
  existingImages = [],
}: VariantListProps) {
  // State untuk melacak metadata gambar (isFeatured, altText) dan status delete gambar lama
  const [imagesState, setImagesState] = useState<VariantImageState[]>(() => {
    return combinations.map((_, variantIndex) => {
      const existingImgs = existingImages[variantIndex] || [];
      return {
        variantIndex: variantIndex,
        imagesMeta: existingImgs.map((img) => ({
          tempId: img.id, // Menggunakan ID sebagai tempId untuk gambar lama
          isFeatured: img.isFeatured ?? false,
          altText: img.altText ?? "",
        })),
      };
    });
  });

  // State untuk file gambar baru
  const [filesMap, setFilesMap] = useState<File[][]>(() =>
    combinations.map(() => [])
  );

  // State untuk gambar lama yang dihapus
  const [deletedImages, setDeletedImages] = useState<
    { variantIndex: number; imageIds: string[] }[]
  >([]);

  // Ref untuk input file
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // State untuk Modal Detail Gambar
  const [modalImage, setModalImage] = useState<
    | {
        variantIndex: number;
        tempId: string | number;
      }
    | undefined
  >(undefined);

  // ==============================================
  // useEffect untuk Sinkronisasi dan Callback
  // ==============================================

  useEffect(() => {
    // Sinkronisasi ukuran state saat combinations berubah
    if (filesMap.length !== combinations.length) {
      setFilesMap(combinations.map((_, idx) => filesMap[idx] || []));
    }
    if (imagesState.length !== combinations.length) {
      setImagesState(
        combinations.map((_, variantIndex) => {
          const existing = imagesState.find(
            (s) => s.variantIndex === variantIndex
          );
          if (existing) return existing;

          const existingImgs = existingImages[variantIndex] || [];
          return {
            variantIndex: variantIndex,
            imagesMeta: existingImgs.map((img) => ({
              tempId: img.id,
              isFeatured: img.isFeatured ?? false,
              altText: img.altText ?? "",
            })),
          };
        })
      );
    }
  }, [combinations, existingImages]); // Sync combinations change

  useEffect(() => {
    // Panggil callback saat data berubah
    onChangeMeta(imagesState, filesMap, deletedImages);
  }, [imagesState, filesMap, deletedImages, onChangeMeta]);

  // ==============================================
  // HANDLERS
  // ==============================================

  // Set/Update metadata Gambar (altText/isFeatured)
  const setImageMetaField = useCallback((
    variantIdx: number,
    tempId: string | number, // Gunakan ID atau FileIndex
    patch: Partial<ImageMeta>
  ) => {
    setImagesState((s) =>
      s.map((variantState) => {
        if (variantState.variantIndex !== variantIdx) return variantState;

        const newImagesMeta = variantState.imagesMeta.map((meta) => {
          if (meta.tempId === tempId) {
            return { ...meta, ...patch };
          }
          return meta;
        });

        return { ...variantState, imagesMeta: newImagesMeta };
      })
    );
  }, []);

  // Set Gambar Featured (memastikan hanya satu per varian)
  const setFeaturedImage = useCallback(
    (variantIdx: number, tempId: string | number, isChecked: boolean) => {
      setImagesState((s) =>
        s.map((variantState) => {
          if (variantState.variantIndex !== variantIdx) return variantState;

          const newImagesMeta = variantState.imagesMeta.map((meta) => {
            let newMeta = { ...meta, isFeatured: false };

            // Set gambar yang dipilih menjadi true
            if (meta.tempId === tempId && isChecked) {
              newMeta.isFeatured = true;
            }
            return newMeta;
          });

          return { ...variantState, imagesMeta: newImagesMeta };
        })
      );
    },
    []
  );

  // Tambah New Images
  const onFilesChange = (idx: number, files: FileList | null) => {
    if (!files) return;

    setFilesMap((s) => {
      const currentFiles = s[idx] || [];
      const newFiles = Array.from(files);
      const newFilesMap = s.map((f, i) =>
        i === idx ? [...currentFiles, ...newFiles] : f
      );

      // Tambahkan meta entry untuk gambar baru
      setImagesState((is) =>
        is.map((variantState) => {
          if (variantState.variantIndex !== idx) return variantState;

          const lastFileIndex = currentFiles.length; // Index awal file baru

          const newMetas = newFiles.map((_, i) => ({
            tempId: lastFileIndex + i, // Gunakan index file baru sebagai tempId
            isFeatured: false,
            altText: "",
          }));

          // Set gambar pertama yang baru diupload sebagai featured jika belum ada yang featured
          const hasFeatured = variantState.imagesMeta.some((m) => m.isFeatured);
          if (!hasFeatured && newMetas.length > 0) {
            newMetas[0].isFeatured = true;
          }

          return {
            ...variantState,
            imagesMeta: [...variantState.imagesMeta, ...newMetas],
          };
        })
      );

      return newFilesMap;
    });
  };

  // Hapus New Image
  const removeNewImage = (variantIdx: number, fileIndex: number) => {
    let wasFeatured = false;

    // Periksa apakah gambar yang dihapus adalah featured
    setImagesState((s) => {
      const variantState = s.find((v) => v.variantIndex === variantIdx);
      const meta = variantState?.imagesMeta.find((m) => m.tempId === fileIndex);
      wasFeatured = meta?.isFeatured ?? false;
      return s;
    });

    // Hapus file
    setFilesMap((s) =>
      s.map((files, i) =>
        i === variantIdx ? files.filter((_, fi) => fi !== fileIndex) : files
      )
    );

    // Hapus dan perbarui meta-nya
    setImagesState((s) =>
      s.map((variantState) => {
        if (variantState.variantIndex !== variantIdx) return variantState;

        const remainingMetas = variantState.imagesMeta.filter(
          (m) => m.tempId !== fileIndex
        );

        // Jika gambar yang dihapus adalah featured, coba set gambar pertama (lama atau baru) sebagai featured
        if (wasFeatured && remainingMetas.length > 0) {
          remainingMetas[0].isFeatured = true;
        }

        return {
          ...variantState,
          imagesMeta: remainingMetas,
        };
      })
    );
  };

  // Remove image lama (Existing Image)
  const deleteExistingImage = (variantIdx: number, imageId: string) => {
    setDeletedImages((prev) => {
      const existing = prev.find((p) => p.variantIndex === variantIdx);

      if (existing) {
        if (existing.imageIds.includes(imageId)) return prev;

        return prev.map((p) =>
          p.variantIndex === variantIdx
            ? { ...p, imageIds: [...p.imageIds, imageId] }
            : p
        );
      }

      return [...prev, { variantIndex: variantIdx, imageIds: [imageId] }];
    });

    // Perbarui meta (cek featured)
    setImagesState((s) => {
      const updatedState = s.map((variantState) => {
        if (variantState.variantIndex !== variantIdx) return variantState;

        const deletedMeta = variantState.imagesMeta.find(
          (m) => m.tempId === imageId
        );

        // Hapus meta dari gambar yang dihapus
        const remainingMetas = variantState.imagesMeta.filter(
          (m) => m.tempId !== imageId
        );

        // Jika gambar yang dihapus adalah featured, coba set gambar pertama sebagai featured
        if (deletedMeta?.isFeatured && remainingMetas.length > 0) {
          remainingMetas[0] = { ...remainingMetas[0], isFeatured: true };
        }

        return { ...variantState, imagesMeta: remainingMetas };
      });
      return updatedState;
    });
  };

  // ==============================================
  // RENDERING
  // ==============================================

  // Cari data gambar untuk Modal
  const currentModalData = (() => {
    if (!modalImage) return null;

    const { variantIndex, tempId } = modalImage;
    const variantState = imagesState.find(
      (s) => s.variantIndex === variantIndex
    );

    const allImagesMeta = variantState?.imagesMeta.find(
      (m) => m.tempId === tempId
    );
    if (!allImagesMeta) return null;

    let imageMeta: ImageMeta | undefined;

    if (typeof tempId === "string") {
      // Gambar lama (Existing Image)
      const oldImage = existingImages[variantIndex]?.find(
        (img) => img.id === tempId
      );
      if (!oldImage) return null;
      imageMeta = {
        id: oldImage.id,
        url: oldImage.url,
        isNew: false,
        isFeatured: allImagesMeta.isFeatured ?? false,
        altText: allImagesMeta.altText ?? "",
      };
    } else if (typeof tempId === "number") {
      // Gambar baru (New Image)
      const file = filesMap[variantIndex]?.[tempId];
      if (!file) return null;
      imageMeta = {
        url: URL.createObjectURL(file),
        file: file,
        fileIndex: tempId,
        isNew: true,
        isFeatured: allImagesMeta.isFeatured ?? false,
        altText: allImagesMeta.altText ?? "",
      };
    }

    return imageMeta ? { imageMeta, variantIndex, tempId } : null;
  })();

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold tracking-tight text-gray-800">
        Generated Variants ({combinations.length})
      </h3>
      <p className="text-sm text-gray-500">
        Configure media and metadata for each combination.
      </p>
      <hr />

      {combinations.map((comb, idx) => {
        const oldImages = existingImages[idx] || [];
        const newImages = filesMap[idx] || [];
        const variantState = imagesState.find((s) => s.variantIndex === idx);

        // Filter out existing images marked for deletion
        const deletedIds =
          deletedImages.find((d) => d.variantIndex === idx)?.imageIds || [];
        const currentOldImages = oldImages.filter(
          (img: any) => !deletedIds.includes(img.id)
        );

        // Gabungkan semua gambar (lama + baru) dengan metadata yang relevan
        const allImages: ImageMeta[] = [
          ...currentOldImages.map(
            (img: any): ImageMeta => {
              const meta = variantState?.imagesMeta.find(
                (m) => m.tempId === img.id
              );
              return {
                id: img.id,
                url: img.url,
                isNew: false,
                isFeatured: meta?.isFeatured ?? false,
                altText: meta?.altText ?? "",
              };
            }
          ),
          ...newImages.map(
            (file, fileIndex): ImageMeta => {
              const meta = variantState?.imagesMeta.find(
                (m) => m.tempId === fileIndex
              );
              return {
                url: URL.createObjectURL(file),
                file: file,
                isNew: true,
                fileIndex: fileIndex,
                isFeatured: meta?.isFeatured ?? false,
                altText: meta?.altText ?? "",
              };
            }
          ),
        ];

        return (
          <div key={idx} className="border p-6 rounded-xl bg-gray-50 space-y-6">
            {/* VARIANT HEADER & LABEL */}
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-semibold">
                Variant #{idx + 1}:{" "}
                <span className="text-indigo-600">
                  {comb.label.split("|").join(" • ")}
                </span>
              </h4>
            </div>

            {/* CONTENT GRID: Hapus Metadata Varian yang Lama */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* IMAGE UPLOAD & PREVIEW (Diperluas menjadi 3 kolom di md) */}
              <div className="md:col-span-3 space-y-4">
                {/* UPLOAD BUTTON */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRefs.current[idx]?.click()}
                  className="space-x-2 w-full md:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Upload Images for this Variant</span>
                </Button>

                {/* Input File (Disembunyikan) */}
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={(el) => {
                    fileInputRefs.current[idx] = el;
                  }}
                  className="hidden"
                  onChange={(e) => {
                    onFilesChange(idx, e.target.files);
                    e.target.value = ""; // Reset input
                  }}
                />

                {/* IMAGE LIST - Grid Tampilan Rapi */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pt-2 border-t">
                  {allImages.length === 0 && (
                    <div className="col-span-full text-sm text-gray-500 italic flex items-center gap-1 p-2">
                      <ImageIcon className="h-4 w-4 text-gray-400" />
                      No images uploaded yet.
                    </div>
                  )}

                  {allImages.map((img: ImageMeta) => {
                    // Tentukan tempId
                    const tempId = img.isNew ? img.fileIndex : img.id;
                    const isFeatured = img.isFeatured;

                    return (
                      <div
                        key={tempId}
                        className="aspect-square border rounded-lg overflow-hidden relative shadow-sm group cursor-pointer"
                        // Buka Modal Detail Gambar saat gambar diklik
                        onClick={() =>
                          setModalImage({ variantIndex: idx, tempId: tempId! })
                        }
                      >
                        {/* TAMPILAN GAMBAR */}
                        <img
                          src={img.url}
                          alt={img.altText || "Variant Image"}
                          className="object-cover w-full h-full"
                        />

                        {/* BADGES */}
                        {isFeatured && (
                          <span className="absolute top-1 left-1 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <Check className="h-3 w-3" /> Featured
                          </span>
                        )}
                        {img.isNew && (
                          <span className="absolute bottom-1 right-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                            NEW
                          </span>
                        )}
                        {img.altText && (
                          <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full font-medium max-w-full truncate">
                            Alt Set
                          </span>
                        )}

                        {/* OVERLAY AKSI */}
                        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity space-y-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-gray-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {/* <span className="text-white text-sm font-medium">
                            Click to Edit Details
                          </span> */}

                          {/* Tombol Hapus - Dibiarkan di sini untuk akses cepat */}
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            // Stop propagation agar tidak memicu onClick pembuka modal
                            onClick={(e) => {
                              e.stopPropagation();
                              if (img.isNew) {
                                removeNewImage(idx, img.fileIndex!);
                              } else {
                                deleteExistingImage(idx, img.id!);
                              }
                            }}
                            title="Delete Image"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* TAMPILAN MODAL (di luar map) */}
      {currentModalData && (
        <ImageDetailModal
          imageMeta={currentModalData.imageMeta}
          variantIndex={currentModalData.variantIndex}
          tempId={currentModalData.tempId}
          onClose={() => setModalImage(undefined)}
          setImageMetaField={setImageMetaField}
          setFeaturedImage={setFeaturedImage}
        />
      )}
    </div>
  );
}
