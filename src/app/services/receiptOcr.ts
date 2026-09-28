export type ReceiptOcrResult = {
  rawText: string;
  storeName: string;
  paidAt: string;
  totalAmount: number;
  amountCandidates: ReceiptAmountCandidate[];
  confidence: number;
  usedEnhancedImage: boolean;
};

export type ReceiptAmountCandidate = {
  amount: number;
  label: string;
  sourceLine: string;
  confidence: 'high' | 'medium' | 'low';
};

export type OcrWorkerHandle = {
  terminate: () => Promise<unknown>;
};

type ParsedReceipt = Omit<ReceiptOcrResult, 'confidence' | 'usedEnhancedImage'>;

const totalKeywords = [
  { keywords: ['합계', '합게', '함계', '함게', '합꼐', '합재'], label: '합계', score: 160 },
  { keywords: ['총금액'], label: '총 금액', score: 148 },
  { keywords: ['총액'], label: '총액', score: 140 },
  { keywords: ['받을금액'], label: '받을 금액', score: 130 },
  { keywords: ['결제금액'], label: '결제 금액', score: 128 },
  { keywords: ['승인금액'], label: '승인 금액', score: 126 },
  { keywords: ['청구금액'], label: '청구 금액', score: 124 },
  { keywords: ['카드금액'], label: '카드 금액', score: 122 },
  { keywords: ['TOTAL'], label: 'TOTAL', score: 112 },
];
const ignoredAmountWords = [
  '사업자', '등록번호', '승인번호', '카드번호', '거래번호', '주문번호', '영수증번호',
  '가맹점번호', '고객번호', '전화', 'TEL', '대표자', '일시', '날짜', '부가세', '부가가치세',
  '소계', 'SUBTOTAL', '과세', '면세', '세액', '봉사료', '할인', '수량', '단가',
];
const ignoredStoreWords = ['영수증', '신용카드', '카드전표', '매출전표', 'RECEIPT', '사업자', '대표자'];

export async function recognizeReceiptImage(
  image: File,
  onProgress: (progress: number, status: string) => void,
  onWorker: (worker: OcrWorkerHandle | null) => void,
): Promise<ReceiptOcrResult> {
  const { createWorker, PSM } = await import('tesseract.js');
  let phase: 'setup' | 'enhanced' | 'focused' | 'fallback' = 'setup';
  const worker = await createWorker(['kor', 'eng'], undefined, {
    logger: ({ progress, status }) => {
      if (status !== 'recognizing text') {
        onProgress(Math.min(progress * 0.12, 0.12), translateStatus(status));
        return;
      }

      if (phase === 'enhanced') {
        onProgress(0.15 + progress * 0.4, '보정한 이미지에서 글자를 읽는 중');
      } else if (phase === 'focused') {
        onProgress(0.56 + progress * 0.22, '영수증 하단의 합계 영역을 다시 읽는 중');
      } else if (phase === 'fallback') {
        onProgress(0.79 + progress * 0.2, '원본 이미지와 결과를 비교하는 중');
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

    phase = 'focused';
    const focusedImage = cropReceiptTotalRegion(enhancedImage);
    const focused = await worker.recognize(focusedImage);
    const focusedCandidate = createCandidate(focused.data.text, focused.data.confidence, true);

    phase = 'fallback';
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
    const original = await worker.recognize(image, { rotateAuto: true });
    const originalCandidate = createCandidate(original.data.text, original.data.confidence, false);
    onProgress(1, '더 정확한 인식 결과를 선택했어요');

    return mergeRecognitionCandidates([enhancedCandidate, focusedCandidate, originalCandidate]);
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

  const amountCandidates = findAmountCandidates(lines);
  const totalAmount = amountCandidates[0]?.amount ?? 0;

  return { rawText: rawText.trim(), storeName, paidAt, totalAmount, amountCandidates };
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
        (imageData.data[offset] ?? 0) * 0.299
        + (imageData.data[offset + 1] ?? 0) * 0.587
        + (imageData.data[offset + 2] ?? 0) * 0.114,
      );
      grayscale[pixel] = value;
      histogram[value] = (histogram[value] ?? 0) + 1;
    }

    const darkPoint = percentileFromHistogram(histogram, grayscale.length, 0.02);
    const lightPoint = percentileFromHistogram(histogram, grayscale.length, 0.98);
    const range = Math.max(40, lightPoint - darkPoint);

    for (let pixel = 0, offset = 0; pixel < grayscale.length; pixel += 1, offset += 4) {
      const normalized = Math.max(0, Math.min(255, (((grayscale[pixel] ?? 0) - darkPoint) * 255) / range));
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

function cropReceiptTotalRegion(image: HTMLCanvasElement) {
  const startY = Math.round(image.height * 0.38);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = Math.max(1, image.height - startY);
  const context = canvas.getContext('2d');
  if (!context) return image;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, startY, image.width, canvas.height, 0, 0, canvas.width, canvas.height);
  applyAdaptiveThreshold(context, canvas.width, canvas.height);
  return canvas;
}

function applyAdaptiveThreshold(context: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = context.getImageData(0, 0, width, height);
  const stride = width + 1;
  const integral = new Uint32Array(stride * (height + 1));

  for (let y = 1; y <= height; y += 1) {
    let rowSum = 0;
    for (let x = 1; x <= width; x += 1) {
      const offset = ((y - 1) * width + (x - 1)) * 4;
      rowSum += imageData.data[offset] ?? 255;
      integral[y * stride + x] = (integral[(y - 1) * stride + x] ?? 0) + rowSum;
    }
  }

  const radius = Math.max(10, Math.round(Math.min(width, height) * 0.012));
  for (let y = 0; y < height; y += 1) {
    const top = Math.max(0, y - radius);
    const bottom = Math.min(height - 1, y + radius);
    for (let x = 0; x < width; x += 1) {
      const left = Math.max(0, x - radius);
      const right = Math.min(width - 1, x + radius);
      const area = (right - left + 1) * (bottom - top + 1);
      const sum = (integral[(bottom + 1) * stride + right + 1] ?? 0)
        - (integral[top * stride + right + 1] ?? 0)
        - (integral[(bottom + 1) * stride + left] ?? 0)
        + (integral[top * stride + left] ?? 0);
      const offset = (y * width + x) * 4;
      const value = (imageData.data[offset] ?? 255) < sum / area - 11 ? 0 : 255;
      imageData.data[offset] = value;
      imageData.data[offset + 1] = value;
      imageData.data[offset + 2] = value;
    }
  }

  context.putImageData(imageData, 0, 0);
}

function percentileFromHistogram(histogram: Uint32Array, total: number, percentile: number) {
  const target = total * percentile;
  let seen = 0;
  for (let value = 0; value < histogram.length; value += 1) {
    seen += histogram[value] ?? 0;
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

function scoreCandidate(candidate: ReceiptOcrResult) {
  const meaningfulCharacters = candidate.rawText.replace(/\s/g, '').length;
  const amountConfidence = candidate.amountCandidates[0]?.confidence;
  return candidate.confidence
    + Math.min(meaningfulCharacters, 160) * 0.12
    + (candidate.storeName ? 8 : 0)
    + (candidate.paidAt ? 8 : 0)
    + (candidate.totalAmount > 0 ? 12 : -12)
    + (amountConfidence === 'high' ? 18 : amountConfidence === 'medium' ? 8 : 0);
}

function mergeRecognitionCandidates(candidates: ReceiptOcrResult[]): ReceiptOcrResult {
  const preferred = [...candidates].sort((left, right) => scoreCandidate(right) - scoreCandidate(left))[0];
  if (!preferred) throw new Error('영수증 인식 결과를 비교할 수 없어요.');

  const amounts = new Map<number, ReceiptAmountCandidate>();
  candidates.flatMap(({ amountCandidates }) => amountCandidates).forEach((candidate) => {
    const current = amounts.get(candidate.amount);
    if (!current || scoreAmountCandidate(candidate) > scoreAmountCandidate(current)) {
      amounts.set(candidate.amount, candidate);
    }
  });
  const amountCandidates = [...amounts.values()]
    .sort((left, right) => scoreAmountCandidate(right) - scoreAmountCandidate(left) || right.amount - left.amount)
    .slice(0, 3);

  return {
    ...preferred,
    totalAmount: amountCandidates[0]?.amount ?? preferred.totalAmount,
    amountCandidates,
  };
}

function scoreAmountCandidate(candidate: ReceiptAmountCandidate) {
  const label = candidate.label.replace(/\s/g, '').replace('다음줄', '');
  const keyword = totalKeywords.find(({ label: keywordLabel }) => keywordLabel.replace(/\s/g, '') === label);
  const confidenceScore = candidate.confidence === 'high' ? 30 : candidate.confidence === 'medium' ? 15 : 0;
  return (keyword?.score ?? 20) + confidenceScore;
}

type ScoredAmount = ReceiptAmountCandidate & { score: number };

function findAmountCandidates(lines: string[]): ReceiptAmountCandidate[] {
  const scored: ScoredAmount[] = [];

  lines.forEach((line, lineIndex) => {
    const upperLine = line.toUpperCase();
    const compactLine = normalizeLabelCharacters(upperLine);
    const keyword = compactLine.includes('SUBTOTAL')
      ? undefined
      : totalKeywords.find(({ keywords }) => keywords.some((value) => compactLine.includes(value)));
    const lineAmounts = extractAmounts(line);

    lineAmounts.forEach(({ amount, hasCurrency, hasGrouping, digitLength, index }) => {
      let score = keyword?.score ?? 20;
      if (hasCurrency) score += 18;
      if (hasGrouping) score += 12;
      if (lineIndex >= lines.length * 0.55) score += 8;
      if (index >= line.length * 0.45) score += 4;
      if (hasIgnoredAmountWord(compactLine)) score -= keyword ? 28 : 95;
      if (!hasGrouping && digitLength >= 8) score -= 100;
      if (looksLikeDateOrTime(line, amount)) score -= 100;

      if (score > 0) {
        scored.push({
          amount,
          label: keyword?.label ?? (hasCurrency ? '원 표시 금액' : '금액 후보'),
          sourceLine: line,
          score,
          confidence: score >= 112 ? 'high' : score >= 55 ? 'medium' : 'low',
        });
      }
    });

    const nextLine = lines[lineIndex + 1];
    if (keyword && lineAmounts.length === 0 && nextLine) {
      const nextUpperLine = normalizeLabelCharacters(nextLine);
      if (hasIgnoredAmountWord(nextUpperLine)) return;
      extractAmounts(nextLine).forEach(({ amount, hasCurrency, hasGrouping, digitLength }) => {
        if (digitLength >= 8 && !hasGrouping) return;
        scored.push({
          amount,
          label: `${keyword.label} 다음 줄`,
          sourceLine: nextLine,
          score: keyword.score - 12 + (hasCurrency ? 18 : 0) + (hasGrouping ? 12 : 0),
          confidence: 'high',
        });
      });
    }
  });

  const unique = new Map<number, ScoredAmount>();
  scored.forEach((candidate) => {
    const current = unique.get(candidate.amount);
    if (!current || candidate.score > current.score) unique.set(candidate.amount, candidate);
  });

  return [...unique.values()]
    .sort((left, right) => right.score - left.score || right.amount - left.amount)
    .slice(0, 3)
    .map(({ score: _score, ...candidate }) => candidate);
}

function normalizeLabelCharacters(line: string) {
  return line.toUpperCase().replace(/[\s:;|\-_.·ㆍ]/g, '');
}

function hasIgnoredAmountWord(compactLine: string) {
  return ignoredAmountWords.some((word) => compactLine.includes(normalizeLabelCharacters(word)));
}

function extractAmounts(line: string) {
  const normalizedLine = normalizeAmountCharacters(line);
  const matches = [...normalizedLine.matchAll(/(?:₩\s*)?(\d{1,3}(?:\s*[,.·]\s*\d{3})+|\d{1,3}(?:\s+\d{3})+|\d{1,8})(?:\s*원)?/g)];

  return matches
    .map((match) => {
      const rawValue = match[1];
      if (!rawValue) return null;
      const compactValue = rawValue.replace(/[\s,.·]/g, '');
      return {
        amount: Number(compactValue),
        hasCurrency: match[0].includes('₩') || match[0].includes('원'),
        hasGrouping: /[,.·\s]/.test(rawValue),
        digitLength: compactValue.length,
        index: match.index ?? 0,
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .filter(({ amount, digitLength }) => (
      Number.isFinite(amount)
      && amount >= 100
      && amount < 100_000_000
      && digitLength <= 8
    ));
}

function normalizeAmountCharacters(line: string) {
  return line.replace(/[\dOoIl|S]+(?:(?:\s*[,.·]\s*|\s+)[\dOoIl|S]{3})*/g, (token) => {
    const digitCount = token.match(/\d/g)?.length ?? 0;
    if (digitCount < 2) return token;
    return token.replace(/[Oo]/g, '0').replace(/[Il|]/g, '1').replace(/S/g, '5');
  });
}

function looksLikeDateOrTime(line: string, amount: number) {
  const compact = String(amount);
  if (/20\d{2}[.\-/년]/.test(line) && compact.length === 4) return true;
  if (/\d{1,2}[:시]\s*\d{2}/.test(line) && compact.length <= 4) return true;
  return false;
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
