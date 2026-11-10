import { persistenceStore } from '../lib/persistence';
import { apiRequest } from '../lib/apiClient';
import { record, text, nonnegative, validResponse } from './apiResponseValidation';
export type ServerSchedule = { scheduleId:number;groupId:number;title:string;startsAt:string;endsAt:string;locationName:string;status:'SCHEDULED'|'CANCELLED' };
export type ServerScheduleDetail = ServerSchedule & { description:string;locationAddress:string;latitude:number|null;longitude:number|null;placeProvider:'KAKAO'|'GOOGLE'|null;placeId:string|null;createdAt:string;updatedAt:string };
export type ScheduleInput = { title:string;description:string;startsAt:string;endsAt:string;locationName:string;locationAddress:string };
export type SchedulePage = {from:string;to:string;items:ServerSchedule[];nextCursor:string|null;hasNext:boolean};
const valid=(v:unknown)=>record(v)&&nonnegative(v.scheduleId)&&nonnegative(v.groupId)&&text(v.title)&&text(v.startsAt)&&text(v.endsAt)&&text(v.locationName)&&['SCHEDULED','CANCELLED'].includes(String(v.status));
export function koreaLocalTime(value: string) { return value.length === 16 ? `${value}:00` : value; }
export const scheduleApi = {
 list:(groupId:number,query:{from?:string;to?:string;cursor?:string}={},signal?:AbortSignal)=>apiRequest<SchedulePage>(`/groups/${groupId}/schedules?${new URLSearchParams({...query,size:'50'})}`,{signal}).then(v=>validResponse<SchedulePage>(v,x=>record(x)&&Array.isArray(x.items)&&x.items.every(valid)&&typeof x.hasNext==='boolean'&&(x.nextCursor===null||text(x.nextCursor)),'일정 목록')),
 detail:(id:number,signal?:AbortSignal)=>apiRequest<ServerScheduleDetail>(`/schedules/${id}`,{signal}).then(v=>validResponse<ServerScheduleDetail>(v,x=>valid(x)&&record(x)&&text(x.description)&&text(x.locationAddress),'일정 상세')),
 create:(groupId:number,input:ScheduleInput)=>apiRequest<{scheduleId:number}>(`/groups/${groupId}/schedules`,{method:'POST',body:input}),
 update:(id:number,input:Partial<ScheduleInput>)=>apiRequest<ServerScheduleDetail>(`/schedules/${id}`,{method:'PATCH',body:input}),
 cancel:(id:number)=>apiRequest<void>(`/schedules/${id}/cancel`,{method:'POST'}),
 remove:(id:number)=>apiRequest<void>(`/schedules/${id}`,{method:'DELETE'}),
};

// Account-scoped server read cache for the map. Never mixed with local draft schedules.
export type ServerMapEvent={id:string;title:string;place:string;dateValue:string;time:string;meetupId:number;group:string;status?:'CONFIRMED'};
export const serverScheduleMapKey=()=>`moeasy:server-schedule-map:${persistenceStore.read<{memberId:number}>('moeasy:authSession')?.memberId??'anonymous'}`;
export function cacheServerScheduleWindow(groupId:number,month:string,items:ServerSchedule[]){
 const key=serverScheduleMapKey();const current=persistenceStore.read<ServerMapEvent[]>(key)??[];
 const kept=current.filter(e=>e.meetupId!==groupId||!e.dateValue.startsWith(month));
 const next=items.filter(s=>s.status==='SCHEDULED').map(s=>({id:`server:${s.scheduleId}`,title:s.title,place:s.locationName,dateValue:s.startsAt.slice(0,10),time:s.startsAt.slice(11,16),meetupId:groupId,group:`모임 #${groupId}`}));
 persistenceStore.write(key,[...kept,...next]);
}
