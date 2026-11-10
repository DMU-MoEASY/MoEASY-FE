import { TimeGrid } from './TimeGrid';
export function AvailabilityBoard({candidates,selected,counts,total,disabled,confirmedSlot,onChange}:{candidates:string[];selected:string[];counts:Record<string,number>;total:number;disabled?:boolean;confirmedSlot?:string;onChange:(slots:string[])=>void}){
 return <div className="grid items-start gap-5 lg:grid-cols-2"><TimeGrid candidates={candidates} selected={selected} counts={counts} total={total} disabled={disabled} confirmedSlot={confirmedSlot} onChange={onChange}/><TimeGrid variant="group" candidates={candidates} counts={counts} total={total} confirmedSlot={confirmedSlot}/></div>;
}
