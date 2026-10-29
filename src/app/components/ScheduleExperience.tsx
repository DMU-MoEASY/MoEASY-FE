import { useState } from 'react';
import { ArrowRight, CalendarDays, Check, Clock3, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import {
  INITIAL_GLOBAL_SCHEDULES,
  removeClubSchedule,
  globalScheduleKey,
  patchLinkedChatMessage,
  syncScheduleAttendance,
  linkScheduleFromChat,
  type GlobalScheduleEvent,
} from '../services/meetupOperations';

interface ScheduleExperienceProps { onOpenMap: () => void; onOpenPoll: (event: GlobalScheduleEvent) => void; }
const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
const emptyForm = { title: '', group: '', date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,10), time: '19:00', place: '' };

export function ScheduleExperience({ onOpenMap, onOpenPoll }: ScheduleExperienceProps) {
  const [events, setEvents] = usePersistentState(globalScheduleKey, INITIAL_GLOBAL_SCHEDULES);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const monthPrefix = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}`;
  const monthEvents = events.filter(event => event.dateValue.startsWith(monthPrefix));
  const visibleEvents = calendarOpen ? monthEvents.filter(event => !selectedDate || event.dateValue === selectedDate) : events.filter(event => event.status === 'POLLING' || new Date(`${event.dateValue}T${event.time}`).getTime() >= Date.now()).sort((a,b)=>`${a.dateValue} ${a.time}`.localeCompare(`${b.dateValue} ${b.time}`));
  const scheduledDays = new Set(monthEvents.map(event => Number(event.day)));
  const changeMonth = (delta:number) => { setMonth(new Date(month.getFullYear(),month.getMonth()+delta,1)); setSelectedDate(''); };

  const attendingCount = monthEvents.filter(event => event.attending).length;

  const addEvent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const date = new Date(`${form.date}T00:00:00`);
    const values = { dateValue: form.date, day: String(date.getDate()).padStart(2, '0'), dow: weekdays[date.getDay()] ?? '', title: form.title.trim(), group: form.group.trim(), time: form.time, place: form.place.trim() };
    setEvents(current => (editingId
      ? current.map(item => item.id === editingId ? { ...item, ...values } : item)
      : [...current, { id: Date.now(), ...values, color: 'bg-amber-500', attending: true }])
      .sort((a, b) => a.dateValue.localeCompare(b.dateValue)));
    const original = events.find(item => item.id === editingId);
    if (original?.meetupId !== undefined && original.chatMessageId) {
      linkScheduleFromChat({meetupId: original.meetupId, meetupName: values.group, chatMessageId: original.chatMessageId, title: values.title, dateValue: values.dateValue, time: values.time, place: values.place, attending: original.attending});
      patchLinkedChatMessage(original.meetupId, original.chatMessageId, {title: values.title, date: values.dateValue, time: values.time, location: values.place});
    }
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1)); setSelectedDate(values.dateValue); setCalendarOpen(true);
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const editEvent = (event: GlobalScheduleEvent) => {
    setEditingId(event.id);
    setForm({ title: event.title, group: event.group, date: event.dateValue, time: event.time, place: event.place });
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const toggleAttendance = (event: GlobalScheduleEvent) => {
    const attending = !event.attending;
    setEvents(current => current.map(item => item.id === event.id ? { ...item, attending } : item));
    if (event.meetupId !== undefined && event.chatMessageId) {
      syncScheduleAttendance(event.meetupId, event.chatMessageId, attending);
      patchLinkedChatMessage(event.meetupId, event.chatMessageId, { attending });
    }
  };

  return <div className="space-y-8 lg:space-y-10">
    <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">내 일정</h1><button onClick={() => setCalendarOpen(value=>!value)} aria-expanded={calendarOpen} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">{calendarOpen ? '다가오는 일정 보기' : '달력으로 보기'}</button></div>
    <section className={`${calendarOpen ? 'grid' : 'hidden'} gap-5 lg:grid-cols-[1fr_380px]`}>
      <div className="rounded-[28px] bg-[#101828] p-7 text-white sm:p-9">
        <div className="flex items-start justify-between"><div><p className="text-sm text-slate-400">내 일정</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{month.getFullYear()}년 {month.getMonth()+1}월 일정</h1><p className="mt-3 text-sm text-slate-400">이번 달에는 {monthEvents.length}개의 모임이 예정되어 있어요.</p></div><CalendarDays className="h-6 w-6 text-slate-500" /></div>
        <div className="mt-5 flex justify-between"><button onClick={() => changeMonth(-1)} aria-label="이전 달">← 이전 달</button><button onClick={() => setSelectedDate('')}>이번 달 전체</button><button onClick={() => changeMonth(1)} aria-label="다음 달">다음 달 →</button></div>
        <div className="mt-5 grid grid-cols-7 gap-1 text-center text-xs text-slate-300">{weekdays.map(day => <span key={day}>{day}</span>)}{Array.from({length:month.getDay()},(_,i)=><span key={`blank-${i}`}/>)}{Array.from({length:new Date(month.getFullYear(),month.getMonth()+1,0).getDate()},(_,i)=>i+1).map(day => { const date = `${monthPrefix}-${String(day).padStart(2,'0')}`; return <button key={day} aria-pressed={selectedDate === date} onClick={() => setSelectedDate(selectedDate === date ? '' : date)} className={`mx-auto mt-2 flex h-10 w-10 items-center justify-center rounded-full ${selectedDate === date ? 'bg-primary text-white' : scheduledDays.has(day) ? 'bg-white/20 text-white' : ''}`}>{day}</button>; })}</div>
      </div>
      <button onClick={onOpenMap} className="group min-h-64 rounded-2xl border border-[#DCE5FF] bg-[#F4F7FF] p-7 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"><div className="flex h-full flex-col justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-sm"><MapPin className="h-5 w-5" /></span><div><p className="text-sm font-medium text-primary">지도에서 확인</p><h2 className="mt-2 text-2xl font-semibold">일정 장소 모아보기</h2><p className="mt-2 text-sm text-slate-600">이동 경로와 주변 번개까지 확인하세요.</p><ArrowRight className="mt-5 h-5 w-5 text-primary transition group-hover:translate-x-1" /></div></div></button>
    </section>

    {showForm && <section className="rounded-[24px] bg-card p-5 ring-1 ring-black/[0.06] sm:p-7"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-semibold text-primary">{editingId ? 'EDIT SCHEDULE' : 'NEW SCHEDULE'}</p><h2 className="mt-1 text-xl font-semibold">{editingId ? '일정 수정' : '일정 추가'}</h2></div><button type="button" aria-label="일정 입력 닫기" onClick={closeForm} className="rounded-full p-2 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button></div><form onSubmit={addEvent} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><ScheduleField label="일정 이름"><input required value={form.title} onChange={event => setForm({...form,title:event.target.value})} className="form-input" placeholder="예: 주말 러닝" /></ScheduleField><ScheduleField label="모임"><input required value={form.group} onChange={event => setForm({...form,group:event.target.value})} className="form-input" placeholder="모임 이름" /></ScheduleField><ScheduleField label="장소"><input required value={form.place} onChange={event => setForm({...form,place:event.target.value})} className="form-input" placeholder="만남 장소" /></ScheduleField><ScheduleField label="날짜"><input required type="date" value={form.date} onChange={event => setForm({...form,date:event.target.value})} className="form-input" /></ScheduleField><ScheduleField label="시간"><input required type="time" value={form.time} onChange={event => setForm({...form,time:event.target.value})} className="form-input" /></ScheduleField><div className="flex items-end"><button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-semibold text-white">{editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editingId ? '수정 내용 저장' : '일정 등록'}</button></div></form></section>}

    <section>
      <div className="mb-5 flex items-end justify-between"><div><h2 className="text-2xl font-semibold">{calendarOpen ? '선택한 기간의 일정' : '다가오는 일정'}</h2><p className="mt-1 text-xs text-muted-foreground">참석 {visibleEvents.filter(event=>event.attending).length}개 · 미정 {visibleEvents.filter(event=>!event.attending).length}개</p></div><button type="button" onClick={() => showForm ? closeForm() : setShowForm(true)} className="flex items-center gap-2 rounded-full bg-[#101828] px-4 py-2.5 text-sm font-medium text-white">{showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{showForm ? '닫기' : '일정 추가'}</button></div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {visibleEvents.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">등록된 일정이 없습니다.</p>}
        {visibleEvents.map((event,index)=><article key={event.id} className={`flex flex-col gap-4 p-5 transition hover:bg-[#FAFBFF] sm:flex-row sm:items-center sm:gap-6 sm:p-6 ${index < events.length-1 ? 'border-b border-border' : ''}`}><div className="w-12 rounded-xl bg-[#EEF3FF] py-2 text-center"><strong className="block text-xl text-primary">{event.status === 'POLLING' ? '조율' : event.day}</strong><span className="text-xs text-primary/70">{event.dow}</span></div><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{event.group}</p><h3 className="mt-1 font-semibold sm:text-lg">{event.title}</h3><div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{event.time}</span><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.place}</span>{event.chatMessageId && <span className="rounded-md bg-[#EEF3FF] px-2 py-0.5 text-[10px] font-medium text-primary">채팅 연동</span>}</div></div><div className="flex flex-wrap items-center gap-2">{event.meetupId !== undefined && <button onClick={()=>onOpenPoll(event)} className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-primary">{event.status === 'POLLING' ? '가용시간 투표' : '시간 조율·결과'}</button>}<button type="button" disabled={event.status === 'POLLING' || String(event.id).startsWith('club:')} aria-label={`${event.title} 수정`} onClick={() => editEvent(event)} className="rounded-full bg-secondary p-2.5 text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button><button type="button" aria-label={`${event.title} 삭제`} onClick={() => { if (window.confirm(`“${event.title}” 일정을 삭제할까요?`)) { const prefix = `club:${event.meetupId}:`; if (event.meetupId !== undefined && String(event.id).startsWith(prefix)) removeClubSchedule(event.meetupId, String(event.id).slice(prefix.length)); else setEvents(current => current.filter(item => item.id !== event.id)); } }} className="rounded-full bg-rose-50 p-2.5 text-rose-600"><Trash2 className="h-4 w-4" /></button><button type="button" disabled={event.status === 'POLLING'} aria-pressed={event.attending} onClick={() => toggleAttendance(event)} className={`rounded-lg px-3 py-2 text-xs font-medium transition ${event.attending ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>{event.attending ? <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5" />참석</span> : '미정'}</button></div></article>)}
      </div>
    </section>

  </div>;
}

function ScheduleField({label,children}:{label:string;children:React.ReactNode}) { return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>; }
