import { useRef, useState } from 'react';

type Props = {
  candidates?: string[]; selected?: string[]; counts?: Record<string, number>;
  names?: Record<string, string[]>; total?: number; disabled?: boolean;
  confirmedSlot?: string; onChange?: (slots: string[]) => void;
  variant?: 'personal'|'group';
};

export function TimeGrid({candidates=[],selected=[],counts={},names={},total=0,disabled,confirmedSlot,onChange,variant='personal'}:Props) {
  const drag=useRef<{day:number;row:number;initial:Set<string>;select:boolean}|null>(null);
  const [scrollMode,setScrollMode]=useState(false);
  const [hovered,setHovered]=useState<string>();
  const dates=[...new Set(candidates.map(slot=>slot.slice(0,10)))].sort();
  const times=[...new Set(candidates.map(slot=>slot.slice(11,16)))].sort();
  const normalized=new Map(candidates.map(slot=>[slot.slice(0,16),slot]));
  const selectedSet=new Set(selected.map(slot=>slot.slice(0,16)));
  const update=(day:number,row:number)=>{
    const start=drag.current;if(!start)return;
    const next=new Set(start.initial);
    for(let x=Math.min(day,start.day);x<=Math.max(day,start.day);x++)for(let y=Math.min(row,start.row);y<=Math.max(row,start.row);y++){
      const slot=normalized.get(`${dates[x]}T${times[y]}`);if(slot)start.select?next.add(slot):next.delete(slot);
    }
    onChange?.([...next].sort());
  };
  return <div className="overflow-hidden rounded-xl border border-border bg-card">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3"><strong className="text-sm">{variant==='personal'?'내가 가능한 시간':'모두의 가능 시간'}</strong>{variant==='personal'&&!disabled&&<button type="button" aria-pressed={scrollMode} onClick={()=>setScrollMode(v=>!v)} className="min-h-11 rounded-lg bg-secondary px-3 text-xs">{scrollMode?'스크롤 모드 · 선택으로 전환':'선택 모드 · 스크롤로 전환'}</button>}</div>
    <p className="px-4 py-3 text-xs leading-5 text-muted-foreground">{variant==='personal'?'가능한 구간을 눌러 선택하거나 드래그해 칠하세요. 선택한 칸을 다시 칠하면 지워집니다.':'색이 진할수록 가능한 인원이 많습니다. 시간 칸을 누르면 인원을 확인할 수 있어요.'} · 30분 단위</p>
    {!dates.length?<p className="p-8 text-center text-sm text-muted-foreground">날짜와 시간 범위를 설정하면 시간표가 표시됩니다.</p>:<div className="max-h-[560px] overflow-auto border-t border-border"><div data-time-grid style={{minWidth:Math.max(300,dates.length*68+52)}} onPointerMove={event=>{
      if(!drag.current)return;const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>('[data-time-cell]');if(cell&&event.currentTarget.contains(cell))update(Number(cell.dataset.day),Number(cell.dataset.row));
    }} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
      <div role="group" aria-label={variant==='personal'?'내 가능 시간표':'모두의 가능 시간표'} className="grid gap-px bg-slate-200" style={{gridTemplateColumns:`52px repeat(${dates.length},minmax(0,1fr))`}}>
        <span className="sticky top-0 z-10 bg-white"/>{dates.map(date=><strong key={date} className="sticky top-0 z-10 bg-white py-3 text-center text-xs">{new Date(`${date}T00:00:00`).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric',weekday:'short'})}</strong>)}
        {times.map((time,row)=><div key={time} className="contents"><span className="flex items-center bg-white px-1 text-[11px] text-slate-500">{time}</span>{dates.map((date,day)=>{
          const slot=normalized.get(`${date}T${time}`);const count=slot?(counts[slot]??0):0;const chosen=selectedSet.has(`${date}T${time}`);const fixed=confirmedSlot?.slice(0,16)===`${date}T${time}`;
          const toggle=()=>{if(!slot||disabled||variant==='group')return;onChange?.(chosen?selected.filter(s=>s.slice(0,16)!==slot.slice(0,16)):[...selected,slot]);};
          return <button key={date} type="button" data-time-cell data-day={day} data-row={row} aria-label={`${date} ${time}, ${count}명 가능`} aria-pressed={variant==='personal'?chosen:undefined} disabled={!slot||(variant==='personal'&&disabled)} title={`${date} ${time} · ${count}명${slot&&names[slot]?.length?`: ${names[slot].join(', ')}`:''}`} onFocus={()=>setHovered(slot)} onPointerEnter={()=>setHovered(slot)} onPointerDown={event=>{
            if(!slot)return;setHovered(slot);if(event.button!==0||disabled||variant==='group'||scrollMode)return;
            event.preventDefault();event.currentTarget.closest<HTMLElement>('[data-time-grid]')?.setPointerCapture(event.pointerId);drag.current={day,row,initial:new Set(selected),select:!chosen};update(day,row);
          }} onClick={event=>{if(variant==='group')setHovered(slot);else if(event.detail===0||scrollMode)toggle();}} className={`h-7 border-0 ${variant==='personal'&&!scrollMode?'touch-none':''} ${fixed?'ring-2 ring-inset ring-blue-700':''} focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-blue-600`} style={{backgroundColor:!slot?'#e2e8f0':variant==='personal'?(chosen?'#22a06b':'#fff'):(count?`rgba(21,128,61,${0.12+0.88*count/Math.max(1,total)})`:'#fff')}}/>;
        })}</div>)}
      </div></div></div>}
    <div className="min-h-12 border-t border-border px-4 py-3 text-xs text-muted-foreground">{variant==='personal'?`${selected.length}칸 선택 · ${selected.length/2}시간`:hovered?`${hovered.slice(5,10)} ${hovered.slice(11,16)} · ${counts[hovered]??0}/${total}명 가능`:'0명  ░ ▒ ▓ █  전체 인원'}</div>
  </div>;
}
