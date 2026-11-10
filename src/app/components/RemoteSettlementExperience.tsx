import { RemoteSettlementCreate } from './RemoteSettlementCreate';
import { SettlementPaymentPanel } from './SettlementPaymentPanel';
import { groupMembersApi } from '../services/groupMembersApi';
import { persistenceStore } from '../lib/persistence';
import { ScreenLoading, RequestError } from './ScreenStates';
import { SettlementTransferPanel } from './SettlementTransferPanel';
import { lazy, Suspense, useEffect, useState } from 'react';
import { settlementApi, type SettlementPage, type SettlementDetail, type SettlementStatus } from '../services/settlementApi';
const ReceiptOcrExperience = lazy(() => import('./ReceiptOcrExperience').then(module => ({ default: module.ReceiptOcrExperience })));
const labels = {OPEN:'진행 중',CLOSED:'종료',CANCELLED:'취소'};
const itemLabels = {PENDING:'미납',PAID:'납부 완료',REFUNDED:'환불',CANCELLED:'취소'};
export function RemoteSettlementExperience({meetupId,meetupName,onBack}:{meetupId:string|number;meetupName:string;onBack:()=>void}) {
  const [paymentNotice,setPaymentNotice]=useState('');
  const [creating,setCreating]=useState(false);
  const [canManage,setCanManage]=useState(false);
  useEffect(()=>{const c=new AbortController();setCanManage(false);void groupMembersApi.list(meetupId,c.signal).then(v=>{const me=persistenceStore.read<{memberId:number}>('moeasy:authSession')?.memberId;setCanManage(v.members.some(m=>m.memberId===me&&m.role!=='MEMBER'));}).catch(()=>setCanManage(false));return()=>c.abort();},[meetupId]);
  const [showOcr,setShowOcr]=useState(false);
  const [page,setPage]=useState(0);
  const [status,setStatus]=useState<SettlementStatus>();
  const [data,setData]=useState<SettlementPage>();
  const [id,setId]=useState<number>();
  const [detail,setDetail]=useState<SettlementDetail>();
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<unknown>(null);
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError(null);setDetail(undefined);setData(undefined);
    const request=id===undefined?settlementApi.list(meetupId,page,status,controller.signal):settlementApi.detail(meetupId,id,controller.signal);
    void request.then(result=>{if(controller.signal.aborted)return;if('items' in result && 'settlementId' in result)setDetail(result as SettlementDetail);else setData(result as SettlementPage);}).catch(error=>{if(!controller.signal.aborted)setError(error);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[meetupId,page,status,id,retry]);
  if (creating) return <main className="mx-auto max-w-4xl p-4 sm:p-8"><RemoteSettlementCreate groupId={meetupId} onBack={()=>setCreating(false)} onCreated={id=>{setCreating(false);setId(id);setRetry(v=>v+1);}}/></main>;
  if (showOcr) return <Suspense fallback={<ScreenLoading label="영수증 인식을 준비하는 중입니다…" />}><ReceiptOcrExperience recognitionOnly onBack={() => setShowOcr(false)} /></Suspense>;
  return <main className="min-h-screen bg-background p-4 sm:p-8"><div className="mx-auto max-w-4xl"><button onClick={()=>id===undefined?onBack():setId(undefined)} className="mb-6 min-h-11 text-sm">← {id===undefined?'모임으로':'정산 목록으로'}</button><p className="text-sm text-muted-foreground">{meetupName}</p><h1 className="mt-2 text-2xl font-semibold">{id===undefined?'정산 목록':detail?.title??'정산 상세'}</h1>
    <p className="my-5 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">서버 정산과 회원별 청구·납부 상태를 확인합니다. 정산 생성은 실제 모임 회원 목록을 사용합니다.</p>
    {id===undefined&&<button onClick={()=>setCreating(true)} className="mb-5 mr-3 min-h-11 rounded-xl bg-secondary px-5 py-3 text-sm">정산 만들기 · 운영진</button>}
    <button type="button" onClick={() => setShowOcr(true)} className="mb-5 min-h-11 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">영수증 인식 · 촬영 / 업로드</button>
    {(id === undefined || (detail?.status === 'OPEN' && detail.items.some(item => item.status === 'PENDING' && item.amount > 0))) && <SettlementTransferPanel key={`${meetupId}:${id ?? 'manual'}`} meetupId={meetupId} settlementId={id === undefined ? undefined : String(id)} targets={detail?.status === 'OPEN' ? detail.items.filter(item => item.status === 'PENDING' && item.amount > 0).map(item => ({ id: String(item.settlementItemId), name: item.nickname, amount: item.remainingAmount??item.amount })) : []} />}
    {id===undefined&&<div className="mb-5 flex flex-wrap gap-2">{([undefined,'OPEN','CLOSED','CANCELLED'] as const).map(value=><button key={value??'all'} aria-pressed={status===value} onClick={()=>{setStatus(value);setPage(0);}} className={`rounded-xl px-4 py-3 text-sm ${status===value?'bg-primary text-white':'bg-card'}`}>{value?labels[value]:'전체'}</button>)}</div>}
    {loading&&<ScreenLoading label="정산을 불러오는 중입니다…"/>}{!!error&&<RequestError error={error} onRetry={()=>setRetry(value=>value+1)} onBack={onBack}/>}
    {!loading&&!error&&data&&<><div className="space-y-3">{data.items.map(item=><button key={item.settlementId} onClick={()=>setId(item.settlementId)} className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 text-left"><span><strong className="block">{item.title}</strong><small className="mt-2 block text-muted-foreground">{labels[item.status]} · {item.targetCount}명 · {item.dueAt?.replace('T',' ')??'기한 없음'}</small></span><strong>{item.totalAmount.toLocaleString()}원</strong></button>)}{!data.items.length&&<p className="py-10 text-center text-muted-foreground">등록된 정산이 없습니다.</p>}</div><div className="mt-5 flex items-center justify-between"><button disabled={!page} onClick={()=>setPage(value=>value-1)} className="min-h-11 px-4 disabled:opacity-30">이전</button><span>{page+1} / {Math.max(1,data.totalPages)}</span><button disabled={!data.hasNext} onClick={()=>setPage(value=>value+1)} className="min-h-11 px-4 disabled:opacity-30">다음</button></div></>}
    {!loading&&!error&&detail&&<section className="space-y-4 rounded-xl border border-border bg-card p-5"><p>{labels[detail.status]} · {detail.splitMode==='EQUAL'?'균등 분할':'개별 금액'}</p><strong className="block text-3xl">{detail.totalAmount.toLocaleString()}원</strong><p className="whitespace-pre-wrap">{detail.description}</p><p className="text-sm text-muted-foreground">작성자 {detail.createdBy.nickname} · 납부기한 {detail.dueAt?.replace('T',' ')??'없음'}</p><h2 className="border-t border-border pt-4 font-semibold">회원별 청구·납부 상태</h2>{detail.items.map(item=><div key={item.settlementItemId} className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 text-sm"><span>{item.nickname} · {itemLabels[item.status]}</span><strong>{item.amount.toLocaleString()}원</strong></div>)}</section>}
    {paymentNotice&&<p role="status" className="my-4 text-sm text-primary">{paymentNotice}</p>}
    {!loading&&!error&&detail&&<SettlementPaymentPanel key={detail.settlementId} groupId={meetupId} detail={detail} canManage={canManage} onRefresh={message=>{setPaymentNotice(message??'납부 현황을 새로 불러왔습니다.');setRetry(v=>v+1);}}/>}
  </div></main>;
}
