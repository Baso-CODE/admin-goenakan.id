// components/upload-media/videoDetailCore.tsx
"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input"; // Tambahkan Input
import { Check, Star, X, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// Perubahan: Tambahkan 'title'
export interface VideoMeta {
  url: string;
  title?: string;
  altText?: string;
  isFeatured?: boolean;
  isNew?: boolean;
}

interface VideoDetailModalProps {
  tempId: string | number;
  videoMeta: VideoMeta;
  onClose: () => void;

  setVideoMetaField: (
    // Ubah nama fungsi
    tempId: string | number,
    patch: Partial<VideoMeta>
  ) => void;

  setFeaturedVideo: (tempId: string | number, isFeatured: boolean) => void; // Ubah nama fungsi
}

export const VideoDetailModalCore = ({
  // Ubah nama komponen
  videoMeta,
  tempId,
  onClose,
  setVideoMetaField,
  setFeaturedVideo,
}: VideoDetailModalProps) => {
  // State lokal untuk form
  const [title, setTitle] = useState(videoMeta.title || ""); // Tambahkan state title
  const [altText, setAltText] = useState(videoMeta.altText || "");

  const handleSaveAndClose = useCallback(() => {
    // Simpan kedua field
    setVideoMetaField(tempId, { title, altText });
    onClose();
  }, [title, altText, onClose, setVideoMetaField, tempId]);

  const handleSetFeatured = (checked: boolean) => {
    setFeaturedVideo(tempId, checked);
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row">
        <button
          onClick={handleSaveAndClose}
          className="absolute top-3 right-3 p-1 rounded-full bg-black/10 hover:bg-black/20 text-gray-700 transition z-10"
          title="Save Changes & Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* --- KOLOM KIRI: PREVIEW VIDEO --- */}
        <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center p-6 relative min-h-[300px]">
          {videoMeta.url ? (
            // Mengubah tag img menjadi video
            <video
              src={videoMeta.url}
              controls
              className="max-w-full max-h-[300px] object-contain shadow-md rounded-md"
            />
          ) : (
            <div className="text-gray-400 text-sm">No Video</div>
          )}

          {/* Badge Status */}
          {videoMeta.isFeatured && (
            <Badge className="absolute top-4 left-4 bg-indigo-600 hover:bg-indigo-700 gap-1 pl-1 pr-2">
              <Star className="w-3 h-3 fill-white" /> Featured Video
            </Badge>
          )}
          {videoMeta.isNew && (
            <Badge className="absolute top-4 right-4 bg-green-500 hover:bg-green-600">
              NEW
            </Badge>
          )}
        </div>

        {/* --- KOLOM KANAN: FORM EDIT --- */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            {" "}
            {/* Mengurangi space-y sedikit */}
            <div>
              <h3 className="text-xl font-bold text-gray-900">Video Details</h3>
              <p className="text-sm text-gray-500">
                Edit metadata untuk meningkatkan discoverability video.
              </p>
            </div>
            <hr className="border-gray-100" />
            {/* Input 1: Title */}
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="text-sm font-semibold text-gray-700"
              >
                Video Title
              </Label>
              <Input
                id="title"
                placeholder="e.g., 'Product X - Official Promotion Video'"
                value={title ?? ""}
                onChange={(e) => setTitle(e.target.value)}
                className="focus-visible:ring-indigo-500"
              />
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
                placeholder="Describe the video content briefly, e.g. 'Model demonstrates usage of T-Shirt size L'"
                className="resize-none min-h-20 focus-visible:ring-indigo-500" // Mengurangi min-h
                value={altText ?? ""}
                onChange={(e) => setAltText(e.target.value)}
              />
            </div>
            {/* Input 3: Featured Toggle */}
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-semibold text-gray-700">
                Display Setting
              </Label>
              <label
                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  videoMeta.isFeatured
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      videoMeta.isFeatured
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-400"
                    }`}
                  >
                    {videoMeta.isFeatured && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      videoMeta.isFeatured ? "text-indigo-700" : "text-gray-600"
                    }`}
                  >
                    Set as Featured Video
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={!!videoMeta.isFeatured}
                  onChange={(e) => handleSetFeatured(e.target.checked)}
                />
              </label>
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
