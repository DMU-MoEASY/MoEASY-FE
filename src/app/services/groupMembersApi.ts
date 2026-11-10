import { apiRequest } from '../lib/apiClient';
import { record, nonnegative, text, validResponse } from './apiResponseValidation';
export type GroupMember = {groupMemberId:number;memberId:number;nickname:string;role:'OWNER'|'MANAGER'|'MEMBER'};
export const groupMembersApi = {
 list:(id:string|number,signal?:AbortSignal)=>apiRequest<{members:GroupMember[]}>(`/groups/${id}/members`,{signal}).then(v=>validResponse<{members:GroupMember[]}>(v,x=>record(x)&&Array.isArray(x.members)&&x.members.every(m=>record(m)&&nonnegative(m.groupMemberId)&&nonnegative(m.memberId)&&text(m.nickname)&&['OWNER','MANAGER','MEMBER'].includes(String(m.role))),'모임 회원 목록')),
};
