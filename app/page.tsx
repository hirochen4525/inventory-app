"use client";

import { useState, useMemo } from "react";
import { ShodaiItem, ZaikoichiItem, OcrSheet } from "@/lib/types";
import StepMaster from "@/components/StepMaster";
import StepOcr from "@/components/StepOcr";
import StepExport from "@/components/StepExport";

const STEPS = ["マスタ登録", "データ取込", "集計・出力"] as const;

export default function Home() {
  const [step, setStep] = useState(0);
  const [shodai, setShodai] = useState<ShodaiItem[]>([]);
  const [zaikoichi, setZaikoichi] = useState<ZaikoichiItem[]>([]);
  const [sheets, setSheets] = useState<OcrSheet[]>([]);
  const [excelSheets, setExcelSheets] = useState<OcrSheet[]>([]);

  const shodaiMap = useMemo(() => {
    const map = new Map<string, ShodaiItem>();
    for (const item of shodai) map.set(item.品番.toLowerCase(), item);
    return map;
  }, [shodai]);

  const canGoNext = () => {
    if (step === 0) return shodai.length > 0 && zaikoichi.length > 0;
    if (step === 1) return sheets.length > 0 || excelSheets.length > 0;
    return false;
  };

  const handleUpdateRow = (
    sheetId: string,
    rowId: string,
    field: "品番" | "数量" | "備考",
    value: string
  ) => {
    setSheets((prev) =>
      prev.map((s) =>
        s.id === sheetId
          ? {
              ...s,
              rows: s.rows.map((r) =>
                r.id === rowId
                  ? {
                      ...r,
                      [field]: field === "数量" ? (parseFloat(value) || 0) : value,
                    }
                  : r
              ),
            }
          : s
      )
    );
  };

  const handleDeleteRow = (sheetId: string, rowId: string) => {
    setSheets((prev) =>
      prev.map((s) =>
        s.id === sheetId
          ? { ...s, rows: s.rows.filter((r) => r.id !== rowId) }
          : s
      )
    );
  };

  const handleDeleteSheet = (sheetId: string) => {
    setSheets((prev) => prev.filter((s) => s.id !== sheetId));
  };

  const handleDeleteExcelSheet = (sheetId: string) => {
    setExcelSheets((prev) => prev.filter((s) => s.id !== sheetId));
  };

  // Step3に渡すときはPDF + Excelを合算
  const allSheets = useMemo(() => [...sheets, ...excelSheets], [sheets, excelSheets]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">棚卸突合アプリ</h1>

      {/* ステップナビゲーション */}
      <div className="flex gap-1 mb-8">
        {STEPS.map((label, i) => (
          <button
            key={label}
            onClick={() => setStep(i)}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
              i === step
                ? "bg-blue-600 text-white"
                : i < step
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {/* ステップ内容 */}
      {step === 0 && (
        <StepMaster
          shodai={shodai}
          zaikoichi={zaikoichi}
          onShodai={setShodai}
          onZaikoichi={setZaikoichi}
        />
      )}
      {step === 1 && (
        <StepOcr
          sheets={sheets}
          excelSheets={excelSheets}
          shodaiMap={shodaiMap}
          onAddSheets={(newSheets) =>
            setSheets((prev) => [...prev, ...newSheets])
          }
          onAddExcelSheets={(newSheets) =>
            setExcelSheets((prev) => [...prev, ...newSheets])
          }
          onUpdateRow={handleUpdateRow}
          onDeleteRow={handleDeleteRow}
          onDeleteSheet={handleDeleteSheet}
          onDeleteExcelSheet={handleDeleteExcelSheet}
        />
      )}
      {step === 2 && (
        <StepExport
          sheets={allSheets}
          shodai={shodai}
          zaikoichi={zaikoichi}
          shodaiMap={shodaiMap}
        />
      )}

      {/* ナビゲーションボタン */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← 戻る
        </button>
        {step < 2 && (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canGoNext()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            次へ →
          </button>
        )}
      </div>
    </main>
  );
}
