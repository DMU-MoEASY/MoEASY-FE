import { useEffect, useRef, useState } from 'react';
import { settlementPaymentApi, type PaymentHistory } from '../services/pendingBackendApi';
import { ApiError } from '../lib/apiClient';
import { koreaNow } from '../services/bankManagement';
import type { SettlementDetail } from '../services/settlementApi';
export function SettlementPaymentPanel({groupId,detail,canManage,onRefresh}:{groupId:string|number;detail:SettlementDetail;canManage:boolean;onRefresh:()=>Promise<void>}) {
  const [selectedId,setItemId]=useState(detail.items[0]?.settlementItemId);
  const item=detail.items.find(i=>i.settlementItemId===selectedId)??detail.items[0];
  const itemId=item?.settlementItemId;
  const [history,setHistory]=useState<PaymentHistory[]>([]); const [page,setPage]=useState(0); const [hasNext,setHasNext]=useState(false);
  const [notice,setNotice]=useState(''); const [amount,setAmount]=useState(''); const [occurred,setOccurred]=useState('');
  const [reasons,setReasons]=useState<Record<number,string>>({}); const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(false); const [error,setError]=useState<unknown>(); const [revision,setRevision]=useState(0);
  const flight=useRef(false); const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{setAmount(String(item?.remainingAmount??''));setOccurred('');setReasons({});},[itemId,item?.remainingAmount,item?.version]);
  useEffect(()=>{
    if(itemId===undefined)return;
    const c=new AbortController();setLoading(true);setHistory([]);setHasNext(false);setError(undefined);
    void settlementPaymentApi.list(groupId,detail.settlementId,itemId,page,c.signal).then(v=>{if(!c.signal.aborted){setHistory(v.items);setHasNext(v.hasNext);}}).catch(e=>{if(!c.signal.aborted)setError(e);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});
    return()=>c.abort();
  },[groupId,detail.settlementId,itemId,page,revision]);
  const run=async(action:()=>Promise<unknown>)=>{
    if(flight.current)return;flight.current=true;setBusy(true);setNotice('');
    let message='서버에 납부 기록을 반영했습니다.';
    try{await action();}
    catch(e){message=e instanceof ApiError&&e.status===409?'청구 또는 납부 상태가 변경됐습니다. 최신 상세와 이력을 확인한 뒤 다시 시도해주세요.':`${e instanceof Error?e.message:'요청 결과를 확인할 수 없습니다.'} 자동 재등록하지 않습니다. 최신 내역을 확인해주세요.`;}
    // A timeout can follow a committed write: reconcile both detail and history on every outcome.
    try{await onRefresh();}catch{message+=' 정산 상세를 다시 불러오지 못했습니다. 재조회 전에는 변경할 수 없습니다.';}
    if(mounted.current){setRevision(v=>v+1);setNotice(message);setReasons({});setBusy(false);}flight.current=false;
  };
  const changeable=canManage&&item?.version!==undefined&&detail.status==='OPEN';
  const registerable=changeable&&item?.status==='PENDING'&&(item.remainingAmount??0)>0;
  const cancellable=changeable&&(item?.status==='PENDING'||item?.status==='PAID');
  const button='min-h-11 rounded-xl bg-secondary px-4 text-sm disabled:opacity-40';
  return <section className="mt-6 space-y-4 rounded-xl border border-border bg-card p-5" aria-label="입금 확인 및 납부 이력"><h2 className="text-lg font-semibold">입금 확인 · 납부 이력</h2><p className="text-xs leading-5 text-muted-foreground">실제 입금을 확인한 운영진이 기록합니다. 기록 취소는 오등록 정정이며 실제 환불을 수행하지 않습니다.</p>
    <label className="block text-sm">청구 선택<select disabled={busy} value={itemId??''} onChange={e=>{setItemId(Number(e.target.value));setPage(0);setNotice('');}} className="form-input mt-2">{detail.items.map(i=><option key={i.settlementItemId} value={i.settlementItemId}>{i.nickname} · {i.amount.toLocaleString()}원</option>)}</select></label>
    {item&&<p className="text-sm">납부 {item.paidAmount?.toLocaleString()??'미제공'}원 · 잔액 {item.remainingAmount?.toLocaleString()??'미제공'}원</p>}
    {registerable&&item&&<form onSubmit={e=>{
      e.preventDefault();const n=Number(amount);const time=occurred?(occurred.length===16?`${occurred}:00`:occurred):undefined;
      if(!/^\d+$/.test(amount)||!Number.isSafeInteger(n)||n<=0||n>(item.remainingAmount??0)){setNotice('현재 미납 잔액 이하의 양수를 입력해주세요.');return;}
      if(time&&time>koreaNow()){setNotice('미래의 입금 시각은 입력할 수 없습니다.');return;}
      if(window.confirm(`${item.nickname}의 실제 입금 ${n.toLocaleString()}원을 등록할까요?`))void run(()=>settlementPaymentApi.register(groupId,detail.settlementId,item.settlementItemId,{amount:n,expectedVersion:item.version!,...(time?{occurredAt:time}:{})}));
    }} className="grid gap-3 sm:grid-cols-2"><label className="text-sm">확인한 납부 금액<input required type="number" step={1} min={1} max={item.remainingAmount} disabled={busy} value={amount} onChange={e=>setAmount(e.target.value)} className="form-input mt-2"/></label><label className="text-sm">실제 입금 시각 (선택·한국 시간)<input type="datetime-local" step={1} max={koreaNow()} disabled={busy} value={occurred} onChange={e=>setOccurred(e.target.value)} className="form-input mt-2"/></label><p className="text-xs text-muted-foreground sm:col-span-2">시각을 비워두면 서버의 현재 시각으로 기록합니다.</p><button disabled={busy} className="min-h-11 rounded-xl bg-primary px-4 text-sm text-white disabled:opacity-40 sm:col-span-2">{busy?'처리 중…':'입금 확인 등록'}</button></form>}
    {loading&&<p role="status" className="text-sm">납부 이력을 불러오는 중…</p>}
    {!!error&&<div role="alert" className="text-sm"><p>{error instanceof Error?error.message:'납부 이력을 불러오지 못했습니다.'}</p><button disabled={busy} onClick={()=>setRevision(v=>v+1)} className={button}>이력 다시 조회</button></div>}
    {!loading&&!error&&!history.length&&<p className="py-4 text-sm text-muted-foreground">등록된 납부 기록이 없습니다.</p>}
    {history.map(payment=><article key={payment.paymentId} className="space-y-2 border-t border-border pt-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong className={payment.status==='CANCELLED'?'text-muted-foreground line-through':''}>{payment.amount.toLocaleString()}원</strong><span>{({COMPLETED:'유효 납부',CANCELLED:'취소된 기록',PENDING:'처리 대기',FAILED:'실패'} as Record<string,string>)[payment.status]??payment.status} · {payment.source==='MANUAL'?'수동 등록':'은행 연동'}</span></div><p className="text-xs text-muted-foreground">입금 {payment.occurredAt?.replace('T',' ')??'시각 미상'} · 등록 {payment.createdAt.replace('T',' ')} · 등록자 {payment.recordedBy?.nickname??'기록 없음'}</p>
      {payment.status==='CANCELLED'&&<div className="rounded-lg bg-secondary p-3 text-xs leading-5"><p>취소자 {payment.cancelledBy?.nickname??'기록 없음'} · {payment.cancelledAt?.replace('T',' ')??'시각 미상'}</p><p>사유: {payment.cancelReason??'기록 없음'}</p></div>}
      {cancellable&&item&&payment.status==='COMPLETED'&&payment.paymentType==='PAYMENT'&&<form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();const reason=reasons[payment.paymentId]?.trim();if(!reason||reason.length>255)return;if(window.confirm('이 납부 기록 1건을 취소할까요? 실제 환불은 수행하지 않습니다.'))void run(()=>settlementPaymentApi.cancel(groupId,detail.settlementId,item.settlementItemId,payment.paymentId,{expectedVersion:item.version!,reason}));}}><input required aria-label={`납부 ${payment.paymentId} 취소 사유`} disabled={busy} maxLength={255} value={reasons[payment.paymentId]??''} onChange={e=>setReasons({...reasons,[payment.paymentId]:e.target.value})} placeholder="오등록 취소 사유" className="form-input min-w-0 flex-1"/><button disabled={busy||!reasons[payment.paymentId]?.trim()} className={button}>기록 취소</button></form>}
    </article>)}
    <div className="flex justify-between"><button disabled={!page||busy||loading} onClick={()=>setPage(v=>v-1)} className={button}>이전</button><button disabled={!hasNext||busy||loading} onClick={()=>setPage(v=>v+1)} className={button}>다음</button></div>{notice&&<p role="status" className="text-sm leading-6">{notice}</p>}
  </section>;
}
