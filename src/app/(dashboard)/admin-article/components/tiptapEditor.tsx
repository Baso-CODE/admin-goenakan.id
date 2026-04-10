"use client";

import { Button } from "@/components/ui/button";
import { apiUrl } from "@/helper/apiurl";
import ImageExtension from "@tiptap/extension-image";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Strikethrough,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [StarterKit, ImageExtension],
    content: value,

    // 🟢 TAMBAHKAN BARIS INI UNTUK MENGATASI ERROR SSR HYDRATION MISMATCH
    immediatelyRender: false,

    editorProps: {
      attributes: {
        class:
          "min-h-[300px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm sm:prose-base max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      // Mengirim HTML string ke React Hook Form setiap kali ada perubahan
      onChange(editor.getHTML());
    },
  });

  // === FUNGSI UPLOAD GAMBAR KE CLOUDINARY ===
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    setIsUploading(true);
    try {
      // 1. Ambil Token
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // 2. Siapkan FormData
      const formData = new FormData();
      formData.append("image", file); // Field harus 'image' sesuai router backend

      // 3. Tembak API Khusus Tiptap
      const res = await fetch(`${apiUrl}/articles/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal mengunggah gambar");

      const data = await res.json();

      // 4. Masukkan URL gambar dari Cloudinary ke dalam Editor
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
        toast.success("Gambar berhasil disisipkan!");
      }
    } catch (error) {
      toast.error("Gagal mengunggah gambar. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
      // Reset input file agar bisa memilih gambar yang sama lagi
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 🟢 Pastikan editor sudah siap sebelum dirender
  if (!editor) {
    return (
      <div className="min-h-75 w-full rounded-md border border-input bg-stone-50 animate-pulse flex items-center justify-center text-muted-foreground text-sm">
        Loading Editor...
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2 border rounded-md overflow-hidden">
      {/* === TOOLBAR === */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 border-b">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-stone-200" : ""}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-stone-200" : ""}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "bg-stone-200" : ""}>
          <Strikethrough className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-stone-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={
            editor.isActive("heading", { level: 1 }) ? "bg-stone-200" : ""
          }>
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={
            editor.isActive("heading", { level: 2 }) ? "bg-stone-200" : ""
          }>
          <Heading2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-stone-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-stone-200" : ""}>
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-stone-200" : ""}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-stone-300 mx-1" />

        {/* === TOMBOL UPLOAD GAMBAR === */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}>
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : (
            <ImagePlus className="h-4 w-4 text-blue-600" />
          )}
        </Button>
      </div>

      {/* === AREA EDITOR === */}
      <EditorContent editor={editor} className="p-2" />
    </div>
  );
}
