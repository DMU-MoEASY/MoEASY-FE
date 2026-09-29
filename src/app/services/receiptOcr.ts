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
  { aliases: ['최종합계', '총합계', '판매합계', '합계금액', '합계', '함계', '합게'], label: '합계', score: 180 },
  { aliases: ['최종결제금액', '실결제금액', '총결제금액', '결제금액', '결제대금'], label: '결제 금액', score: 168 },
  { aliases: ['총금액', '총액', '최종금액', '지불금액'], label: '총 금액', score: 156 },
  { aliases: ['받을금액', '받은금액'], label: '받을 금액', score: 146 },
  { aliases: ['승인금액', '카드승인금액'], label: '승인 금액', score: 142 },
  { aliases: ['청구금액', '카드금액'], label: '청구 금액', score: 138 },
  { aliases: ['GRANDTOTAL', 'TOTALAMOUNT', 'PAYMENTAMOUNT', 'AMOUNTDUE', 'TOTAL'], label: 'TOTAL', score: 132 },
];
const ignoredAmountWords = [
  '사업자', '등록번호', '승인번호', '카드번호', '거래번호', '주문번호', '영수증번호',
  '가맹점번호', '고객번호', '전화', 'TEL', '대표자', '일시', '날짜', '부가세', '부가가치세',
  '소계', '과세', '면세', '세액', '봉사료', '할인', '수량', '단가',
];
const ignoredStoreWords = [
  '영수증', '신용카드', '카드전표', '매출전표', 'RECEIPT', '사업자', '대표자', '승인번호',
  '카드번호', '거래번호', '주문번호', '고객번호', '품명', '상품명', '수량', '단가', '금액',
  '합계', '부가세', '공급가액', '과세', '면세', '봉사료', '결제', 'TEL', '전화', '주소',
];
const storeLabelPattern = /(?:상호명?|가맹점명?|매장명|업체명|MERCHANT|STORE)\s*[:：\-]?\s*(.*)/i;

export async function recognizeReceiptImage(
  image: File,
  onProgress: (progress: number, status: string) => void,
  onWorker: (worker: OcrWorkerHandle | null) => void,
): Promise<ReceiptOcrResult> {
  const { createWorker, PSM } = await import('tesseract.js');
  let phase: 'setup' | 'enhanced' | 'fallback' | 'focused' = 'setup';
  const worker = await createWorker(['kor', 'eng'], undefined, {
    logger: ({ progress, status }) => {
      if (status !== 'recognizing text') {
        onProgress(Math.min(progress * 0.12, 0.12), translateStatus(status));
        return;
      }

      if (phase === 'enhanced') {
        onProgress(0.15 + progress * 0.35, '보정한 이미지에서 글자를 읽는 중');
      } else if (phase === 'fallback') {
        onProgress(0.52 + progress * 0.27, '원본 이미지와 결과를 비교하는 중');
      } else if (phase === 'focused') {
        onProgress(0.81 + progress * 0.18, '영수증 하단에서 합계를 다시 찾는 중');
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

    phase = 'fallback';
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
    const original = await worker.recognize(image, { rotateAuto: true });
    const originalCandidate = createCandidate(original.data.text, original.data.confidence, false);

    const candidates = [enhancedCandidate, originalCandidate];
    phase = 'focused';
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    const focusedImage = cropReceiptBottom(enhancedImage);
    const focused = await worker.recognize(focusedImage);
    candidates.push(createCandidate(focused.data.text, focused.data.confidence, true));

    const mergedCandidate = mergeCandidates(candidates);
    onProgress(1, '더 정확한 인식 결과를 선택했어요');

    return mergedCandidate;
  } finally {
    await worker.terminate().catch(() => undefined);
    onWorker(null);
  }
}

function cropReceiptBottom(image: HTMLCanvasElement) {
  const startY = Math.round(image.height * 0.42);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = Math.max(1, image.height - startY);
  const context = canvas.getContext('2d');
  if (!context) return image;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, startY, image.width, canvas.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function parseReceiptText(rawText: string): ParsedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const storeName = findStoreName(lines);

  const datePattern = /(20\d{2})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})일?(?:\s+|\s*T\s*)?(\d{1,2})?[:시]?\s*(\d{2})?/;
  const dateMatch = rawText.match(datePattern);
  const paidAt = dateMatch
    ? formatPaidAt(dateMatch[1], dateMatch[2], dateMatch[3], dateMatch[4], dateMatch[5])
    : '';

  const amountCandidates = findAmountCandidates(lines);
  const totalAmount = amountCandidates[0]?.amount ?? 0;

  return { rawText: rawText.trim(), storeName, paidAt, totalAmount, amountCandidates };
}

function findStoreName(lines: string[]) {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const match = line.match(storeLabelPattern);
    if (!match) continue;

    const inlineValue = cleanStoreName(match[1] ?? '');
    if (isPlausibleStoreName(inlineValue)) return inlineValue;

    const nextLine = cleanStoreName(lines[index + 1] ?? '');
    if (isPlausibleStoreName(nextLine)) return nextLine;
  }

  return lines
    .map((line, index) => ({ name: cleanStoreName(line), score: scoreStoreName(line, index) }))
    .filter(({ name, score }) => score > 0 && isPlausibleStoreName(name))
    .sort((left, right) => right.score - left.score)[0]?.name ?? '';
}

function cleanStoreName(value: string) {
  return value
    .replace(storeLabelPattern, '$1')
    .replace(/^[\s※*#|:：\-]+|[\s※*#|:：\-]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isPlausibleStoreName(value: string) {
  const upperValue = value.toUpperCase();
  return value.length >= 2
    && value.length <= 32
    && /[가-힣A-Za-z]/.test(value)
    && !ignoredStoreWords.some((word) => upperValue.includes(word))
    && !/^\d[\d\s.,:/-]+$/.test(value)
    && !/(?:https?:\/\/|www\.|@)/i.test(value)
    && !/\d{2,4}[-.)\s]\d{3,4}[-.\s]\d{4}/.test(value);
}

function scoreStoreName(line: string, index: number) {
  const value = cleanStoreName(line);
  if (!isPlausibleStoreName(value)) return -100;

  let score = Math.max(0, 42 - index * 4);
  if (/[가-힣]/.test(value)) score += 12;
  if (/(?:점|마트|마켓|카페|커피|식당|스토어|편의점|백화점|약국|서점|SHOP|CAFE|MART)$/i.test(value)) score += 24;
  if (/^(?:주식회사|\(주\)|㈜)/.test(value)) score += 10;
  if (/\d{4,}/.test(value)) score -= 30;
  if (/(?:특별시|광역시|[가-힣]+[시군구])\s|[가-힣\d]+(?:로|길)\s*\d*/.test(value)) score -= 28;
  if (/[₩￦]|\d[,.]\d{3}|\d+\s*원/.test(value)) score -= 45;
  return score;
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

function mergeCandidates(candidates: ReceiptOcrResult[]): ReceiptOcrResult {
  const uniqueLines = new Set<string>();
  candidates.forEach((candidate) => {
    candidate.rawText.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed) uniqueLines.add(trimmed);
    });
  });

  const mergedText = [...uniqueLines].join('\n');
  const averageConfidence = candidates.length > 0
    ? candidates.reduce((sum, candidate) => sum + candidate.confidence, 0) / candidates.length
    : 0;
  const mergedCandidate = createCandidate(
    mergedText,
    averageConfidence,
    candidates.some((candidate) => candidate.usedEnhancedImage),
  );
  const amountCandidates = mergeAmountCandidates(candidates, mergedCandidate.amountCandidates);

  return {
    ...mergedCandidate,
    storeName: selectMergedStoreName(candidates, mergedCandidate.storeName),
    totalAmount: amountCandidates[0]?.amount ?? 0,
    amountCandidates,
  };
}

function selectMergedStoreName(candidates: ReceiptOcrResult[], fallback: string) {
  const grouped = new Map<string, { name: string; count: number; confidence: number }>();

  candidates.forEach((candidate) => {
    if (!candidate.storeName) return;
    const key = candidate.storeName.toUpperCase().replace(/[^가-힣A-Z0-9]/g, '');
    if (!key) return;
    const current = grouped.get(key);
    if (current) {
      current.count += 1;
      current.confidence = Math.max(current.confidence, candidate.confidence);
    } else {
      grouped.set(key, { name: candidate.storeName, count: 1, confidence: candidate.confidence });
    }
  });

  return [...grouped.values()]
    .sort((left, right) => right.count - left.count || right.confidence - left.confidence)[0]?.name
    ?? fallback;
}

function mergeAmountCandidates(
  ocrCandidates: ReceiptOcrResult[],
  parsedCandidates: ReceiptAmountCandidate[],
) {
  type AggregatedAmount = {
    best: ReceiptAmountCandidate;
    appearances: number;
    score: number;
  };

  const aggregated = new Map<number, AggregatedAmount>();
  const addCandidate = (candidate: ReceiptAmountCandidate, weight: number) => {
    const confidenceScore = candidate.confidence === 'high' ? 90 : candidate.confidence === 'medium' ? 45 : 10;
    const keywordScore = candidate.label === '금액 후보' || candidate.label === '원 표시 금액' ? 0 : 24;
    const current = aggregated.get(candidate.amount);

    if (!current) {
      aggregated.set(candidate.amount, {
        best: candidate,
        appearances: weight > 0 ? 1 : 0,
        score: confidenceScore + keywordScore + weight,
      });
      return;
    }

    const currentConfidence = current.best.confidence === 'high' ? 3 : current.best.confidence === 'medium' ? 2 : 1;
    const nextConfidence = candidate.confidence === 'high' ? 3 : candidate.confidence === 'medium' ? 2 : 1;
    current.appearances += weight > 0 ? 1 : 0;
    current.score += weight;
    if (nextConfidence > currentConfidence || (nextConfidence === currentConfidence && keywordScore > 0)) {
      current.best = candidate;
    }
  };

  ocrCandidates.forEach((ocrCandidate) => {
    const uniqueAmounts = new Set<number>();
    ocrCandidate.amountCandidates.forEach((candidate) => {
      if (uniqueAmounts.has(candidate.amount)) return;
      uniqueAmounts.add(candidate.amount);
      addCandidate(candidate, 38);
    });
  });
  parsedCandidates.forEach((candidate) => addCandidate(candidate, 0));

  return [...aggregated.values()]
    .sort((left, right) => (
      right.score - left.score
      || right.appearances - left.appearances
      || right.best.amount - left.best.amount
    ))
    .slice(0, 3)
    .map(({ best }) => best);
}

type ScoredAmount = ReceiptAmountCandidate & { score: number };

function findAmountCandidates(lines: string[]): ReceiptAmountCandidate[] {
  const scored: ScoredAmount[] = [];

  lines.forEach((line, lineIndex) => {
    const upperLine = line.toUpperCase();
    const keyword = findTotalKeyword(line);
    const lineAmounts = extractAmounts(line);

    lineAmounts.forEach(({ amount, hasCurrency, hasGrouping, digitLength, index }) => {
      let score = keyword?.score ?? 20;
      if (hasCurrency) score += 18;
      if (hasGrouping) score += 12;
      if (lineIndex >= lines.length * 0.55) score += 8;
      if (index >= line.length * 0.45) score += 4;
      if (ignoredAmountWords.some((word) => upperLine.includes(word))) score -= keyword ? 28 : 95;
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

    if (keyword && lineAmounts.length === 0) {
      lines.slice(lineIndex + 1, lineIndex + 4).forEach((nearbyLine, offset) => {
        const nearbyUpperLine = nearbyLine.toUpperCase();
        if (ignoredAmountWords.some((word) => nearbyUpperLine.includes(word))) return;
        extractAmounts(nearbyLine).forEach(({ amount, hasCurrency, hasGrouping, digitLength }) => {
          if (digitLength >= 8 && !hasGrouping) return;
          const distancePenalty = (offset + 1) * 10;
          const score = keyword.score - distancePenalty + (hasCurrency ? 18 : 0) + (hasGrouping ? 12 : 0);
          scored.push({
            amount,
            label: `${keyword.label} 근처`,
            sourceLine: `${line} / ${nearbyLine}`,
            score,
            confidence: score >= 112 ? 'high' : 'medium',
          });
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

function extractAmounts(line: string) {
  const normalizedLine = normalizeAmountCharacters(line);
  const matches = [...normalizedLine.matchAll(/(?:₩|￦|\\|W)?\s*([0-9OQDIiLl|]{1,3}(?:(?:\s*[,，.]\s*|\s+)[0-9OQDIiLl|]{3})+|[0-9OQDIiLl|]{3,8})(?:\s*(?:원|KRW))?/gi)];

  return matches
    .map((match) => {
      const rawValue = match[1];
      if (!rawValue) return null;
      const compactValue = rawValue
        .replace(/[OQD]/gi, '0')
        .replace(/[IiLl|]/g, '1')
        .replace(/[\s,，.]/g, '');
      return {
        amount: Number(compactValue),
        hasCurrency: /[₩￦\\W원]|KRW/i.test(match[0]),
        hasGrouping: /[,，.]|\s/.test(rawValue.trim()),
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
  return line
    .replace(/[₩￦]/g, '￦')
    .replace(/(?<=[\d,，.\s])[OoQD](?=\d|[,，.원\s])/gi, '0')
    .replace(/(?<=[\d,，.\s])[IiLl|](?=\d|[,，.원\s])/g, '1');
}

function findTotalKeyword(line: string) {
  const normalized = line
    .toUpperCase()
    .replace(/[^가-힣A-Z0-9]/g, '');

  return totalKeywords.find(({ aliases }) => aliases.some((alias) => normalized.includes(alias)));
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
