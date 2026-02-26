import { ShodaiItem } from "./types";

/**
 * Shodai.txt パーサー
 * タブ区切り、Shift-JIS、ヘッダーなし、43列
 * col0=品番, col1=商品名, col18=倉庫コード, col34=原価（在庫金額）
 */
export function parseShodai(text: string): ShodaiItem[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const items: ShodaiItem[] = [];

  for (const line of lines) {
    const cols = line.split("\t");
    const 品番 = (cols[0] || "").trim();

    // 空行やカテゴリ行（品番が短い数字のみ）はスキップ
    if (!品番 || /^\d{1,4}$/.test(品番)) continue;

    const 商品名 = (cols[1] || "").trim();
    const 倉庫コード = (cols[18] || "").trim();
    const 在庫金額 = parseFloat((cols[34] || "0").replace(/,/g, "")) || 0;

    items.push({ 品番, 商品名, 倉庫コード, 在庫金額 });
  }

  return items;
}
