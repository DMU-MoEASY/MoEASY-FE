export type ReceiptOcrResult = {
  rawText: string;
  storeName: string;
  paidAt: string;
  totalAmount: number;
  confidence: number;
  usedEnhancedImage: boolean;
};

export type OcrWorkerHandle = {
  terminate: () => Promise<unknown>;
};

type ParsedReceipt = Omit<ReceiptOcrResult, 'confidence' | 'usedEnhancedImage'>;

const totalKeywords = ['총액', '합계', '총 금액', '결제금액', '결제 금액', '승인금액', '받을금액', 'TOTAL'];
const ignoredStoreWords = ['영수증', '신용카드', '카드전표', '매출전표', 'RECEIPT', '사업자', '대표자'];
const MIN_RECOGNITION_CONFIDENCE = 58;
const MIN_MEANINGFUL_CHARACTERS = 24;

export async function recognizeReceiptImage(
  image: File,
  onProgress: (progress: number, status: string) => void,
  onWorker: (worker: OcrWorkerHandle | null) => void,
): Promise<ReceiptOcrResult> {
  const { createWorker, PSM } = await import('tesseract.js');
  let phase: 'setup' | 'enhanced' | 'fallback' = 'setup';
  const worker = await createWorker(['kor', 'eng'], undefined, {
    logger: ({ progress, status }) => {
      if (status !== 'recognizing text') {
        onProgress(Math.min(progress * 0.12, 0.12), translateStatus(status));
        return;
      }

      if (phase === 'enhanced') {
        onProgress(0.15 + progress * 0.55, '보정한 이미지에서 글자를 읽는 중');
      } else if (phase === 'fallback') {
        onProgress(0.72 + progress * 0.27, '원본 이미지와 결과를 비교하는 중');
      }
    },
  });
  onWorker(worker);

  try {
    onProgress(0.12, '이미지의 밝기와 대비를 보정하는 중');
    const enhancedImage = await preprocessReceiptImage(image);
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    });

    phase = 'enhanced';
    const enhanced = await worker.recognize(enhancedImage, { rotateAuto: true });
    const enhancedCandidate = createCandidate(enhanced.data.text, enhanced.data.confidence, true);

    if (!needsFallback(enhancedCandidate)) {
      onProgress(1, 'OCR 분석이 완료됐어요');
      return enhancedCandidate;
    }

    phase = 'fallback';
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
    const original = await worker.recognize(image, { rotateAuto: true });
    const originalCandidate = createCandidate(original.data.text, original.data.confidence, false);
    onProgress(1, '더 정확한 인식 결과를 선택했어요');

    return scoreCandidate(originalCandidate) > scoreCandidate(enhancedCandidate)
      ? originalCandidate
      : enhancedCandidate;
  } finally {
    await worker.terminate().catch(() => undefined);
    onWorker(null);
  }
}

export function parseReceiptText(rawText: string): ParsedReceipt {
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

async function preprocessReceiptImage(image: File) {
  const bitmap = await createImageBitmap(image);

  try {
    const longestSide = Math.max(bitmap.width, bitmap.height);
    const upscale = longestSide < 1800 ? 1800 / longestSide : 1;
    const downscale = longestSide * upscale > 2800 ? 2800 / (longestSide * upscale) : 1;
    const scale = upscale * downscale;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('이미지 보정을 시작할 수 없어요. 다른 브라우저에서 다시 시도해주세요.');

    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, width, height);

    const imageData = context.getImageData(0, 0, width, height);
    const histogram = new Uint32Array(256);
    const grayscale = new Uint8Array(width * height);

    for (let pixel = 0, offset = 0; offset < imageData.data.length; pixel += 1, offset += 4) {
      const value = Math.round(
        imageData.data[offset] * 0.299
        + imageData.data[offset + 1] * 0.587
        + imageData.data[offset + 2] * 0.114,
      );
      grayscale[pixel] = value;
      histogram[value] += 1;
    }

    const darkPoint = percentileFromHistogram(histogram, grayscale.length, 0.02);
    const lightPoint = percentileFromHistogram(histogram, grayscale.length, 0.98);
    const range = Math.max(40, lightPoint - darkPoint);

    for (let pixel = 0, offset = 0; pixel < grayscale.length; pixel += 1, offset += 4) {
      const normalized = Math.max(0, Math.min(255, ((grayscale[pixel] - darkPoint) * 255) / range));
      const contrasted = normalized < 150
        ? normalized * 0.82
        : 150 + (normalized - 150) * 1.18;
      const value = Math.round(Math.max(0, Math.min(255, contrasted)));
      imageData.data[offset] = value;
      imageData.data[offset + 1] = value;
      imageData.data[offset + 2] = value;
      imageData.data[offset + 3] = 255;
    }

    context.putImageData(imageData, 0, 0);
    return canvas;
  } finally {
    bitmap.close();
  }
}

function percentileFromHistogram(histogram: Uint32Array, total: number, percentile: number) {
  const target = total * percentile;
  let seen = 0;
  for (let value = 0; value < histogram.length; value += 1) {
    seen += histogram[value];
    if (seen >= target) return value;
  }
  return 255;
}

function createCandidate(rawText: string, confidence: number, usedEnhancedImage: boolean): ReceiptOcrResult {
  return {
    ...parseReceiptText(rawText),
    confidence: Math.max(0, Math.min(100, Math.round(confidence))),
    usedEnhancedImage,
  };
}

function needsFallback(candidate: ReceiptOcrResult) {
  const meaningfulCharacters = candidate.rawText.replace(/\s/g, '').length;
  return candidate.confidence < MIN_RECOGNITION_CONFIDENCE
    || meaningfulCharacters < MIN_MEANINGFUL_CHARACTERS
    || (!candidate.storeName && !candidate.paidAt && candidate.totalAmount === 0);
}

function scoreCandidate(candidate: ReceiptOcrResult) {
  const meaningfulCharacters = candidate.rawText.replace(/\s/g, '').length;
  return candidate.confidence
    + Math.min(meaningfulCharacters, 160) * 0.12
    + (candidate.storeName ? 8 : 0)
    + (candidate.paidAt ? 8 : 0)
    + (candidate.totalAmount > 0 ? 12 : 0);
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
