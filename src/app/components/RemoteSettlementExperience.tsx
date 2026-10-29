import { useEffect, useState } from 'react';
import { settlementApi, type SettlementPage, type SettlementDetail, type SettlementStatus } from '../services/settlementApi';
const labels = {OPEN:'진행 중',CLOSED:'종료',CANCELLED:'취소'};
const itemLabels = {PENDING:'미납',PAID:'납부 완료',REFUNDED:'환불',CANCELLED:'취소'};
export function RemoteSettlementExperience({meetupId,meetupName,onBack}:{meetupId:string|number;meetupName:string;onBack:()=>void}) {
  const [page,setPage]=useState(0);
  const [status,setStatus]=useState<SettlementStatus>();
  const [data,setData]=useState<SettlementPage>();
  const [id,setId]=useState<number>();
  const [detail,setDetail]=useState<SettlementDetail>();
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('');setDetail(undefined);setData(undefined);
    const request=id===undefined?settlementApi.list(meetupId,page,status,controller.signal):settlementApi.detail(meetupId,id,controller.signal);
    void request.then(result=>{if(controller.signal.aborted)return;if('items' in result && 'settlementId' in result)setDetail(result as SettlementDetail);else setData(result as SettlementPage);}).catch(error=>{if(!controller.signal.aborted)setError(error instanceof Error?error.message:'정산을 불러오지 못했습니다.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[meetupId,page,status,id,retry]);
  return <main className="min-h-screen bg-background p-4 sm:p-8"><div className="mx-auto max-w-4xl"><button onClick={()=>id===undefined?onBack():setId(undefined)} className="mb-6 min-h-11 text-sm">← {id===undefined?'모임으로':'정산 목록으로'}</button><p className="text-sm text-muted-foreground">{meetupName}</p><h1 className="mt-2 text-2xl font-semibold">{id===undefined?'정산 목록':detail?.title??'정산 상세'}</h1>
    <p className="my-5 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">현재 등록된 정산과 회원별 납부 상태를 확인할 수 있습니다. 새 정산 작성은 모임 회원 목록 연동이 준비되면 사용할 수 있습니다.</p>
    {id===undefined&&<div className="mb-5 flex flex-wrap gap-2">{([undefined,'OPEN','CLOSED','CANCELLED'] as const).map(value=><button key={value??'all'} aria-pressed={status===value} onClick={()=>{setStatus(value);setPage(0);}} className={`rounded-xl px-4 py-3 text-sm ${status===value?'bg-primary text-white':'bg-card'}`}>{value?labels[value]:'전체'}</button>)}</div>}
    {loading&&<p role="status" className="py-8">정산을 불러오는 중입니다…</p>}{error&&<div role="alert" className="rounded-xl bg-red-50 p-5 text-red-700"><p>{error}</p><button onClick={()=>setRetry(value=>value+1)} className="mt-3 rounded-lg border px-4 py-2">다시 시도</button></div>}
    {!loading&&!error&&data&&<><div className="space-y-3">{data.items.map(item=><button key={item.settlementId} onClick={()=>setId(item.settlementId)} className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 text-left"><span><strong className="block">{item.title}</strong><small className="mt-2 block text-muted-foreground">{labels[item.status]} · {item.targetCount}명 · {item.dueAt?.replace('T',' ')??'기한 없음'}</small></span><strong>{item.totalAmount.toLocaleString()}원</strong></button>)}{!data.items.length&&<p className="py-10 text-center text-muted-foreground">등록된 정산이 없습니다.</p>}</div><div className="mt-5 flex items-center justify-between"><button disabled={!page} onClick={()=>setPage(value=>value-1)} className="min-h-11 px-4 disabled:opacity-30">이전</button><span>{page+1} / {Math.max(1,data.totalPages)}</span><button disabled={!data.hasNext} onClick={()=>setPage(value=>value+1)} className="min-h-11 px-4 disabled:opacity-30">다음</button></div></>}
    {!loading&&!error&&detail&&<section className="space-y-4 rounded-xl border border-border bg-card p-5"><p>{labels[detail.status]} · {detail.splitMode==='EQUAL'?'균등 분할':'개별 금액'}</p><strong className="block text-3xl">{detail.totalAmount.toLocaleString()}원</strong><p className="whitespace-pre-wrap">{detail.description}</p><p className="text-sm text-muted-foreground">작성자 {detail.createdBy.nickname} · 납부기한 {detail.dueAt?.replace('T',' ')??'없음'}</p><h2 className="border-t border-border pt-4 font-semibold">회원별 청구·납부 상태</h2>{detail.items.map(item=><div key={item.settlementItemId} className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 text-sm"><span>{item.nickname} · {itemLabels[item.status]}</span><strong>{item.amount.toLocaleString()}원</strong></div>)}</section>}
  </div></main>;
}
