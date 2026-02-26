"use client";

import { useState } from "react";
import { OcrSheet, ShodaiItem } from "@/lib/types";
import FileDropzone from "./FileDropzone";
import OcrResultTable from "./OcrResultTable";

type Props = {
  sheets: OcrSheet[];
  shodaiMap: Map<string, ShodaiItem>;
  onAddSheets: (sheets: OcrSheet[]) => void;
  onUpdateRow: (sheetId: string, rowId: string, field: "品番" | "数量" | "備考", value: string) => void;
  onDeleteRow: (sheetId: string, rowId: string) => void;
  onDeleteSheet: (sheetId: string) => void;
};

export default function StepOcr({
  sheets,
  shodaiMap,
  onAddSheets,
  onUpdateRow,
  onDeleteRow,
  onDeleteSheet,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handlePdfUpload = async (files: File[]) => {
    setLoading(true);
    setProgress({ current: 0, total: files.length });
    const newSheets: OcrSheet[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ current: i + 1, total: files.length });

      try {
        const formData = new FormData();
        formData.append("pdf", file);

        const res = await fetch("/api/ocr", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          alert(`OCRエラー (${file.name}): ${err.error || "不明なエラー"}`);
          continue;
        }

        const data = await res.json();
        const sheet: OcrSheet = {
          id: crypto.randomUUID(),
          fileName: file.name,
          部門: data.header?.部門 || "",
          シートNo: data.header?.シートNo || `${sheets.length + newSheets.length + 1}`,
          rows: (data.items || []).map(
            (item: { 品番?: string; 数量?: number; 備考?: string }) => ({
              id: crypto.randomUUID(),
              品番: item.品番 || "",
              数量: item.数量 || 0,
              備考: item.備考 || "",
            })
          ),
        };
        newSheets.push(sheet);
      } catch (e) {
        alert(`OCRエラー (${file.name}): ${e instanceof Error ? e.message : "通信エラー"}`);
      }
    }

    if (newSheets.length > 0) {
      onAddSheets(newSheets);
    }
    setLoading(false);
  };

  const totalRows = sheets.reduce((sum, s) => sum + s.rows.length, 0);
  const errorCount = sheets.reduce(
    (sum, s) => sum + s.rows.filter((r) => r.品番 && !shodaiMap.has(r.品番)).length,
    0
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">ステップ2: PDF アップロード & OCR</h2>

      <FileDropzone
        accept=".pdf"
        multiple
        label="PDFファイルをアップロード（複数可）"
        onFiles={handlePdfUpload}
      />

      {loading && (
        <div className="text-sm text-blue-600">
          OCR処理中... ({progress.current}/{progress.total})
        </div>
      )}

      {sheets.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-4 text-sm text-gray-600">
            <span>シート数: {sheets.length}</span>
            <span>全行数: {totalRows}</span>
            {errorCount > 0 && (
              <span className="text-red-600">品番エラー: {errorCount}件</span>
            )}
          </div>

          <div className="space-y-4">
            {sheets.map((sheet) => (
              <div key={sheet.id}>
                <div className="flex justify-end mb-1">
                  <button
                    onClick={() => onDeleteSheet(sheet.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    このシートを削除
                  </button>
                </div>
                <OcrResultTable
                  sheet={sheet}
                  shodaiMap={shodaiMap}
                  onUpdate={onUpdateRow}
                  onDeleteRow={onDeleteRow}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
