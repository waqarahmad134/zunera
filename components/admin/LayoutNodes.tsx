import { Node, mergeAttributes } from "@tiptap/core";

// Side-by-side layout: a `columns` container holding two or more `column`
// nodes, each with its own block content (text, videos, cards, …). Rendered as
// a responsive grid via the .cols / .col styles in globals.css — columns sit
// side by side on wider screens and stack on mobile.

export const Column = Node.create({
  name: "column",
  content: "block+",
  isolating: true,

  parseHTML() {
    return [{ tag: "div.col" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "col" }), 0];
  },
});

export const Columns = Node.create({
  name: "columns",
  group: "block",
  content: "column{2,}",
  isolating: true,

  parseHTML() {
    return [{ tag: "div.cols" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const count = node.childCount || 2;
    return [
      "div",
      mergeAttributes(HTMLAttributes, { class: `cols cols-${count}` }),
      0,
    ];
  },
});

/** Build the content for an N-column layout (each column an empty paragraph). */
export function makeColumns(count: number) {
  return {
    type: "columns",
    content: Array.from({ length: count }, () => ({
      type: "column",
      content: [{ type: "paragraph" }],
    })),
  };
}
