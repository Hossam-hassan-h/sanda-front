/**
 * Build a compact list of page tokens for pagination.
 * For <= MAX_VISIBLE pages, show every page.
 * Otherwise show: 1, …, (current-1, current, current+1), …, last
 */
export function buildPageItems(current: number, total: number): (number | "ellipsis")[] {
  const MAX_VISIBLE = 7;
  if (total <= MAX_VISIBLE) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("ellipsis");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total - 1) items.push("ellipsis");
  items.push(total);
  return items;
}
