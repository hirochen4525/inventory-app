# 棚卸突合アプリ

## 概要
小沢株式会社の半期棚卸業務効率化アプリ。商品マスタ・やよい在庫データと、部署から届くPDF棚卸表をOCR読取→突合→Excel出力する。

## 技術スタック
- Next.js 15 (App Router / TypeScript) → Vercel
- Tailwind CSS
- Gemini Pro API（OCR）
- ExcelJS（Excel出力）
- 認証なし / DBなし（ブラウザstate保持）

## デプロイURL
- Vercel（要設定）

## 環境変数
- `GEMINI_API_KEY` — Gemini API キー（.env.local + Vercel環境変数）

## ファイル構成
- `app/page.tsx` — メインUI（ステップ1-3）
- `app/api/ocr/route.ts` — Gemini OCR API
- `app/api/export/route.ts` — Excel出力API
- `components/` — UI コンポーネント
- `lib/` — パーサー・型定義
