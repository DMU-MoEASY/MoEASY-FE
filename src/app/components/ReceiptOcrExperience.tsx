import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, CheckCircle2, FileImage, ImagePlus, LoaderCircle, ReceiptText, RefreshCw, Users, X } from 'lucide-react';
import { recognizeReceiptImage, type OcrWorkerHandle } from '../services/receiptOcr';

type OcrStatus = 'idle' | 'ready' | 'recognizing' | 'done' | 'error';

export function ReceiptOcrExperience({ onBack }: { onBack: () => void }) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<OcrWorkerHandle | null>(null);
  const cancelledRef = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [status, setStatus] = useState<OcrStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState('');
  const [storeName, setStoreName] = useState('');
  const [paidAt, setPaidAt] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [memberCount, setMemberCount] = useState('2');
  const [rawText, setRawText] = useState('');

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    void workerRef.current?.terminate();
  }, [previewUrl]);

  const amountNumber = Number(totalAmount.replace(/[^\d]/g, '')) || 0;
  const members = Math.max(1, Number(memberCount) || 1);
  const perPerson = Math.ceil(amountNumber / members);
  const formattedAmount = useMemo(() => amountNumber.toLocaleString('ko-KR'), [amountNumber]);

  const selectFile = (selected?: File) => {
    if (!selected) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setError('JPG, PNG 또는 WebP 이미지만 사용할 수 있어요.');
      setStatus('error');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('이미지 크기는 10MB 이하로 선택해주세요.');
      setStatus('error');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setStatus('ready');
    setProgress(0);
    setRawText('');
  };

  const runOcr = async () => {
    if (!file) return;
    cancelledRef.current = false;
    setError('');
    setProgress(0);
    setProgressLabel('OCR 엔진을 준비하는 중');
    setStatus('recognizing');

    try {
      const result = await recognizeReceiptImage(
        file,
        (nextProgress, nextStatus) => {
          setProgress(Math.round(nextProgress * 100));
          setProgressLabel(nextStatus);
        },
        (worker) => { workerRef.current = worker; },
      );
      if (cancelledRef.current) return;
      setStoreName(result.storeName);
      setPaidAt(result.paidAt);
      setTotalAmount(result.totalAmount ? String(result.totalAmount) : '');
      setRawText(result.rawText);
      setProgress(100);
      setStatus('done');
    } catch (ocrError) {
      if (cancelledRef.current) return;
      setError(ocrError instanceof Error ? ocrError.message : '영수증을 인식하지 못했어요.');
      setStatus('error');
    }
  };

  const cancelOcr = async () => {
    cancelledRef.current = true;
    await workerRef.current?.terminate().catch(() => undefined);
    workerRef.current = null;
    setStatus('ready');
    setProgress(0);
    setProgressLabel('');
  };

  const reset = () => {
    cancelledRef.current = true;
    void workerRef.current?.terminate();
    workerRef.current = null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl('');
    setStatus('idle');
    setProgress(0);
    setProgressLabel('');
    setError('');
    setStoreName('');
    setPaidAt('');
    setTotalAmount('');
    setRawText('');
  };

  return (
    <main className="min-h-screen bg-[#F4F6FA]">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#F4F6FA]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <button onClick={onBack} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-slate-600 hover:bg-white"><ArrowLeft className="h-5 w-5" />돌아가기</button>
          {file && <button onClick={reset} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 ring-1 ring-black/[0.06]"><RefreshCw className="h-4 w-4" />처음부터</button>}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-9 sm:px-6 sm:pt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Smart settlement · OCR</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">영수증을 촬영하거나 올려주세요</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">이미지는 서버로 전송되지 않고 현재 기기의 브라우저에서 분석돼요. 인식 결과는 직접 수정할 수 있습니다.</p>

        <div className="mt-9 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <section className="rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-black/[0.05] sm:p-6">
            <input ref={uploadInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => selectFile(event.target.files?.[0])} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => selectFile(event.target.files?.[0])} />

            {previewUrl ? (
              <div className="relative flex min-h-[390px] items-center justify-center overflow-hidden rounded-[22px] bg-slate-950">
                <img src={previewUrl} alt="선택한 영수증 미리보기" className="max-h-[620px] w-full object-contain" />
                <button onClick={reset} aria-label="선택한 이미지 제거" className="absolute right-3 top-3 rounded-full bg-black/55 p-2 text-white backdrop-blur"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="flex min-h-[390px] flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-slate-250 bg-slate-50 px-6 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#101828] text-white shadow-lg shadow-slate-900/15"><ReceiptText className="h-7 w-7" /></span>
                <h2 className="mt-5 text-xl font-semibold text-slate-900">선명한 영수증 한 장이면 충분해요</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">구겨지지 않게 정면에서 촬영하면<br />상호명과 금액을 더 정확히 읽을 수 있어요.</p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" disabled={status === 'recognizing'} onClick={() => uploadInputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3.5 text-sm font-semibold text-slate-700 disabled:opacity-40"><ImagePlus className="h-4 w-4" />이미지 업로드</button>
              <button type="button" disabled={status === 'recognizing'} onClick={() => cameraInputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3.5 text-sm font-semibold text-slate-700 disabled:opacity-40"><Camera className="h-4 w-4" />카메라 촬영</button>
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">JPG, PNG, WebP · 최대 10MB</p>

            {status === 'ready' && <button onClick={() => void runOcr()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-semibold text-white hover:bg-blue-700"><FileImage className="h-4 w-4" />OCR 분석 시작</button>}
            {status === 'recognizing' && <div className="mt-5 rounded-2xl bg-blue-50 p-4"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-semibold text-blue-900"><LoaderCircle className="h-4 w-4 animate-spin" />{progressLabel}</span><span className="text-xs font-semibold text-blue-700">{progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div><button onClick={() => void cancelOcr()} className="mt-3 text-xs font-semibold text-blue-700 hover:text-blue-900">분석 취소</button></div>}
            {error && <div role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{error}<button onClick={() => file && void runOcr()} className="ml-2 font-semibold underline">다시 시도</button></div>}
          </section>

          <section className="space-y-5">
            <div className="rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-black/[0.05] sm:p-7">
              <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-blue-600">EXTRACTED DATA</p><h2 className="mt-1 text-xl font-semibold text-slate-900">인식 결과</h2></div>{status === 'done' && <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />분석 완료</span>}</div>
              {status === 'idle' || status === 'ready' || status === 'recognizing' ? <div className="mt-8 flex min-h-[290px] flex-col items-center justify-center rounded-2xl bg-slate-50 text-center"><FileImage className="h-8 w-8 text-slate-300" /><p className="mt-4 text-sm font-medium text-slate-500">OCR 분석이 끝나면 결과가 표시돼요.</p></div> : <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <OcrField label="사용처"><input value={storeName} onChange={(event) => setStoreName(event.target.value)} placeholder="상호명을 확인해주세요" className="form-input" /></OcrField>
                <OcrField label="결제 일시"><input type="datetime-local" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} className="form-input" /></OcrField>
                <OcrField label="총 결제 금액"><div className="relative"><input inputMode="numeric" value={totalAmount} onChange={(event) => setTotalAmount(event.target.value.replace(/[^\d]/g, ''))} placeholder="0" className="form-input pr-10" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">원</span></div></OcrField>
                <OcrField label="정산 인원"><div className="relative"><Users className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="number" min="1" max="100" value={memberCount} onChange={(event) => setMemberCount(event.target.value)} className="form-input pl-11" /></div></OcrField>
              </div>}
            </div>

            <div className="rounded-[26px] bg-[#101828] p-6 text-white sm:p-7">
              <p className="text-xs text-slate-400">1인당 정산 예상 금액</p>
              <div className="mt-2 flex items-end justify-between gap-4"><strong className="text-3xl tracking-tight">{perPerson.toLocaleString('ko-KR')}원</strong><span className="text-xs text-slate-400">총 {formattedAmount}원 ÷ {members}명</span></div>
              <button disabled={status !== 'done' || amountNumber === 0} className="mt-7 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-35">정산 내용 적용하기</button>
            </div>

            {rawText && <details className="rounded-[22px] bg-white p-5 ring-1 ring-black/[0.05]"><summary className="cursor-pointer text-sm font-semibold text-slate-700">OCR 원문 확인</summary><textarea value={rawText} onChange={(event) => setRawText(event.target.value)} rows={8} className="mt-4 w-full resize-y rounded-xl bg-slate-50 p-4 font-mono text-xs leading-5 text-slate-600 outline-none ring-1 ring-black/[0.05]" /></details>}
          </section>
        </div>
      </div>
    </main>
  );
}

function OcrField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>{children}</label>;
}
