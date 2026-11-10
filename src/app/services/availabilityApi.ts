import { apiRequest } from '../lib/apiClient';
import { record, nonnegative, text, validResponse } from './apiResponseValidation';
export type AvailabilityConfig={startDate:string;dayCount:number;startHour:number;endHour:number;voteDeadlineAt:string};
export type AvailabilityPoll=AvailabilityConfig & {pollId:number;status:'OPEN'|'CLOSED'|'CONFIRMED';slotMinutes:number;token:string;confirmed:boolean;confirmedStartsAt:string|null;confirmedEndsAt:string|null};
export type AvailabilityDetail={poll:AvailabilityPoll;targetCount:number;respondedCount:number;pendingCount:number;slots:{startsAt:string;availableCount:number;selected:boolean}[];me:{responded:boolean;slots:string[];editable:boolean};recommendations:{startsAt:string;endsAt:string;availableCount:number;targetCount:number;ratio:number}[]};
const configBody=(input:AvailabilityConfig)=>({startDate:input.startDate,dayCount:input.dayCount,startHour:input.startHour,endHour:input.endHour,voteDeadlineAt:input.voteDeadlineAt});
const base=(id:number)=>`/schedules/${id}`;
export const availabilityApi={
 detail:(id:number,signal?:AbortSignal)=>apiRequest<AvailabilityDetail>(`${base(id)}/availability`,{signal}).then(v=>validResponse<AvailabilityDetail>(v,x=>record(x)&&record(x.poll)&&text(x.poll.token)&&text(x.poll.voteDeadlineAt)&&x.poll.slotMinutes===30&&['OPEN','CLOSED','CONFIRMED'].includes(String(x.poll.status))&&typeof x.poll.confirmed==='boolean'&&nonnegative(x.targetCount)&&nonnegative(x.respondedCount)&&nonnegative(x.pendingCount)&&Array.isArray(x.slots)&&x.slots.every(s=>record(s)&&text(s.startsAt)&&nonnegative(s.availableCount)&&typeof s.selected==='boolean')&&record(x.me)&&Array.isArray(x.me.slots)&&x.me.slots.every(text)&&typeof x.me.editable==='boolean'&&typeof x.me.responded==='boolean'&&Array.isArray(x.recommendations)&&x.recommendations.every(r=>record(r)&&text(r.startsAt)&&text(r.endsAt)&&nonnegative(r.availableCount)&&nonnegative(r.targetCount)&&typeof r.ratio==='number'&&r.ratio>=0&&r.ratio<=1),'가용시간 그리드')),
 create:(id:number,input:AvailabilityConfig)=>apiRequest<AvailabilityPoll>(`${base(id)}/availability-poll`,{method:'POST',body:configBody(input)}),
 configure:(id:number,input:AvailabilityConfig)=>apiRequest<AvailabilityPoll>(`${base(id)}/availability-poll`,{method:'PATCH',body:configBody(input)}),
 submit:(id:number,slots:string[])=>apiRequest<void>(`${base(id)}/availability/me`,{method:'PUT',body:{slots:slots.map(s=>s.length===16?`${s}:00`:s)}}),
 withdraw:(id:number)=>apiRequest<void>(`${base(id)}/availability/me`,{method:'DELETE'}),
 confirm:(id:number,startsAt:string,token:string)=>apiRequest<AvailabilityPoll>(`${base(id)}/availability-poll/confirm`,{method:'POST',body:{startsAt,token}}),
 remove:(id:number)=>apiRequest<void>(`${base(id)}/availability-poll`,{method:'DELETE'}),
};
