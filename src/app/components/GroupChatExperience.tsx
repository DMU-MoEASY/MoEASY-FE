import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Image as ImageIcon,
  MapPin,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Search,
  Send,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { UserAvatar } from './UserAvatar';
import {
  linkScheduleFromChat,
  linkSettlementFromChat,
  linkTransferFromChat,
  meetupChatKey,
  syncFinanceCompletion,
  syncScheduleAttendance,
} from '../services/meetupOperations';

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

type TransferMessage = {
  id: string;
  type: 'transfer';
  sender: string;
  isMe: boolean;
  sentAt: string;
  recipient: string;
  amount: number;
  memo: string;
  completed: boolean;
};

type ChatItem = TextMessage | ImageMessage | ScheduleMessage | SettlementMessage | TransferMessage;
type ComposerMode = 'schedule' | 'settlement' | 'transfer' | null;

const CHAT_COMMANDS = [
  { command: '/사진', label: '사진 보내기', description: '앨범이나 카메라에서 사진 선택', action: 'image' },
  { command: '/일정', label: '일정 공유', description: '날짜·시간·장소가 있는 일정 만들기', action: 'schedule' },
  { command: '/정산', label: '공동 정산', description: '총액을 여러 명에게 나눠 정산하기', action: 'settlement' },
  { command: '/송금', label: '개별 송금 요청', description: '특정 멤버에게 금액을 요청하기', action: 'transfer' },
  { command: '/도움말', label: '명령어 도움말', description: '사용 가능한 명령어 확인', action: 'help' },
] as const;

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
  const [messages, setMessages] = usePersistentState<ChatItem[]>(meetupChatKey(meetupId), createInitialMessages(meetupName));
  const [message, setMessage] = useState('');
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>(null);
  const [notice, setNotice] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState({ title: '', date: '2026-09-30', time: '19:30', location: '' });
  const [settlementDraft, setSettlementDraft] = useState({ title: '', totalAmount: '', participants: String(Math.min(memberCount, 10)) });
  const [transferDraft, setTransferDraft] = useState({ recipient: '', amount: '', memo: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const commandQuery = message.startsWith('/') ? message.trim().toLowerCase() : '';
  const filteredCommands = commandQuery
    ? CHAT_COMMANDS.filter(item => item.command.startsWith(commandQuery))
    : [];

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, composerMode]);

  const appendMessage = (item: ChatItem) => {
    setMessages(current => [...current, item]);
    setAttachmentsOpen(false);
  };

  const executeCommand = (command: string) => {
    const matchedCommand = CHAT_COMMANDS.find(item => item.command === command.trim().toLowerCase());
    if (!matchedCommand) return false;
    setMessage('');
    setAttachmentsOpen(false);
    if (matchedCommand.action === 'image') fileInputRef.current?.click();
    if (matchedCommand.action === 'schedule') setComposerMode('schedule');
    if (matchedCommand.action === 'settlement') setComposerMode('settlement');
    if (matchedCommand.action === 'transfer') setComposerMode('transfer');
    if (matchedCommand.action === 'help') setNotice('사용 가능한 명령어: /사진 · /일정 · /정산 · /송금 · /도움말');
    return true;
  };

  const sendText = () => {
    const text = message.trim();
    if (!text) return;
    if (executeCommand(text)) return;
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
    const id = createId();
    const item: ScheduleMessage = {
      id,
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
    };
    appendMessage(item);
    linkScheduleFromChat({ meetupId, meetupName, chatMessageId: id, title: item.title, dateValue: item.date, time: item.time, place: item.location, attending: item.attending });
    setScheduleDraft({ title: '', date: scheduleDraft.date, time: scheduleDraft.time, location: '' });
    setComposerMode(null);
    setNotice('일정을 채팅방에 공유했습니다.');
  };

  const sendSettlement = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const totalAmount = Number(settlementDraft.totalAmount);
    const participants = Number(settlementDraft.participants);
    if (!settlementDraft.title.trim() || !Number.isFinite(totalAmount) || totalAmount <= 0 || !Number.isInteger(participants) || participants < 1) return;
    const id = createId();
    const item: SettlementMessage = {
      id,
      type: 'settlement',
      sender: currentUserName,
      isMe: true,
      sentAt: new Date().toISOString(),
      title: settlementDraft.title.trim(),
      totalAmount,
      participants,
      paid: true,
      paidCount: 1,
    };
    appendMessage(item);
    linkSettlementFromChat(meetupId, {
      id: `settlement-${id}`,
      chatMessageId: id,
      title: item.title,
      totalAmount,
      participants,
      shareAmount: Math.ceil(totalAmount / participants),
      paidCount: 1,
      completed: participants === 1,
      createdAt: item.sentAt,
      source: 'chat',
    });
    setSettlementDraft({ title: '', totalAmount: '', participants: settlementDraft.participants });
    setComposerMode(null);
    setNotice('정산 요청을 채팅방에 공유했습니다.');
  };

  const sendTransfer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(transferDraft.amount);
    if (!transferDraft.recipient.trim() || !Number.isFinite(amount) || amount <= 0 || !transferDraft.memo.trim()) return;
    const id = createId();
    const item: TransferMessage = {
      id,
      type: 'transfer',
      sender: currentUserName,
      isMe: true,
      sentAt: new Date().toISOString(),
      recipient: transferDraft.recipient.trim(),
      amount,
      memo: transferDraft.memo.trim(),
      completed: false,
    };
    appendMessage(item);
    linkTransferFromChat(meetupId, {
      id: `transfer-${id}`,
      chatMessageId: id,
      recipient: item.recipient,
      amount,
      memo: item.memo,
      completed: false,
      createdAt: item.sentAt,
      source: 'chat',
    });
    setTransferDraft({ recipient: '', amount: '', memo: '' });
    setComposerMode(null);
    setNotice(`${item.recipient}님에게 송금 요청을 보냈습니다.`);
  };

  const toggleScheduleAttendance = (messageId: string) => {
    const schedule = messages.find(item => item.id === messageId && item.type === 'schedule') as ScheduleMessage | undefined;
    if (!schedule) return;
    const attending = !schedule.attending;
    setMessages(current => current.map(item => item.id === messageId && item.type === 'schedule'
      ? { ...item, attending, attendeeCount: Math.max(0, item.attendeeCount + (item.attending ? -1 : 1)) }
      : item));
    syncScheduleAttendance(meetupId, messageId, attending);
  };

  const toggleSettlementPaid = (messageId: string) => {
    const settlement = messages.find(item => item.id === messageId && item.type === 'settlement') as SettlementMessage | undefined;
    if (!settlement) return;
    const paid = !settlement.paid;
    const paidCount = Math.max(0, settlement.paidCount + (settlement.paid ? -1 : 1));
    setMessages(current => current.map(item => item.id === messageId && item.type === 'settlement'
      ? { ...item, paid, paidCount }
      : item));
    syncFinanceCompletion(meetupId, messageId, paidCount >= settlement.participants, paidCount);
  };

  const toggleTransferCompleted = (messageId: string) => {
    const transfer = messages.find(item => item.id === messageId && item.type === 'transfer') as TransferMessage | undefined;
    if (!transfer) return;
    const completed = !transfer.completed;
    setMessages(current => current.map(item => item.id === messageId && item.type === 'transfer' ? { ...item, completed } : item));
    syncFinanceCompletion(meetupId, messageId, completed);
  };

  return <div className="flex h-screen flex-col overflow-hidden bg-[#F6F7F9]">
    <header className="z-50 shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-3xl items-center gap-2 px-3 sm:px-5">
        <button onClick={onBack} aria-label="모임으로 돌아가기" className="rounded-full p-2.5 text-slate-700 hover:bg-slate-100"><ArrowLeft className="h-5 w-5"/></button>
        <UserAvatar name={meetupName} className="h-10 w-10" textClassName="text-[11px]"/>
        <div className="min-w-0 flex-1"><h1 className="truncate text-sm font-semibold text-slate-950">{meetupName}</h1><p className="mt-0.5 text-[11px] text-slate-500">멤버 {memberCount}명</p></div>
        <button aria-label="채팅 검색" className="rounded-full p-2.5 text-slate-600 hover:bg-slate-100"><Search className="h-5 w-5"/></button>
        <button aria-label="채팅방 메뉴" className="rounded-full p-2.5 text-slate-600 hover:bg-slate-100"><MoreHorizontal className="h-5 w-5"/></button>
      </div>
    </header>

    <main className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-5">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center"><span className="rounded-full bg-slate-200/70 px-3 py-1 text-[11px] font-medium text-slate-500">오늘</span></div>
        <div className="space-y-4">{messages.map(item => <ChatItemView key={item.id} item={item} onToggleAttendance={() => toggleScheduleAttendance(item.id)} onTogglePaid={() => toggleSettlementPaid(item.id)} onToggleTransfer={() => toggleTransferCompleted(item.id)}/>)}</div>
        <div ref={scrollAnchorRef}/>
      </div>
    </main>

    <footer className="z-40 shrink-0 border-t border-border bg-white/95 backdrop-blur-xl">
      <div className="mx-auto max-w-3xl px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-5">
        {notice && <div className="mb-3 flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="알림 닫기"><X className="h-3.5 w-3.5"/></button></div>}
        {filteredCommands.length > 0 && <div className="mb-3 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/[0.08]" role="listbox" aria-label="채팅 명령어">
          <div className="border-b border-border px-4 py-2.5"><p className="text-[11px] font-semibold text-muted-foreground">사용할 기능을 선택하세요</p></div>
          {filteredCommands.map((item, index) => <button key={item.command} type="button" role="option" aria-selected={index === 0} onClick={() => executeCommand(item.command)} className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/70 ${index < filteredCommands.length - 1 ? 'border-b border-border' : ''}`}><CommandIcon action={item.action}/><span className="min-w-0 flex-1"><strong className="block text-sm">{item.command} <span className="ml-1 font-medium text-muted-foreground">{item.label}</span></strong><span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.description}</span></span><span className="rounded-md bg-secondary px-2 py-1 text-[10px] text-muted-foreground">실행</span></button>)}
        </div>}
        {attachmentsOpen && <div className="mb-3 grid grid-cols-4 gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <AttachmentButton label={isImageLoading ? '처리 중' : '사진'} icon={<ImageIcon/>} onClick={() => fileInputRef.current?.click()} disabled={isImageLoading}/>
          <AttachmentButton label="일정" icon={<CalendarDays/>} onClick={() => setComposerMode('schedule')}/>
          <AttachmentButton label="정산" icon={<ReceiptText/>} onClick={() => setComposerMode('settlement')}/>
          <AttachmentButton label="송금" icon={<Wallet/>} onClick={() => setComposerMode('transfer')}/>
        </div>}
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={event => void sendImage(event.target.files?.[0])}/>
        <div className="flex items-end gap-2">
          <button onClick={() => setAttachmentsOpen(current => !current)} aria-label="첨부 메뉴" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${attachmentsOpen ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}><Plus className={`h-5 w-5 transition-transform ${attachmentsOpen ? 'rotate-45' : ''}`}/></button>
          <textarea value={message} onChange={event => setMessage(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendText(); } }} rows={1} placeholder="메시지 입력 · / 로 기능 열기" className="max-h-28 min-h-11 flex-1 resize-none rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-primary/10"/>
          <button onClick={sendText} disabled={!message.trim()} aria-label="메시지 보내기" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#315EFB] text-white transition hover:bg-[#244ED8] disabled:bg-slate-100 disabled:text-slate-400"><Send className="h-4.5 w-4.5"/></button>
        </div>
      </div>
    </footer>

    {composerMode === 'schedule' && <ComposerModal eyebrow="Schedule" title="일정 공유" description="채팅방 멤버가 바로 참석 여부를 선택할 수 있어요." onClose={() => setComposerMode(null)}><form onSubmit={sendSchedule} className="space-y-4"><ChatField label="일정명"><input required value={scheduleDraft.title} onChange={event => setScheduleDraft(current => ({ ...current, title: event.target.value }))} className="form-input" placeholder="예: 주간 정기 모임"/></ChatField><div className="grid grid-cols-2 gap-3"><ChatField label="날짜"><input required type="date" value={scheduleDraft.date} onChange={event => setScheduleDraft(current => ({ ...current, date: event.target.value }))} className="form-input"/></ChatField><ChatField label="시간"><input required type="time" value={scheduleDraft.time} onChange={event => setScheduleDraft(current => ({ ...current, time: event.target.value }))} className="form-input"/></ChatField></div><ChatField label="장소"><div className="relative"><MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input required value={scheduleDraft.location} onChange={event => setScheduleDraft(current => ({ ...current, location: event.target.value }))} className="form-input pl-11" placeholder="만날 장소를 입력하세요"/></div></ChatField><button type="submit" className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white">채팅방에 일정 보내기</button></form></ComposerModal>}

    {composerMode === 'settlement' && <ComposerModal eyebrow="Settlement" title="정산 요청" description="총액을 인원수로 나눠 1인당 금액을 계산합니다." onClose={() => setComposerMode(null)}><form onSubmit={sendSettlement} className="space-y-4"><ChatField label="정산명"><input required value={settlementDraft.title} onChange={event => setSettlementDraft(current => ({ ...current, title: event.target.value }))} className="form-input" placeholder="예: 모임 뒤풀이"/></ChatField><div className="grid grid-cols-2 gap-3"><ChatField label="총 금액"><div className="relative"><input required type="number" min="1" value={settlementDraft.totalAmount} onChange={event => setSettlementDraft(current => ({ ...current, totalAmount: event.target.value }))} className="form-input pr-9" placeholder="0"/><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">원</span></div></ChatField><ChatField label="정산 인원"><div className="relative"><input required type="number" min="1" max={memberCount} value={settlementDraft.participants} onChange={event => setSettlementDraft(current => ({ ...current, participants: event.target.value }))} className="form-input pr-9"/><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">명</span></div></ChatField></div>{Number(settlementDraft.totalAmount) > 0 && Number(settlementDraft.participants) > 0 && <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs text-emerald-700">1인당 예상 금액</p><strong className="mt-1 block text-xl text-emerald-950">{Math.ceil(Number(settlementDraft.totalAmount) / Number(settlementDraft.participants)).toLocaleString('ko-KR')}원</strong></div>}<button type="submit" className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white">채팅방에 정산 보내기</button></form></ComposerModal>}

    {composerMode === 'transfer' && <ComposerModal eyebrow="Transfer" title="개별 송금 요청" description="특정 멤버 한 명에게 보낼 금액 요청을 만듭니다." onClose={() => setComposerMode(null)}><form onSubmit={sendTransfer} className="space-y-4"><ChatField label="요청 대상"><input required value={transferDraft.recipient} onChange={event => setTransferDraft(current => ({ ...current, recipient: event.target.value }))} className="form-input" placeholder="예: 김철수"/></ChatField><ChatField label="요청 금액"><div className="relative"><input required type="number" min="1" value={transferDraft.amount} onChange={event => setTransferDraft(current => ({ ...current, amount: event.target.value }))} className="form-input pr-9" placeholder="0"/><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">원</span></div></ChatField><ChatField label="요청 사유"><input required value={transferDraft.memo} onChange={event => setTransferDraft(current => ({ ...current, memo: event.target.value }))} className="form-input" placeholder="예: 장비 공동 구매 비용"/></ChatField><div className="rounded-2xl bg-sky-50 p-4 text-xs leading-5 text-sky-800">공동 비용을 나누는 경우에는 <strong>/정산</strong>을 사용하세요. 이 기능은 한 사람에게 특정 금액을 요청할 때 사용합니다.</div><button type="submit" className="w-full rounded-xl bg-sky-600 py-3.5 text-sm font-semibold text-white">개별 송금 요청 보내기</button></form></ComposerModal>}
  </div>;
}

function ChatItemView({ item, onToggleAttendance, onTogglePaid, onToggleTransfer }: { item: ChatItem; onToggleAttendance: () => void; onTogglePaid: () => void; onToggleTransfer: () => void }) {
  const cardAlignment = item.isMe ? 'items-end' : 'items-start';
  return <article className={`flex gap-2.5 ${item.isMe ? 'flex-row-reverse' : ''}`}>
    {!item.isMe && <UserAvatar name={item.sender} className="mt-0.5 h-9 w-9" textClassName="text-[10px]"/>}
    <div className={`flex max-w-[84%] flex-col sm:max-w-[72%] ${cardAlignment}`}>
      {!item.isMe && <span className="mb-1.5 px-1 text-xs font-medium text-slate-600">{item.sender}</span>}
      {item.type === 'text' && <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${item.isMe ? 'rounded-tr-[5px] bg-[#315EFB] text-white' : 'rounded-tl-[5px] border border-slate-200 bg-white text-slate-900'}`}>{item.text}</div>}
      {item.type === 'image' && <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white ${item.isMe ? 'rounded-tr-[5px]' : 'rounded-tl-[5px]'}`}><img src={item.imageUrl} alt={item.fileName} className="max-h-[420px] w-full object-cover"/>{item.caption && <p className="px-3.5 py-3 text-sm leading-6">{item.caption}</p>}</div>}
      {item.type === 'schedule' && <TaskCard label="일정" icon={<CalendarDays/>} title={item.title} accent="text-[#315EFB]">
        <div className="space-y-2.5 text-sm text-slate-700"><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-slate-400"/>{formatScheduleDate(item.date)} · {item.time}</p><p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"/><span>{item.location}</span></p></div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="flex items-center gap-1.5 text-xs text-slate-500"><Users className="h-3.5 w-3.5"/>{item.attendeeCount}명 참석</span><button onClick={onToggleAttendance} className={`rounded-lg px-3 py-2 text-xs font-semibold ${item.attending ? 'bg-slate-100 text-slate-700' : 'bg-[#315EFB] text-white'}`}>{item.attending ? '참석 취소' : '참석하기'}</button></div>
      </TaskCard>}
      {item.type === 'settlement' && <TaskCard label="정산" icon={<ReceiptText/>} title={item.title} accent="text-emerald-700">
        <div className="flex items-end justify-between"><div><strong className="text-xl text-slate-950">{Math.ceil(item.totalAmount / item.participants).toLocaleString('ko-KR')}원</strong><p className="mt-1 text-xs text-slate-500">1인당 · 총 {item.participants}명</p></div><span className="text-xs font-medium text-slate-500">{item.paidCount}/{item.participants} 완료</span></div>
        <div className="my-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (item.paidCount / item.participants) * 100)}%` }}/></div>
        <button onClick={onTogglePaid} className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold ${item.paid ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-white'}`}>{item.paid ? <><Check className="h-4 w-4"/>완료 취소</> : <><Check className="h-4 w-4"/>송금 완료</>}</button>
      </TaskCard>}
      {item.type === 'transfer' && <TaskCard label="송금 요청" icon={<Wallet/>} title={`${item.recipient}님에게`} accent="text-sky-700">
        <strong className="text-xl text-slate-950">{item.amount.toLocaleString('ko-KR')}원</strong><p className="mt-2 text-sm leading-6 text-slate-600">{item.memo}</p>
        <button onClick={onToggleTransfer} className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold ${item.completed ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-white'}`}>{item.completed ? <><Check className="h-4 w-4"/>완료 취소</> : <><Check className="h-4 w-4"/>송금 완료</>}</button>
      </TaskCard>}
      <span className="mt-1 px-1 text-[10px] text-slate-400">{formatChatTime(item.sentAt)}</span>
    </div>
  </article>;
}

function TaskCard({ label, icon, title, accent, children }: { label: string; icon: React.ReactNode; title: string; accent: string; children: React.ReactNode }) {
  return <div className="w-[300px] max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)]"><div className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${accent}`}><span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>{label}</div><h3 className="mb-4 font-semibold text-slate-950">{title}</h3>{children}</div>;
}

function AttachmentButton({ label, icon, onClick, disabled = false }: { label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="flex flex-col items-center gap-2 rounded-xl py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>{label}</button>;
}

function CommandIcon({ action }: { action: typeof CHAT_COMMANDS[number]['action'] }) {
  const styles = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl [&>svg]:h-4 [&>svg]:w-4';
  if (action === 'image') return <span className={`${styles} bg-slate-100 text-slate-700`}><ImageIcon/></span>;
  if (action === 'schedule') return <span className={`${styles} bg-slate-100 text-slate-700`}><CalendarDays/></span>;
  if (action === 'settlement') return <span className={`${styles} bg-slate-100 text-slate-700`}><ReceiptText/></span>;
  if (action === 'transfer') return <span className={`${styles} bg-slate-100 text-slate-700`}><Wallet/></span>;
  return <span className={`${styles} bg-slate-100 font-bold text-slate-700`}>/</span>;
}

function ComposerModal({ eyebrow, title, description, onClose, children }: { eyebrow: string; title: string; description: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={title}><section className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px] sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p><h2 className="mt-2 text-2xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div><button type="button" onClick={onClose} className="shrink-0 rounded-full bg-secondary p-2" aria-label={`${title} 닫기`}><X className="h-4 w-4"/></button></div><div className="mt-7">{children}</div></section></div>;
}

function ChatField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>;
}
