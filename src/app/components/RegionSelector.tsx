import { useEffect, useId, useState } from 'react';
import { ChevronDown, LoaderCircle } from 'lucide-react';
import type { RegionProvince } from '../services/p0Api';

type Props = {
  groups: RegionProvince[];
  value: string;
  onChange: (code: string, label: string) => void;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
};

export function RegionSelector({groups,value,onChange,loading=false,error,onRetry}:Props) {
  const id = useId();
  const [province,setProvince] = useState(() => groups.find(group=>group.regions.some(region=>region.code===value))?.provinceName ?? '');
  useEffect(()=>{
    const selectedGroup=groups.find(group=>group.regions.some(region=>region.code===value));
    if(selectedGroup) setProvince(selectedGroup.provinceName);
  },[groups,value]);
  const activeGroup=groups.find(group=>group.provinceName===province);
  const activeRegion=activeGroup?.regions.find(region=>region.code===value);
  const unavailable=loading || !!error || !groups.length;
  const selectClass='form-input min-h-12 appearance-none pr-10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';
  return <fieldset><legend className="mb-3 text-sm font-semibold text-slate-800">주 활동 지역</legend>
    <div className="grid gap-3 sm:grid-cols-2">
      <div><label htmlFor={`${id}-province`} className="mb-2 block text-xs font-medium text-slate-500">시·도</label><div className="relative"><select id={`${id}-province`} required value={province} disabled={unavailable} aria-describedby={error?`${id}-error`:undefined} onChange={event=>{setProvince(event.target.value);onChange('','');}} className={selectClass}><option value="">{loading?'지역 불러오는 중…':'시·도 선택'}</option>{groups.map(group=><option key={group.provinceName} value={group.provinceName}>{group.provinceName}</option>)}</select><ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/></div></div>
      <div><label htmlFor={`${id}-district`} className="mb-2 block text-xs font-medium text-slate-500">시·군·구</label><div className="relative"><select id={`${id}-district`} required value={activeRegion?.code ?? ''} disabled={unavailable || !activeGroup} onChange={event=>{const region=activeGroup?.regions.find(item=>item.code===event.target.value);onChange(region?.code??'',region&&activeGroup?`${activeGroup.provinceName} ${region.name}`:'');}} className={selectClass}><option value="">{activeGroup?'시·군·구 선택':'시·도를 먼저 선택'}</option>{activeGroup?.regions.map(region=><option key={region.code} value={region.code}>{region.name}</option>)}</select><ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/></div></div>
    </div>
    {loading&&<p role="status" className="mt-3 flex items-center gap-2 text-xs text-slate-500"><LoaderCircle className="h-3.5 w-3.5 animate-spin"/>선택 가능한 지역을 불러오고 있어요.</p>}
    {error&&<div id={`${id}-error`} role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"><p>{error}</p>{onRetry&&<button type="button" onClick={onRetry} className="mt-2 min-h-10 font-medium underline">지역 다시 불러오기</button>}</div>}
    {!loading&&!error&&<p className="mt-3 text-xs text-slate-500" aria-live="polite">{activeRegion&&activeGroup?`${activeGroup.provinceName} ${activeRegion.name}에서 모임을 추천해드려요.`:'활동할 시·도와 시·군·구를 차례로 선택해주세요.'}</p>}
  </fieldset>;
}
