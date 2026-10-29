import { openMeetupFromCard, meetupCover } from '../navigation/meetupTransition';
import { useState } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { globalScheduleKey, meetupFinanceKey, type GlobalScheduleEvent, type DuesManagementState } from '../services/meetupOperations';
import { ArrowRight, CalendarDays, Clock3, MapPin, Plus, Sparkles, Users } from 'lucide-react';

type Meetup = {
  id: number;
  name: string;
  region: string;
  description: string;
  members: number;
  category: string;
};

interface HomeExperienceProps {
  meetups: Meetup[];
  onCreate: () => void;
  onSelect: (meetup: Meetup) => void;
  onOpenMap: () => void;
  onSchedule: () => void;
  onFinance: (meetup: Meetup) => void;
}



export function HomeExperience({ meetups, onCreate, onSelect, onOpenMap, onSchedule, onFinance }: HomeExperienceProps) {
  const [showAll, setShowAll] = useState(false);
  const featured = showAll ? meetups : meetups.slice(0, 3);
  const [events] = usePersistentState<GlobalScheduleEvent[]>(globalScheduleKey, []);
  const upcoming = events.filter(event => new Date(`${event.dateValue}T${event.time}`).getTime() >= Date.now())
    .sort((a,b) => `${a.dateValue} ${a.time}`.localeCompare(`${b.dateValue} ${b.time}`)).slice(0,3);

  return (
    <div className="space-y-7 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[28px] bg-[#101828] text-white ">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_70%_25%,#4F7CFF_0,transparent_35%),radial-gradient(circle_at_25%_100%,#14B8A6_0,transparent_28%)]" />
        <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative grid h-full gap-8 p-6 sm:p-8 lg:grid-cols-[1.05fr_.95fr] lg:p-8">
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/80 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-[#8FAAFF]" />
                우리의 모임, MoEasy
              </div>
              <h1 className="max-w-xl text-[32px] font-semibold leading-[1.15] tracking-[-0.04em] sm:text-4xl lg:text-[40px]">
                사람을 만나는 일이<br />조금 더 쉬워지도록.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
                일정부터 장소, 대화와 정산까지. 모임에 필요한 모든 순간을 MoEasy에서 이어보세요.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onCreate} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#101828] transition hover:-translate-y-0.5">
                <Plus className="h-4 w-4" /> 새 모임 만들기
              </button>
              <button onClick={onOpenMap} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10">
                주변 모임 보기 <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button disabled={!meetups[0]} onClick={event => meetups[0] && openMeetupFromCard(event.currentTarget, () => onSelect(meetups[0]!))} className="group self-end rounded-[24px] border border-white/15 bg-white/10 p-3 text-left backdrop-blur-md transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 lg:p-4">
            <div data-meetup-cover className="relative h-40 overflow-hidden rounded-[18px] lg:h-40">
              <img src={meetupCover(meetups[0]?.id ?? 1)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
              <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-white/90 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">참여 중인 모임</span>
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-lg font-semibold">{meetups[0]?.name ?? '새로운 모임을 시작해보세요'}</p>
                <p className="mt-1 text-xs text-white/75">{meetups[0]?.category ?? '함께하는 일상'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 px-1 pb-1 pt-4 text-xs text-white/70">
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#8FAAFF]" />{meetups[0]?.region ?? '활동 지역을 정해보세요'}</span>
              <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#8FAAFF]" />멤버 {meetups[0]?.members ?? 0}명</span>
              <span className="col-span-2 flex items-center gap-2"><MapPin className="h-4 w-4 text-[#8FAAFF]" />모임 홈으로 이동</span>
            </div>
          </button>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="mb-1 text-sm text-muted-foreground">내 모임</p>
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">참여 중인 모임</h2>
          </div>
          {meetups.length > 3 && <button onClick={() => setShowAll(value => !value)} aria-expanded={showAll} className="flex min-h-11 items-center gap-1 text-sm font-medium text-primary">{showAll ? '접기' : `전체 ${meetups.length}개 보기`} <ArrowRight className="h-4 w-4" /></button>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((meetup) => (
            <button key={meetup.id} onClick={event => openMeetupFromCard(event.currentTarget, () => onSelect(meetup))} className="group overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition hover:border-primary/35 hover:shadow-md">
              <div data-meetup-cover className="relative h-44 overflow-hidden">
                <img src={meetupCover(meetup.id)} loading="lazy" alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute left-4 top-4 rounded-md border border-white/60 bg-white/90 px-2.5 py-1 text-xs font-medium text-primary backdrop-blur">{meetup.category}</span>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-lg font-semibold">{meetup.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-white/75"><MapPin className="h-3.5 w-3.5" />{meetup.region}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" />멤버 {meetup.members}명</span>
                <span className="font-medium text-primary">모임 홈 <ArrowRight className="ml-1 inline h-4 w-4" /></span>
              </div>
            </button>
          ))}
        </div>
      </section>

    <section className="grid gap-4 lg:grid-cols-2" aria-label="확인할 일">
      <div className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">다가오는 일정</h2><button onClick={onSchedule} className="rounded-lg px-3 py-2 text-sm text-primary">전체 일정 →</button></div>
        {upcoming.length ? upcoming.map(event => <button key={event.id} onClick={onSchedule} className="flex w-full items-center gap-3 border-t border-border py-4 text-left"><CalendarDays className="h-5 w-5 shrink-0 text-primary"/><div className="min-w-0 flex-1"><p className="font-medium break-words">{event.title}</p><p className="mt-1 text-sm text-muted-foreground">{event.dateValue} {event.time} · {event.group}</p><p className="mt-1 text-sm text-muted-foreground">{event.place}</p></div><ArrowRight className="h-4 w-4 shrink-0"/></button>) : <div className="py-5"><p className="text-sm text-muted-foreground">예정된 일정이 없습니다.</p><button onClick={onSchedule} className="mt-3 rounded-lg bg-secondary px-4 py-3 text-sm">첫 일정 등록하기</button></div>}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5"><h2 className="text-lg font-semibold">모임별 정산 확인</h2><p className="mt-2 text-sm text-muted-foreground">모임 전체의 진행 중인 정산입니다.</p><div className="mt-4 [&:has(button)>p]:hidden"><p className="py-5 text-sm text-muted-foreground">현재 진행 중인 정산이 없습니다.</p>{meetups.map(meetup => <FinanceTask key={meetup.id} meetup={meetup} onOpen={() => onFinance(meetup)}/>)}{meetups.length === 0 && <p className="py-5 text-sm text-muted-foreground">모임에 참여하면 정산을 확인할 수 있어요.</p>}</div></div>
    </section>
    </div>
  );
}

function FinanceTask({meetup,onOpen}:{meetup:Meetup;onOpen:()=>void}) {
  const [finance] = usePersistentState<Pick<DuesManagementState,'settlements'>>(meetupFinanceKey(meetup.id), {settlements:[]});
  const count = finance.settlements?.filter(item => !item.completed).length ?? 0;
  if (!count) return null;
  return <button onClick={onOpen} className="flex w-full items-center justify-between gap-3 border-t border-border py-4 text-left"><span className="min-w-0 break-words text-sm font-medium">{meetup.name}</span><span className={`shrink-0 text-sm ${count ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>{count ? `${count}건 진행 중` : '진행 중인 정산 없음'} →</span></button>;
}
