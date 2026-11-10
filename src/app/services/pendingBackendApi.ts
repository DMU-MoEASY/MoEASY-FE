// Contracts reviewed against BE PRs #31/#36/#37. They may not be deployed yet.
import { apiRequest } from '../lib/apiClient';
import { validResponse, record, nonnegative, text, nullableText } from './apiResponseValidation';
export type Rsvp={scheduleId:number;startsAt:string;endsAt:string;canRespond:boolean;myStatus:string|null;counts:Record<string,number>;members:{groupMemberId:number;status:string}[]};
export type Attendance={scheduleId:number;collectionStatus:string;version:number;canEdit:boolean;canComplete:boolean;canReopen:boolean;rosterFixed:boolean;recoverable:boolean;members:{groupMemberId:number;status:'PRESENT'|'LATE'|'ABSENT';preRegistered:boolean;credited:boolean}[]};
export const participationApi={
 rsvp:(id:number,signal?:AbortSignal)=>apiRequest<Rsvp>(`/schedules/${id}/rsvp`,{signal}).then(v=>validResponse<Rsvp>(v,x=>record(x)&&nonnegative(x.scheduleId)&&typeof x.canRespond==='boolean'&&record(x.counts)&&Array.isArray(x.members),'참석 신청')),
 respond:(id:number,status:'ATTENDING'|'NOT_ATTENDING'|'UNDECIDED')=>apiRequest(`/schedules/${id}/rsvp/me`,{method:'PUT',body:{status}}),
 withdraw:(id:number)=>apiRequest(`/schedules/${id}/rsvp/me`,{method:'DELETE'}),
 attendance:(id:number,signal?:AbortSignal)=>apiRequest<Attendance>(`/schedules/${id}/attendance`,{signal}).then(v=>validResponse<Attendance>(v,x=>record(x)&&nonnegative(x.version)&&typeof x.canEdit==='boolean'&&Array.isArray(x.members)&&x.members.every(m=>record(m)&&nonnegative(m.groupMemberId)&&['PRESENT','LATE','ABSENT'].includes(String(m.status))),'출석부')),
 mark:(id:number,version:number,entries:{groupMemberId:number;status:string}[])=>apiRequest<Attendance>(`/schedules/${id}/attendance`,{method:'PUT',body:{version,entries}}),
 complete:(id:number,version:number)=>apiRequest<Attendance>(`/schedules/${id}/attendance/complete`,{method:'POST',body:{version}}),
 reopen:(id:number,version:number)=>apiRequest<Attendance>(`/schedules/${id}/attendance/reopen`,{method:'POST',body:{version}}),
};
export type BankAccount={accountId:number;bankCode:string;accountNumberMasked:string;accountHolder:string;lastSyncedAt:string|null;nextSyncAt:string|null;lastSyncError:string|null};
export type BankTransaction={transactionId:number;type:'DEPOSIT'|'WITHDRAWAL';transactedAt:string;description:string;displayName:string;counterparty:string;amount:number;balance:number;branch:string;memo:string};
export const bankAccountApi={
 get:(id:string|number,signal?:AbortSignal)=>apiRequest<BankAccount>(`/groups/${id}/bank-account`,{signal}).then(v=>validResponse<BankAccount>(v,x=>record(x)&&nonnegative(x.accountId)&&text(x.bankCode)&&text(x.accountNumberMasked)&&text(x.accountHolder)&&nullableText(x.lastSyncedAt)&&nullableText(x.nextSyncAt),'모임 계좌')),
 transactions:(id:string|number,page=0,signal?:AbortSignal)=>apiRequest<{items:BankTransaction[];page:number;totalPages:number;hasNext:boolean}>(`/groups/${id}/bank-account/transactions?page=${page}&size=20`,{signal}).then(v=>validResponse<{items:BankTransaction[];page:number;totalPages:number;hasNext:boolean}>(v,x=>record(x)&&Array.isArray(x.items)&&x.items.every(t=>record(t)&&text(t.transactedAt)&&nonnegative(t.amount)&&Number.isSafeInteger(t.balance))&&typeof x.hasNext==='boolean','거래내역')),
};
export type PaymentHistory={paymentId:number;settlementItemId:number;paymentType:string;source:string;status:string;amount:number;occurredAt:string|null;createdAt:string;cancelReason:string|null};
const payments=(groupId:string|number,settlementId:number,itemId:number)=>`/groups/${groupId}/settlements/${settlementId}/items/${itemId}/payments`;
export const settlementPaymentApi={
 list:(groupId:string|number,settlementId:number,itemId:number,page=0,signal?:AbortSignal)=>apiRequest<{items:PaymentHistory[];page:number;totalPages:number;hasNext:boolean}>(`${payments(groupId,settlementId,itemId)}?page=${page}&size=20`,{signal}).then(v=>validResponse<{items:PaymentHistory[];page:number;totalPages:number;hasNext:boolean}>(v,x=>record(x)&&Array.isArray(x.items)&&x.items.every(p=>record(p)&&nonnegative(p.paymentId)&&nonnegative(p.amount)&&text(p.status)&&text(p.createdAt)&&nullableText(p.occurredAt))&&typeof x.hasNext==='boolean','납부 기록')),
 register:(groupId:string|number,settlementId:number,itemId:number,input:{amount:number;expectedVersion:number;occurredAt?:string})=>apiRequest(payments(groupId,settlementId,itemId),{method:'POST',body:input}),
 cancel:(groupId:string|number,settlementId:number,itemId:number,paymentId:number,input:{expectedVersion:number;reason:string})=>apiRequest(`${payments(groupId,settlementId,itemId)}/${paymentId}/cancel`,{method:'POST',body:input}),
};
