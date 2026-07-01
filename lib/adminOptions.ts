import type { SectionDef } from "@/lib/adminConfig";
import type { Item, Option } from "@/components/admin/ItemForm";

// Fetches the option lists for every `select` field on a section (e.g. the
// blog post "Category" field pulls its options from the categories section).
export async function fetchOptionsBySection(
  def: SectionDef
): Promise<Record<string, Option[]>> {
  const entries: Record<string, Option[]> = {};
  for (const f of def.fields) {
    if (!f.optionsFrom) continue;
    const res = await fetch(`/api/admin/content?section=${f.optionsFrom}`);
    if (!res.ok) continue;
    const { data } = await res.json();
    entries[f.optionsFrom] = (data as Item[]).map((o) => ({
      value: String(o[f.optionValue ?? "slug"]),
      label: String(o[f.optionLabel ?? "name"]),
    }));
  }
  return entries;
}
