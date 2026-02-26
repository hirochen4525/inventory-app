import { ShodaiItem } from "./types";

/**
 * Shodai.txt パーサー
 * タブ区切り、Shift-JIS想定
 * フォーマット: 品番\t商品名\t倉庫コード\t在庫金額
 * 1行目ヘッダー
 */
export function parseShodai(text: string): ShodaiItem[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // ヘッダー行スキップ
  const dataLines = lines.slice(1);
  const items: ShodaiItem[] = [];

  for (const line of dataLines) {
    const cols = line.split("\t");
    if (cols.length < 4) continue;

    const 品番 = cols[0].trim();
    const 商品名 = cols[1].trim();
    const 倉庫コード = cols[2].trim();
    const 在庫金額 = parseFloat(cols[3].replace(/,/g, "")) || 0;

    if (品番) {
      items.push({ 品番, 商品名, 倉庫コード, 在庫金額 });
    }
  }

  return items;
}
