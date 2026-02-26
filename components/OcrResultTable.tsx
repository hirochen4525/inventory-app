"use client";

import { OcrSheet, ShodaiItem } from "@/lib/types";

type Props = {
  sheet: OcrSheet;
  shodaiMap: Map<string, ShodaiItem>;
  onUpdate: (sheetId: string, rowId: string, field: "品番" | "数量" | "備考", value: string) => void;
  onDeleteRow: (sheetId: string, rowId: string) => void;
};

export default function OcrResultTable({ sheet, shodaiMap, onUpdate, onDeleteRow }: Props) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 font-medium text-sm flex justify-between">
        <span>
          シート: {sheet.シートNo} / 部門: {sheet.部門} / {sheet.fileName}
        </span>
        <span className="text-gray-500">{sheet.rows.length}行</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-3 py-2 text-left w-40">品番</th>
            <th className="px-3 py-2 text-left w-24">数量</th>
            <th className="px-3 py-2 text-left">備考</th>
            <th className="px-3 py-2 w-12"></th>
          </tr>
        </thead>
        <tbody>
          {sheet.rows.map((row) => {
            const hasError = !shodaiMap.has(row.品番) && row.品番 !== "";
            return (
              <tr key={row.id} className={`border-b ${hasError ? "bg-red-50" : ""}`}>
                <td className="px-3 py-1">
                  <input
                    type="text"
                    value={row.品番}
                    onChange={(e) => onUpdate(sheet.id, row.id, "品番", e.target.value)}
                    className={`w-full px-2 py-1 border rounded text-sm ${
                      hasError ? "border-red-400 text-red-700" : "border-gray-200"
                    }`}
                  />
                  {hasError && (
                    <span className="text-xs text-red-500">マスタに存在しない品番</span>
                  )}
                </td>
                <td className="px-3 py-1">
                  <input
                    type="number"
                    value={row.数量}
                    onChange={(e) => onUpdate(sheet.id, row.id, "数量", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                  />
                </td>
                <td className="px-3 py-1">
                  <input
                    type="text"
                    value={row.備考}
                    onChange={(e) => onUpdate(sheet.id, row.id, "備考", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                  />
                </td>
                <td className="px-3 py-1 text-center">
                  <button
                    onClick={() => onDeleteRow(sheet.id, row.id)}
                    className="text-red-400 hover:text-red-600"
                    title="行を削除"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
