import { useState } from 'react';
import { ArrowRight, CalendarDays, Check, Clock3, MapPin, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';

interface ScheduleExperienceProps { onOpenMap: () => void; }
type ScheduleEvent = { id: number; dateValue: string; day: string; dow: string; title: string; group: string; time: string; place: string; color: string; attending: boolean };

const initialEvents: ScheduleEvent[] = [
  { id: 1, dateValue: '2026-09-09', day: '09', dow: '수', title: '주간 러닝 모임', group: '강남 러닝 크루', time: '19:30', place: '반포 한강공원', color: 'bg-blue-500', attending: true },
  { id: 2, dateValue: '2026-09-12', day: '12', dow: '토', title: '프론트엔드 아키텍처', group: '판교 개발자 스터디', time: '20:00', place: '스타트업캠퍼스', color: 'bg-violet-500', attending: true },
  { id: 3, dateValue: '2026-09-14', day: '14', dow: '월', title: '초보자 백운대 코스', group: '북한산 등산 클럽', time: '08:00', place: '북한산 우이역', color: 'bg-emerald-500', attending: true },
];
const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
const emptyForm = { title: '', group: '', date: '2026-09-15', time: '19:00', place: '' };

export function ScheduleExperience({ onOpenMap }: ScheduleExperienceProps) {
  const [events, setEvents] = usePersistentState('moeasy:scheduleEvents', initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const scheduledDays = new Set(events.map(event => Number(event.day)));
  const attendingCount = events.filter(event => event.attending).length;

  const addEvent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const date = new Date(`${form.date}T00:00:00`);
    const values = { dateValue: form.date, day: String(date.getDate()).padStart(2, '0'), dow: weekdays[date.getDay()], title: form.title.trim(), group: form.group.trim(), time: form.time, place: form.place.trim() };
    setEvents(current => (editingId
      ? current.map(item => item.id === editingId ? { ...item, ...values } : item)
      : [...current, { id: Date.now(), ...values, color: 'bg-amber-500', attending: true }])
      .sort((a, b) => a.dateValue.localeCompare(b.dateValue)));
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const editEvent = (event: ScheduleEvent) => {
    setEditingId(event.id);
    setForm({ title: event.title, group: event.group, date: event.dateValue, time: event.time, place: event.place });
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  return <div className="space-y-8 lg:space-y-10">
    <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <div className="rounded-[28px] bg-[#101828] p-7 text-white sm:p-9">
        <div className="flex items-start justify-between"><div><p className="text-xs font-semibold tracking-[0.18em] text-[#8FAAFF]">MY SCHEDULE</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">9월의 모임 일정</h1><p className="mt-3 text-sm text-slate-400">이번 달에는 {events.length}개의 모임이 예정되어 있어요.</p></div><CalendarDays className="h-6 w-6 text-slate-500" /></div>
        <div className="mt-10 grid grid-cols-7 gap-1 text-center text-xs text-slate-500">{['월','화','수','목','금','토','일'].map(day => <span key={day}>{day}</span>)}{Array.from({length:21},(_,index)=>index+1).map(day => <button type="button" key={day} className={`mx-auto mt-3 flex h-9 w-9 items-center justify-center rounded-full ${day === 9 ? 'bg-primary text-white' : scheduledDays.has(day) ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}>{day}</button>)}</div>
      </div>
      <button onClick={onOpenMap} className="group relative min-h-64 overflow-hidden rounded-[28px] bg-[#DCE7FF] p-7 text-left"><div className="absolute inset-0 opacity-70 bg-[linear-gradient(35deg,transparent_44%,white_45%,white_51%,transparent_52%),linear-gradient(110deg,transparent_42%,rgba(255,255,255,.8)_43%,rgba(255,255,255,.8)_49%,transparent_50%)] bg-[size:180px_160px]" /><div className="relative flex h-full flex-col justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-blue-500/25"><MapPin className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-primary">MAP VIEW</p><h2 className="mt-2 text-2xl font-semibold">일정 장소 모아보기</h2><p className="mt-2 text-sm text-slate-600">이동 경로와 주변 번개까지 확인하세요.</p><ArrowRight className="mt-5 h-5 w-5 transition group-hover:translate-x-1" /></div></div></button>
    </section>

    {showForm && <section className="rounded-[24px] bg-card p-5 ring-1 ring-black/[0.06] sm:p-7"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-semibold text-primary">{editingId ? 'EDIT SCHEDULE' : 'NEW SCHEDULE'}</p><h2 className="mt-1 text-xl font-semibold">{editingId ? '일정 수정' : '일정 추가'}</h2></div><button type="button" aria-label="일정 입력 닫기" onClick={closeForm} className="rounded-full p-2 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button></div><form onSubmit={addEvent} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><ScheduleField label="일정 이름"><input required value={form.title} onChange={event => setForm({...form,title:event.target.value})} className="form-input" placeholder="예: 주말 러닝" /></ScheduleField><ScheduleField label="모임"><input required value={form.group} onChange={event => setForm({...form,group:event.target.value})} className="form-input" placeholder="모임 이름" /></ScheduleField><ScheduleField label="장소"><input required value={form.place} onChange={event => setForm({...form,place:event.target.value})} className="form-input" placeholder="만남 장소" /></ScheduleField><ScheduleField label="날짜"><input required type="date" value={form.date} onChange={event => setForm({...form,date:event.target.value})} className="form-input" /></ScheduleField><ScheduleField label="시간"><input required type="time" value={form.time} onChange={event => setForm({...form,time:event.target.value})} className="form-input" /></ScheduleField><div className="flex items-end"><button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-semibold text-white">{editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editingId ? '수정 내용 저장' : '일정 등록'}</button></div></form></section>}

    <section>
      <div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-semibold text-primary">UPCOMING</p><h2 className="mt-1 text-2xl font-semibold">다가오는 일정</h2><p className="mt-1 text-xs text-muted-foreground">참석 {attendingCount}개 · 미정 {events.length - attendingCount}개</p></div><button type="button" onClick={() => showForm ? closeForm() : setShowForm(true)} className="flex items-center gap-2 rounded-full bg-[#101828] px-4 py-2.5 text-sm font-medium text-white">{showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{showForm ? '닫기' : '일정 추가'}</button></div>
      <div className="overflow-hidden rounded-[24px] bg-card ring-1 ring-black/[0.06]">
        {events.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">등록된 일정이 없습니다.</p>}
        {events.map((event,index)=><article key={event.id} className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6 ${index < events.length-1 ? 'border-b border-border' : ''}`}><div className="w-12 text-center"><strong className="block text-2xl">{event.day}</strong><span className="text-xs text-muted-foreground">{event.dow}</span></div><span className={`hidden h-10 w-1 rounded-full sm:block ${event.color}`} /><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{event.group}</p><h3 className="mt-1 font-semibold sm:text-lg">{event.title}</h3><div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{event.time}</span><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.place}</span></div></div><div className="flex items-center gap-2"><button type="button" aria-label={`${event.title} 수정`} onClick={() => editEvent(event)} className="rounded-full bg-secondary p-2.5 text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button><button type="button" aria-label={`${event.title} 삭제`} onClick={() => setEvents(current => current.filter(item => item.id !== event.id))} className="rounded-full bg-rose-50 p-2.5 text-rose-600"><Trash2 className="h-4 w-4" /></button><button type="button" aria-pressed={event.attending} onClick={() => setEvents(current => current.map(item => item.id === event.id ? {...item,attending:!item.attending} : item))} className={`rounded-full px-3 py-2 text-xs font-medium transition ${event.attending ? 'bg-emerald-50 text-emerald-700' : 'bg-secondary text-muted-foreground'}`}>{event.attending ? <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5" />참석</span> : '미정'}</button></div></article>)}
      </div>
    </section>
    <section className="flex items-center gap-4 rounded-[22px] bg-[#FFF4D8] p-5 sm:p-6"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFD76A]"><Sparkles className="h-5 w-5" /></span><div><h3 className="font-semibold">일정 조율이 필요한 모임이 있어요</h3><p className="mt-1 text-sm text-amber-900/60">판교 개발자 스터디의 10월 일정을 함께 정해주세요.</p></div><ArrowRight className="ml-auto h-5 w-5" /></section>
  </div>;
}

function ScheduleField({label,children}:{label:string;children:React.ReactNode}) { return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>; }
