"use client";

import { ArrowDown, ArrowUp, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { Field, SectionDef } from "@/lib/adminConfig";

type Item = Record<string, unknown>;
type Option = { value: string; label: string };

function CellValue({
  field,
  value,
  options,
}: {
  field: Field | undefined;
  value: unknown;
  options: Option[];
}) {
  if (!field) return <span className="text-ink-soft/50">—</span>;

  if (field.key === "published") {
    const on = Boolean(value);
    return (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
          on
            ? "bg-green-600/10 text-green-700 dark:text-green-400"
            : "border border-line text-ink-soft"
        }`}
      >
        {on ? "Published" : "Draft"}
      </span>
    );
  }
  if (field.type === "select") {
    const opts = field.options ?? options;
    const label = opts.find((o) => o.value === value)?.label;
    return <span>{label ?? String(value ?? "—")}</span>;
  }
  if (field.type === "checkbox") {
    return <span>{value ? "Yes" : "No"}</span>;
  }
  if (field.type === "tags") {
    return <span>{Array.isArray(value) ? value.join(", ") : "—"}</span>;
  }
  if (field.type === "richtext") {
    // Show a plain-text preview of the HTML content in the table cell.
    const text = String(value ?? "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return <span>{text || <span className="text-ink-soft/50">—</span>}</span>;
  }
  const text = value === null || value === undefined || value === "" ? "" : String(value);
  return <span>{text || <span className="text-ink-soft/50">—</span>}</span>;
}

export default function DataTable({
  def,
  items,
  optionsBySection,
  onRowClick,
  onAddNew,
  onMove,
  onDelete,
}: {
  def: SectionDef;
  items: Item[];
  optionsBySection: Record<string, Option[]>;
  onRowClick: (index: number) => void;
  onAddNew: () => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onDelete: (index: number) => void;
}) {
  const columnKeys = def.columns ?? [def.itemTitleKey];
  const columns = columnKeys.map((key) => def.fields.find((f) => f.key === key));

  return (
    <div className="rounded-2xl border border-line bg-white/70 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl">{def.label}</h1>
          <p className="mt-0.5 text-xs text-ink-soft">{def.description}</p>
        </div>
        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-3.5 py-2 text-sm font-medium hover:bg-accent-deep transition-colors"
        >
          <Plus size={15} /> Add new
        </button>
      </div>

      {items.length === 0 ? (
        <p className="p-10 text-center text-sm text-ink-soft">
          Nothing here yet. Use “Add new” to create the first entry.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-soft/60">
                {columns.map((f, i) => (
                  <th
                    key={f?.key ?? i}
                    className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap"
                  >
                    {f?.label ?? ""}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const title = String(item[def.itemTitleKey] || "").trim() || "(untitled)";
                return (
                  <tr
                    key={i}
                    onClick={() => onRowClick(i)}
                    className="cursor-pointer border-b border-line last:border-0 transition-colors hover:bg-paper-soft/60"
                  >
                    {columns.map((f, ci) => (
                      <td
                        key={f?.key ?? ci}
                        className={`px-4 py-3 align-top ${
                          ci === 0
                            ? "font-medium text-ink max-w-[280px] truncate"
                            : "text-ink-soft max-w-[220px] truncate"
                        }`}
                        title={ci === 0 ? title : undefined}
                      >
                        <CellValue
                          field={f}
                          value={item[f?.key ?? ""]}
                          options={f?.optionsFrom ? optionsBySection[f.optionsFrom] ?? [] : []}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center justify-end gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onMove(i, -1)}
                          disabled={i === 0}
                          title="Move up"
                          className="p-1.5 text-ink-soft hover:text-accent disabled:opacity-25 transition-colors"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => onMove(i, 1)}
                          disabled={i === items.length - 1}
                          title="Move down"
                          className="p-1.5 text-ink-soft hover:text-accent disabled:opacity-25 transition-colors"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(i)}
                          title="Delete"
                          className="p-1.5 text-ink-soft hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          onClick={() => onRowClick(i)}
                          title="Edit"
                          className="p-1.5 text-ink-soft hover:text-accent transition-colors"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
