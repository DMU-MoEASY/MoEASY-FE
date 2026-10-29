import { useRef } from 'react';

type Props = {
  candidates?: string[];
  selected?: string[];
  counts?: Record<string, number>;
  names?: Record<string, string[]>;
  total?: number;
  disabled?: boolean;
  confirmedSlot?: string;
  onChange?: (slots: string[]) => void;
};

// Drag a rectangle of dates and half-hour rows. Every move starts from the
// original selection so shrinking or reversing a drag restores the right cells.
export function TimeGrid({candidates = [], selected = [], counts = {}, names = {}, total = 0, disabled, confirmedSlot, onChange}: Props) {
  const drag = useRef<{day:number;row:number;initial:Set<string>;select:boolean} | null>(null);
  const dates = [...new Set(candidates.map(slot=>slot.slice(0,10)))].sort();
  const times = [...new Set(candidates.map(slot=>slot.slice(11)))].sort();
  const allowed = new Set(candidates);
  const update = (day:number,row:number) => {
    const start = drag.current;
    if (!start) return;
    const next = new Set(start.initial);
    for(let x=Math.min(day,start.day);x<=Math.max(day,start.day);x++) {
      for(let y=Math.min(row,start.row);y<=Math.max(row,start.row);y++) {
        const slot = `${dates[x]}T${times[y]}`;
        if(allowed.has(slot)) start.select ? next.add(slot) : next.delete(slot);
      }
    }
    onChange?.([...next].sort());
  };
  return <div className="rounded-2xl border border-border bg-card p-3"><p className="mb-3 text-sm text-muted-foreground">30분 단위로 가능한 시간을 드래그하거나 눌러 선택하세요. 색이 진할수록 가능한 사람이 많아요.</p><div className="overflow-x-auto"><div style={{minWidth:Math.max(340,dates.length*76+54)}} onPointerMove={event=>{
    if(!drag.current) return;
    const cell = document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>('[data-time-cell]');
    if(cell && event.currentTarget.contains(cell)) update(Number(cell.dataset.day),Number(cell.dataset.row));
  }} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
    <div className="grid gap-px" style={{gridTemplateColumns:`54px repeat(${dates.length}, minmax(0,1fr))`}}><span/>{dates.map(date=><strong key={date} className="py-3 text-center text-xs">{new Date(`${date}T00:00:00`).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric',weekday:'short'})}</strong>)}
    {times.map((time,row)=><div key={time} className="contents"><span className="flex items-center text-xs text-muted-foreground">{time}</span>{dates.map((date,day)=>{const slot=`${date}T${time}`;const count=counts[slot]??0;const chosen=selected.includes(slot);const unavailable=!allowed.has(slot);return <button key={slot} type="button" data-time-cell data-day={day} data-row={row} aria-label={`${date} ${time}, ${count}명 가능`} aria-pressed={chosen} disabled={disabled||unavailable} title={`${date} ${time} · ${count}명: ${(names[slot]??[]).join(', ') || '응답 없음'}`} onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();event.currentTarget.parentElement?.parentElement?.setPointerCapture(event.pointerId);drag.current={day,row,initial:new Set(selected),select:!chosen};update(day,row);}} onClick={event=>{if(event.detail===0) onChange?.(chosen?selected.filter(value=>value!==slot):[...selected,slot]);}} className={`h-8 touch-none border ${chosen?'ring-2 ring-inset ring-primary':''} ${confirmedSlot===slot?'outline-2 outline-offset-1 outline-emerald-600':''}`} style={{backgroundColor:unavailable?'#f1f2f4':count?`rgba(37,99,235,${0.15+0.75*count/Math.max(1,total)})`:'#f8fafc',borderColor:chosen?'#2563eb':'#e2e8f0'}}/>;})}</div>)}
    </div></div></div></div>;
}
