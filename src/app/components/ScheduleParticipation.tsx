import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../lib/apiClient';
import { participationApi, type Rsvp, type Attendance } from '../services/pendingBackendApi';
import { attendanceEntries } from '../services/attendanceRules';
import type { GroupMember } from '../services/groupMembersApi';
const labels={UNRECORDED:'미기록',PRESENT:'출석',LATE:'지각',ABSENT:'결석'};
export function ScheduleParticipation({scheduleId,canManage=false,members=[]}:{scheduleId:number;canManage?:boolean;members?:GroupMember[]}) {
  const [data,setData]=useState<Rsvp>(); const [error,setError]=useState<unknown>();
  const [revision,setRevision]=useState(0); const [busy,setBusy]=useState(false);
  const [attendance,setAttendance]=useState<Attendance>(); const [saved,setSaved]=useState('');
  const [notice,setNotice]=useState(''); const inFlight=useRef(false); const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{const c=new AbortController();setError(undefined);void participationApi.rsvp(scheduleId,c.signal).then(v=>{if(!c.signal.aborted)setData(v);}).catch(e=>{if(!c.signal.aborted)setError(e);});return()=>c.abort();},[scheduleId,revision]);
  const replace=(value:Attendance)=>{setAttendance(value);setSaved(JSON.stringify(value.members));};
  const run=async(action:()=>Promise<unknown>,readAttendance=false)=>{
    if(inFlight.current)return;inFlight.current=true;setBusy(true);setNotice('');
    try{await action();if(mounted.current){setRevision(v=>v+1);if(readAttendance)replace(await participationApi.attendance(scheduleId));setNotice('서버에 반영했습니다.');}}
    catch(e){if(mounted.current){setNotice(e instanceof ApiError&&e.status===409?'상태가 변경됐습니다. 최신 내역을 확인한 뒤 다시 시도해주세요.':(e as Error).message);setRevision(v=>v+1);if(readAttendance)try{const value=await participationApi.attendance(scheduleId);if(mounted.current)replace(value);}catch{setAttendance(undefined);}}}
    finally{inFlight.current=false;if(mounted.current)setBusy(false);}
  };
  const open=async()=>{setBusy(true);try{const value=await participationApi.attendance(scheduleId);if(mounted.current)replace(value);}catch(e){if(mounted.current)setNotice((e as Error).message);}finally{if(mounted.current)setBusy(false);}};
  const dirty=attendance&&JSON.stringify(attendance.members)!==saved;
  const button='min-h-11 rounded-lg bg-secondary px-4 text-sm disabled:opacity-40';
  if(error)return <div role="alert" className="space-y-2 text-sm"><p>{error instanceof Error?error.message:'참석 정보를 불러오지 못했습니다.'}</p><button onClick={()=>setRevision(v=>v+1)} className={button}>참석 정보 다시 조회</button></div>;
  return <div className="space-y-3 border-t border-border pt-4"><p className="text-sm">참석 {data?.counts.ATTENDING??0}명 · 불참 {data?.counts.NOT_ATTENDING??0}명 · 내 응답 {{ATTENDING:'참석',NOT_ATTENDING:'불참',UNDECIDED:'미정'}[data?.myStatus as 'ATTENDING']??'미응답'}</p>
    <div className="flex flex-wrap gap-2">{(['ATTENDING','NOT_ATTENDING','UNDECIDED'] as const).map((value,i)=><button key={value} disabled={!data?.canRespond||busy} aria-pressed={data?.myStatus===value} onClick={()=>void run(()=>participationApi.respond(scheduleId,value))} className={button}>{['참석','불참','미정'][i]}</button>)}<button disabled={!data?.canRespond||busy} onClick={()=>void run(()=>participationApi.withdraw(scheduleId))} className={button}>응답 철회</button>{canManage&&<button disabled={busy} onClick={()=>void open()} className={button}>출석부 · 운영진</button>}</div>
    {canManage&&attendance&&<section aria-label="일정 출석부" className="space-y-3 rounded-lg bg-secondary p-4"><div className="flex justify-between gap-3"><p className="text-sm">출석부 · {attendance.collectionStatus==='COMPLETED'?'집계 완료':'집계 중'}</p><button disabled={busy} onClick={()=>{setAttendance(undefined);setSaved('');}} className="text-sm underline">닫기</button></div>{attendance.members.map(member=><label key={member.groupMemberId} className="flex items-center justify-between gap-3 text-sm">{members.find(m=>m.groupMemberId===member.groupMemberId)?.nickname??`회원 #${member.groupMemberId}`}<select aria-label={`회원 ${member.groupMemberId} 출석`} disabled={!attendance.canEdit||busy} value={member.status} onChange={e=>setAttendance({...attendance,members:attendance.members.map(m=>m.groupMemberId===member.groupMemberId?{...m,status:e.target.value as typeof m.status}:m)})} className="form-input w-auto">{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>)}
      {!attendance.members.length&&<p className="text-sm">출석 대상이 없습니다.</p>}
      {dirty&&<p className="text-xs text-primary">변경한 출석을 먼저 저장해주세요.</p>}
      <div className="flex flex-wrap gap-2">{attendance.canEdit&&<button disabled={busy||!dirty} onClick={()=>void run(()=>participationApi.mark(scheduleId,attendance.version,attendanceEntries(attendance.members)),true)} className={button}>출석 저장</button>}{attendance.canComplete&&<button disabled={busy||!!dirty} onClick={()=>{if(window.confirm('저장된 출석을 확정할까요? 미기록 회원은 결석 처리됩니다.'))void run(()=>participationApi.complete(scheduleId,attendance.version),true);}} className={button}>출석 확정</button>}{attendance.canReopen&&<button disabled={busy} onClick={()=>void run(()=>participationApi.reopen(scheduleId,attendance.version),true)} className={button}>출석부 다시 열기</button>}</div>
    </section>}
    {notice&&<p role="status" className="text-sm">{notice}</p>}
  </div>;
}
