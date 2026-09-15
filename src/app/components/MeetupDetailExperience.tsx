import { useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Camera, Check, Clock3, Heart, MapPin, MessageCircle, MoreHorizontal, Pencil, Plus, Receipt, Send, Settings2, Share2, Trash2, Users, Wallet, X } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';

type Meetup = { id: number; name: string; region: string; description: string; members: number; category: string };
type ClubSchedule = { id: number; date: string; dateValue: string; title: string; time: string; place: string; attending: boolean };
type BoardPost = { id: number; author: string; content: string; time: string; likes: number; liked: boolean };

interface MeetupDetailExperienceProps {
  meetup: Meetup; activeTab: string; onTabChange: (tab: string) => void; onBack: () => void;
  onChat: () => void; onSchedule: () => void; onGallery: () => void; onMembers: () => void;
  onFinance: () => void; onRequests: () => void; onReceipt: () => void;
}

const initialSchedules: ClubSchedule[] = [
  { id: 1, date: '9월 9일 화요일', dateValue: '2026-09-09', title: '주간 정기 모임', time: '19:30', place: '반포 한강공원', attending: true },
  { id: 2, date: '9월 14일 월요일', dateValue: '2026-09-14', title: '주말 특별 모임', time: '07:00', place: '올림픽공원', attending: false },
  { id: 3, date: '9월 20일 일요일', dateValue: '2026-09-20', title: '신입 멤버 환영회', time: '18:00', place: '강남역 11번 출구', attending: true },
];

const initialPosts: BoardPost[] = [
  { id: 1, author: '김철수', content: '이번 모임도 즐거웠어요! 다음 주에도 참여합니다 🙌', time: '10분 전', likes: 12, liked: false },
  { id: 2, author: '이영희', content: '처음 참여하시는 분들은 편하게 질문 남겨주세요.', time: '1시간 전', likes: 8, liked: true },
];

const emptyScheduleDraft = { title: '', date: '2026-09-21', time: '19:00', place: '' };

export function MeetupDetailExperience(props: MeetupDetailExperienceProps) {
  const { meetup, activeTab, onTabChange, onBack, onChat, onSchedule, onGallery, onMembers, onFinance, onRequests, onReceipt } = props;
  const tabs = ['홈', '게시판', '일정', '회비'];
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [schedules, setSchedules] = usePersistentState(`moeasy:meetup:${meetup.id}:schedules`, initialSchedules);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState(emptyScheduleDraft);
  const [posts, setPosts] = usePersistentState<BoardPost[]>(`moeasy:meetup:${meetup.id}:posts`, initialPosts);
  const [postDraft, setPostDraft] = useState('');
  const [duesPaid, setDuesPaid] = usePersistentState(`moeasy:meetup:${meetup.id}:duesPaid`, false);
  const [copied, setCopied] = useState(false);

  const addSchedule = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const date = new Date(`${scheduleDraft.date}T00:00:00`);
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    const schedule = { date: `${date.getMonth() + 1}월 ${date.getDate()}일 ${weekday}요일`, dateValue: scheduleDraft.date, title: scheduleDraft.title.trim(), time: scheduleDraft.time, place: scheduleDraft.place.trim() };
    setSchedules(current => editingScheduleId
      ? current.map(item => item.id === editingScheduleId ? { ...item, ...schedule } : item)
      : [...current, { id: Date.now(), ...schedule, attending: true }]);
    setScheduleDraft(emptyScheduleDraft);
    setEditingScheduleId(null);
    setShowScheduleForm(false);
  };

  const editSchedule = (schedule: ClubSchedule) => {
    setEditingScheduleId(schedule.id);
    setScheduleDraft({ title: schedule.title, date: schedule.dateValue, time: schedule.time, place: schedule.place });
    setShowScheduleForm(true);
  };

  const closeScheduleForm = () => {
    setEditingScheduleId(null);
    setScheduleDraft(emptyScheduleDraft);
    setShowScheduleForm(false);
  };

  const changeTab = (tab: string) => {
    setCurrentTab(tab);
    onTabChange(tab);
  };

  const addPost = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!postDraft.trim()) return;
    setPosts(current => [{ id: Date.now(), author: '김모이지', content: postDraft.trim(), time: '방금 전', likes: 0, liked: false }, ...current]);
    setPostDraft('');
  };

  const shareMeetup = () => {
    void navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return <div className="min-h-screen bg-background">
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#101828]/80 text-white backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"><button onClick={onBack} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:bg-white/10"><ArrowLeft className="h-5 w-5" /><span className="hidden sm:inline">모임 목록</span></button><div className="flex items-center gap-1">{copied && <span className="mr-2 text-xs text-[#C9FF5C]">링크 복사됨</span>}<button onClick={shareMeetup} className="rounded-full p-2.5 hover:bg-white/10" aria-label="모임 링크 복사"><Share2 className="h-5 w-5" /></button><button className="rounded-full p-2.5 hover:bg-white/10" aria-label="더보기"><MoreHorizontal className="h-5 w-5" /></button></div></div></header>

    <section className="relative h-[470px] overflow-hidden bg-[#101828] lg:h-[560px]"><img src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1800&q=90" alt={`${meetup.name} 대표`} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#101828] via-[#101828]/25 to-black/20" /><div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-5 pb-9 sm:px-8 lg:pb-12"><span className="rounded-full bg-[#C9FF5C] px-3 py-1.5 text-xs font-semibold text-[#193300]">{meetup.category} · 활발한 모임</span><h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">{meetup.name}</h1><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/75"><span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{meetup.region}</span><span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{meetup.members}명</span></div></div></section>

    <div className="sticky top-16 z-40 border-b border-border bg-background/90 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6"><nav className="flex gap-1 overflow-x-auto scrollbar-hide">{tabs.map(tab => <button key={tab} onClick={() => changeTab(tab)} className={`relative px-4 py-5 text-sm ${currentTab === tab ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{tab}{currentTab === tab && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />}</button>)}</nav><button onClick={onChat} className="hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white sm:flex"><MessageCircle className="h-4 w-4" />그룹 채팅</button></div></div>

    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 pb-28 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-12">
      <div className="space-y-8">
        {currentTab === '홈' && <HomePanel meetup={meetup} schedules={schedules} onOpenSchedules={() => changeTab('일정')} onSchedule={onSchedule} onGallery={onGallery} />}
        {currentTab === '게시판' && <BoardPanel posts={posts} draft={postDraft} onDraftChange={setPostDraft} onSubmit={addPost} onToggleLike={(id) => setPosts(current => current.map(post => post.id === id ? {...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1)} : post))} />}
        {currentTab === '일정' && <SchedulePanel schedules={schedules} showForm={showScheduleForm} editingId={editingScheduleId} draft={scheduleDraft} onDraftChange={setScheduleDraft} onToggleForm={() => showScheduleForm ? closeScheduleForm() : setShowScheduleForm(true)} onSubmit={addSchedule} onToggleAttendance={(id) => setSchedules(current => current.map(item => item.id === id ? {...item, attending: !item.attending} : item))} onEdit={editSchedule} onDelete={(id) => setSchedules(current => current.filter(item => item.id !== id))} onCoordinate={onSchedule} />}
        {currentTab === '회비' && <FinancePanel paid={duesPaid} onTogglePaid={() => setDuesPaid(value => !value)} onOpenFinance={onFinance} onReceipt={onReceipt} />}
      </div>
      <aside className="space-y-4"><div className="rounded-[24px] bg-card p-5 ring-1 ring-black/[0.06]"><p className="text-xs font-semibold text-primary">NEXT MEETUP</p><h3 className="mt-3 text-lg font-semibold">{schedules[0]?.date}</h3><p className="mt-1 text-sm text-muted-foreground">{schedules[0]?.time} · {schedules[0]?.place}</p><button onClick={() => changeTab('일정')} className="mt-5 w-full rounded-xl bg-[#101828] py-3 text-sm font-semibold text-white">일정 자세히 보기</button></div><div className="rounded-[24px] bg-card p-5 ring-1 ring-black/[0.06]"><div className="flex items-center justify-between"><h3 className="font-semibold">운영진 도구</h3><Settings2 className="h-4 w-4 text-muted-foreground" /></div><div className="mt-3 space-y-1"><ToolButton icon={<Users />} label="가입 신청 3건" onClick={onRequests}/><ToolButton icon={<Users />} label="멤버 관리" onClick={onMembers}/><ToolButton icon={<Wallet />} label="회비 관리" onClick={onFinance}/><ToolButton icon={<Receipt />} label="정산 등록" onClick={onReceipt}/></div></div></aside>
    </main>
    <button onClick={onChat} className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-blue-500/30 sm:hidden"><MessageCircle className="h-5 w-5" /></button>
  </div>;
}

function HomePanel({ meetup, schedules, onOpenSchedules, onSchedule, onGallery }: { meetup: Meetup; schedules: ClubSchedule[]; onOpenSchedules: () => void; onSchedule: () => void; onGallery: () => void }) {
  return <><section className="rounded-[24px] bg-[#E8EEFF] p-6 sm:p-8"><p className="text-xs font-semibold text-primary">PINNED NOTICE</p><h2 className="mt-3 text-xl font-semibold">이번 주 모임 장소가 변경됐어요</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">모임 장소와 시간을 다시 확인해주세요. 참석 상태는 일정 탭에서 변경할 수 있습니다.</p></section><section><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-semibold text-primary">UPCOMING</p><h2 className="mt-1 text-2xl font-semibold">다가오는 일정</h2></div><button onClick={onSchedule} className="text-sm font-medium text-primary">일정 조율</button></div><div className="grid gap-4 sm:grid-cols-2">{schedules.slice(0,2).map(item => <button key={item.id} onClick={onOpenSchedules} className="rounded-[22px] bg-card p-5 text-left ring-1 ring-black/[0.06] transition hover:-translate-y-0.5 hover:shadow-lg"><span className="text-xs font-semibold text-primary">{item.date}</span><h3 className="mt-4 text-lg font-semibold">{item.title}</h3><p className="mt-2 text-sm text-muted-foreground">{item.time} · {item.place}</p><div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span>{item.attending ? '참석 예정' : '참석 미정'}</span><ArrowRight className="h-4 w-4" /></div></button>)}</div></section><section><h2 className="text-2xl font-semibold">우리 모임 이야기</h2><p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{meetup.description}</p></section><button onClick={onGallery} className="group relative block h-64 w-full overflow-hidden rounded-[24px] text-left"><img src="https://images.unsplash.com/photo-1530137073520-4ea6e2f10a48?auto=format&fit=crop&w=1400&q=85" alt="모임 사진첩" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent"/><div className="absolute bottom-0 p-6 text-white"><Camera className="mb-3 h-5 w-5"/><h2 className="text-2xl font-semibold">지난 순간들</h2><p className="mt-1 text-sm text-white/70">사진첩에서 함께한 기록을 확인하세요</p></div></button></>;
}

function BoardPanel({ posts, draft, onDraftChange, onSubmit, onToggleLike }: { posts: BoardPost[]; draft: string; onDraftChange: (value: string) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onToggleLike: (id: number) => void }) {
  return <section><div className="mb-5"><p className="text-xs font-semibold text-primary">COMMUNITY</p><h2 className="mt-1 text-2xl font-semibold">모임 게시판</h2></div><form onSubmit={onSubmit} className="rounded-[22px] bg-card p-5 ring-1 ring-black/[0.06]"><textarea required value={draft} onChange={event => onDraftChange(event.target.value)} rows={3} className="form-input resize-none" placeholder="모임원들과 이야기를 나눠보세요"/><div className="mt-3 flex justify-end"><button type="submit" className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white"><Send className="h-4 w-4"/>게시하기</button></div></form><div className="mt-4 space-y-3">{posts.map(post => <article key={post.id} className="rounded-[22px] bg-card p-5 ring-1 ring-black/[0.06]"><div className="flex items-center justify-between"><div><strong className="text-sm">{post.author}</strong><p className="mt-0.5 text-xs text-muted-foreground">{post.time}</p></div><MoreHorizontal className="h-4 w-4 text-muted-foreground"/></div><p className="mt-4 text-sm leading-6">{post.content}</p><button type="button" onClick={() => onToggleLike(post.id)} className={`mt-4 flex items-center gap-1.5 text-xs ${post.liked ? 'text-rose-600' : 'text-muted-foreground'}`}><Heart className={`h-4 w-4 ${post.liked ? 'fill-current' : ''}`}/>좋아요 {post.likes}</button></article>)}</div></section>;
}

function SchedulePanel({ schedules, showForm, editingId, draft, onDraftChange, onToggleForm, onSubmit, onToggleAttendance, onEdit, onDelete, onCoordinate }: {
  schedules: ClubSchedule[];
  showForm: boolean;
  editingId: number | null;
  draft: { title: string; date: string; time: string; place: string };
  onDraftChange: (value: { title: string; date: string; time: string; place: string }) => void;
  onToggleForm: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onToggleAttendance: (id: number) => void;
  onEdit: (schedule: ClubSchedule) => void;
  onDelete: (id: number) => void;
  onCoordinate: () => void;
}) {
  return <section>
    <div className="mb-5 flex items-end justify-between">
      <div><p className="text-xs font-semibold text-primary">SCHEDULE</p><h2 className="mt-1 text-2xl font-semibold">모임 일정</h2></div>
      <button onClick={onToggleForm} className="flex items-center gap-2 rounded-full bg-[#101828] px-4 py-2.5 text-sm text-white">{showForm ? <X className="h-4 w-4"/> : <Plus className="h-4 w-4"/>}{showForm ? '닫기' : '일정 추가'}</button>
    </div>
    {showForm && <form onSubmit={onSubmit} className="mb-4 grid gap-4 rounded-[22px] bg-card p-5 ring-1 ring-black/[0.06] sm:grid-cols-2">
      <div className="sm:col-span-2"><p className="text-xs font-semibold text-primary">{editingId ? 'EDIT SCHEDULE' : 'NEW SCHEDULE'}</p><h3 className="mt-1 font-semibold">{editingId ? '일정 수정' : '새 일정 등록'}</h3></div>
      <DetailField label="일정 이름"><input required value={draft.title} onChange={event=>onDraftChange({...draft,title:event.target.value})} className="form-input" placeholder="일정 이름"/></DetailField>
      <DetailField label="장소"><input required value={draft.place} onChange={event=>onDraftChange({...draft,place:event.target.value})} className="form-input" placeholder="모임 장소"/></DetailField>
      <DetailField label="날짜"><input required type="date" value={draft.date} onChange={event=>onDraftChange({...draft,date:event.target.value})} className="form-input"/></DetailField>
      <DetailField label="시간"><input required type="time" value={draft.time} onChange={event=>onDraftChange({...draft,time:event.target.value})} className="form-input"/></DetailField>
      <button type="submit" className="rounded-xl bg-primary py-3.5 text-sm font-semibold text-white sm:col-span-2">{editingId ? '수정 내용 저장' : '일정 등록하기'}</button>
    </form>}
    <div className="space-y-3">
      {schedules.length === 0 && <div className="rounded-[22px] bg-card p-8 text-center text-sm text-muted-foreground ring-1 ring-black/[0.06]">등록된 일정이 없습니다.</div>}
      {schedules.map(item => <article key={item.id} className="rounded-[22px] bg-card p-5 ring-1 ring-black/[0.06]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary"><CalendarDays className="h-5 w-5"/></span>
          <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-primary">{item.date}</p><h3 className="mt-1 font-semibold">{item.title}</h3><div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5"/>{item.time}</span><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5"/>{item.place}</span></div></div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label={`${item.title} 수정`} onClick={() => onEdit(item)} className="rounded-full bg-secondary p-2.5 text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4"/></button>
            <button type="button" aria-label={`${item.title} 삭제`} onClick={() => onDelete(item.id)} className="rounded-full bg-rose-50 p-2.5 text-rose-600"><Trash2 className="h-4 w-4"/></button>
            <button type="button" aria-pressed={item.attending} onClick={() => onToggleAttendance(item.id)} className={`rounded-full px-4 py-2 text-xs font-medium ${item.attending ? 'bg-emerald-50 text-emerald-700' : 'bg-secondary text-muted-foreground'}`}>{item.attending ? <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5"/>참석</span> : '미정'}</button>
          </div>
        </div>
      </article>)}
    </div>
    <button onClick={onCoordinate} className="mt-4 w-full rounded-xl bg-[#E8EEFF] py-4 text-sm font-semibold text-primary">멤버들과 가능 시간 조율하기</button>
  </section>;
}

function FinancePanel({ paid, onTogglePaid, onOpenFinance, onReceipt }: { paid:boolean; onTogglePaid:()=>void; onOpenFinance:()=>void; onReceipt:()=>void }) {
  return <section><div className="mb-5"><p className="text-xs font-semibold text-primary">FINANCE</p><h2 className="mt-1 text-2xl font-semibold">회비 및 정산</h2></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-[24px] bg-[#101828] p-6 text-white"><p className="text-xs text-slate-400">모임 잔액</p><strong className="mt-3 block text-3xl">275,000원</strong><p className="mt-8 text-xs text-slate-400">최근 갱신 · 오늘 14:30</p></div><div className={`rounded-[24px] p-6 ${paid ? 'bg-emerald-50 text-emerald-800' : 'bg-[#FFF4D8] text-amber-900'}`}><p className="text-xs">9월 정기 회비</p><strong className="mt-3 block text-3xl">15,000원</strong><button type="button" onClick={onTogglePaid} className={`mt-7 w-full rounded-xl py-3 text-sm font-semibold ${paid ? 'bg-white text-emerald-700' : 'bg-[#101828] text-white'}`}>{paid ? '납부 완료 · 되돌리기' : '납부 상태 테스트'}</button></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><button onClick={onOpenFinance} className="flex items-center justify-between rounded-[20px] bg-card p-5 text-left ring-1 ring-black/[0.06]"><span><strong className="block">전체 회비 내역</strong><small className="mt-1 block text-muted-foreground">입출금과 납부 현황 확인</small></span><ArrowRight className="h-4 w-4"/></button><button onClick={onReceipt} className="flex items-center justify-between rounded-[20px] bg-card p-5 text-left ring-1 ring-black/[0.06]"><span><strong className="block">영수증 정산</strong><small className="mt-1 block text-muted-foreground">지출 등록 화면 열기</small></span><Receipt className="h-4 w-4"/></button></div></section>;
}

function ToolButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) { return <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-secondary"><span className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</span><span className="flex-1 text-left">{label}</span><ArrowRight className="h-4 w-4 text-muted-foreground" /></button>; }
function DetailField({ label, children }: { label:string; children:React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>; }
