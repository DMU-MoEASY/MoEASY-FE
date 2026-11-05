import { useState } from 'react';
import { Copy, ExternalLink, Wallet } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { persistenceStore } from '../lib/persistence';
import { buildTossTransferUrl, transferFingerprint, type TransferAccount } from '../services/tossTransfer';

type Target = { id: string; name: string; amount: number };
const emptyAccount: TransferAccount = { bank: '', accountNumber: '', holder: '' };
const banks = ['국민은행', '신한은행', '우리은행', '하나은행', '농협은행', '기업은행', '카카오뱅크', '케이뱅크', '토스뱅크', '우체국', '새마을금고', '신협', '부산은행', 'iM뱅크'];

export function SettlementTransferPanel({ meetupId, settlementId = 'manual', targets = [] }: { meetupId: string | number; settlementId?: string; targets?: Target[] }) {
  const memberId = persistenceStore.read<{ memberId?: number }>('moeasy:authSession')?.memberId ?? 'local';
  const scope = `${memberId}:${meetupId}`;
  const [account, saveAccount] = usePersistentState<TransferAccount>(`moeasy:transfer-account:${scope}`, emptyAccount);
  const [memo, saveMemo] = usePersistentState<{ fingerprint: string; at: string } | null>(`moeasy:transfer-memo:${scope}:${settlementId}`, null);
  const [editing, setEditing] = useState(!account.accountNumber);
  const [draft, setDraft] = useState(account);
  const [targetId, setTargetId] = usePersistentState(`moeasy:transfer-target:${scope}:${settlementId}`, '');
  const [manualAmount, setManualAmount] = usePersistentState(`moeasy:transfer-amount:${scope}:${settlementId}`, '');
  const [message, setMessage] = useState('');
  const target = targets.find(item => item.id === targetId);
  const amount = target?.amount ?? Number(manualAmount);
  let href = '';
  let validation = '';
  try { href = buildTossTransferUrl(account, amount); } catch (error) { validation = (error as Error).message; }
  const fingerprint = transferFingerprint(account, amount, targetId);
  const reported = memo?.fingerprint === fingerprint;
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setMessage('복사했어요. 사용하는 은행 앱에 붙여넣어주세요.'); }
    catch { setMessage('복사하지 못했어요. 아래 표시된 정보를 직접 선택해 복사해주세요.'); }
  };
  return <section aria-label="정산 송금 준비" className="my-6 space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-semibold"><Wallet className="h-5 w-5"/>송금 준비</h2><p className="mt-2 text-sm text-muted-foreground">받는 계좌와 본인의 납부 금액을 확인해주세요.</p></div>{!editing && <button type="button" onClick={() => { setDraft(account); setEditing(true); setMessage(''); }} className="min-h-11 rounded-lg bg-secondary px-4 text-sm">계좌 수정</button>}</div>
    <p className="text-xs leading-5 text-muted-foreground">계좌 설정과 송금 메모는 현재 계정의 이 기기에만 저장됩니다. 다른 회원이나 운영자에게 전달되지 않습니다.</p>
    {editing ? <form className="grid gap-4 sm:grid-cols-2" onSubmit={event => {
      event.preventDefault();
      try { buildTossTransferUrl(draft, 1); saveAccount({ bank: draft.bank.trim(), holder: draft.holder.trim(), accountNumber: draft.accountNumber.replace(/[\s-]/g, '') }); setEditing(false); setMessage('이 기기에 계좌를 저장했어요. 실제 받는 계좌가 맞는지 확인해주세요.'); }
      catch (error) { setMessage((error as Error).message); }
    }}>
      <label className="text-sm">은행<input list="transfer-bank-options" required maxLength={40} value={draft.bank} onChange={event => setDraft({ ...draft, bank: event.target.value })} className="form-input mt-2" placeholder="은행 선택 또는 입력"/><datalist id="transfer-bank-options">{banks.map(bank => <option key={bank} value={bank}/>)}</datalist></label>
      <label className="text-sm">예금주<input required maxLength={50} value={draft.holder} onChange={event => setDraft({ ...draft, holder: event.target.value })} className="form-input mt-2" autoComplete="off"/></label>
      <label className="text-sm sm:col-span-2">계좌번호<input required inputMode="numeric" maxLength={30} value={draft.accountNumber} onChange={event => setDraft({ ...draft, accountNumber: event.target.value })} className="form-input mt-2" placeholder="숫자와 하이픈으로 입력" autoComplete="off"/></label>
      <div className="flex gap-2 sm:col-span-2"><button type="submit" className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white">계좌 저장</button>{account.accountNumber && <button type="button" onClick={() => setEditing(false)} className="min-h-11 rounded-xl bg-secondary px-5 text-sm">취소</button>}</div>
    </form> : <>
      <div className="rounded-xl bg-secondary p-4"><p className="font-medium">{account.bank} · {account.holder}</p><p className="mt-2 select-all break-all font-mono text-lg">{account.accountNumber}</p><button type="button" onClick={() => void copy(account.accountNumber)} className="mt-3 flex min-h-11 items-center gap-2 text-sm"><Copy className="h-4 w-4"/>계좌번호 복사</button></div>
      {targets.length > 0 && <label className="block text-sm">본인의 청구 항목 선택<select value={targetId} onChange={event => { setTargetId(event.target.value); setMessage(''); }} className="form-input mt-2"><option value="">금액 직접 입력</option>{targets.map(item => <option key={item.id} value={item.id}>{item.name} · {item.amount.toLocaleString()}원</option>)}</select></label>}
      {target ? <p className="text-sm">선택한 청구: {target.name} · <strong>{amount.toLocaleString()}원</strong><span className="mt-1 block text-xs text-muted-foreground">본인의 청구 항목인지 확인해주세요.</span></p> : <label className="block text-sm">송금할 금액 (원)<input inputMode="numeric" value={manualAmount} onChange={event => setManualAmount(event.target.value.replace(/\D/g, ''))} className="form-input mt-2" placeholder="본인의 납부 금액 입력"/></label>}
      <div className="flex flex-col gap-3 sm:flex-row">{href ? <a href={href} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white"><ExternalLink className="h-4 w-4"/>토스로 {amount.toLocaleString()}원 송금하기</a> : <button type="button" disabled className="min-h-12 rounded-xl bg-primary px-5 text-sm text-white opacity-40">토스로 송금하기</button>}<button type="button" disabled={!href} onClick={() => void copy(String(amount))} className="min-h-12 rounded-xl bg-secondary px-5 text-sm disabled:opacity-40">금액 복사</button></div>
      {!href && <p className="text-sm text-muted-foreground">{validation}</p>}
      <p className="text-xs leading-5 text-muted-foreground">휴대폰에서 토스 앱을 엽니다. 앱이 열리지 않으면 계좌번호와 금액을 복사해 은행 앱을 이용해주세요. 받는 분 확인과 최종 송금은 토스에서 직접 진행합니다.</p>
      <div className="border-t border-border pt-4"><p className="text-sm">{reported ? '이 기기에 송금 메모가 있어요 · 실제 입금 확인 전' : '송금을 마쳤다면 개인 메모를 남길 수 있어요.'}</p><button type="button" disabled={!href} onClick={() => { saveMemo(reported ? null : { fingerprint, at: new Date().toISOString() }); setMessage(reported ? '송금 메모를 취소했어요.' : '이 기기에만 기록했어요. 운영자에게 별도로 입금 확인을 요청해주세요.'); }} className="mt-2 min-h-11 text-sm font-medium text-primary disabled:opacity-40">{reported ? '송금 메모 취소' : '송금했어요 · 이 기기에 메모'}</button><p className="text-xs leading-5 text-muted-foreground">이 버튼으로 납부 완료 상태가 변경되지는 않습니다.</p></div>
    </>}
    {message && <p role="status" className="rounded-lg bg-secondary p-3 text-sm">{message}</p>}
  </section>;
}
