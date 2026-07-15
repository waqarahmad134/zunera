"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { Trash2 } from "lucide-react";

// A "card" block with three visual variants, matching the site's card styles:
//   paper   — year · title · subtitle · meta (compact publication row)
//   book    — label · year eyebrow, large title, italic meta, description
//   compact — small icon + title + meta (op-ed / media row)
// Editable inline in the admin; serialized to self-contained HTML that the
// public pages render via the .pub-card styles in globals.css.

type Spec = unknown;

export const CARD_VARIANTS: Record<
  string,
  { label: string; fields: string[] }
> = {
  paper: { label: "Paper / article", fields: ["year", "title", "subtitle", "meta", "href"] },
  book: { label: "Book (large)", fields: ["eyebrow", "year", "title", "meta", "description", "href"] },
  compact: { label: "Compact (with icon)", fields: ["title", "meta", "href"] },
};

const FIELD_META: Record<string, { placeholder: string; className?: string }> = {
  eyebrow: { placeholder: "Label (e.g. Author, Editor)", className: "uppercase text-accent tracking-wide" },
  year: { placeholder: "Year (e.g. 2024)", className: "font-serif text-accent" },
  title: { placeholder: "Title", className: "font-serif text-ink" },
  subtitle: { placeholder: "Subtitle / authors" },
  meta: { placeholder: "Publisher / journal / outlet · date", className: "italic" },
  description: { placeholder: "Description" },
  href: { placeholder: "Link URL (optional, https://…)" },
};

function CardPreview({ attrs }: { attrs: Record<string, string> }) {
  const v = attrs.variant || "paper";
  if (v === "book") {
    return (
      <div className="pub-card pub-card--book" style={{ margin: 0 }}>
        {(attrs.eyebrow || attrs.year) && (
          <p className="pub-card-eyebrow">
            {[attrs.eyebrow, attrs.year].filter(Boolean).join(" · ")}
          </p>
        )}
        <h3 className="pub-card-title">{attrs.title || "Untitled"}</h3>
        {attrs.meta && <p className="pub-card-meta">{attrs.meta}</p>}
        {attrs.description && <div className="pub-card-desc">{attrs.description}</div>}
      </div>
    );
  }
  if (v === "compact") {
    return (
      <div className="pub-card pub-card--compact" style={{ margin: 0 }}>
        <span className="pub-card-icon" />
        <div className="pub-card-main">
          <h3 className="pub-card-title">{attrs.title || "Untitled"}</h3>
          {attrs.meta && <p className="pub-card-meta">{attrs.meta}</p>}
        </div>
      </div>
    );
  }
  return (
    <div className="pub-card pub-card--paper" style={{ margin: 0 }}>
      <div className="pub-card-inner">
        {attrs.year && <span className="pub-card-year">{attrs.year}</span>}
        <div className="pub-card-main">
          <h3 className="pub-card-title">{attrs.title || "Untitled"}</h3>
          {attrs.subtitle && <p className="pub-card-sub">{attrs.subtitle}</p>}
          {attrs.meta && <p className="pub-card-meta">{attrs.meta}</p>}
        </div>
      </div>
    </div>
  );
}

function PubCardView({ node, updateAttributes, deleteNode }: ReactNodeViewProps) {
  const attrs = node.attrs as Record<string, string>;
  const variant = attrs.variant || "paper";
  const fields = CARD_VARIANTS[variant]?.fields ?? CARD_VARIANTS.paper.fields;
  const hasContent = fields.some((f) => f !== "href" && attrs[f]);

  return (
    <NodeViewWrapper
      className="my-3 rounded-2xl border border-line bg-paper-soft/50 p-4"
      contentEditable={false}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <select
          value={variant}
          onChange={(e) => updateAttributes({ variant: e.target.value })}
          className="rounded-md border border-line bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent outline-none"
        >
          {Object.entries(CARD_VARIANTS).map(([key, v]) => (
            <option key={key} value={key}>
              {v.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => deleteNode()}
          title="Remove card"
          className="rounded-md p-1 text-ink-soft hover:text-red-600 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {hasContent && (
        <div className="mb-3">
          <CardPreview attrs={attrs} />
        </div>
      )}

      <div className="grid gap-2">
        {fields.map((key) => (
          <input
            key={key}
            type="text"
            value={attrs[key] || ""}
            placeholder={FIELD_META[key]?.placeholder ?? key}
            onChange={(e) => updateAttributes({ [key]: e.target.value })}
            className={`w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent transition-colors ${FIELD_META[key]?.className ?? ""}`}
          />
        ))}
      </div>
    </NodeViewWrapper>
  );
}

const ATTR_KEYS = ["variant", "eyebrow", "year", "title", "subtitle", "meta", "description", "href"];

export const PubCard = Node.create({
  name: "pubCard",
  group: "block",
  atom: true,
  selectable: true,

  addAttributes() {
    const attrs: Record<string, unknown> = {};
    for (const key of ATTR_KEYS) {
      attrs[key] = {
        default: key === "variant" ? "paper" : "",
        parseHTML: (el: HTMLElement) =>
          el.getAttribute(`data-${key}`) || (key === "variant" ? "paper" : ""),
      };
    }
    return attrs;
  },

  parseHTML() {
    return [{ tag: "div.pub-card" }, { tag: "a.pub-card" }];
  },

  renderHTML({ node }) {
    const a = node.attrs as Record<string, string>;
    const variant = a.variant || "paper";

    let body: Spec;
    if (variant === "book") {
      const children: Spec[] = [];
      const eyebrow = [a.eyebrow, a.year].filter(Boolean).join(" · ");
      if (eyebrow) children.push(["p", { class: "pub-card-eyebrow" }, eyebrow]);
      children.push(["h3", { class: "pub-card-title" }, a.title || ""]);
      if (a.meta) children.push(["p", { class: "pub-card-meta" }, a.meta]);
      if (a.description) children.push(["div", { class: "pub-card-desc" }, a.description]);
      body = children;
    } else if (variant === "compact") {
      const main: Spec[] = [["h3", { class: "pub-card-title" }, a.title || ""]];
      if (a.meta) main.push(["p", { class: "pub-card-meta" }, a.meta]);
      body = [
        ["span", { class: "pub-card-icon" }],
        ["div", { class: "pub-card-main" }, ...main],
      ];
    } else {
      const main: Spec[] = [["h3", { class: "pub-card-title" }, a.title || ""]];
      if (a.subtitle) main.push(["p", { class: "pub-card-sub" }, a.subtitle]);
      if (a.meta) main.push(["p", { class: "pub-card-meta" }, a.meta]);
      const inner: Spec[] = [];
      if (a.year) inner.push(["span", { class: "pub-card-year" }, a.year]);
      inner.push(["div", { class: "pub-card-main" }, ...main]);
      body = [["div", { class: "pub-card-inner" }, ...inner]];
    }

    const data: Record<string, string> = {};
    for (const key of ATTR_KEYS) data[`data-${key}`] = a[key] || "";
    const cls = `pub-card pub-card--${variant}`;

    const spec = a.href
      ? [
          "a",
          mergeAttributes(data, { class: cls, href: a.href, target: "_blank", rel: "noopener noreferrer" }),
          ...(body as Spec[]),
        ]
      : ["div", mergeAttributes(data, { class: cls }), ...(body as Spec[])];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return spec as any;
  },

  addNodeView() {
    return ReactNodeViewRenderer(PubCardView);
  },
});
