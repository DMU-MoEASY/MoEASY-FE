export type ReceiptOcrResult = {
  rawText: string;
  storeName: string;
  paidAt: string;
  totalAmount: number;
};

export type OcrWorkerHandle = {
  terminate: () => Promise<unknown>;
};

const totalKeywords = ['총액', '합계', '총 금액', '결제금액', '결제 금액', '승인금액', '받을금액', 'TOTAL'];
const ignoredStoreWords = ['영수증', '신용카드', '카드전표', '매출전표', 'RECEIPT', '사업자', '대표자'];

export async function recognizeReceiptImage(
  image: File,
  onProgress: (progress: number, status: string) => void,
  onWorker: (worker: OcrWorkerHandle | null) => void,
) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(['kor', 'eng'], undefined, {
    logger: ({ progress, status }) => onProgress(progress, translateStatus(status)),
  });
  onWorker(worker);

  try {
    const { data } = await worker.recognize(image, { rotateAuto: true });
    return parseReceiptText(data.text);
  } finally {
    await worker.terminate().catch(() => undefined);
    onWorker(null);
  }
}

export function parseReceiptText(rawText: string): ReceiptOcrResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const storeName = lines.find((line) => (
    line.length >= 2
    && line.length <= 32
    && /[가-힣A-Za-z]/.test(line)
    && !ignoredStoreWords.some((word) => line.toUpperCase().includes(word))
    && !/^\d[\d\s.,:/-]+$/.test(line)
  )) ?? '';

  const datePattern = /(20\d{2})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})일?(?:\s+|\s*T\s*)?(\d{1,2})?[:시]?\s*(\d{2})?/;
  const dateMatch = rawText.match(datePattern);
  const paidAt = dateMatch
    ? formatPaidAt(dateMatch[1], dateMatch[2], dateMatch[3], dateMatch[4], dateMatch[5])
    : '';

  const keywordAmounts = lines
    .filter((line) => totalKeywords.some((keyword) => line.toUpperCase().includes(keyword)))
    .flatMap(extractAmounts);
  const allAmounts = lines.flatMap(extractAmounts);
  const candidates = keywordAmounts.length > 0 ? keywordAmounts : allAmounts;
  const totalAmount = candidates.length > 0 ? Math.max(...candidates) : 0;

  return { rawText: rawText.trim(), storeName, paidAt, totalAmount };
}

function extractAmounts(line: string) {
  return [...line.matchAll(/(?:₩\s*)?(\d{1,3}(?:,\d{3})+|\d{4,})(?:\s*원)?/g)]
    .map((match) => Number(match[1].replaceAll(',', '')))
    .filter((amount) => Number.isFinite(amount) && amount > 0 && amount < 100_000_000);
}

function formatPaidAt(year?: string, month?: string, day?: string, hour?: string, minute?: string) {
  if (!year || !month || !day) return '';
  const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  if (!hour || !minute) return date;
  return `${date}T${hour.padStart(2, '0')}:${minute}`;
}

function translateStatus(status: string) {
  const labels: Record<string, string> = {
    'loading tesseract core': 'OCR 엔진을 준비하는 중',
    'initializing tesseract': 'OCR 엔진을 초기화하는 중',
    'loading language traineddata': '한국어·영어 데이터를 불러오는 중',
    'initializing api': '인식 환경을 준비하는 중',
    'recognizing text': '영수증 글자를 읽는 중',
  };
  return labels[status] ?? '영수증을 분석하는 중';
}
