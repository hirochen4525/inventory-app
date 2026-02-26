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
          <FileDropzone
            accept=".txt,.csv"
            label="Shodai.txt をアップロード"
            onFiles={handleShodai}
          />
          {shodai.length > 0 && (
            <p className="mt-2 text-sm text-green-600">
              {shodai.length}件 読み込み完了
            </p>
          )}
        </div>

        <div>
          <h3 className="font-medium mb-2">Zaikoichi.txt（やよい在庫）</h3>
          <FileDropzone
            accept=".txt,.csv"
            label="Zaikoichi.txt をアップロード"
            onFiles={handleZaikoichi}
          />
          {zaikoichi.length > 0 && (
            <p className="mt-2 text-sm text-green-600">
              {zaikoichi.length}件 読み込み完了
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
