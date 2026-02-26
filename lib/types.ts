// 商品マスタ（Shodai.txt）
export type ShodaiItem = {
  品番: string;
  商品名: string;
  倉庫コード: string;
  単価: number;
};

// やよい在庫（Zaikoichi.txt）
export type ZaikoichiItem = {
  品番: string;
  やよい在庫: number;
};

// OCR読取行
export type OcrRow = {
  id: string;
  品番: string;
  数量: number;
  備考: string;
};

// OCRシート（1PDF = 1シート）
export type OcrSheet = {
  id: string;
  fileName: string;
  部門: string;
  シートNo: string;
  rows: OcrRow[];
};

// 突合結果行
export type MatchRow = {
  品番: string;
  商品名: string;
  倉庫コード: string;
  単価: number;
  やよい在庫: number;
  実地棚卸数: number;
  差分: number;
  差分金額: number;
};

// 品番エラー行
export type ErrorRow = {
  品番: string;
  数量: number;
  備考: string;
  シートNo: string;
  部門: string;
};
