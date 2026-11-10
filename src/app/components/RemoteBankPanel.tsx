import { useEffect, useRef, useState, type FormEvent } from 'react';
import { bankAccountApi, type BankAccount, type BankTransaction } from '../services/pendingBackendApi';
import { bankErrorMessage, koreaToday, normalizeBankConnection, supportedBanks, validateBankSync, type BankConnectInput, type BankSyncInput } from '../services/bankManagement';
import { useGroupMembership } from '../hooks/useGroupMembership';
import { ApiError } from '../lib/apiClient';
import { RequestError, ScreenLoading } from './ScreenStates';
const emptyConnect = (): BankConnectInput => ({ bankCode:'NH', accountNumber:'', accountHolder:'', apiKey:'', secretKey:'' });
const emptySync = (): BankSyncInput => ({ startDate:koreaToday().slice(0,8)+'01', endDate:koreaToday(), accountPassword:'', residentNumber:'', accountType:'personal', loginId:'', loginPassword:'' });
export function RemoteBankPanel({meetupId}:{meetupId:string|number}) { return <BankPanel key={meetupId} meetupId={meetupId}/>; }
function BankPanel({meetupId}:{meetupId:string|number}) {
  const membership = useGroupMembership(meetupId);
  const [account,setAccount] = useState<BankAccount>();
  const [transactions,setTransactions] = useState<BankTransaction[]>([]);
  const [error,setError] = useState<unknown>();
  const [transactionError,setTransactionError] = useState<unknown>();
  const [missing,setMissing] = useState(false);
  const [page,setPage] = useState(0);
  const [hasNext,setHasNext] = useState(false);
  const [loading,setLoading] = useState(true);
  const [revision,setRevision] = useState(0);
  const [form,setForm] = useState<'connect'|'sync'|'disconnect'>();
  const [connect,setConnect] = useState(emptyConnect);
  const [sync,setSync] = useState(emptySync);
  const [busy,setBusy] = useState(false);
  const inFlight = useRef(false);
  const mutation = useRef<AbortController | undefined>(undefined);
  const mounted = useRef(true);
  const [notice,setNotice] = useState('');
  const [now,setNow] = useState(Date.now());
  const [blockedUntil,setBlockedUntil] = useState(0);
  useEffect(() => { mounted.current=true; const timer=window.setInterval(()=>setNow(Date.now()),1000); return()=>{mounted.current=false;clearInterval(timer);mutation.current?.abort();}; },[]);
  useEffect(() => {
    const c=new AbortController(); setLoading(true); setError(undefined); setMissing(false);
    void bankAccountApi.get(meetupId,c.signal).then(value=>{if(!c.signal.aborted){setAccount(value);if(value.nextSyncAt)setBlockedUntil(0);}}).catch(e=>{
      if(c.signal.aborted)return;
      if(e instanceof ApiError&&e.status===404&&e.code==='BANK404_1'){setAccount(undefined);setMissing(true);}else setError(e);
    }).finally(()=>{if(!c.signal.aborted)setLoading(false);});
    return()=>c.abort();
  },[meetupId,revision]);
  useEffect(() => {
    const c=new AbortController();setTransactions([]);setHasNext(false);setTransactionError(undefined);
    if(account)void bankAccountApi.transactions(meetupId,page,c.signal).then(value=>{if(!c.signal.aborted){setTransactions(value.items);setHasNext(value.hasNext);}}).catch(e=>{if(!c.signal.aborted)setTransactionError(e);});
    return()=>c.abort();
  },[meetupId,account?.accountId,page,revision]);
  const refresh=()=>{setPage(0);setRevision(v=>v+1);};
  const nextSync=account?.nextSyncAt?Date.parse(`${account.nextSyncAt}+09:00`):0;
  const remaining=Math.max(0,Math.ceil((Math.max(Number.isFinite(nextSync)?nextSync:0,blockedUntil)-now)/1000));
  const close=()=>{if(inFlight.current)return;setForm(undefined);setConnect(emptyConnect());setSync(emptySync());};
  const run=async(action:()=>Promise<unknown>,success:string|((value:unknown)=>string),isSync=false)=>{
    if(inFlight.current||!membership.canManage)return;
    inFlight.current=true;setBusy(true);setNotice('');
    try { const value=await action(); if(mounted.current){setNotice(typeof success==='function'?success(value):success);setForm(undefined);} }
    catch(e) {
      if(!mounted.current)return;
      const api=e instanceof ApiError?e:undefined;
      if(api?.status===429)setBlockedUntil(Date.now()+30*60*1000);
      // Reconcile after uncertain outcomes; never automatically replay a bank operation.
      setNotice(bankErrorMessage(api?.code) ?? (e instanceof Error?e.message:'요청 결과를 확인할 수 없습니다.'));
      if(e instanceof DOMException&&e.name==='TimeoutError')setNotice('응답 대기 시간이 지났습니다. 자동 재시도하지 않습니다. 계좌와 거래내역을 새로 확인해주세요.');
    } finally {
      if(mounted.current){setConnect(emptyConnect());setSync(emptySync());setBusy(false);refresh();}
      if(isSync)mutation.current=undefined;
      inFlight.current=false;
    }
  };
  const submitConnect=(event:FormEvent)=>{event.preventDefault();try{const input=normalizeBankConnection(connect);void run(()=>bankAccountApi.connect(meetupId,input),'계좌를 연결했습니다. 은행 조회 가능 여부는 첫 동기화에서 확인됩니다.');}catch(e){setNotice((e as Error).message);}};
  const submitSync=(event:FormEvent)=>{
    event.preventDefault();if(!account||remaining)return;
    try {
      const input=validateBankSync(account.bankCode as BankConnectInput['bankCode'],sync);
      mutation.current=new AbortController();
      // External bank response wait can be 70s; allow 90s including server work.
      const controller=mutation.current; const timeout=window.setTimeout(()=>controller.abort(new DOMException('동기화 응답 시간 초과','TimeoutError')),90000);
      void run(async()=>{try{const result=await bankAccountApi.sync(meetupId,input,controller.signal);if(mounted.current)setNotice(`${result.insertedCount}건의 새 거래를 불러왔습니다.`);return result;}finally{clearTimeout(timeout);}},value=>`${(value as {insertedCount:number}).insertedCount}건의 새 거래를 불러왔습니다.`,true);
    }catch(e){setNotice((e as Error).message);}
  };
  const field='form-input mt-2'; const button='min-h-11 rounded-xl bg-secondary px-4 text-sm disabled:opacity-40';
  return <section className="my-6 space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6" aria-label="모임 계좌 관리">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">모임 계좌 · 거래내역</h2><button disabled={busy} onClick={refresh} className={button}>새로고침</button></div>
    <p className="text-sm text-muted-foreground">저장된 은행 거래를 함께 확인합니다. 동기화가 납부를 자동 처리하지는 않습니다.</p>
    {loading&&<ScreenLoading/>}{!!error&&<RequestError error={error} onRetry={refresh}/>}
    {!!membership.error&&<p className="text-sm text-muted-foreground">운영 권한을 확인하지 못했습니다. <button onClick={membership.retry} className="underline">권한 다시 확인</button></p>}
    {!loading&&missing&&<div className="rounded-xl bg-secondary p-5"><p>연결된 모임 계좌가 없습니다.</p>{membership.canManage?<button onClick={()=>setForm('connect')} className="mt-4 min-h-11 rounded-xl bg-primary px-5 text-white">계좌 연결하기</button>:<p className="mt-2 text-sm text-muted-foreground">모임장 또는 운영진이 계좌를 연결할 수 있습니다.</p>}</div>}
    {account&&!error&&<><div className="rounded-xl bg-secondary p-4"><p className="font-semibold">{supportedBanks[account.bankCode as keyof typeof supportedBanks]??account.bankCode} · {account.accountNumberMasked}</p><p className="mt-2 text-sm">예금주 {account.accountHolder} <span className="text-xs text-muted-foreground">· 운영진 입력 정보</span></p><p className="mt-2 text-xs text-muted-foreground">마지막 동기화 {account.lastSyncedAt?.replace('T',' ')??'없음'}</p>{account.lastSyncError&&<p className="mt-2 text-sm text-red-600">{bankErrorMessage(account.lastSyncError)??'직전 동기화에 실패했습니다. 입력 정보와 연결 상태를 확인해주세요.'}</p>}</div>
      {membership.canManage&&<div className="flex flex-wrap gap-3"><button disabled={busy||remaining>0} onClick={()=>{setSync(emptySync());setForm('sync');}} className={button}>{remaining>0?`동기화 대기 ${Math.floor(remaining/60)}분 ${remaining%60}초`:'거래내역 동기화'}</button><button disabled={busy} onClick={()=>setForm('disconnect')} className={button}>계좌 연결 해제</button></div>}
      {account.nextSyncAt&&<p className="text-xs text-muted-foreground">다음 동기화 {account.nextSyncAt.replace('T',' ')} · 실패한 조회도 최소 5분 제한이 적용됩니다.</p>}
      <div className="flex items-center justify-between"><h3 className="font-semibold">저장된 거래내역</h3><span className="text-xs text-muted-foreground">{page+1}페이지</span></div>
      {!!transactionError&&<RequestError error={transactionError} onRetry={()=>setRevision(v=>v+1)}/>}
      {!transactions.length&&!transactionError&&!loading&&<p className="py-5 text-sm text-muted-foreground">이 페이지에 저장된 거래가 없습니다.</p>}
      {transactions.map(t=><article key={t.transactionId} className="flex flex-wrap justify-between gap-3 border-t border-border py-3 text-sm"><div><p>{t.counterparty||t.displayName||t.description||'거래'}</p><p className="mt-1 text-xs text-muted-foreground">{t.transactedAt.replace('T',' ')}{t.memo?` · ${t.memo}`:''}</p><p className="mt-1 text-xs text-muted-foreground">잔액 {t.balance.toLocaleString()}원</p></div><strong className={t.type==='DEPOSIT'?'text-blue-600':'text-foreground'}>{t.type==='DEPOSIT'?'입금 +':'출금 −'}{t.amount.toLocaleString()}원</strong></article>)}
      <div className="flex justify-between"><button disabled={!page||busy} onClick={()=>setPage(v=>v-1)} className={button}>이전</button><button disabled={!hasNext||busy} onClick={()=>setPage(v=>v+1)} className={button}>다음</button></div></>}
    {form&&membership.canManage&&<section className="space-y-4 rounded-xl border border-border p-4" aria-label="계좌 관리 입력"><div className="flex justify-between gap-3"><h3 className="font-semibold">{form==='connect'?'계좌 연결':form==='sync'?'은행 거래 조회':'계좌 연결 해제'}</h3><button disabled={busy} onClick={close} className="text-sm underline">닫기</button></div>
      {form==='connect'&&<form onSubmit={submitConnect} className="grid gap-4 sm:grid-cols-2" autoComplete="off"><label>은행<select value={connect.bankCode} onChange={e=>setConnect({...connect,bankCode:e.target.value as BankConnectInput['bankCode']})} className={field} disabled={busy}>{Object.entries(supportedBanks).map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></label><label>예금주<input required maxLength={50} value={connect.accountHolder} onChange={e=>setConnect({...connect,accountHolder:e.target.value})} className={field} disabled={busy}/></label><label className="sm:col-span-2">계좌번호<input required inputMode="numeric" maxLength={30} value={connect.accountNumber} onChange={e=>setConnect({...connect,accountNumber:e.target.value})} className={field} disabled={busy}/></label>{(['apiKey','secretKey'] as const).map(key=><label key={key}>{key==='apiKey'?'Bank API Key':'Bank Secret Key'}<input required type="password" autoComplete="new-password" maxLength={200} value={connect[key]} onChange={e=>setConnect({...connect,[key]:e.target.value})} className={field} disabled={busy}/></label>)}<p className="text-xs leading-5 text-muted-foreground sm:col-span-2">키와 계좌번호는 연결을 위해 서버로 전송됩니다. 이 기기에 저장하지 않습니다. 연결 계좌의 마스킹 정보와 거래내역은 모임 회원에게 표시됩니다.</p><button disabled={busy} className="min-h-12 rounded-xl bg-primary px-5 text-white disabled:opacity-40 sm:col-span-2">{busy?'연결 중…':'계좌 연결'}</button></form>}
      {form==='sync'&&account&&<form onSubmit={submitSync} autoComplete="off" className="grid gap-4 sm:grid-cols-2"><label>조회 시작일<input required type="date" max={sync.endDate||koreaToday()} value={sync.startDate} onChange={e=>setSync({...sync,startDate:e.target.value})} className={field} disabled={busy}/></label><label>조회 종료일<input required type="date" min={sync.startDate} max={koreaToday()} value={sync.endDate} onChange={e=>setSync({...sync,endDate:e.target.value})} className={field} disabled={busy}/></label><label className="sm:col-span-2">계좌 비밀번호 (4자리)<input required type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="new-password" value={sync.accountPassword} onChange={e=>setSync({...sync,accountPassword:e.target.value})} className={field} disabled={busy}/></label>
      {account.bankCode==='SH'?<>{(['loginId','loginPassword'] as const).map(key=><label key={key}>{key==='loginId'?'신한 인터넷뱅킹 ID':'인터넷뱅킹 비밀번호'}<input required type={key==='loginPassword'?'password':'text'} autoComplete={key==='loginPassword'?'new-password':'off'} maxLength={key==='loginId'?100:200} value={sync[key]??''} onChange={e=>setSync({...sync,[key]:e.target.value})} className={field} disabled={busy}/></label>)}</>:<><label>계좌 유형<select value={sync.accountType} onChange={e=>setSync({...sync,accountType:e.target.value as 'personal'|'business',residentNumber:''})} className={field} disabled={busy}><option value="personal">개인</option><option value="business">사업자</option></select></label><label>{sync.accountType==='business'?'사업자번호 (10자리)':'생년월일 (6자리)'}<input required type="password" inputMode="numeric" maxLength={sync.accountType==='business'?10:6} autoComplete="new-password" value={sync.residentNumber??''} onChange={e=>setSync({...sync,residentNumber:e.target.value})} className={field} disabled={busy}/></label></>}
      <p className="text-xs leading-5 text-muted-foreground sm:col-span-2">최대 31일을 조회합니다. 입력한 인증정보는 조회 요청 후 비우며 기기에 저장하지 않습니다. 응답은 약 70초 이상 걸릴 수 있습니다.</p><button disabled={busy||remaining>0} className="min-h-12 rounded-xl bg-primary px-5 text-white disabled:opacity-40 sm:col-span-2">{busy?'은행 응답을 기다리는 중…':'거래내역 불러오기'}</button></form>}
      {form==='disconnect'&&<><p className="text-sm">연결을 해제해도 서버에 저장된 거래내역은 보존됩니다. 같은 계좌를 다시 연결하면 이전 내역을 조회할 수 있습니다.</p><button disabled={busy} onClick={()=>void run(()=>bankAccountApi.disconnect(meetupId),'계좌 연결을 해제했습니다.')} className="min-h-11 rounded-xl bg-red-50 px-5 text-red-700 disabled:opacity-40">{busy?'해제 중…':'연결 해제 확인'}</button></>}
    </section>}
    {notice&&<p role="status" className="text-sm leading-6">{notice}</p>}
  </section>;
}
