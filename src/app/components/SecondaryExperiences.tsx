import { useState } from 'react';
import { ArrowLeft, Bell, BellRing, CalendarDays, Camera, Check, CheckCheck, Clock3, CreditCard, MapPin, MessageCircle, MoreHorizontal, Pencil, Plus, Receipt, Search, Send, Sparkles, UserCheck, Users, Wallet, X } from 'lucide-react';
import { TimeGrid } from './TimeGrid';
import { OptimalTimeCard } from './OptimalTimeCard';
import { ReceiptOcrExperience } from './ReceiptOcrExperience';
import { usePersistentState } from '../hooks/usePersistentState';
import { UserAvatar } from './UserAvatar';
import {
  INITIAL_DUES_STATE,
  meetupFinanceKey,
  patchLinkedChatMessage,
  type DuesManagementState,
  type SettlementRecord,
  type TransferRecord,
} from '../services/meetupOperations';

function PageFrame({ eyebrow, title, description, onBack, action, children, dark = false }: { eyebrow: string; title: string; description?: string; onBack: () => void; action?: React.ReactNode; children: React.ReactNode; dark?: boolean }) {
  return <div className="min-h-screen bg-background">
    <header className={`sticky top-0 z-50 border-b ${dark ? 'border-white/10 bg-[#101828]/90 text-white' : 'border-border bg-background/90'} backdrop-blur-xl`}>
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
        <button onClick={onBack} className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ${dark ? 'hover:bg-white/10' : 'hover:bg-card'}`}><ArrowLeft className="h-5 w-5" /><span className="hidden sm:inline">돌아가기</span></button>{action}
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
      <div className="mb-8 sm:mb-10"><p className="text-sm text-muted-foreground">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{title}</h1>{description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>
      {children}
    </main>
  </div>;
}

export function NotificationsExperience({ onBack }: { onBack: () => void }) {
  const [read, setRead] = useState<number[]>([4, 5, 6]);
  const items = [
    [1, '정산 요청이 도착했어요', '해운대 횟집 모임 · 15,000원을 확인해주세요.', '2시간 전', 'bg-amber-100 text-amber-700', <Receipt />],
    [2, '모임 장소가 변경됐어요', '주간 러닝 모임이 반포 한강공원으로 변경되었습니다.', '5시간 전', 'bg-blue-100 text-blue-700', <MapPin />],
    [3, '5월 회비 납부 안내', '납부 기한이 3일 남았습니다.', '1일 전', 'bg-violet-100 text-violet-700', <Wallet />],
    [4, '일정이 확정됐어요', '4월 22일 오후 7시에 만나요.', '1일 전', 'bg-emerald-100 text-emerald-700', <CalendarDays />],
    [5, '가입 신청이 승인됐어요', '강남 러닝 크루에 오신 것을 환영합니다.', '2일 전', 'bg-sky-100 text-sky-700', <UserCheck />],
    [6, '새 댓글이 달렸어요', '김철수님이 회원님의 게시글에 댓글을 남겼습니다.', '2일 전', 'bg-slate-100 text-slate-700', <MessageCircle />],
  ] as const;
  const unread = items.length - read.length;
  return <PageFrame eyebrow="알림" title="새로운 소식" description={`확인하지 않은 알림이 ${unread}개 있어요.`} onBack={onBack} action={unread > 0 ? <button onClick={() => setRead(items.map(i => i[0]))} className="flex items-center gap-2 rounded-full bg-[#101828] px-4 py-2.5 text-xs font-semibold text-white"><CheckCheck className="h-4 w-4" />모두 읽음</button> : undefined}>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="overflow-hidden rounded-[24px] bg-card ring-1 ring-black/[0.06]">{items.map(([id,title,message,time,color,icon], index) => { const isRead = read.includes(id); return <button key={id} onClick={() => setRead([...new Set([...read,id])])} className={`flex w-full gap-4 p-5 text-left transition hover:bg-secondary/60 sm:p-6 ${index < items.length-1 ? 'border-b border-border' : ''} ${isRead ? 'opacity-65' : ''}`}><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl [&>svg]:h-5 [&>svg]:w-5 ${color}`}>{icon}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{title}</h3><span className="shrink-0 text-xs text-muted-foreground">{time}</span></div><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{message}</p></div>{!isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}</button>; })}</div>
      <aside className="hidden lg:block"><div className="rounded-[24px] bg-[#101828] p-6 text-white"><Bell className="h-5 w-5 text-[#8FAAFF]" /><strong className="mt-7 block text-4xl">{unread}</strong><p className="mt-2 text-sm text-slate-400">읽지 않은 알림</p><div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary" style={{width:`${(read.length/items.length)*100}%`}} /></div></div></aside>
    </div>
  </PageFrame>;
}

export function MessagesExperience({ onBack, onChat }: { onBack: () => void; onChat: () => void }) {
  const rooms = [
    ['강남 러닝 크루','오늘 모임 장소가 변경되었습니다','10분 전','3'],
    ['판교 개발자 스터디','다음 주 스터디 자료 공유드립니다','1시간 전',''],
    ['북한산 등산 클럽','다들 무사히 하산하셨나요?','3시간 전','1'],
    ['홍대 독서 모임','이번 달 책 추천 받습니다','5시간 전',''],
  ];
  return <PageFrame eyebrow="메시지" title="모임 대화" description="참여 중인 모임의 이야기를 이어가세요." onBack={onBack} action={<button className="rounded-full bg-primary p-2.5 text-white"><Plus className="h-5 w-5" /></button>}>
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="p-4"><label className="flex items-center gap-3 rounded-xl bg-secondary px-4"><Search className="h-4 w-4 text-muted-foreground"/><input className="w-full bg-transparent py-3 text-sm outline-none" placeholder="대화 검색"/></label></div>{rooms.map(([name,message,time,count]) => <button key={name} onClick={onChat} className="flex w-full items-center gap-3 border-t border-border p-4 text-left hover:bg-secondary/60"><UserAvatar name={name} className="h-11 w-11" textClassName="text-[10px]"/><div className="min-w-0 flex-1"><div className="flex justify-between"><h3 className="truncate text-sm font-semibold">{name}</h3><span className="text-[11px] text-muted-foreground">{time}</span></div><p className="mt-1 truncate text-sm text-muted-foreground">{message}</p></div>{count && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">{count}</span>}</button>)}</section>
      <section className="hidden min-h-[520px] items-center justify-center rounded-2xl border border-border bg-slate-50 text-center lg:flex"><div><MessageCircle className="mx-auto h-7 w-7 text-slate-400"/><h2 className="mt-4 text-lg font-semibold">대화를 선택하세요</h2><p className="mt-2 text-sm text-muted-foreground">모임에서 오간 이야기를 확인할 수 있어요.</p></div></section>
    </div>
  </PageFrame>;
}

export function GalleryExperience({ onBack, name }: { onBack: () => void; name: string }) {
  const photos = ['photo-1530137073520-4ea6e2f10a48','photo-1529156069898-49953e39b3ac','photo-1552674605-db6ffd4facb5','photo-1500530855697-b586d89ba3ee','photo-1511632765486-a01980e01a18','photo-1521737711867-e3b97375f902'];
  return <PageFrame eyebrow="Gallery" title="지난 순간들" description={`${name} 멤버들이 함께 남긴 기록입니다.`} onBack={onBack} action={<button className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-white"><Camera className="h-4 w-4"/>사진 올리기</button>}>
    <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[260px] lg:grid-cols-3">{photos.map((photo,index)=><button key={photo} className={`group relative overflow-hidden rounded-[20px] ${index===0?'col-span-2 row-span-2 lg:col-span-2':''}`}><img src={`https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1200&q=85`} alt="모임 활동" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/><span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/15"/></button>)}</div>
  </PageFrame>;
}

export function RequestsExperience({ onBack, name }: { onBack: () => void; name: string }) {
  const [handled, setHandled] = useState<number[]>([]);
  const people = [['민지','러닝을 이제 막 시작했어요. 꾸준히 함께 달리고 싶습니다.','서울 강남구','MJ'],['도윤','10km 완주를 목표로 하고 있습니다!','서울 서초구','DY'],['서연','퇴근 후 건강한 취미를 만들고 싶어요.','서울 송파구','SY']];
  return <PageFrame eyebrow="운영진 도구" title="가입 신청 관리" description={`${name}에 함께하고 싶은 새로운 멤버들을 확인하세요.`} onBack={onBack}>
    <div className="overflow-hidden rounded-2xl border border-border bg-card">{people.map(([person,intro,place],index)=><article key={person} className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center ${index < people.length - 1 ? 'border-b border-border' : ''} ${handled.includes(index)?'opacity-50':''}`}><UserAvatar name={person} className="h-11 w-11" textClassName="text-[10px]"/><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="font-semibold">{person}</h2><p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3"/>{place}</p></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{intro}</p></div>{handled.includes(index)?<span className="self-start rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 sm:self-auto">처리 완료</span>:<div className="flex gap-2"><button onClick={()=>setHandled([...handled,index])} className="rounded-lg bg-secondary px-4 py-2.5 text-sm">거절</button><button onClick={()=>setHandled([...handled,index])} className="rounded-lg bg-primary px-4 py-2.5 text-sm text-white">승인</button></div>}</article>)}</div>
  </PageFrame>;
}

export type CreateMeetupValues = { name: string; description: string; category: string; region: string; maxMembers: number };

export function CreateMeetupExperience({ onBack, onCreate }: { onBack: () => void; onCreate: (values: CreateMeetupValues) => void }) {
  const [category,setCategory]=useState('운동');
  const [name,setName]=useState('');
  const [description,setDescription]=useState('');
  const [region,setRegion]=useState('');
  const [maxMembers,setMaxMembers]=useState('20');
  const [error,setError]=useState('');
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const capacity = Number(maxMembers);
    if (!name.trim() || !description.trim() || !region.trim()) { setError('모임 이름, 소개, 활동 지역을 모두 입력해주세요.'); return; }
    if (!Number.isInteger(capacity) || capacity < 2 || capacity > 500) { setError('최대 인원은 2명에서 500명 사이로 입력해주세요.'); return; }
    onCreate({ name: name.trim(), description: description.trim(), category, region: region.trim(), maxMembers: capacity });
  };
  return <PageFrame eyebrow="Create a circle" title="새로운 모임 만들기" description="어떤 사람들과 무엇을 하고 싶은지 알려주세요. 나머지는 MoEasy가 도와드릴게요." onBack={onBack}>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><form onSubmit={handleSubmit} className="space-y-6 rounded-[26px] bg-card p-5 ring-1 ring-black/[0.06] sm:p-8"><FormField label="모임 이름"><input required value={name} onChange={event=>setName(event.target.value)} placeholder="예: 퇴근 후 한강 러닝" className="form-input"/></FormField><FormField label="모임 소개"><textarea required value={description} onChange={event=>setDescription(event.target.value)} rows={5} placeholder="모임의 분위기와 활동을 소개해주세요" className="form-input resize-none"/></FormField><FormField label="카테고리"><div className="flex flex-wrap gap-2">{['운동','스터디','문화','음식','취미','게임'].map(item=><button type="button" key={item} onClick={()=>setCategory(item)} className={`rounded-full px-4 py-2 text-sm ${category===item?'bg-[#101828] text-white':'bg-secondary text-muted-foreground'}`}>{item}</button>)}</div></FormField><div className="grid gap-4 sm:grid-cols-2"><FormField label="활동 지역"><div className="relative"><MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input required value={region} onChange={event=>setRegion(event.target.value)} placeholder="서울 강남구" className="form-input pl-11"/></div></FormField><FormField label="최대 인원"><div className="relative"><Users className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input required type="number" min="2" max="500" value={maxMembers} onChange={event=>setMaxMembers(event.target.value)} className="form-input pl-11"/></div></FormField></div>{error&&<p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<button type="submit" className="w-full rounded-xl bg-primary py-4 text-sm font-semibold text-white">모임 만들기</button></form>
      <aside className="space-y-4"><div className="overflow-hidden rounded-[24px] bg-[#101828] text-white"><div className="relative h-44"><img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=85" alt="모임 미리보기" className="h-full w-full object-cover opacity-70"/><div className="absolute inset-0 bg-gradient-to-t from-[#101828] to-transparent"/></div><div className="p-5"><span className="text-xs text-[#8FAAFF]">PREVIEW</span><h3 className="mt-2 text-xl font-semibold">{name.trim() || `새로운 ${category} 모임`}</h3><p className="mt-2 line-clamp-2 text-sm text-slate-400">{description.trim() || '모임 정보가 여기에 표시됩니다.'}</p>{region.trim()&&<p className="mt-3 flex items-center gap-1 text-xs text-slate-300"><MapPin className="h-3 w-3"/>{region} · 최대 {maxMembers || 0}명</p>}</div></div><div className="rounded-[22px] bg-[#E8EEFF] p-5"><Sparkles className="h-5 w-5 text-primary"/><h3 className="mt-4 font-semibold">좋은 소개의 기준</h3><p className="mt-2 text-sm leading-6 text-slate-600">누구를 위한 모임인지, 언제 얼마나 자주 만나는지 적으면 가입률이 높아져요.</p></div></aside>
    </div>
  </PageFrame>;
}

function createReminderMessage(dues: Pick<DuesManagementState, 'title' | 'amount' | 'dueDate' | 'account'>) {
  const dueDate = dues.dueDate.replaceAll('-', '.');
  return `[MoEasy] ${dues.title} 납부 안내\n아직 회비 납부가 확인되지 않았어요.\n\n납부 금액: ${dues.amount.toLocaleString('ko-KR')}원\n납부 기한: ${dueDate}\n입금 계좌: ${dues.account}\n\n이미 납부하셨다면 모임장에게 알려주세요.`;
}

function formatDuesDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: value.includes('T') ? 'numeric' : undefined, minute: value.includes('T') ? '2-digit' : undefined }).format(date);
}

export function FinanceExperience({ meetupId, meetupName, onBack, onReceipt }: { meetupId: string | number; meetupName: string; onBack: () => void; onReceipt: () => void }) {
  const [tab, setTab] = useState<'납부 현황' | '거래 내역'>('납부 현황');
  const [dues, setDues] = usePersistentState<DuesManagementState>(meetupFinanceKey(meetupId), INITIAL_DUES_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => ({ title: dues.title, amount: String(dues.amount), dueDate: dues.dueDate, account: dues.account }));
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState(() => createReminderMessage(dues));
  const [notice, setNotice] = useState('');
  const paidMembers = dues.members.filter(member => member.paid);
  const unpaidMembers = dues.members.filter(member => !member.paid);
  const expectedAmount = dues.amount * dues.members.length;
  const collectedAmount = dues.amount * paidMembers.length;
  const progress = dues.members.length === 0 ? 0 : Math.round((paidMembers.length / dues.members.length) * 100);
  const settlements = dues.settlements ?? [];
  const transfers = dues.transfers ?? [];
  const transactionRows = [
    ['회비 납부', `${paidMembers.length}명 납부 완료`, `+${collectedAmount.toLocaleString('ko-KR')}원`, 'text-emerald-600'],
    ['모임 회식', '해운대 횟집 · 9월 15일', '-120,000원', 'text-foreground'],
    ['장비 구매', '러닝 조끼 10개 · 9월 12일', '-85,000원', 'text-foreground'],
  ];

  const startEditing = () => {
    setDraft({ title: dues.title, amount: String(dues.amount), dueDate: dues.dueDate, account: dues.account });
    setIsEditing(true);
  };

  const saveSettings = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(draft.amount);
    if (!draft.title.trim() || !Number.isFinite(amount) || amount < 0 || !draft.dueDate || !draft.account.trim()) {
      setNotice('회비명, 금액, 납부기한, 입금 계좌를 모두 확인해주세요.');
      return;
    }
    const nextDues = { ...dues, title: draft.title.trim(), amount, dueDate: draft.dueDate, account: draft.account.trim() };
    setDues(nextDues);
    setReminderMessage(createReminderMessage(nextDues));
    setIsEditing(false);
    setNotice('회비 설정을 저장했습니다.');
  };

  const togglePaid = (memberId: string) => {
    setDues(current => ({
      ...current,
      members: current.members.map(member => member.id === memberId
        ? { ...member, paid: !member.paid, paidAt: member.paid ? undefined : new Date().toISOString() }
        : member),
    }));
    setSelectedMemberIds(current => current.filter(id => id !== memberId));
    setNotice('납부 상태를 변경했습니다.');
  };

  const toggleSelected = (memberId: string) => {
    setSelectedMemberIds(current => current.includes(memberId) ? current.filter(id => id !== memberId) : [...current, memberId]);
  };

  const selectAllUnpaid = () => {
    const unpaidIds = unpaidMembers.map(member => member.id);
    setSelectedMemberIds(current => current.length === unpaidIds.length ? [] : unpaidIds);
  };

  const openReminder = () => {
    if (selectedMemberIds.length === 0) {
      setSelectedMemberIds(unpaidMembers.map(member => member.id));
    }
    setReminderMessage(createReminderMessage(dues));
    setIsReminderOpen(true);
    setNotice('');
  };

  const recordReminder = () => {
    const targetIds = selectedMemberIds.length > 0 ? selectedMemberIds : unpaidMembers.map(member => member.id);
    if (targetIds.length === 0 || !reminderMessage.trim()) return;
    const remindedAt = new Date().toISOString();
    setDues(current => ({
      ...current,
      members: current.members.map(member => targetIds.includes(member.id) ? { ...member, lastRemindedAt: remindedAt } : member),
    }));
    setIsReminderOpen(false);
    setSelectedMemberIds([]);
    setNotice(`${targetIds.length}명의 독촉 문자 발송 기록을 저장했습니다.`);
  };

  const toggleLinkedSettlement = (record: SettlementRecord) => {
    const completed = !record.completed;
    const paidCount = completed ? record.participants : Math.min(1, record.participants);
    setDues(current => ({
      ...current,
      settlements: (current.settlements ?? []).map(item => item.id === record.id ? { ...item, completed, paidCount } : item),
    }));
    patchLinkedChatMessage(meetupId, record.chatMessageId, { paid: completed, paidCount });
    setNotice(completed ? '공동 정산을 완료 처리했습니다.' : '공동 정산을 진행 중으로 되돌렸습니다.');
  };

  const toggleLinkedTransfer = (record: TransferRecord) => {
    const completed = !record.completed;
    setDues(current => ({
      ...current,
      transfers: (current.transfers ?? []).map(item => item.id === record.id ? { ...item, completed } : item),
    }));
    patchLinkedChatMessage(meetupId, record.chatMessageId, { completed });
    setNotice(completed ? '개별 송금 요청을 완료 처리했습니다.' : '개별 송금 요청을 대기 상태로 되돌렸습니다.');
  };

  return <PageFrame eyebrow="모임 회비" title="회비 관리" description={`${meetupName}의 회비를 설정하고 회원별 납부 여부와 미납 안내 이력을 한곳에서 관리하세요.`} onBack={onBack} action={<button onClick={onReceipt} className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-white"><Receipt className="h-4 w-4"/>영수증 등록</button>}>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-border bg-card p-6 sm:col-span-2"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">이번 회비 모금액</p><strong className="mt-2 block text-3xl tracking-tight">{collectedAmount.toLocaleString('ko-KR')}원</strong></div><span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600">목표 {expectedAmount.toLocaleString('ko-KR')}원</span></div><div className="mt-7 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }}/></div><div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{dues.title}</span><b className="text-foreground">{progress}% 달성</b></div></div>
      <div className="rounded-2xl border border-border bg-card p-6"><CreditCard className="h-5 w-5 text-slate-500"/><strong className="mt-8 block text-2xl">{paidMembers.length} / {dues.members.length}</strong><p className="mt-1 text-sm text-muted-foreground">납부 완료</p></div>
      <div className="rounded-2xl border border-border bg-card p-6"><BellRing className="h-5 w-5 text-slate-500"/><strong className="mt-8 block text-2xl">{unpaidMembers.length}명</strong><p className="mt-1 text-sm text-rose-600">미납 {Math.max(0, expectedAmount - collectedAmount).toLocaleString('ko-KR')}원</p></div>
    </section>

    {notice && <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-800 ring-1 ring-blue-100"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="알림 닫기"><X className="h-4 w-4"/></button></div>}

    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">현재 회비</p><h2 className="mt-2 text-xl font-semibold">{dues.title}</h2><p className="mt-1 text-sm text-muted-foreground">회원 1인당 {dues.amount.toLocaleString('ko-KR')}원 · {dues.dueDate.replaceAll('-', '.')}까지</p></div><button type="button" onClick={startEditing} className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-xs font-semibold"><Pencil className="h-3.5 w-3.5"/>회비 설정</button></div>
      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-secondary/70 p-4"><Wallet className="mt-0.5 h-4 w-4 shrink-0 text-primary"/><div><p className="text-xs text-muted-foreground">입금 계좌</p><p className="mt-1 text-sm font-medium">{dues.account}</p></div></div>
    </section>

    <div className="mt-8 flex gap-2">{(['납부 현황','거래 내역'] as const).map(item=><button key={item} onClick={()=>setTab(item)} className={`rounded-full px-4 py-2 text-sm ${tab===item?'bg-[#101828] text-white':'bg-card text-muted-foreground ring-1 ring-black/[0.06]'}`}>{item}</button>)}</div>

    {tab === '납부 현황' ? <section className="mt-4 overflow-hidden rounded-[24px] bg-card ring-1 ring-black/[0.06]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="font-semibold">회원별 납부 현황</h2><p className="mt-1 text-xs text-muted-foreground">납부 여부를 직접 수정하고 미납자에게 안내할 수 있어요.</p></div><div className="flex gap-2"><button type="button" onClick={selectAllUnpaid} disabled={unpaidMembers.length === 0} className="rounded-full bg-secondary px-3.5 py-2 text-xs font-medium disabled:opacity-50">{selectedMemberIds.length === unpaidMembers.length && unpaidMembers.length > 0 ? '선택 해제' : '미납자 전체 선택'}</button><button type="button" onClick={openReminder} disabled={unpaidMembers.length === 0} className="flex items-center gap-2 rounded-full bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50"><BellRing className="h-3.5 w-3.5"/>독촉 문자</button></div></div>
      <div>{dues.members.map((member, index) => <div key={member.id} className={`flex items-center gap-3 px-4 py-4 sm:px-5 ${index < dues.members.length - 1 ? 'border-b border-border' : ''}`}>
        <input type="checkbox" aria-label={`${member.name} 선택`} disabled={member.paid} checked={selectedMemberIds.includes(member.id)} onChange={() => toggleSelected(member.id)} className="h-4 w-4 rounded border-border accent-rose-600 disabled:opacity-30"/>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-semibold ${member.paid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{member.name.slice(-2)}</span>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{member.name}</h3><span className="text-[11px] text-muted-foreground">{member.role}</span></div><p className="mt-1 text-xs text-muted-foreground">{member.paid ? `${formatDuesDate(member.paidAt)} 납부` : member.lastRemindedAt ? `${formatDuesDate(member.lastRemindedAt)} 독촉 문자 기록` : '아직 안내 기록 없음'}</p></div>
        <button type="button" onClick={() => togglePaid(member.id)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${member.paid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{member.paid ? '납부 완료' : '미납'}</button>
      </div>)}</div>
    </section> : <div className="mt-4 space-y-4">
      {(settlements.length > 0 || transfers.length > 0) && <section className="overflow-hidden rounded-[24px] bg-card ring-1 ring-black/[0.06]"><div className="border-b border-border px-5 py-4"><div className="flex items-center gap-2"><h2 className="font-semibold">채팅에서 연결된 업무</h2><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">SYNCED</span></div><p className="mt-1 text-xs text-muted-foreground">채팅에서 만든 정산과 송금 요청의 상태가 함께 반영됩니다.</p></div>
        {settlements.map((record, index) => <div key={record.id} className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center ${index < settlements.length - 1 || transfers.length > 0 ? 'border-b border-border' : ''}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50"><Receipt className="h-5 w-5 text-emerald-700"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{record.title}</h3><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">공동 정산</span></div><p className="mt-1 text-xs text-muted-foreground">총 {record.totalAmount.toLocaleString('ko-KR')}원 · {record.participants}명 · 1인 {record.shareAmount.toLocaleString('ko-KR')}원</p></div><div className="flex items-center justify-between gap-3 sm:justify-end"><span className="text-xs text-muted-foreground">{record.paidCount}/{record.participants}명 완료</span><button type="button" onClick={() => toggleLinkedSettlement(record)} className={`rounded-full px-3 py-2 text-xs font-semibold ${record.completed ? 'bg-emerald-50 text-emerald-700' : 'bg-secondary text-muted-foreground'}`}>{record.completed ? '정산 완료' : '진행 중'}</button></div></div>)}
        {transfers.map((record, index) => <div key={record.id} className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center ${index < transfers.length - 1 ? 'border-b border-border' : ''}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50"><Send className="h-5 w-5 text-sky-700"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{record.recipient}님 송금 요청</h3><span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] text-sky-700">개별 송금</span></div><p className="mt-1 text-xs text-muted-foreground">{record.memo} · {record.amount.toLocaleString('ko-KR')}원</p></div><button type="button" onClick={() => toggleLinkedTransfer(record)} className={`self-start rounded-full px-3 py-2 text-xs font-semibold sm:self-auto ${record.completed ? 'bg-sky-50 text-sky-700' : 'bg-secondary text-muted-foreground'}`}>{record.completed ? '송금 완료' : '대기 중'}</button></div>)}
      </section>}
      <section className="overflow-hidden rounded-[24px] bg-card ring-1 ring-black/[0.06]">{transactionRows.map(([title,meta,amount,color],index)=><div key={title} className={`flex items-center gap-4 p-5 ${index<transactionRows.length-1?'border-b border-border':''}`}><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary"><Wallet className="h-5 w-5 text-muted-foreground"/></span><div className="flex-1"><h3 className="font-medium">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{meta}</p></div><strong className={`text-sm ${color}`}>{amount}</strong></div>)}</section>
    </div>}

    {isEditing && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="회비 설정"><form onSubmit={saveSettings} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px] sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Dues settings</p><h2 className="mt-2 text-2xl font-semibold">회비 설정</h2></div><button type="button" onClick={() => setIsEditing(false)} className="rounded-full bg-secondary p-2"><X className="h-4 w-4"/></button></div><div className="mt-7 space-y-5"><FormField label="회비명"><input value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} className="form-input" placeholder="예: 9월 정기 회비"/></FormField><div className="grid gap-4 sm:grid-cols-2"><FormField label="1인당 회비"><div className="relative"><input type="number" min="0" step="1000" value={draft.amount} onChange={event => setDraft(current => ({ ...current, amount: event.target.value }))} className="form-input pr-10"/><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">원</span></div></FormField><FormField label="납부 기한"><input type="date" value={draft.dueDate} onChange={event => setDraft(current => ({ ...current, dueDate: event.target.value }))} className="form-input"/></FormField></div><FormField label="입금 계좌"><input value={draft.account} onChange={event => setDraft(current => ({ ...current, account: event.target.value }))} className="form-input" placeholder="은행 계좌번호 예금주"/></FormField></div><div className="mt-8 flex gap-3"><button type="button" onClick={() => setIsEditing(false)} className="flex-1 rounded-xl bg-secondary py-3.5 text-sm font-semibold">취소</button><button type="submit" className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white">설정 저장</button></div></form></div>}

    {isReminderOpen && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="독촉 문자 보내기"><section className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px] sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-600">Payment reminder</p><h2 className="mt-2 text-2xl font-semibold">독촉 문자 보내기</h2><p className="mt-2 text-sm text-muted-foreground">{selectedMemberIds.length || unpaidMembers.length}명에게 보낼 문구를 확인해주세요.</p></div><button type="button" onClick={() => setIsReminderOpen(false)} className="rounded-full bg-secondary p-2"><X className="h-4 w-4"/></button></div><div className="mt-6 flex flex-wrap gap-2">{dues.members.filter(member => selectedMemberIds.includes(member.id) || (selectedMemberIds.length === 0 && !member.paid)).map(member => <span key={member.id} className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700">{member.name}</span>)}</div><label className="mt-5 block"><span className="mb-2 block text-sm font-semibold">메시지</span><textarea value={reminderMessage} onChange={event => setReminderMessage(event.target.value)} rows={10} className="form-input resize-none text-sm leading-6"/></label><div className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-800 ring-1 ring-amber-100">현재 프런트엔드 데모에서는 실제 SMS를 전송하지 않고 발송 대상과 시각만 기록합니다. 실제 전송에는 문자 발송 서비스 연동이 필요합니다.</div><div className="mt-6 flex gap-3"><button type="button" onClick={() => setIsReminderOpen(false)} className="flex-1 rounded-xl bg-secondary py-3.5 text-sm font-semibold">취소</button><button type="button" onClick={recordReminder} disabled={!reminderMessage.trim()} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-3.5 text-sm font-semibold text-white disabled:opacity-50"><Send className="h-4 w-4"/>발송 기록 저장</button></div></section></div>}
  </PageFrame>;
}

export function MembersExperience({ onBack }: { onBack: () => void }) {
  const members=[['김모이지','모임장','ME'],['김철수','운영진','CH'],['이영희','멤버','YH'],['박민수','멤버','MS'],['최수진','멤버','SJ']];
  return <PageFrame eyebrow="운영진 도구" title="멤버 관리" description="역할과 가입 상태를 관리하고 모임 구성원을 확인하세요." onBack={onBack} action={<button className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-white"><Plus className="h-4 w-4"/>멤버 초대</button>}>
    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-border bg-card p-3"><Search className="ml-2 h-4 w-4 text-muted-foreground"/><input className="flex-1 bg-transparent py-2 text-sm outline-none" placeholder="이름으로 검색"/><span className="rounded-md bg-secondary px-3 py-1 text-xs text-muted-foreground">145명</span></div><div className="overflow-hidden rounded-2xl border border-border bg-card">{members.map(([name,role],index)=><article key={name} className={`flex items-center gap-3 p-4 ${index < members.length - 1 ? 'border-b border-border' : ''}`}><UserAvatar name={name} className="h-11 w-11" textClassName="text-[10px]"/><div className="flex-1"><h3 className="font-semibold">{name}</h3><p className="mt-1 text-xs text-muted-foreground">{role} · 최근 활동 오늘</p></div><button className="rounded-full p-2 hover:bg-secondary"><MoreHorizontal className="h-4 w-4"/></button></article>)}</div>
  </PageFrame>;
}

export function ReceiptExperience({ onBack }: { onBack: () => void }) {
  return <ReceiptOcrExperience onBack={onBack} />;
}

export function SchedulerExperience({ onBack }: { onBack: () => void }) {
  return <PageFrame eyebrow="Schedule together" title="일정 조율" description="멤버들이 가능한 시간을 선택하고 가장 좋은 시간을 찾아보세요." onBack={onBack}>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-semibold">주간 가능 시간</h2><p className="mt-1 text-sm text-muted-foreground">드래그해서 가능한 시간을 선택하세요.</p></div><span className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-primary">10명 참여</span></div><TimeGrid/></section><aside className="space-y-4"><OptimalTimeCard day="금요일" date="9월 12일" time="오후 7:30" participants={9} totalMembers={10}/><div className="rounded-[22px] bg-card p-5 ring-1 ring-black/[0.06]"><h3 className="font-semibold">응답 현황</h3><div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full w-[90%] rounded-full bg-primary"/></div><div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>9명 응답</span><span>1명 대기</span></div></div><button className="w-full rounded-xl bg-[#101828] py-4 text-sm font-semibold text-white">이 시간으로 확정하기</button></aside></div>
  </PageFrame>;
}

function FormField({label,children}:{label:string;children:React.ReactNode}) { return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>; }
function Info({label,value}:{label:string;value:string}) { return <div className="rounded-2xl bg-secondary p-4"><p className="text-xs text-muted-foreground">{label}</p><strong className="mt-2 block text-sm">{value}</strong></div>; }
