"use client";

import { useState } from "react";
import { OcrSheet, ShodaiItem, ZaikoichiItem } from "@/lib/types";

type Props = {
  sheets: OcrSheet[];
  shodai: ShodaiItem[];
  zaikoichi: ZaikoichiItem[];
  shodaiMap: Map<string, ShodaiItem>;
};

export default function StepExport({ sheets, shodai, zaikoichi, shodaiMap }: Props) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{
    total: number;
    diffCount: number;
    errorCount: number;
  } | null>(null);

  // 集計: 品番ごとの実地棚卸数を合算
  const aggregated = new Map<string, number>();
  const errors: { 品番: string; 数量: number; 備考: string; シートNo: string; 部門: string }[] = [];

  for (const sheet of sheets) {
    for (const row of sheet.rows) {
      if (!row.品番) continue;
      if (!shodaiMap.has(row.品番)) {
        errors.push({
          品番: row.品番,
          数量: row.数量,
          備考: row.備考,
          シートNo: sheet.シートNo,
          部門: sheet.部門,
        });
        continue;
      }
      aggregated.set(row.品番, (aggregated.get(row.品番) || 0) + row.数量);
    }
  }

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shodai,
          zaikoichi,
          ocrSheets: sheets,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        alert(`出力エラー: ${errText}`);
        return;
      }

      // サマリーをヘッダーから取得
      setSummary({
        total: Number(res.headers.get("X-Summary-Total") || 0),
        diffCount: Number(res.headers.get("X-Summary-Diff") || 0),
        errorCount: Number(res.headers.get("X-Summary-Errors") || 0),
      });

      // バイナリを直接Blobにしてダウンロード
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `棚卸突合_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`出力エラー: ${e instanceof Error ? e.message : "通信エラー"}`);
    } finally {
      setLoading(false);
    }
  };

  const allRows = sheets.flatMap((s) => s.rows).filter((r) => r.品番);
  const uniqueProducts = new Set(allRows.map((r) => r.品番));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">ステップ3: 集計・Excel出力</h2>

      <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
        <p>全品番数: {uniqueProducts.size}</p>
        <p>有効行数: {aggregated.size}</p>
        <p className={errors.length > 0 ? "text-red-600" : ""}>
          品番エラー: {errors.length}件
        </p>
      </div>

      <button
        onClick={handleExport}
        disabled={loading || sheets.length === 0}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? "出力中..." : "集計＆Excel出力"}
      </button>

      {summary && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm space-y-1">
          <p className="font-medium text-green-800">出力完了</p>
          <p>全品番数: {summary.total}</p>
          <p>差分あり: {summary.diffCount}件</p>
          <p>品番エラー: {summary.errorCount}件</p>
          <p className="text-gray-500 mt-2">
            ステップ2に戻って修正し、再出力できます
          </p>
        </div>
      )}
    </div>
  );
}
