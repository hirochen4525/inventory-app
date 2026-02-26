"use client";

import { ShodaiItem, ZaikoichiItem } from "@/lib/types";
import { parseShodai } from "@/lib/parseShodai";
import { parseZaikoichi } from "@/lib/parseZaikoichi";
import FileDropzone from "./FileDropzone";

type Props = {
  shodai: ShodaiItem[];
  zaikoichi: ZaikoichiItem[];
  onShodai: (items: ShodaiItem[]) => void;
  onZaikoichi: (items: ZaikoichiItem[]) => void;
};

async function decodeShiftJIS(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const decoder = new TextDecoder("shift-jis");
  return decoder.decode(buffer);
}

export default function StepMaster({
  shodai,
  zaikoichi,
  onShodai,
  onZaikoichi,
}: Props) {
  const handleShodai = async (files: File[]) => {
    const text = await decodeShiftJIS(files[0]);
    const items = parseShodai(text);
    onShodai(items);
  };

  const handleZaikoichi = async (files: File[]) => {
    const text = await decodeShiftJIS(files[0]);
    const items = parseZaikoichi(text);
    onZaikoichi(items);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">ステップ1: マスタデータ登録</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-2">Shodai.txt（商品マスタ）</h3>
          {shodai.length > 0 ? (
            <div className="border-2 border-green-400 bg-green-50 rounded-lg p-4">
              <p className="font-bold text-green-700 text-lg">{shodai.length}件 読み込み完了</p>
              <p className="text-sm text-green-600 mt-1">
                例: {shodai[0].品番} / {shodai[0].商品名}
              </p>
              <button
                onClick={() => onShodai([])}
                className="text-xs text-gray-400 mt-2 hover:text-gray-600"
              >
                再アップロード
              </button>
            </div>
          ) : (
            <FileDropzone
              accept=".txt,.csv"
              label="Shodai.txt をアップロード"
              onFiles={handleShodai}
            />
          )}
        </div>

        <div>
          <h3 className="font-medium mb-2">Zaikoichi.txt（やよい在庫）</h3>
          {zaikoichi.length > 0 ? (
            <div className="border-2 border-green-400 bg-green-50 rounded-lg p-4">
              <p className="font-bold text-green-700 text-lg">{zaikoichi.length}件 読み込み完了</p>
              <p className="text-sm text-green-600 mt-1">
                例: {zaikoichi[0].品番} / 在庫 {zaikoichi[0].やよい在庫}
              </p>
              <button
                onClick={() => onZaikoichi([])}
                className="text-xs text-gray-400 mt-2 hover:text-gray-600"
              >
                再アップロード
              </button>
            </div>
          ) : (
            <FileDropzone
              accept=".txt,.csv"
              label="Zaikoichi.txt をアップロード"
              onFiles={handleZaikoichi}
            />
          )}
        </div>
      </div>

      {shodai.length > 0 && zaikoichi.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
          両方の読み込みが完了しました。「次へ」でPDFアップロードに進めます。
        </div>
      )}
    </div>
  );
}
