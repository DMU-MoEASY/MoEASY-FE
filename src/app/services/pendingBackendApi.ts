// Contracts verified against deployed Swagger and FE integration guide (2026-11-11).
import type { BankConnectInput, BankSyncInput } from './bankManagement';
import { apiRequest } from '../lib/apiClient';
import { validResponse, record, nonnegative, text, nullableText } from './apiResponseValidation';
export type Rsvp={scheduleId:number;startsAt:string;endsAt:string;canRespond:boolean;myStatus:string|null;counts:Record<string,number>;members:{groupMemberId:number;status:string}[]};
export type Attendance={scheduleId:number;collectionStatus:string;version:number;canEdit:boolean;canComplete:boolean;canReopen:boolean;rosterFixed:boolean;recoverable:boolean;members:{groupMemberId:number;status:'PRESENT'|'LATE'|'ABSENT'|'UNRECORDED';preRegistered:boolean;credited:boolean}[]};
export const participationApi={
 rsvp:(id:number,signal?:AbortSignal)=>apiRequest<Rsvp>(`/schedules/${id}/rsvp`,{signal}).then(v=>validResponse<Rsvp>(v,x=>record(x)&&nonnegative(x.scheduleId)&&typeof x.canRespond==='boolean'&&record(x.counts)&&Array.isArray(x.members),'참석 신청')),
 respond:(id:number,status:'ATTENDING'|'NOT_ATTENDING'|'UNDECIDED')=>apiRequest(`/schedules/${id}/rsvp/me`,{method:'PUT',body:{status}}),
 withdraw:(id:number)=>apiRequest(`/schedules/${id}/rsvp/me`,{method:'DELETE'}),
 attendance:(id:number,signal?:AbortSignal)=>apiRequest<Attendance>(`/schedules/${id}/attendance`,{signal}).then(v=>validResponse<Attendance>(v,x=>record(x)&&nonnegative(x.version)&&typeof x.canEdit==='boolean'&&Array.isArray(x.members)&&x.members.every(m=>record(m)&&nonnegative(m.groupMemberId)&&['PRESENT','LATE','ABSENT','UNRECORDED'].includes(String(m.status))),'출석부')),
 mark:(id:number,version:number,entries:{groupMemberId:number;status:'PRESENT'|'LATE'|'ABSENT'}[])=>apiRequest<Attendance>(`/schedules/${id}/attendance`,{method:'PUT',body:{version,entries}}),
 complete:(id:number,version:number)=>apiRequest<Attendance>(`/schedules/${id}/attendance/complete`,{method:'POST',body:{version}}),
 reopen:(id:number,version:number)=>apiRequest<Attendance>(`/schedules/${id}/attendance/reopen`,{method:'POST',body:{version}}),
};
export type BankAccount={accountId:number;bankCode:string;accountNumberMasked:string;accountHolder:string;lastSyncedAt:string|null;nextSyncAt:string|null;lastSyncError:string|null};
export type BankTransaction={transactionId:number;type:'DEPOSIT'|'WITHDRAWAL';transactedAt:string;description:string;displayName:string;counterparty:string;amount:number;balance:number;branch:string;memo:string};
const validAccount=(x:unknown)=>record(x)&&nonnegative(x.accountId)&&['NH','KB','WR','IBK','SH'].includes(String(x.bankCode))&&text(x.accountNumberMasked)&&text(x.accountHolder)&&nullableText(x.lastSyncedAt)&&nullableText(x.nextSyncAt)&&nullableText(x.lastSyncError);
export const bankAccountApi={
 connect:(id:string|number,input:BankConnectInput)=>apiRequest<BankAccount>(`/groups/${id}/bank-account`,{method:'POST',body:input}).then(v=>validResponse<BankAccount>(v,validAccount,'모임 계좌 연결')),
 disconnect:(id:string|number)=>apiRequest<void>(`/groups/${id}/bank-account`,{method:'DELETE'}),
 sync:(id:string|number,input:BankSyncInput,signal?:AbortSignal)=>apiRequest<{insertedCount:number;lastSyncedAt:string}>(`/groups/${id}/bank-account/sync`,{method:'POST',body:input,signal}).then(v=>validResponse<{insertedCount:number;lastSyncedAt:string}>(v,x=>record(x)&&nonnegative(x.insertedCount)&&text(x.lastSyncedAt),'거래 동기화')),
 get:(id:string|number,signal?:AbortSignal)=>apiRequest<BankAccount>(`/groups/${id}/bank-account`,{signal}).then(v=>validResponse<BankAccount>(v,validAccount,'모임 계좌')),
 transactions:(id:string|number,page=0,signal?:AbortSignal)=>apiRequest<{items:BankTransaction[];page:number;totalPages:number;hasNext:boolean}>(`/groups/${id}/bank-account/transactions?page=${page}&size=20`,{signal}).then(v=>validResponse<{items:BankTransaction[];page:number;totalPages:number;hasNext:boolean}>(v,x=>record(x)&&Array.isArray(x.items)&&x.items.every(t=>record(t)&&nonnegative(t.transactionId)&&['DEPOSIT','WITHDRAWAL'].includes(String(t.type))&&text(t.transactedAt)&&nonnegative(t.amount)&&Number.isSafeInteger(t.balance)&&[t.counterparty,t.displayName,t.description,t.memo].every(text))&&typeof x.hasNext==='boolean','거래내역')),
};
export type PaymentActor={groupMemberId:number;nickname:string};
export type PaymentHistory={paymentId:number;settlementItemId:number;paymentType:string;source:string;status:string;amount:number;occurredAt:string|null;createdAt:string;cancelReason:string|null;recordedBy?:PaymentActor|null;cancelledAt?:string|null;cancelledBy?:PaymentActor|null};
const actor=(x:unknown)=>x===undefined||x===null||record(x)&&nonnegative(x.groupMemberId)&&text(x.nickname);
const payments=(groupId:string|number,settlementId:number,itemId:number)=>`/groups/${groupId}/settlements/${settlementId}/items/${itemId}/payments`;
export const settlementPaymentApi={
 list:(groupId:string|number,settlementId:number,itemId:number,page=0,signal?:AbortSignal)=>apiRequest<{items:PaymentHistory[];page:number;totalPages:number;hasNext:boolean}>(`${payments(groupId,settlementId,itemId)}?page=${page}&size=20`,{signal}).then(v=>validResponse<{items:PaymentHistory[];page:number;totalPages:number;hasNext:boolean}>(v,x=>record(x)&&Array.isArray(x.items)&&x.items.every(p=>record(p)&&nonnegative(p.paymentId)&&nonnegative(p.amount)&&text(p.status)&&text(p.createdAt)&&nullableText(p.occurredAt)&&nullableText(p.cancelReason)&&[p.recordedBy,p.cancelledBy].every(actor)&&(p.cancelledAt===undefined||nullableText(p.cancelledAt)))&&typeof x.hasNext==='boolean','납부 기록')),
 register:(groupId:string|number,settlementId:number,itemId:number,input:{amount:number;expectedVersion:number;occurredAt?:string})=>apiRequest(payments(groupId,settlementId,itemId),{method:'POST',body:input}),
 cancel:(groupId:string|number,settlementId:number,itemId:number,paymentId:number,input:{expectedVersion:number;reason:string})=>apiRequest(`${payments(groupId,settlementId,itemId)}/${paymentId}/cancel`,{method:'POST',body:input}),
};
