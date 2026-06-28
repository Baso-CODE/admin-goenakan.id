"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Plus, Star, X, Layers } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useRef, useState, useEffect } from "react";
import { ImageDetailModalCore } from "../imageDetailCore";
import { VideoDetailModalCore } from "../videoDetailCore";
import { MockupAreaSelector } from "../MockupAreaSelector";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductMedia {
  id: string;
  url: string;
  altText?: string;
  isFeatured?: boolean;
}

interface Product {
  id: string;
  images: ProductMedia[];
  videos: ProductMedia[];
  isCustom?: boolean;
  isMultiFace?: boolean;
  mockupFrontImageId?: string | null;
  mockupBackImageId?: string | null;
}

interface FormUpdateProductMediaProps {
  productId: string;
  initialData: Product | undefined;
  isSubmitting: boolean;
  onAddImage: (
    file: File,
    onProgress?: (progress: number) => void,
  ) => Promise<void>;
  onDeleteImage: (mediaId: string) => Promise<void>;
  onAddVideo: (
    file: File,
    onProgress?: (progress: number) => void,
  ) => Promise<void>;
  onDeleteVideo: (mediaId: string) => Promise<void>;
  onUpdateMediaMetadata: (mediaId: string, updates: any) => Promise<void>;
  onUpdateVideoMetadata: (mediaId: string, updates: any) => Promise<void>;
  onUpdateMediaMockups?: (mediaId: string, mockups: any[]) => Promise<void>;
  onUpdateMockupSettings?: (settings: {
    isMultiFace: boolean;
    mockupFrontImageId: string | null;
    mockupBackImageId: string | null;
  }) => Promise<void>;
}

function ExistingMediaDisplay({
  media,
  type,
  onDelete,
  onEdit,
  onConfigureMockups,
  isSubmitting,
}: {
  media: ProductMedia[];
  type: "image" | "video";
  onDelete: (mediaId: string) => Promise<void>;
  onEdit: (item: any) => void;
  onConfigureMockups?: (item: any) => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 border rounded-lg bg-gray-50/50 min-h-30">
      {media.map((m) => (
        <div
          key={m.id}
          // PERBAIKAN 1: Tambahkan 'group' di sini
          className="group relative aspect-square rounded-lg overflow-hidden border bg-white shadow-sm hover:shadow-md transition-all">
          {type === "image" ? (
            <Image src={m.url} alt="img" fill className="object-cover" />
          ) : (
            // PERBAIKAN 3: Video tanpa controls agar overlay hover bekerja
            <video
              src={m.url}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          )}

          {m.isFeatured && (
            <div className="absolute top-0 left-0 bg-yellow-500 p-1.5 rounded-br-lg z-20 shadow-sm">
              <Star className="h-3.5 w-3.5 fill-white text-white" />
            </div>
          )}

          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
            {type === "image" && onConfigureMockups && (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full bg-white hover:bg-gray-100 text-gray-700 shadow-md"
                onClick={() => onConfigureMockups(m)}
                disabled={isSubmitting}
                title="Atur Area Mockup"
              >
                <Layers className="h-4 w-4 text-indigo-600" />
              </Button>
            )}

            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-white hover:bg-gray-100 text-gray-700 shadow-md"
              onClick={() => onEdit(m)}
              disabled={isSubmitting}
              title="Edit Detail SEO">
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-8 w-8 rounded-full shadow-md"
              onClick={() => onDelete(m.id)}
              disabled={isSubmitting}
              title="Hapus Media">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {media.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center h-full text-muted-foreground italic text-sm">
          <p>Belum ada {type === "image" ? "gambar" : "video"} produk.</p>
        </div>
      )}
    </div>
  );
}

export default function FormUpdateProductMedia({
  initialData,
  isSubmitting,
  onAddImage,
  onDeleteImage,
  onAddVideo,
  onDeleteVideo,
  onUpdateMediaMetadata,
  onUpdateVideoMetadata,
  onUpdateMediaMockups,
  onUpdateMockupSettings,
}: FormUpdateProductMediaProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<ProductMedia | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const [selectedMockupImage, setSelectedMockupImage] = useState<any | null>(null);
  const [isMockupModalOpen, setIsMockupModalOpen] = useState(false);
  const [mockupAreasState, setMockupAreasState] = useState<any[]>([]);

  // State untuk pengaturan mockup placement
  const [isMultiFace, setIsMultiFace] = useState(false);
  const [mockupFrontImageId, setMockupFrontImageId] = useState<string | null>(null);
  const [mockupBackImageId, setMockupBackImageId] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (initialData) {
      setIsMultiFace(!!initialData.isMultiFace);
      setMockupFrontImageId(initialData.mockupFrontImageId || null);
      setMockupBackImageId(initialData.mockupBackImageId || null);
    }
  }, [initialData]);

  const handleSaveSettings = async () => {
    if (!onUpdateMockupSettings) return;
    setIsSavingSettings(true);
    try {
      await onUpdateMockupSettings({
        isMultiFace,
        mockupFrontImageId,
        mockupBackImageId: isMultiFace ? mockupBackImageId : null,
      });
    } catch (err) {
      console.error("Gagal menyimpan pengaturan mockup:", err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleOpenMockupModal = (image: any) => {
    setSelectedMockupImage(image);
    setMockupAreasState(image.mockupAreas || []);
    setIsMockupModalOpen(true);
  };

  const handleSaveMockupAreas = async () => {
    if (!selectedMockupImage || !onUpdateMediaMockups) return;
    try {
      await onUpdateMediaMockups(selectedMockupImage.id, mockupAreasState);
      setIsMockupModalOpen(false);
      setSelectedMockupImage(null);
    } catch (err) {
      console.error("Gagal menyimpan area mockup:", err);
    }
  };

  const handleOpenModal = (item: ProductMedia) => {
    setSelectedMedia(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedMedia(null);
    setIsModalOpen(false);
  };

  const handleOpenVideoModal = (item: any) => {
    setSelectedVideo(item);
    setIsVideoModalOpen(true);
  };

  const handleVideoModalUpdate = (id: string | number, patch: any) => {
    onUpdateVideoMetadata(id as string, patch);
    setSelectedVideo((prev: any) => (prev ? { ...prev, ...patch } : null));
  };

  const handleModalUpdateMeta = (id: number | string, patch: any) => {
    if (selectedMedia && selectedMedia.id === id) {
      onUpdateMediaMetadata(id as string, patch);
      setSelectedMedia((prev) => (prev ? { ...prev, ...patch } : null));
    }
  };

  const handleModalSetFeatured = (id: number | string, isFeatured: boolean) => {
    if (selectedMedia && selectedMedia.id === id) {
      onUpdateMediaMetadata(id as string, { isFeatured });
    }
  };

  const handleVideoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    setUploadProgress(0);

    try {
      await onAddVideo(file, (progress) => {
        setUploadProgress(Math.round(progress));
      });
    } catch (error) {
      console.error("Video upload failed", error);
    } finally {
      setIsUploadingVideo(false);
      setUploadProgress(0);
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    }
  };

  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      await onAddImage(file);
    } catch (error) {
      console.error("Image upload failed", error);
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Update Gambar & Video Produk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* --- Gambar Produk --- */}
          <div>
            <h3 className="text-lg font-medium mb-2">Gambar Produk</h3>
            <ExistingMediaDisplay
              media={initialData?.images || []}
              type="image"
              onDelete={onDeleteImage}
              onEdit={handleOpenModal}
              onConfigureMockups={handleOpenMockupModal}
              isSubmitting={isSubmitting}
            />
            <div className="mt-3 flex gap-2 items-center">
              <Input
                type="file"
                accept="image/*"
                ref={imageInputRef}
                onChange={handleImageFileChange}
                disabled={isSubmitting || isUploadingImage}
                className="max-w-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => imageInputRef.current?.click()}
                disabled={isSubmitting || isUploadingImage}>
                <Plus className="h-4 w-4 mr-2" />
                {isUploadingImage ? "Uploading..." : "Tambah Gambar"}
              </Button>
            </div>
          </div>

          {/* --- Video Produk --- */}
          <div>
            <h3 className="text-lg font-medium mb-2">Video Produk</h3>
            <ExistingMediaDisplay
              media={initialData?.videos || []}
              type="video"
              onDelete={onDeleteVideo}
              isSubmitting={isSubmitting}
              onEdit={handleOpenVideoModal}
            />
            <div className="mt-3 flex gap-2 items-center">
              <Input
                type="file"
                accept="video/mp4,video/quicktime"
                ref={videoInputRef}
                onChange={handleVideoFileChange}
                disabled={isSubmitting || isUploadingVideo}
                className="max-w-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                disabled={isSubmitting || isUploadingVideo}
                className="min-w-32">
                {isUploadingVideo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploadProgress > 0
                      ? `Uploading (${uploadProgress}%)`
                      : "Uploading..."}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Video
                  </>
                )}
              </Button>
            </div>
            {isUploadingVideo && uploadProgress > 0 && (
              <div className="w-full max-w-sm bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {initialData?.isCustom && (
        <Card className="mt-6 border-stone-200">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <Layers className="h-4.5 w-4.5 text-indigo-500" /> Pengaturan Area Custom Mockup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isMultiFace"
                checked={isMultiFace}
                onCheckedChange={(checked) => setIsMultiFace(!!checked)}
              />
              <Label
                htmlFor="isMultiFace"
                className="text-sm font-medium leading-none cursor-pointer text-stone-700 select-none"
              >
                Mendukung Dua Sisi (Tampak Depan & Belakang)
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Dropdown: Tampak Depan */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {isMultiFace ? "Gambar Tampak Depan" : "Gambar Area Placement Mockup"}
                </Label>
                <Select
                  value={mockupFrontImageId || ""}
                  onValueChange={(val) => setMockupFrontImageId(val || null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih gambar produk..." />
                  </SelectTrigger>
                  <SelectContent>
                    {initialData?.images?.map((img) => (
                      <SelectItem key={img.id} value={img.id}>
                        <div className="flex items-center gap-2">
                          <div className="relative w-6 h-6 border rounded-sm overflow-hidden shrink-0">
                            <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs truncate max-w-[180px]">
                            {img.altText || `Gambar (${img.id.slice(0, 8)})`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dropdown: Tampak Belakang */}
              {isMultiFace && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Gambar Tampak Belakang
                  </Label>
                  <Select
                    value={mockupBackImageId || ""}
                    onValueChange={(val) => setMockupBackImageId(val || null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih gambar produk..." />
                    </SelectTrigger>
                    <SelectContent>
                      {initialData?.images?.map((img) => (
                        <SelectItem key={img.id} value={img.id}>
                          <div className="flex items-center gap-2">
                            <div className="relative w-6 h-6 border rounded-sm overflow-hidden shrink-0">
                              <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs truncate max-w-[180px]">
                              {img.altText || `Gambar (${img.id.slice(0, 8)})`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSubmitting || isSavingSettings}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Pengaturan Mockup"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {isModalOpen && selectedMedia && (
        <ImageDetailModalCore
          tempId={selectedMedia.id as any}
          imageMeta={{
            ...selectedMedia,
            isNew: false,
          }}
          onClose={handleCloseModal}
          setImageMetaField={handleModalUpdateMeta}
          setFeaturedImage={handleModalSetFeatured}
        />
      )}
      {isVideoModalOpen && selectedVideo && (
        <VideoDetailModalCore
          tempId={selectedVideo.id}
          videoMeta={{
            ...selectedVideo,
            isNew: false,
          }}
          onClose={() => {
            setIsVideoModalOpen(false);
            setSelectedVideo(null);
          }}
          setVideoMetaField={handleVideoModalUpdate}
          setFeaturedVideo={(id, isFeatured) =>
            handleVideoModalUpdate(id, { isFeatured })
          }
        />
      )}
      {isMockupModalOpen && selectedMockupImage && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
              <div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-500" />
                  Konfigurasi Area Mockup
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Tentukan satu atau lebih penempatan custom mockup untuk gambar ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMockupModalOpen(false);
                  setSelectedMockupImage(null);
                }}
                className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-stone-50/30 dark:bg-stone-950/20">
              <MockupAreaSelector
                imageUrl={selectedMockupImage.url}
                areas={mockupAreasState}
                onChange={(newAreas) => setMockupAreasState(newAreas)}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsMockupModalOpen(false);
                  setSelectedMockupImage(null);
                }}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSaveMockupAreas}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Area Mockup"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
