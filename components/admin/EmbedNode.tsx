"use client";

import { useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { Trash2 } from "lucide-react";

// A video embed block. Accepts a YouTube/Vimeo link OR a full <iframe> embed
// code, and always renders a clean iframe pointing at the provider's embed URL
// (so we never store arbitrary iframe markup). Serialized to self-contained
// HTML that public pages render via the .embed styles in globals.css.

const IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

/** Turn a link or embed code into a safe provider embed URL, or null. */
export function toEmbedSrc(input: string): string | null {
  const s = (input || "").trim();
  if (!s) return null;
  const url = s.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)?.[1] || s;

  let m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  if (m) return `https://www.youtube.com/embed/${m[1]}`;

  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;

  return null;
}

function EmbedView({ node, updateAttributes, deleteNode }: ReactNodeViewProps) {
  const src = (node.attrs as { src: string }).src;
  const [raw, setRaw] = useState(src);
  const [error, setError] = useState("");

  function apply(value: string) {
    setRaw(value);
    if (!value.trim()) {
      setError("");
      return;
    }
    const parsed = toEmbedSrc(value);
    if (parsed) {
      updateAttributes({ src: parsed });
      setError("");
    } else {
      setError("Paste a YouTube or Vimeo link, or its embed code.");
    }
  }

  return (
    <NodeViewWrapper
      className="my-3 rounded-2xl border border-line bg-paper-soft/50 p-4"
      contentEditable={false}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">
          Video
        </span>
        <button
          type="button"
          onClick={() => deleteNode()}
          title="Remove video"
          className="rounded-md p-1 text-ink-soft hover:text-red-600 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {src && (
        <div className="embed" style={{ margin: "0 0 0.85rem" }}>
          <iframe
            src={src}
            title="Embedded video"
            loading="lazy"
            allow={IFRAME_ALLOW}
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      )}

      <input
        type="text"
        value={raw}
        onChange={(e) => apply(e.target.value)}
        placeholder="Paste a YouTube/Vimeo link or embed code"
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </NodeViewWrapper>
  );
}

export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (el: HTMLElement) =>
          el.querySelector("iframe")?.getAttribute("src") ||
          el.getAttribute("data-src") ||
          "",
      },
    };
  },

  parseHTML() {
    return [{ tag: "div.embed" }];
  },

  renderHTML({ node }) {
    const src = (node.attrs as { src: string }).src || "";
    const iframe = [
      "iframe",
      {
        src,
        title: "Embedded video",
        loading: "lazy",
        allow: IFRAME_ALLOW,
        referrerpolicy: "strict-origin-when-cross-origin",
        allowfullscreen: "true",
      },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ["div", mergeAttributes({ class: "embed", "data-src": src }), iframe] as any;
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedView);
  },
});
