export type PollParticipant = { id: string; name: string };
export type SchedulePoll = {
  mode?: 'GRID';
  durationMinutes?: number;
  ownerId: string;
  participants: PollParticipant[];
  candidates: string[];
  responses: Record<string, string[]>;
  confirmedSlot?: string;
};
export function validateCandidates(candidates: string[], now = Date.now(), grid = false) {
  const unique = [...new Set(candidates)].sort();
  if (unique.length < 2 || unique.length > (grid ? 672 : 12)) throw new Error(grid ? '시간표 범위를 다시 선택해주세요.' : '서로 다른 후보 시간을 2~12개 입력해주세요.');
  if (unique.some(value => !Number.isFinite(new Date(value).getTime()) || new Date(value).getTime() <= now)) throw new Error('후보 시간은 현재 이후로 선택해주세요.');
  return unique;
}
export function recordAvailability(poll: SchedulePoll, memberId: string, slots: string[]): SchedulePoll {
  if (poll.confirmedSlot) throw new Error('이미 확정된 투표입니다.');
  if (!poll.participants.some(member => member.id === memberId)) throw new Error('이 투표의 참여 대상이 아닙니다.');
  if (slots.some(slot => !poll.candidates.includes(slot))) throw new Error('존재하지 않는 후보 시간입니다.');
  return {...poll, responses: {...poll.responses, [memberId]: [...new Set(slots)]}};
}
export function confirmAvailability(poll: SchedulePoll, memberId: string, slot: string, now = Date.now()): SchedulePoll {
  if (poll.ownerId !== memberId) throw new Error('투표를 만든 사람만 확정할 수 있습니다.');
  if (poll.confirmedSlot) throw new Error('이미 확정된 일정입니다.');
  if (!poll.candidates.includes(slot) || new Date(slot).getTime() <= now) throw new Error('현재 이후의 후보 시간을 선택해주세요.');
  return {...poll, confirmedSlot:slot};
}

// Preserve old votes while expanding legacy point candidates into a real time grid.
export function normalizeGridPoll(poll: SchedulePoll): SchedulePoll {
  if(poll.mode==='GRID'||!poll.candidates.length)return poll;
  const sorted=[...poll.candidates].sort();const first=sorted[0]!.slice(0,10);const last=sorted[sorted.length-1]!.slice(0,10);
  const hours=sorted.map(s=>Number(s.slice(11,13)));const start=Math.min(9,...hours);const end=Math.min(24,Math.max(23,...hours.map(h=>h+1)));
  const candidates:string[]=[];const day=new Date(`${first}T12:00:00`);
  for(let i=0;i<14;i++){const date=new Date(day.getTime()-day.getTimezoneOffset()*60000).toISOString().slice(0,10);if(date>last)break;for(let half=start*2;half<end*2;half++)candidates.push(`${date}T${String(Math.floor(half/2)).padStart(2,'0')}:${half%2?'30':'00'}`);day.setDate(day.getDate()+1);}
  return {...poll,mode:'GRID',candidates:[...new Set([...candidates,...poll.candidates])].sort()};
}
export function localAvailabilityRecommendations(poll:SchedulePoll,now=Date.now()){
 const duration=poll.durationMinutes??30;const steps=Math.ceil(duration/30);const allowed=new Set(poll.candidates);
 return poll.candidates.flatMap(slot=>{
  if(new Date(slot).getTime()<=now)return [];
  const start=new Date(slot);const window:string[]=[];
  for(let i=0;i<steps;i++){const d=new Date(start.getTime()+i*30*60000);const key=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);if(!allowed.has(key)||key.slice(0,10)!==slot.slice(0,10))return [];window.push(key);}
  const members=poll.participants.filter(m=>window.every(s=>poll.responses[m.id]?.includes(s)));
  return members.length?[{slot,members,endsAt:new Date(start.getTime()+duration*60000)}]:[];
 }).sort((a,b)=>b.members.length-a.members.length||a.slot.localeCompare(b.slot));
}

export function buildGridCandidates(startDate:string,days:number,startHour:number,endHour:number){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(startDate)||![3,5,7,14].includes(days)||!Number.isInteger(startHour)||!Number.isInteger(endHour)||startHour<0||endHour>24||endHour<=startHour)return [];
 const output:string[]=[];const day=new Date(`${startDate}T12:00:00`);if(!Number.isFinite(day.getTime()))return [];
 for(let i=0;i<days;i++){const date=new Date(day.getTime()-day.getTimezoneOffset()*60000).toISOString().slice(0,10);for(let half=startHour*2;half<endHour*2;half++)output.push(`${date}T${String(Math.floor(half/2)).padStart(2,'0')}:${half%2?'30':'00'}`);day.setDate(day.getDate()+1);}return output;
}
