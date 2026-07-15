"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { Trash2 } from "lucide-react";

// TipTap's DOM output spec is a nested tuple structure; typed loosely here.
type Spec = unknown;

// A "publication card" block: year · title · subtitle · meta · optional link.
// Editable inline in the admin (a small form), and serialized to self-contained
// HTML that the public pages render via the `.pub-card` styles in globals.css.

const FIELDS: { key: string; placeholder: string; className: string }[] = [
  { key: "year", placeholder: "Year (e.g. 2024)", className: "font-serif text-accent" },
  { key: "title", placeholder: "Title", className: "font-serif text-base text-ink" },
  { key: "subtitle", placeholder: "Subtitle / authors (optional)", className: "" },
  { key: "meta", placeholder: "Journal / publisher (optional)", className: "italic" },
  { key: "href", placeholder: "Link URL (optional, https://…)", className: "" },
];

function PubCardView({ node, updateAttributes, deleteNode }: ReactNodeViewProps) {
  const attrs = node.attrs as Record<string, string>;
  return (
    <NodeViewWrapper
      className="my-3 rounded-2xl border border-line bg-paper-soft/50 p-4"
      contentEditable={false}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">
          Card
        </span>
        <button
          type="button"
          onClick={() => deleteNode()}
          title="Remove card"
          className="rounded-md p-1 text-ink-soft hover:text-red-600 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="grid gap-2">
        {FIELDS.map((f) => (
          <input
            key={f.key}
            type="text"
            value={attrs[f.key] || ""}
            placeholder={f.placeholder}
            onChange={(e) => updateAttributes({ [f.key]: e.target.value })}
            className={`w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent transition-colors ${f.className}`}
          />
        ))}
      </div>
    </NodeViewWrapper>
  );
}

export const PubCard = Node.create({
  name: "pubCard",
  group: "block",
  atom: true,
  selectable: true,

  addAttributes() {
    const attr = (name: string) => ({
      default: "",
      parseHTML: (el: HTMLElement) => el.getAttribute(`data-${name}`) || "",
    });
    return {
      year: attr("year"),
      title: attr("title"),
      subtitle: attr("subtitle"),
      meta: attr("meta"),
      href: attr("href"),
    };
  },

  parseHTML() {
    return [{ tag: "div.pub-card" }, { tag: "a.pub-card" }];
  },

  renderHTML({ node }) {
    const { year, title, subtitle, meta, href } = node.attrs as Record<string, string>;

    const main: Spec[] = [["h3", { class: "pub-card-title" }, title || ""]];
    if (subtitle) main.push(["p", { class: "pub-card-sub" }, subtitle]);
    if (meta) main.push(["p", { class: "pub-card-meta" }, meta]);

    const inner: Spec[] = [];
    if (year) inner.push(["span", { class: "pub-card-year" }, year]);
    inner.push(["div", { class: "pub-card-main" }, ...main]);

    const data = {
      "data-year": year || "",
      "data-title": title || "",
      "data-subtitle": subtitle || "",
      "data-meta": meta || "",
      "data-href": href || "",
    };
    const body = ["div", { class: "pub-card-inner" }, ...inner];

    const spec = href
      ? [
          "a",
          mergeAttributes(data, {
            class: "pub-card",
            href,
            target: "_blank",
            rel: "noopener noreferrer",
          }),
          body,
        ]
      : ["div", mergeAttributes(data, { class: "pub-card" }), body];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return spec as any;
  },

  addNodeView() {
    return ReactNodeViewRenderer(PubCardView);
  },
});
