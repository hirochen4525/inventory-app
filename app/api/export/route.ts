import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { ShodaiItem, ZaikoichiItem, OcrSheet, MatchRow, ErrorRow } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const shodai: ShodaiItem[] = body.shodai || [];
    const zaikoichi: ZaikoichiItem[] = body.zaikoichi || [];
    const ocrSheets: OcrSheet[] = body.ocrSheets || [];

    // マスタをMapに
    const shodaiMap = new Map<string, ShodaiItem>();
    for (const item of shodai) {
      shodaiMap.set(item.品番.toLowerCase(), item);
    }

    const zaikoMap = new Map<string, number>();
    for (const item of zaikoichi) {
      zaikoMap.set(item.品番, item.やよい在庫);
    }

    // OCR結果を品番ごとに集計
    const ocrAgg = new Map<string, number>();
    const errors: ErrorRow[] = [];

    for (const sheet of ocrSheets) {
      for (const row of sheet.rows) {
        if (!row.品番) continue;
        if (!shodaiMap.has(row.品番.toLowerCase())) {
          errors.push({
            品番: row.品番,
            数量: row.数量,
            備考: row.備考,
            シートNo: sheet.シートNo,
            部門: sheet.部門,
          });
          continue;
        }
        ocrAgg.set(row.品番.toLowerCase(), (ocrAgg.get(row.品番.toLowerCase()) || 0) + row.数量);
      }
    }

    // 突合結果を作成（マスタの全品番が対象）
    const matchRows: MatchRow[] = [];
    for (const item of shodai) {
      const key = item.品番.toLowerCase();
      const やよい在庫 = zaikoMap.get(item.品番) || 0;
      const 実地棚卸数 = ocrAgg.get(key) || 0;
      const 差分 = 実地棚卸数 - やよい在庫;
      const 差分金額 = 差分 * item.単価;

      matchRows.push({
        品番: item.品番,
        商品名: item.商品名,
        倉庫コード: item.倉庫コード,
        単価: item.単価,
        やよい在庫,
        実地棚卸数,
        差分,
        差分金額: Math.round(差分金額),
      });
    }

    // Excel作成
    const workbook = new ExcelJS.Workbook();

    // シート1: 突合結果
    const ws1 = workbook.addWorksheet("突合結果", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    ws1.columns = [
      { header: "品番", key: "品番", width: 18 },
      { header: "商品名", key: "商品名", width: 30 },
      { header: "倉庫コード", key: "倉庫コード", width: 12 },
      { header: "単価", key: "単価", width: 14 },
      { header: "やよい在庫", key: "やよい在庫", width: 12 },
      { header: "実地棚卸数", key: "実地棚卸数", width: 12 },
      { header: "差分", key: "差分", width: 10 },
      { header: "差分金額", key: "差分金額", width: 14 },
    ];

    // ヘッダーのスタイル
    ws1.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9E1F2" },
      };
      cell.border = {
        bottom: { style: "thin" },
      };
    });

    for (const row of matchRows) {
      const excelRow = ws1.addRow(row);

      // 差分≠0は赤背景
      if (row.差分 !== 0) {
        excelRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFCE4EC" },
          };
        });
      }
    }

    // オートフィルター（ヘッダー行に適用）
    ws1.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 8 },
    };

    // 数値フォーマット
    ws1.getColumn("単価").numFmt = "#,##0";
    ws1.getColumn("差分金額").numFmt = "#,##0";

    // シート2: 品番エラー一覧
    const ws2 = workbook.addWorksheet("品番エラー一覧", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    ws2.columns = [
      { header: "品番", key: "品番", width: 18 },
      { header: "数量", key: "数量", width: 10 },
      { header: "備考", key: "備考", width: 20 },
      { header: "シートNo", key: "シートNo", width: 12 },
      { header: "部門", key: "部門", width: 15 },
    ];

    ws2.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9E1F2" },
      };
      cell.border = {
        bottom: { style: "thin" },
      };
    });

    for (const err of errors) {
      ws2.addRow(err);
    }

    // Bufferに出力
    const buffer = await workbook.xlsx.writeBuffer();
    const diffCount = matchRows.filter((r) => r.差分 !== 0).length;

    // サマリーをカスタムヘッダーで返す
    const fileName = `棚卸突合_${new Date().toISOString().slice(0, 10)}.xlsx`;
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "X-Summary-Total": String(matchRows.length),
        "X-Summary-Diff": String(diffCount),
        "X-Summary-Errors": String(errors.length),
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Excel出力でエラーが発生しました",
      },
      { status: 500 }
    );
  }
}
