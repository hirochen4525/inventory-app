import { ZaikoichiItem } from "./types";

/**
 * Zaikoichi.txt パーサー
 * タブ区切り、Shift-JIS、ヘッダーなし、19列
 * col2=品番, col11=在庫数（やよい在庫）
 */
export function parseZaikoichi(text: string): ZaikoichiItem[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const items: ZaikoichiItem[] = [];

  for (const line of lines) {
    const cols = line.split("\t");
    const 品番 = (cols[2] || "").trim();
    if (!品番) continue;

    const やよい在庫 = parseFloat((cols[11] || "0").replace(/,/g, "")) || 0;

    items.push({ 品番, やよい在庫 });
  }

  return items;
}
