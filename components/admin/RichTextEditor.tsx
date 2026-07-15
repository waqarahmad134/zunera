"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import {
  Bold, Italic, Underline as UnderlineIcon, Heading2, Heading3, List,
  ListOrdered, Quote, Link2, Link2Off, ImagePlus, Undo2, Redo2, Loader2,
  CreditCard, Video, Columns3, Table as TableIcon,
} from "lucide-react";
import {
  ACCEPTED_IMAGE_TYPES,
  fileToDataUrl,
  imageSizeError,
} from "@/lib/clientImages";
import { PubCard, CARD_VARIANTS } from "@/components/admin/PubCardNode";
import { Embed } from "@/components/admin/EmbedNode";
import { Columns, Column, makeColumns } from "@/components/admin/LayoutNodes";

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-lg p-2 transition-colors disabled:opacity-30 ${
        active
          ? "bg-ink text-paper"
          : "text-ink-soft hover:bg-paper-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [cardMenu, setCardMenu] = useState(false);
  const [colMenu, setColMenu] = useState(false);
  const [tableMenu, setTableMenu] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false },
      }),
      Image,
      PubCard,
      Embed,
      Columns,
      Column,
      TableKit.configure({ table: { resizable: true } }),
    ],
    content: value || "<p></p>",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose-z min-h-[280px] max-w-none px-4 py-3 outline-none text-[0.95rem]",
      },
    },
  });

  async function addImage(file: File) {
    setError("");
    const sizeError = imageSizeError(file);
    if (sizeError) {
      setError(sizeError);
      return;
    }
    setUploading(true);
    try {
      // Insert as a local preview; the actual upload happens on Save.
      const dataUrl = await fileToDataUrl(file);
      editor?.chain().focus().setImage({ src: dataUrl }).run();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the image.");
    } finally {
      setUploading(false);
    }
  }

  function toggleLink() {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("Link URL (https://...)");
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  }

  if (!editor) {
    return (
      <div className="rounded-xl border border-line bg-white min-h-[330px] grid place-items-center text-ink-soft text-sm">
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-white overflow-hidden focus-within:border-accent transition-colors">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-paper-soft/60 px-2 py-1.5">
        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={15} />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-line" />
        <ToolbarButton
          title="Heading"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Subheading"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={15} />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-line" />
        <ToolbarButton
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={15} />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-line" />
        <ToolbarButton
          title={editor.isActive("link") ? "Remove link" : "Add link"}
          active={editor.isActive("link")}
          onClick={toggleLink}
        >
          {editor.isActive("link") ? <Link2Off size={15} /> : <Link2 size={15} />}
        </ToolbarButton>
        <ToolbarButton
          title="Insert image"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ImagePlus size={15} />
          )}
        </ToolbarButton>
        <div className="relative">
          <ToolbarButton
            title="Insert card"
            active={cardMenu}
            onClick={() => setCardMenu((o) => !o)}
          >
            <CreditCard size={15} />
          </ToolbarButton>
          {cardMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setCardMenu(false)}
              />
              <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-xl border border-line bg-white p-1 shadow-[0_8px_30px_rgba(33,31,26,0.12)]">
                {Object.entries(CARD_VARIANTS).map(([key, v]) => (
                  <button
                    key={key}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor
                        .chain()
                        .focus()
                        .insertContent({ type: "pubCard", attrs: { variant: key } })
                        .run();
                      setCardMenu(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper-soft hover:text-ink transition-colors"
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <ToolbarButton
          title="Insert video"
          onClick={() =>
            editor.chain().focus().insertContent({ type: "embed", attrs: {} }).run()
          }
        >
          <Video size={15} />
        </ToolbarButton>

        {/* Columns (side by side) */}
        <div className="relative">
          <ToolbarButton
            title="Side-by-side columns"
            active={colMenu}
            onClick={() => setColMenu((o) => !o)}
          >
            <Columns3 size={15} />
          </ToolbarButton>
          {colMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setColMenu(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-xl border border-line bg-white p-1 shadow-[0_8px_30px_rgba(33,31,26,0.12)]">
                {[2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor.chain().focus().insertContent(makeColumns(n)).run();
                      setColMenu(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper-soft hover:text-ink transition-colors"
                  >
                    {n} columns
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Table */}
        <div className="relative">
          <ToolbarButton
            title="Table"
            active={tableMenu}
            onClick={() => setTableMenu((o) => !o)}
          >
            <TableIcon size={15} />
          </ToolbarButton>
          {tableMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setTableMenu(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-xl border border-line bg-white p-1 shadow-[0_8px_30px_rgba(33,31,26,0.12)]">
                {[
                  { label: "Insert table (3×3)", run: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
                  { label: "Add row", run: () => editor.chain().focus().addRowAfter().run() },
                  { label: "Add column", run: () => editor.chain().focus().addColumnAfter().run() },
                  { label: "Delete row", run: () => editor.chain().focus().deleteRow().run() },
                  { label: "Delete column", run: () => editor.chain().focus().deleteColumn().run() },
                  { label: "Delete table", run: () => editor.chain().focus().deleteTable().run() },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      item.run();
                      setTableMenu(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper-soft hover:text-ink transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <span className="mx-1 h-5 w-px bg-line" />
        <ToolbarButton
          title="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={15} />
        </ToolbarButton>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) addImage(f);
            e.target.value = "";
          }}
        />
      </div>
      <EditorContent editor={editor} />
      {error && <p className="px-4 pb-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}
