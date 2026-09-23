import { useMemo, useState } from 'react';
import { ArrowUpRight, Compass, MapPin, RotateCcw, Search, SlidersHorizontal, Users } from 'lucide-react';

type Meetup = { id: number; name: string; region: string; description: string; members: number; category: string };
interface ExploreExperienceProps { meetups: Meetup[]; onSelect: (meetup: Meetup) => void; }

const images = [
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085f0?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=85',
];
const categories = ['추천', '운동', '스터디', '문화', '음식', '취미', '게임'];

export function ExploreExperience({ meetups, onSelect }: ExploreExperienceProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('추천');
  const [showFilters, setShowFilters] = useState(false);
  const [region, setRegion] = useState('전체');
  const regions = useMemo(() => ['전체', ...Array.from(new Set(meetups.map(meetup => meetup.region.split(' ')[0] ?? meetup.region)))], [meetups]);
  const filteredMeetups = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko-KR');
    return meetups.filter(meetup => {
      const matchesCategory = category === '추천' || meetup.category === category;
      const matchesRegion = region === '전체' || meetup.region.startsWith(region);
      const text = `${meetup.name} ${meetup.region} ${meetup.category} ${meetup.description}`.toLocaleLowerCase('ko-KR');
      return matchesCategory && matchesRegion && (!keyword || text.includes(keyword));
    });
  }, [category, meetups, query, region]);
  const resetFilters = () => { setQuery(''); setCategory('추천'); setRegion('전체'); };

  return <div className="space-y-8 lg:space-y-10">
    <section className="pt-2 lg:pt-5">
      <div className="max-w-2xl"><p className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><Compass className="h-4 w-4" />DISCOVER</p><h1 className="text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl lg:text-5xl">이번 주말,<br className="sm:hidden" /> 누구와 무엇을 해볼까요?</h1><p className="mt-4 text-muted-foreground">취향과 거리, 시간을 기준으로 나와 잘 맞는 모임을 찾아보세요.</p></div>
      <div className="mt-7 flex max-w-3xl items-center gap-3 rounded-2xl bg-card p-2 ring-1 ring-black/[0.07] shadow-lg shadow-slate-900/[0.04]"><Search className="ml-3 h-5 w-5 text-muted-foreground" /><input value={query} onChange={event => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent px-1 py-3 outline-none" placeholder="지역, 취미, 모임 이름으로 검색" /><button type="button" aria-expanded={showFilters} onClick={() => setShowFilters(value => !value)} className="rounded-xl bg-[#101828] p-3 text-white sm:px-5"><SlidersHorizontal className="h-5 w-5 sm:mr-2 sm:inline" /><span className="hidden sm:inline">필터</span></button></div>
      {showFilters && <div className="mt-3 flex max-w-3xl flex-wrap items-center gap-2 rounded-2xl bg-card p-4 ring-1 ring-black/[0.06]"><span className="mr-1 text-xs font-semibold text-muted-foreground">활동 지역</span>{regions.map(item => <button type="button" key={item} onClick={() => setRegion(item)} className={`rounded-full px-3 py-1.5 text-xs ${region === item ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>{item}</button>)}<button type="button" onClick={resetFilters} className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary"><RotateCcw className="h-3.5 w-3.5" />초기화</button></div>}
    </section>
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">{categories.map(item => <button type="button" key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${category === item ? 'bg-[#101828] text-white' : 'bg-card text-muted-foreground ring-1 ring-black/[0.06] hover:text-foreground'}`}>{item}</button>)}</div>
    <section>
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground"><span><strong className="text-foreground">{filteredMeetups.length}</strong>개의 모임을 찾았어요</span>{(query || category !== '추천' || region !== '전체') && <button type="button" onClick={resetFilters} className="flex items-center gap-1.5 hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" />검색 초기화</button>}</div>
      {filteredMeetups.length > 0 ? <div className="grid gap-4 lg:grid-cols-2">{filteredMeetups.map((meetup, index) => <button key={meetup.id} onClick={() => onSelect(meetup)} className={`group relative overflow-hidden rounded-[24px] text-left ${index === 0 ? 'min-h-[390px] lg:row-span-2 lg:min-h-full' : 'min-h-[240px]'}`}><img src={images[index % images.length]} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/10" /><div className="absolute inset-x-0 top-0 flex items-center justify-between p-5"><span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 backdrop-blur">{meetup.category}</span><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition group-hover:bg-white group-hover:text-slate-900"><ArrowUpRight className="h-5 w-5" /></span></div><div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6"><p className="mb-2 flex items-center gap-1.5 text-xs text-white/75"><MapPin className="h-3.5 w-3.5" />{meetup.region}</p><h2 className={`${index === 0 ? 'text-2xl sm:text-3xl' : 'text-xl'} font-semibold tracking-[-0.025em]`}>{meetup.name}</h2><p className="mt-2 line-clamp-2 max-w-lg text-sm leading-6 text-white/70">{meetup.description}</p><div className="mt-4 flex items-center gap-2 text-xs text-white/80"><Users className="h-4 w-4" />{meetup.members}명이 함께하고 있어요</div></div></button>)}</div> : <div className="rounded-[24px] bg-card px-6 py-16 text-center ring-1 ring-black/[0.06]"><Search className="mx-auto h-7 w-7 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">조건에 맞는 모임이 없어요</h2><p className="mt-2 text-sm text-muted-foreground">검색어나 필터를 바꾸면 더 많은 모임을 볼 수 있어요.</p><button type="button" onClick={resetFilters} className="mt-5 rounded-full bg-[#101828] px-5 py-2.5 text-sm text-white">전체 모임 보기</button></div>}
    </section>
  </div>;
}
