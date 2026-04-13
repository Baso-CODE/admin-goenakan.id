"use client";

import { apiUrl } from "@/helper/apiurl";
import {
  EditorContent,
  EditorContext,
  useCurrentEditor,
  useEditor,
} from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// --- Tiptap Core Extensions ---
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Selection } from "@tiptap/extensions";
import { StarterKit } from "@tiptap/starter-kit";

// --- Tiptap Table Extensions ---

import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Asumsi pakai shadcn tooltip

// --- Tiptap Node (Bawaan Template) ---
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

// --- Tiptap UI (Bawaan Template) ---
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
  ColorHighlightPopoverContent,
} from "@/components/tiptap-ui/color-highlight-popover";
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import {
  LinkButton,
  LinkContent,
  LinkPopover,
} from "@/components/tiptap-ui/link-popover";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";
import {
  ArrowDownToLine,
  ArrowRightToLine,
  MinusSquare,
  Table as TableIcon,
  Trash2,
} from "lucide-react";

// --- Hooks ---
import { useCursorVisibility } from "@/hooks/use-cursor-visibility";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { useWindowSize } from "@/hooks/use-window-size";

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss";
import { Table } from "@tiptap/extension-table";

// ─── TYPES PROPS ───
interface SimpleEditorProps {
  value?: string;
  onChange?: (value: string) => void;
}

// ─── KOMPONEN TOMBOL TABEL KHUSUS ───
// Kita buat komponen ini agar bisa mengakses hook `useCurrentEditor`
const TableControls = () => {
  const { editor } = useCurrentEditor();

  if (!editor) return null;

  const isTableActive = editor.isActive("table");

  return (
    <>
      <ToolbarSeparator />
      <ToolbarGroup>
        {/* Tombol Insert Table (Selalu Aktif) */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="default"
                className="h-8 w-8"
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .insertTable({ rows: 5, cols: 5, withHeaderRow: true })
                    .run()
                }>
                <TableIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert Table (5x5)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Tombol Manipulasi Tabel (Hanya Aktif jika kursor ada di dalam tabel) */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="default"
                className="h-8 w-8"
                disabled={!isTableActive}
                onClick={() => editor.chain().focus().addRowAfter().run()}>
                <ArrowDownToLine className="h-4 w-4 text-blue-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Row After</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="default"
                className="h-8 w-8"
                disabled={!isTableActive}
                onClick={() => editor.chain().focus().addColumnAfter().run()}>
                <ArrowRightToLine className="h-4 w-4 text-blue-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Column After</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="default"
                className="h-8 w-8"
                disabled={!isTableActive}
                onClick={() => editor.chain().focus().deleteRow().run()}>
                <MinusSquare className="h-4 w-4 text-orange-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete Row</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="default"
                className="h-8 w-8"
                disabled={!isTableActive}
                onClick={() => editor.chain().focus().deleteTable().run()}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete Table</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ToolbarGroup>
    </>
  );
};

// ─── TOOLBAR COMPONENTS ───
const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  isMobile: boolean;
}) => {
  return (
    <>
      <Spacer />
      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu
          modal={false}
          types={["bulletList", "orderedList", "taskList"]}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <TableControls />

      <ToolbarSeparator />
      <ToolbarGroup>
        <ImageUploadButton text="Add Image" />
      </ToolbarGroup>
      <Spacer />
    </>
  );
};

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link";
  onBack: () => void;
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>
    <ToolbarSeparator />
    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
);

// ─── MAIN EDITOR COMPONENT ───
export function SimpleEditor({ value = "", onChange }: SimpleEditorProps) {
  const isMobile = useIsBreakpoint();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main",
  );
  const toolbarRef = useRef<HTMLDivElement>(null);

  // ─── CUSTOM UPLOAD CLOUDINARY LOGIC ───
  const customCloudinaryUpload = async (file: File): Promise<string> => {
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${apiUrl}/articles/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal mengunggah gambar");
      const data = await res.json();

      if (data.url) {
        toast.success("Gambar berhasil disisipkan!");
        return data.url;
      }
      throw new Error("URL tidak ditemukan");
    } catch (error) {
      toast.error("Gagal mengunggah gambar.");
      throw error;
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class:
          "simple-editor min-h-[400px] outline-none px-4 py-6 prose max-w-none prose-sm sm:prose-base",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,

      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: 5 * 1024 * 1024,
        limit: 10,
        upload: customCloudinaryUpload,
        onError: (error) => {
          console.error("Upload failed:", error);
          toast.error("Gagal memproses gambar.");
        },
      }),

      // 🟢 INISIALISASI EKSTENSI TABEL
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });
  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  if (!editor) return null;

  return (
    <div className="simple-editor-wrapper border rounded-md shadow-sm overflow-hidden bg-white">
      <EditorContext.Provider value={{ editor }}>
        {/* Toolbar Header */}
        <div className="bg-stone-50 border-b">
          <Toolbar
            ref={toolbarRef}
            className="flex-wrap px-2 py-1"
            style={{
              ...(isMobile
                ? {
                    bottom: `calc(100% - ${height - rect.y}px)`,
                  }
                : {}),
            }}>
            {mobileView === "main" ? (
              <MainToolbarContent
                onHighlighterClick={() => setMobileView("highlighter")}
                onLinkClick={() => setMobileView("link")}
                isMobile={isMobile}
              />
            ) : (
              <MobileToolbarContent
                type={mobileView === "highlighter" ? "highlighter" : "link"}
                onBack={() => setMobileView("main")}
              />
            )}
          </Toolbar>
        </div>

        {/* Content Area */}
        <div className="bg-white">
          <EditorContent
            editor={editor}
            role="presentation"
            className="simple-editor-content"
          />
        </div>
      </EditorContext.Provider>
    </div>
  );
}
