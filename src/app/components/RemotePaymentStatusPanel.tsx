import {settlementPaymentStatus} from '../services/settlementPaymentStatus';
import {useEffect,useState} from 'react';
import {settlementApi,type SettlementDetail,type SettlementPage,type SettlementStatus} from '../services/settlementApi';
import {RequestError,ScreenLoading} from './ScreenStates';
const settlementLabels={OPEN:'진행 중',CLOSED:'종료',CANCELLED:'취소'};
export function RemotePaymentStatusPanel(props:{groupId:string|number;onOpen:(id?:number)=>void}) {return <PaymentStatus key={props.groupId} {...props}/>;}
function PaymentStatus({groupId,onOpen}:{groupId:string|number;onOpen:(id?:number)=>void}) {
  const [page,setPage]=useState(0);const [status,setStatus]=useState<SettlementStatus|undefined>('OPEN');
  const [list,setList]=useState<SettlementPage>();const [chosen,setChosen]=useState<number>();const [detail,setDetail]=useState<SettlementDetail>();
  const [listError,setListError]=useState<unknown>();const [detailError,setDetailError]=useState<unknown>();
  const [loading,setLoading]=useState(true);const [reading,setReading]=useState(false);const [revision,setRevision]=useState(0);
  const selected=list?.items.some(item=>item.settlementId===chosen)?chosen:list?.items[0]?.settlementId;
  useEffect(()=>{
    const c=new AbortController();setLoading(true);setListError(undefined);setList(undefined);setDetail(undefined);
    void settlementApi.list(groupId,page,status,c.signal).then(value=>{if(!c.signal.aborted)setList(value);}).catch(error=>{if(!c.signal.aborted)setListError(error);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});
    return()=>c.abort();
  },[groupId,page,status,revision]);
  useEffect(()=>{
    const c=new AbortController();setDetail(undefined);setDetailError(undefined);
    if(selected===undefined){setReading(false);return()=>c.abort();}
    setReading(true);
    void settlementApi.detail(groupId,selected,c.signal).then(value=>{if(!c.signal.aborted)setDetail(value);}).catch(error=>{if(!c.signal.aborted)setDetailError(error);}).finally(()=>{if(!c.signal.aborted)setReading(false);});
    return()=>c.abort();
  },[groupId,selected,revision]);
  useEffect(()=>{const refresh=()=>{if(!document.hidden)setRevision(v=>v+1);};window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh);},[]);
  const refresh=()=>setRevision(v=>v+1);const button='min-h-11 rounded-xl bg-secondary px-4 text-sm disabled:opacity-40';
  return <section aria-label="서버 회원별 납부 현황" className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">회원별 청구와 납부 기록</h2><button onClick={refresh} disabled={loading||reading} className={button}>납부 현황 새로고침</button></div>
    <p className="text-sm leading-6 text-muted-foreground">선택한 정산에 서버에 기록된 납부 현황입니다. 은행 거래를 불러오는 것만으로 납부가 자동 반영되지는 않습니다.</p>
    <label className="block text-sm">정산 상태<select value={status??'ALL'} onChange={e=>{setStatus(e.target.value==='ALL'?undefined:e.target.value as SettlementStatus);setPage(0);setChosen(undefined);}} className="form-input mt-2"><option value="ALL">전체</option>{Object.entries(settlementLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    {loading&&<ScreenLoading label="서버 정산 목록을 불러오는 중입니다…"/>}{!!listError&&<RequestError error={listError} onRetry={refresh}/>}
    {!loading&&!listError&&list&&<>{list.items.length?<label className="block text-sm">정산 선택<select value={selected??''} onChange={e=>setChosen(Number(e.target.value))} className="form-input mt-2">{list.items.map(item=><option key={item.settlementId} value={item.settlementId}>{item.title} · {item.totalAmount.toLocaleString()}원</option>)}</select></label>:<p className="rounded-xl bg-secondary p-5 text-sm">이 조건에 해당하는 정산이 없습니다. 정산을 등록하면 회원별 납부 현황이 표시됩니다.</p>}
      {list.totalPages>1&&<div className="flex items-center justify-between gap-3"><button disabled={page===0} onClick={()=>{setPage(v=>v-1);setChosen(undefined);}} className={button}>이전 정산</button><span className="text-xs text-muted-foreground">{page+1}/{list.totalPages}페이지</span><button disabled={!list.hasNext} onClick={()=>{setPage(v=>v+1);setChosen(undefined);}} className={button}>다음 정산</button></div>}
    </>}
    {reading&&<ScreenLoading label="회원별 납부 현황을 불러오는 중입니다…"/>}{!!detailError&&<RequestError error={detailError} onRetry={refresh}/>}
    {!loading&&!reading&&!detailError&&detail&&<>
      <div className="rounded-xl bg-secondary p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{detail.title}</h3><span className="text-xs text-muted-foreground">{settlementLabels[detail.status]}</span></div><p className="mt-2 text-sm">청구 총액 {detail.totalAmount.toLocaleString()}원 · 납부 {detail.paidAmount?.toLocaleString()??'미제공'}원 · 잔액 {detail.remainingAmount?.toLocaleString()??'미제공'}원</p><p className="mt-2 text-sm">완납 {detail.paidCount??'미제공'}명 · 미납/부분 납부 {detail.pendingCount??'미제공'}명 · 대상 {detail.targetCount}명</p><p className="mt-2 text-xs text-muted-foreground">납부기한 {detail.dueAt?.replace('T',' ')??'없음'}</p></div>
      <div className="divide-y divide-border">{detail.items.map(item=>{
        const label=settlementPaymentStatus(item);
        return <article key={item.settlementItemId} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"><div><p className="font-semibold">{item.nickname}</p><span className={`mt-2 inline-block rounded-md px-2 py-1 text-xs ${item.status==='PAID'?'bg-emerald-50 text-emerald-700':item.status==='PENDING'?'bg-amber-50 text-amber-800':'bg-secondary text-muted-foreground'}`}>{label}</span></div><div className="text-right"><p>청구 {item.amount.toLocaleString()}원</p><p className="mt-1 text-xs text-muted-foreground">납부 {item.paidAmount?.toLocaleString()??'미제공'}원 · 잔액 {item.remainingAmount?.toLocaleString()??'미제공'}원</p></div></article>;
      })}{!detail.items.length&&<p className="py-4 text-sm text-muted-foreground">이 정산의 청구 대상이 없습니다.</p>}</div>
      <button onClick={()=>onOpen(detail.settlementId)} className="min-h-11 rounded-xl bg-primary px-5 text-sm text-white">이 정산 상세 · 입금 기록 보기</button>
    </>}
    <button onClick={()=>onOpen()} className={button}>전체 정산 목록</button>
  </section>;
}
