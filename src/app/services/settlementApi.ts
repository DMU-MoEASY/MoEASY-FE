import { record, nonnegative, text, nullableText, validResponse } from './apiResponseValidation';
import { apiRequest } from '../lib/apiClient';
export type SettlementStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';
export type SettlementSummary = { settlementId:number;title:string;scheduleId:number|null;status:SettlementStatus;splitMode:'EQUAL'|'CUSTOM';totalAmount:number;targetCount:number;dueAt:string|null;createdAt:string };
export type SettlementDetail = SettlementSummary & {groupId:number;description:string|null;createdBy:{groupMemberId:number;nickname:string};items:{settlementItemId:number;groupMemberId:number;nickname:string;amount:number;status:'PENDING'|'PAID'|'REFUNDED'|'CANCELLED'}[]};
export type SettlementPage = {items:SettlementSummary[];page:number;size:number;totalElements:number;totalPages:number;hasNext:boolean};
// These are group_member.id values, never account IDs or local demo member IDs.
export type SettlementSplit = {totalAmount:number} & ({splitMode:'EQUAL';groupMemberIds:number[];memberAmounts?:never}|{splitMode:'CUSTOM';memberAmounts:{groupMemberId:number;amount:number}[];groupMemberIds?:never});
export type SettlementPreview = {splitMode:'EQUAL'|'CUSTOM';totalAmount:number;targetCount:number;items:{groupMemberId:number;nickname:string;amount:number;remainderAmount:number}[]};
const validSummary=(v:unknown)=>record(v)&&nonnegative(v.settlementId)&&text(v.title)&&['OPEN','CLOSED','CANCELLED'].includes(String(v.status))&&['EQUAL','CUSTOM'].includes(String(v.splitMode))&&nonnegative(v.totalAmount)&&nonnegative(v.targetCount)&&nullableText(v.dueAt)&&text(v.createdAt);
const validPage=(v:unknown)=>record(v)&&Array.isArray(v.items)&&v.items.every(validSummary)&&nonnegative(v.page)&&nonnegative(v.size)&&nonnegative(v.totalElements)&&nonnegative(v.totalPages)&&typeof v.hasNext==='boolean';
const validDetail=(v:unknown)=>validSummary(v)&&record(v)&&nonnegative(v.groupId)&&nullableText(v.description)&&record(v.createdBy)&&text(v.createdBy.nickname)&&Array.isArray(v.items)&&v.items.every(item=>record(item)&&nonnegative(item.settlementItemId)&&nonnegative(item.groupMemberId)&&text(item.nickname)&&nonnegative(item.amount)&&['PENDING','PAID','REFUNDED','CANCELLED'].includes(String(item.status)));
export const settlementApi = {
  list:(groupId:string|number,page=0,status?:SettlementStatus,signal?:AbortSignal)=>apiRequest<SettlementPage>(`/groups/${groupId}/settlements?${new URLSearchParams({page:String(page),size:'20',...(status?{status}:{})})}`,{signal}).then(value=>validResponse<SettlementPage>(value,validPage,'정산 목록')),
  detail:(groupId:string|number,id:number,signal?:AbortSignal)=>apiRequest<SettlementDetail>(`/groups/${groupId}/settlements/${id}`,{signal}).then(value=>validResponse<SettlementDetail>(value,validDetail,'정산 상세')),
  preview:(groupId:string|number,input:SettlementSplit)=>apiRequest<SettlementPreview>(`/groups/${groupId}/settlements/preview`,{method:'POST',body:input}),
  create:(groupId:string|number,input:SettlementSplit & {title:string;description?:string;dueAt?:string;scheduleId?:number})=>apiRequest<{settlementId:number}>(`/groups/${groupId}/settlements`,{method:'POST',body:input}),
};
