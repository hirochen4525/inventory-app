import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY が設定されていません" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const pdf = formData.get("pdf") as File | null;
    if (!pdf) {
      return NextResponse.json(
        { error: "PDFファイルが必要です" },
        { status: 400 }
      );
    }

    // PDFをbase64に変換
    const buffer = await pdf.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `この棚卸表PDFを読み取り、以下のJSON形式で出力してください。
必ず有効なJSONのみを出力し、それ以外のテキストは含めないでください。

{
  "header": {
    "シートNo": "シート番号",
    "部門": "部門名"
  },
  "items": [
    {
      "品番": "品番文字列",
      "数量": 数値,
      "備考": "備考があれば"
    }
  ]
}

注意:
- 品番は正確に読み取ること（英数字・ハイフン等）
- 数量は整数で返すこと
- 空行や合計行は含めないこと
- 備考がない場合は空文字列にすること`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64,
        },
      },
    ]);

    const text = result.response.text();

    // JSONブロックを抽出（```json ... ``` に囲まれている場合にも対応）
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "OCR処理でエラーが発生しました",
      },
      { status: 500 }
    );
  }
}
