import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Image as ImageIcon,
  MapPin,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Send,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';

type TextMessage = {
  id: string;
  type: 'text';
  sender: string;
  isMe: boolean;
  sentAt: string;
  text: string;
};

type ImageMessage = {
  id: string;
  type: 'image';
  sender: string;
  isMe: boolean;
  sentAt: string;
  imageUrl: string;
  fileName: string;
  caption?: string;
};

type ScheduleMessage = {
  id: string;
  type: 'schedule';
  sender: string;
  isMe: boolean;
  sentAt: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attending: boolean;
  attendeeCount: number;
};

type SettlementMessage = {
  id: string;
  type: 'settlement';
  sender: string;
  isMe: boolean;
  sentAt: string;
  title: string;
  totalAmount: number;
  participants: number;
  paid: boolean;
  paidCount: number;
};

type ChatItem = TextMessage | ImageMessage | ScheduleMessage | SettlementMessage;
type ComposerMode = 'schedule' | 'settlement' | null;

function createInitialMessages(meetupName: string): ChatItem[] {
  return [
    { id: 'welcome-1', type: 'text', sender: '김철수', isMe: false, sentAt: '2026-09-28T14:21:00+09:00', text: `${meetupName} 이번 주 모임 일정 공유할게요!` },
    { id: 'welcome-2', type: 'schedule', sender: '김철수', isMe: false, sentAt: '2026-09-28T14:22:00+09:00', title: '9월 마지막 정기 모임', date: '2026-09-30', time: '19:30', location: '반포 한강공원 달빛광장', attending: false, attendeeCount: 7 },
    { id: 'welcome-3', type: 'text', sender: '이영희', isMe: false, sentAt: '2026-09-28T14:24:00+09:00', text: '지난 모임 식사비 정산도 올렸어요. 확인 부탁드려요 🙌' },
    { id: 'welcome-4', type: 'settlement', sender: '이영희', isMe: false, sentAt: '2026-09-28T14:25:00+09:00', title: '9월 24일 모임 뒤풀이', totalAmount: 128000, participants: 8, paid: false, paidCount: 5 },
  ];
}

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `chat-${Date.now()}-${Math.random()}`;
}

function formatChatTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function formatScheduleDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(`${value}T00:00:00`));
}

async function resizeChatImage(file: File) {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('사진을 불러오지 못했습니다.'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('사진 형식을 확인해주세요.'));
    element.src = source;
  });

  const maxSize = 1280;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return source;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

export function GroupChatExperience({
  meetupId,
  meetupName,
  memberCount,
  currentUserName,
  onBack,
}: {
  meetupId: string | number;
  meetupName: string;
  memberCount: number;
  currentUserName: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = usePersistentState<ChatItem[]>(`moeasy:group-chat:${meetupId}`, createInitialMessages(meetupName));
  const [message, setMessage] = useState('');
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>(null);
  const [notice, setNotice] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState({ title: '', date: '2026-09-30', time: '19:30', location: '' });
  const [settlementDraft, setSettlementDraft] = useState({ title: '', totalAmount: '', participants: String(Math.min(memberCount, 10)) });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, composerMode]);

  const appendMessage = (item: ChatItem) => {
    setMessages(current => [...current, item]);
    setAttachmentsOpen(false);
  };

  const sendText = () => {
    const text = message.trim();
    if (!text) return;
    appendMessage({ id: createId(), type: 'text', sender: currentUserName, isMe: true, sentAt: new Date().toISOString(), text });
    setMessage('');
  };

  const sendImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice('이미지 파일만 보낼 수 있어요.');
      return;
    }
    setIsImageLoading(true);
    setNotice('');
    try {
      const imageUrl = await resizeChatImage(file);
      appendMessage({
        id: createId(),
        type: 'image',
        sender: currentUserName,
        isMe: true,
        sentAt: new Date().toISOString(),
        imageUrl,
        fileName: file.name,
        caption: message.trim() || undefined,
      });
      setMessage('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '사진을 보내지 못했습니다.');
    } finally {
      setIsImageLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sendSchedule = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!scheduleDraft.title.trim() || !scheduleDraft.date || !scheduleDraft.time || !scheduleDraft.location.trim()) return;
    appendMessage({
      id: createId(),
      type: 'schedule',
      sender: currentUserName,
      isMe: true,
      sentAt: new Date().toISOString(),
      title: scheduleDraft.title.trim(),
      date: scheduleDraft.date,
      time: scheduleDraft.time,
      location: scheduleDraft.location.trim(),
      attending: true,
      attendeeCount: 1,
    });
    setScheduleDraft({ title: '', date: scheduleDraft.date, time: scheduleDraft.time, location: '' });
    setComposerMode(null);
    setNotice('일정을 채팅방에 공유했습니다.');
  };

  const sendSettlement = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const totalAmount = Number(settlementDraft.totalAmount);
    const participants = Number(settlementDraft.participants);
    if (!settlementDraft.title.trim() || !Number.isFinite(totalAmount) || totalAmount <= 0 || !Number.isInteger(participants) || participants < 1) return;
    appendMessage({
      id: createId(),
      type: 'settlement',
      sender: currentUserName,
      isMe: true,
      sentAt: new Date().toISOString(),
      title: settlementDraft.title.trim(),
      totalAmount,
      participants,
      paid: true,
      paidCount: 1,
    });
    setSettlementDraft({ title: '', totalAmount: '', participants: settlementDraft.participants });
    setComposerMode(null);
    setNotice('정산 요청을 채팅방에 공유했습니다.');
  };

  const toggleScheduleAttendance = (messageId: string) => {
    setMessages(current => current.map(item => item.id === messageId && item.type === 'schedule'
      ? { ...item, attending: !item.attending, attendeeCount: Math.max(0, item.attendeeCount + (item.attending ? -1 : 1)) }
      : item));
  };

  const toggleSettlementPaid = (messageId: string) => {
    setMessages(current => current.map(item => item.id === messageId && item.type === 'settlement'
      ? { ...item, paid: !item.paid, paidCount: Math.max(0, item.paidCount + (item.paid ? -1 : 1)) }
      : item));
  };

  return <div className="flex h-screen flex-col overflow-hidden bg-[#EEF1F5]">
    <header className="z-50 shrink-0 border-b border-white/10 bg-[#101828] text-white">
      <div className="mx-auto flex h-[72px] max-w-5xl items-center justify-between px-3 sm:px-5">
        <button onClick={onBack} aria-label="모임으로 돌아가기" className="rounded-full p-2.5 hover:bg-white/10"><ArrowLeft className="h-5 w-5"/></button>
        <div className="min-w-0 text-center"><h1 className="truncate font-semibold">{meetupName}</h1><p className="mt-0.5 text-[11px] text-slate-400">{memberCount}명 · 그룹 채팅</p></div>
        <button aria-label="채팅방 메뉴" className="rounded-full p-2.5 hover:bg-white/10"><MoreHorizontal className="h-5 w-5"/></button>
      </div>
    </header>

    <main className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-5">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center"><span className="rounded-full bg-slate-200/80 px-3 py-1.5 text-[11px] text-slate-600">오늘</span></div>
        <div className="space-y-5">{messages.map(item => <ChatItemView key={item.id} item={item} onToggleAttendance={() => toggleScheduleAttendance(item.id)} onTogglePaid={() => toggleSettlementPaid(item.id)}/>)}</div>
        <div ref={scrollAnchorRef}/>
      </div>
    </main>

    <footer className="z-40 shrink-0 border-t border-border bg-white/95 backdrop-blur-xl">
      <div className="mx-auto max-w-3xl px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-5">
        {notice && <div className="mb-3 flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="알림 닫기"><X className="h-3.5 w-3.5"/></button></div>}
        {attachmentsOpen && <div className="mb-3 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-black/[0.05]">
          <AttachmentButton label={isImageLoading ? '처리 중' : '사진'} icon={<ImageIcon/>} color="bg-blue-100 text-blue-700" onClick={() => fileInputRef.current?.click()} disabled={isImageLoading}/>
          <AttachmentButton label="일정" icon={<CalendarDays/>} color="bg-violet-100 text-violet-700" onClick={() => setComposerMode('schedule')}/>
          <AttachmentButton label="정산" icon={<ReceiptText/>} color="bg-emerald-100 text-emerald-700" onClick={() => setComposerMode('settlement')}/>
        </div>}
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={event => void sendImage(event.target.files?.[0])}/>
        <div className="flex items-end gap-2">
          <button onClick={() => setAttachmentsOpen(current => !current)} aria-label="첨부 메뉴" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${attachmentsOpen ? 'bg-primary text-white' : 'bg-secondary text-foreground'}`}><Plus className={`h-5 w-5 transition-transform ${attachmentsOpen ? 'rotate-45' : ''}`}/></button>
          <textarea value={message} onChange={event => setMessage(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendText(); } }} rows={1} placeholder="메시지를 입력하세요" className="max-h-28 min-h-11 flex-1 resize-none rounded-[20px] bg-secondary px-4 py-3 text-sm outline-none ring-primary/20 focus:ring-2"/>
          <button onClick={sendText} disabled={!message.trim()} aria-label="메시지 보내기" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:bg-secondary disabled:text-muted-foreground"><Send className="h-4.5 w-4.5"/></button>
        </div>
      </div>
    </footer>

    {composerMode === 'schedule' && <ComposerModal eyebrow="Schedule" title="일정 공유" description="채팅방 멤버가 바로 참석 여부를 선택할 수 있어요." onClose={() => setComposerMode(null)}><form onSubmit={sendSchedule} className="space-y-4"><ChatField label="일정명"><input required value={scheduleDraft.title} onChange={event => setScheduleDraft(current => ({ ...current, title: event.target.value }))} className="form-input" placeholder="예: 주간 정기 모임"/></ChatField><div className="grid grid-cols-2 gap-3"><ChatField label="날짜"><input required type="date" value={scheduleDraft.date} onChange={event => setScheduleDraft(current => ({ ...current, date: event.target.value }))} className="form-input"/></ChatField><ChatField label="시간"><input required type="time" value={scheduleDraft.time} onChange={event => setScheduleDraft(current => ({ ...current, time: event.target.value }))} className="form-input"/></ChatField></div><ChatField label="장소"><div className="relative"><MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input required value={scheduleDraft.location} onChange={event => setScheduleDraft(current => ({ ...current, location: event.target.value }))} className="form-input pl-11" placeholder="만날 장소를 입력하세요"/></div></ChatField><button type="submit" className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white">채팅방에 일정 보내기</button></form></ComposerModal>}

    {composerMode === 'settlement' && <ComposerModal eyebrow="Settlement" title="정산 요청" description="총액을 인원수로 나눠 1인당 금액을 계산합니다." onClose={() => setComposerMode(null)}><form onSubmit={sendSettlement} className="space-y-4"><ChatField label="정산명"><input required value={settlementDraft.title} onChange={event => setSettlementDraft(current => ({ ...current, title: event.target.value }))} className="form-input" placeholder="예: 모임 뒤풀이"/></ChatField><div className="grid grid-cols-2 gap-3"><ChatField label="총 금액"><div className="relative"><input required type="number" min="1" value={settlementDraft.totalAmount} onChange={event => setSettlementDraft(current => ({ ...current, totalAmount: event.target.value }))} className="form-input pr-9" placeholder="0"/><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">원</span></div></ChatField><ChatField label="정산 인원"><div className="relative"><input required type="number" min="1" max={memberCount} value={settlementDraft.participants} onChange={event => setSettlementDraft(current => ({ ...current, participants: event.target.value }))} className="form-input pr-9"/><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">명</span></div></ChatField></div>{Number(settlementDraft.totalAmount) > 0 && Number(settlementDraft.participants) > 0 && <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs text-emerald-700">1인당 예상 금액</p><strong className="mt-1 block text-xl text-emerald-950">{Math.ceil(Number(settlementDraft.totalAmount) / Number(settlementDraft.participants)).toLocaleString('ko-KR')}원</strong></div>}<button type="submit" className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white">채팅방에 정산 보내기</button></form></ComposerModal>}
  </div>;
}

function ChatItemView({ item, onToggleAttendance, onTogglePaid }: { item: ChatItem; onToggleAttendance: () => void; onTogglePaid: () => void }) {
  const cardAlignment = item.isMe ? 'items-end' : 'items-start';
  return <article className={`flex gap-2.5 ${item.isMe ? 'flex-row-reverse' : ''}`}>
    {!item.isMe && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white">{item.sender.slice(-2)}</span>}
    <div className={`flex max-w-[82%] flex-col sm:max-w-[70%] ${cardAlignment}`}>
      {!item.isMe && <span className="mb-1.5 px-1 text-xs text-slate-500">{item.sender}</span>}
      {item.type === 'text' && <div className={`rounded-[20px] px-4 py-2.5 text-sm leading-6 shadow-sm ${item.isMe ? 'rounded-tr-md bg-primary text-white' : 'rounded-tl-md bg-white text-foreground ring-1 ring-black/[0.05]'}`}>{item.text}</div>}
      {item.type === 'image' && <div className={`overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-black/[0.06] ${item.isMe ? 'rounded-tr-md' : 'rounded-tl-md'}`}><img src={item.imageUrl} alt={item.fileName} className="max-h-[420px] w-full object-cover"/>{item.caption && <p className="px-4 py-3 text-sm leading-6">{item.caption}</p>}</div>}
      {item.type === 'schedule' && <div className={`w-[290px] overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-black/[0.06] ${item.isMe ? 'rounded-tr-md' : 'rounded-tl-md'}`}><div className="bg-violet-600 p-4 text-white"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-medium text-violet-100"><CalendarDays className="h-4 w-4"/>일정 공유</span><ChevronRight className="h-4 w-4 text-violet-200"/></div><h3 className="mt-4 font-semibold">{item.title}</h3></div><div className="space-y-3 p-4 text-sm"><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-violet-600"/>{formatScheduleDate(item.date)}</p><p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-violet-600"/>{item.time}</p><p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-600"/><span>{item.location}</span></p><div className="flex items-center justify-between border-t border-border pt-3"><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5"/>{item.attendeeCount}명 참석</span><button onClick={onToggleAttendance} className={`rounded-full px-3 py-2 text-xs font-semibold ${item.attending ? 'bg-violet-100 text-violet-700' : 'bg-violet-600 text-white'}`}>{item.attending ? '참석 예정' : '참석할게요'}</button></div></div></div>}
      {item.type === 'settlement' && <div className={`w-[290px] overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-black/[0.06] ${item.isMe ? 'rounded-tr-md' : 'rounded-tl-md'}`}><div className="bg-emerald-600 p-4 text-white"><span className="flex items-center gap-2 text-xs font-medium text-emerald-100"><ReceiptText className="h-4 w-4"/>정산 요청</span><h3 className="mt-4 font-semibold">{item.title}</h3><strong className="mt-2 block text-2xl">{Math.ceil(item.totalAmount / item.participants).toLocaleString('ko-KR')}원</strong><p className="mt-1 text-xs text-emerald-100">총 {item.totalAmount.toLocaleString('ko-KR')}원 · {item.participants}명</p></div><div className="p-4"><div className="mb-3 flex items-center justify-between text-xs text-muted-foreground"><span>{item.paidCount}/{item.participants}명 완료</span><span>{Math.round((item.paidCount / item.participants) * 100)}%</span></div><div className="mb-4 h-1.5 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (item.paidCount / item.participants) * 100)}%` }}/></div><button onClick={onTogglePaid} className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold ${item.paid ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-600 text-white'}`}>{item.paid ? <><Check className="h-4 w-4"/>송금 완료</> : <><Wallet className="h-4 w-4"/>송금 완료 처리</>}</button></div></div>}
      <span className="mt-1 px-1 text-[10px] text-slate-500">{formatChatTime(item.sentAt)}</span>
    </div>
  </article>;
}

function AttachmentButton({ label, icon, color, onClick, disabled = false }: { label: string; icon: React.ReactNode; color: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="flex flex-col items-center gap-2 rounded-xl py-2.5 text-xs font-medium transition hover:bg-white disabled:opacity-50"><span className={`flex h-10 w-10 items-center justify-center rounded-full [&>svg]:h-5 [&>svg]:w-5 ${color}`}>{icon}</span>{label}</button>;
}

function ComposerModal({ eyebrow, title, description, onClose, children }: { eyebrow: string; title: string; description: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={title}><section className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px] sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p><h2 className="mt-2 text-2xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div><button type="button" onClick={onClose} className="shrink-0 rounded-full bg-secondary p-2" aria-label={`${title} 닫기`}><X className="h-4 w-4"/></button></div><div className="mt-7">{children}</div></section></div>;
}

function ChatField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>;
}
