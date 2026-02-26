"use client";

import { useState } from "react";
import { OcrSheet, ShodaiItem } from "@/lib/types";
import FileDropzone from "./FileDropzone";
import OcrResultTable from "./OcrResultTable";

type Props = {
  sheets: OcrSheet[];
  excelSheets: OcrSheet[];
  shodaiMap: Map<string, ShodaiItem>;
  onAddSheets: (sheets: OcrSheet[]) => void;
  onAddExcelSheets: (sheets: OcrSheet[]) => void;
  onUpdateRow: (sheetId: string, rowId: string, field: "品番" | "数量" | "備考", value: string) => void;
  onDeleteRow: (sheetId: string, rowId: string) => void;
  onDeleteSheet: (sheetId: string) => void;
  onDeleteExcelSheet: (sheetId: string) => void;
};

export default function StepOcr({
  sheets,
  excelSheets,
  shodaiMap,
  onAddSheets,
  onAddExcelSheets,
  onUpdateRow,
  onDeleteRow,
  onDeleteSheet,
  onDeleteExcelSheet,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
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

  const handleExcelUpload = async (files: File[]) => {
    setExcelLoading(true);
    const newSheets: OcrSheet[] = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/parse-excel", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          alert(`Excel読込エラー (${file.name}): ${err.error || "不明なエラー"}`);
          continue;
        }

        const data = await res.json();
        const sheet: OcrSheet = {
          id: crypto.randomUUID(),
          fileName: file.name,
          部門: "EC",
          シートNo: data.sheetName || "Excel",
          rows: (data.items || []).map(
            (item: { 品番: string; 数量: number }) => ({
              id: crypto.randomUUID(),
              品番: String(item.品番),
              数量: item.数量,
              備考: "",
            })
          ),
        };
        newSheets.push(sheet);
      } catch (e) {
        alert(`Excel読込エラー (${file.name}): ${e instanceof Error ? e.message : "通信エラー"}`);
      }
    }

    if (newSheets.length > 0) {
      onAddExcelSheets(newSheets);
    }
    setExcelLoading(false);
  };

  const totalRows = sheets.reduce((sum, s) => sum + s.rows.length, 0);
  const errorCount = sheets.reduce(
    (sum, s) => sum + s.rows.filter((r) => r.品番 && !shodaiMap.has(r.品番.toLowerCase())).length,
    0
  );
  const excelTotalRows = excelSheets.reduce((sum, s) => sum + s.rows.length, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">ステップ2: データ取込</h2>

      {/* PDFアップロード */}
      <div>
        <h3 className="font-medium mb-2">PDF（部署棚卸表）</h3>
        <FileDropzone
          accept=".pdf"
          multiple
          label="PDFファイルをアップロード（複数可）"
          onFiles={handlePdfUpload}
        />
        {loading && (
          <div className="text-sm text-blue-600 mt-2">
            OCR処理中... ({progress.current}/{progress.total})
          </div>
        )}
      </div>

      {/* Excelアップロード */}
      <div>
        <h3 className="font-medium mb-2">Excel（EC棚卸データ）</h3>
        <FileDropzone
          accept=".xlsx,.xls"
          multiple
          label="Excelファイルをアップロード（複数可）"
          onFiles={handleExcelUpload}
        />
        {excelLoading && (
          <div className="text-sm text-blue-600 mt-2">Excel読込中...</div>
        )}
      </div>

      {/* Excel取込結果（簡易表示） */}
      {excelSheets.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-gray-700">Excel取込済み</h3>
          {excelSheets.map((sheet) => (
            <div
              key={sheet.id}
              className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm"
            >
              <span>
                {sheet.fileName} — {sheet.rows.length}行取込
              </span>
              <button
                onClick={() => onDeleteExcelSheet(sheet.id)}
                className="text-red-400 hover:text-red-600 text-xs"
              >
                削除
              </button>
            </div>
          ))}
          <p className="text-xs text-gray-500">Excel合計: {excelTotalRows}行</p>
        </div>
      )}

      {/* PDF OCR結果 */}
      {sheets.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-4 text-sm text-gray-600">
            <span>PDFシート数: {sheets.length}</span>
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
