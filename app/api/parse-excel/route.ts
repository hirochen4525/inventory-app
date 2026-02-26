import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    // 【合計】棚卸シートを探す。なければ最初のシートを使用
    let targetSheet = workbook.worksheets.find((ws) =>
      ws.name.includes("合計")
    );
    if (!targetSheet) {
      targetSheet = workbook.worksheets[0];
    }

    if (!targetSheet) {
      return NextResponse.json({ error: "シートが見つかりません" }, { status: 400 });
    }

    const items: { 品番: string; 数量: number }[] = [];

    targetSheet.eachRow((row, rowNumber) => {
      // ヘッダー行スキップ
      if (rowNumber <= 1) return;

      const values = row.values as unknown[];
      // col[1]=SKU, col[2]=数量（ExcelJSは1-indexed、values[0]はnull）
      // ExcelJSはリッチテキストや数値など様々な型で返すので堅牢に変換
      const rawSku = values[1];
      const sku = (typeof rawSku === "object" && rawSku !== null && "text" in rawSku
        ? String((rawSku as { text: string }).text)
        : String(rawSku ?? "")
      ).trim();
      const qty = Number(values[2]) || 0;

      if (sku && sku !== "SKU") {
        items.push({ 品番: sku, 数量: qty });
      }
    });

    return NextResponse.json({
      sheetName: targetSheet.name,
      items,
    });
  } catch (error) {
    console.error("Excel parse error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Excel解析エラー" },
      { status: 500 }
    );
  }
}
