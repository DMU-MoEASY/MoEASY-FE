import { record, nonnegative, text, validResponse } from './apiResponseValidation';
import { apiRequest } from '../lib/apiClient';
export type PendingJoinRequest={requestId:number;memberId:number;nickname:string;introduction:string;createdAt:string};
export type PendingJoinPage={items:PendingJoinRequest[];page:number;size:number;hasNext:boolean};
const validPage=(value:unknown)=>record(value)&&Array.isArray(value.items)&&value.items.every(item=>record(item)&&nonnegative(item.requestId)&&nonnegative(item.memberId)&&text(item.nickname)&&text(item.introduction)&&text(item.createdAt))&&nonnegative(value.page)&&nonnegative(value.size)&&typeof value.hasNext==='boolean';
export const joinRequestApi={
  list:(groupId:string|number,page=0,signal?:AbortSignal)=>apiRequest<PendingJoinPage>(`/groups/${groupId}/join-requests?page=${page}&size=20`,{signal}).then(value=>validResponse<PendingJoinPage>(value,validPage,'가입 신청 목록')),
  approve:(groupId:string|number,requestId:number)=>apiRequest<void>(`/groups/${groupId}/join-requests/${requestId}/approve`,{method:'POST'}),
  reject:(groupId:string|number,requestId:number,rejectionReason?:string)=>apiRequest<void>(`/groups/${groupId}/join-requests/${requestId}/reject`,{method:'POST',body:rejectionReason?{rejectionReason}:{}}),
};
