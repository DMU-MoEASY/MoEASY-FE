import { useState } from 'react';
import { type AvailabilityConfig } from '../services/availabilityApi';
import { buildGridCandidates } from '../services/schedulePollRules';
import { koreaNow } from '../services/bankManagement';
import { TimeGrid } from './TimeGrid';
export function AvailabilitySettings({initial,busy,confirmed=false,onSave,onCancel}:{initial:AvailabilityConfig;busy:boolean;confirmed?:boolean;onSave:(config:AvailabilityConfig)=>Promise<void>;onCancel?:()=>void}) {
  const [config,setConfig]=useState<AvailabilityConfig>(()=>({startDate:initial.startDate,dayCount:initial.dayCount,startHour:initial.startHour,endHour:initial.endHour,voteDeadlineAt:initial.voteDeadlineAt})); const [error,setError]=useState('');
  return <form onSubmit={e=>{e.preventDefault();setError('');if(config.endHour<=config.startHour){setError('종료 시간을 시작 시간 이후로 선택해주세요.');return;}if(config.voteDeadlineAt<=koreaNow()){setError('응답 마감은 현재 이후로 선택해주세요.');return;}void onSave(config);}} className="mt-5 grid gap-4 sm:grid-cols-2" aria-label="가용시간표 설정">
    {confirmed&&<p className="text-sm text-muted-foreground sm:col-span-2">설정을 저장하면 투표가 다시 열리고 확정 전 일정 시간으로 복원됩니다. 원래 시간이 지났거나 일정이 변경되었다면 서버가 거부할 수 있습니다.</p>}
    <label>시작 날짜<input required type="date" value={config.startDate} onChange={e=>setConfig({...config,startDate:e.target.value})} className="form-input mt-2" disabled={busy}/></label>
    <label>날짜 범위<select value={config.dayCount} onChange={e=>setConfig({...config,dayCount:Number(e.target.value)})} className="form-input mt-2" disabled={busy}>{[3,5,7,14].map(n=><option key={n} value={n}>{n}일</option>)}</select></label>
    <label>시작 시간<input required type="number" min={0} max={23} value={config.startHour} onChange={e=>setConfig({...config,startHour:Number(e.target.value)})} className="form-input mt-2" disabled={busy}/></label>
    <label>종료 시간<input required type="number" min={1} max={24} value={config.endHour} onChange={e=>setConfig({...config,endHour:Number(e.target.value)})} className="form-input mt-2" disabled={busy}/></label>
    <label className="sm:col-span-2">응답 마감 (한국 시간)<input required type="datetime-local" min={koreaNow().slice(0,16)} value={config.voteDeadlineAt.slice(0,16)} onChange={e=>setConfig({...config,voteDeadlineAt:`${e.target.value}:00`})} className="form-input mt-2" disabled={busy}/></label>
    <div className="flex gap-3 sm:col-span-2"><button disabled={busy} className="min-h-12 rounded-xl bg-primary px-5 text-white disabled:opacity-40">{busy?'저장 중…':'시간표 설정 저장'}</button>{onCancel&&<button type="button" disabled={busy} onClick={onCancel} className="min-h-12 rounded-xl bg-secondary px-5">취소</button>}</div>
    {error&&<p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}
    <div className="min-w-0 sm:col-span-2"><TimeGrid candidates={buildGridCandidates(config.startDate,config.dayCount,config.startHour,config.endHour)} disabled/></div>
  </form>;
}
