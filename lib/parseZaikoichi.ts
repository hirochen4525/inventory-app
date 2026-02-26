import { ZaikoichiItem } from "./types";

/**
 * Zaikoichi.txt パーサー
 * タブ区切り、Shift-JIS想定
 * フォーマット: 品番\tやよい在庫数
 * 1行目ヘッダー
 */
export function parseZaikoichi(text: string): ZaikoichiItem[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const dataLines = lines.slice(1);
  const items: ZaikoichiItem[] = [];

  for (const line of dataLines) {
    const cols = line.split("\t");
    if (cols.length < 2) continue;

    const 品番 = cols[0].trim();
    const やよい在庫 = parseFloat(cols[1].replace(/,/g, "")) || 0;

    if (品番) {
      items.push({ 品番, やよい在庫 });
    }
  }

  return items;
}
