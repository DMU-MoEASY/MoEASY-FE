import { ArrowRight, CalendarDays, Clock3, MapPin, Plus, Sparkles, Users, Zap } from 'lucide-react';

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
}

const photos = [
  'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=85',
];

export function HomeExperience({ meetups, onCreate, onSelect, onOpenMap }: HomeExperienceProps) {
  const featured = meetups.slice(0, 3);

  return (
    <div className="space-y-10 lg:space-y-14">
      <section className="relative overflow-hidden rounded-[28px] bg-[#101828] text-white min-h-[390px] lg:min-h-[430px]">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_70%_25%,#4F7CFF_0,transparent_35%),radial-gradient(circle_at_25%_100%,#14B8A6_0,transparent_28%)]" />
        <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative grid h-full gap-8 p-6 sm:p-8 lg:grid-cols-[1.05fr_.95fr] lg:p-12">
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/80 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-[#8FAAFF]" />
                오늘의 모임 브리핑
              </div>
              <h1 className="max-w-xl text-[32px] font-semibold leading-[1.15] tracking-[-0.04em] sm:text-4xl lg:text-5xl">
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

          <button disabled={!meetups[0]} onClick={() => meetups[0] && onSelect(meetups[0])} className="group self-end rounded-[24px] border border-white/15 bg-white/10 p-3 text-left backdrop-blur-md transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 lg:p-4">
            <div className="relative h-40 overflow-hidden rounded-[18px] lg:h-48">
              <img src={photos[0]} alt="한강 러닝 모임" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-[#C9FF5C] px-3 py-1 text-xs font-semibold text-[#193300]">D-1 · 참여 예정</span>
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-lg font-semibold">주간 러닝 모임</p>
                <p className="mt-1 text-xs text-white/75">강남 러닝 크루</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 px-1 pb-1 pt-4 text-xs text-white/70">
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#8FAAFF]" />9월 9일 화요일</span>
              <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#8FAAFF]" />오후 7:30</span>
              <span className="col-span-2 flex items-center gap-2"><MapPin className="h-4 w-4 text-[#8FAAFF]" />반포 한강공원 달빛광장</span>
            </div>
          </button>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">My circles</p>
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">이어가고 있는 모임</h2>
          </div>
          <button className="hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:flex">전체 보기 <ArrowRight className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {featured.map((meetup, index) => (
            <button key={meetup.id} onClick={() => onSelect(meetup)} className="group overflow-hidden rounded-[22px] bg-card text-left ring-1 ring-black/[0.06] transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10">
              <div className="relative h-44 overflow-hidden">
                <img src={photos[index]} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 backdrop-blur">{meetup.category}</span>
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

      <section className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-[24px] bg-card p-5 ring-1 ring-black/[0.06] sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><p className="text-xs font-semibold text-primary">UP NEXT</p><h2 className="mt-1 text-xl font-semibold">이번 주 일정</h2></div>
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            {[
              ['09', '화', '주간 러닝 모임', '19:30 · 반포 한강공원'],
              ['12', '금', '프론트엔드 스터디', '20:00 · 판교 스타트업캠퍼스'],
              ['14', '일', '북한산 초보 코스', '08:00 · 북한산 우이역'],
            ].map(([date, day, title, meta], index) => (
              <div key={title} className={`flex items-center gap-4 py-4 ${index < 2 ? 'border-b border-border/70' : ''}`}>
                <div className="w-12 text-center"><strong className="block text-xl">{date}</strong><span className="text-xs text-muted-foreground">{day}</span></div>
                <div className="min-w-0 flex-1"><p className="font-medium">{title}</p><p className="mt-1 truncate text-sm text-muted-foreground">{meta}</p></div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
        <button onClick={onOpenMap} className="group relative min-h-64 overflow-hidden rounded-[24px] bg-[#DCE7FF] p-6 text-left ring-1 ring-black/[0.04]">
          <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_70%_20%,white_0,transparent_26%),linear-gradient(135deg,transparent_45%,rgba(255,255,255,.8)_46%,rgba(255,255,255,.8)_51%,transparent_52%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between"><span className="rounded-full bg-[#101828] px-3 py-1.5 text-xs font-medium text-white">LIVE MAP</span><Zap className="h-5 w-5 text-primary" /></div>
            <div><p className="text-4xl font-semibold tracking-tight">3</p><h3 className="mt-1 text-lg font-semibold">지금 참여 가능한 번개</h3><p className="mt-2 text-sm text-slate-600">내 주변 2km 안에서 열리고 있어요.</p></div>
          </div>
        </button>
      </section>
    </div>
  );
}
