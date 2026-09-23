import { useState } from 'react';
import { ArrowLeft, ArrowRight, Bell, CalendarDays, Camera, Check, CheckCheck, Clock3, CreditCard, Lock, Mail, MapPin, MessageCircle, MoreHorizontal, Paperclip, Plus, Receipt, Search, Send, Sparkles, User, UserCheck, Users, Wallet } from 'lucide-react';
import { TimeGrid } from './TimeGrid';
import { OptimalTimeCard } from './OptimalTimeCard';
import type { SocialProvider } from '../services/p0Api';

function PageFrame({ eyebrow, title, description, onBack, action, children, dark = false }: { eyebrow: string; title: string; description?: string; onBack: () => void; action?: React.ReactNode; children: React.ReactNode; dark?: boolean }) {
  return <div className="min-h-screen bg-background">
    <header className={`sticky top-0 z-50 border-b ${dark ? 'border-white/10 bg-[#101828]/90 text-white' : 'border-border bg-background/90'} backdrop-blur-xl`}>
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
        <button onClick={onBack} className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ${dark ? 'hover:bg-white/10' : 'hover:bg-card'}`}><ArrowLeft className="h-5 w-5" /><span className="hidden sm:inline">돌아가기</span></button>{action}
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
      <div className="mb-8 sm:mb-10"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{title}</h1>{description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>
      {children}
    </main>
  </div>;
}

export function SignupExperience({
  onBack,
  onSignup,
  apiMode = false,
  onSocialSignup,
}: {
  onBack: () => void;
  onSignup: () => void;
  apiMode?: boolean;
  onSocialSignup?: (provider: SocialProvider) => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [signupError, setSignupError] = useState('');

  const continueWithEmail = () => {
    if (apiMode) {
      setSignupError('현재 백엔드는 이메일 회원가입을 제공하지 않습니다. 카카오 또는 Google을 이용해주세요.');
      return;
    }
    setStep(2);
  };

  const startSocialSignup = async (provider: SocialProvider) => {
    setSignupError('');
    if (!apiMode || !onSocialSignup) {
      onSignup();
      return;
    }

    try {
      setSocialLoading(provider);
      await onSocialSignup(provider);
    } catch (error) {
      setSocialLoading(null);
      setSignupError(error instanceof Error ? error.message : '소셜 회원가입을 시작하지 못했습니다.');
    }
  };

  return <main className="min-h-screen bg-[#F4F6FA] p-3 sm:p-5 lg:p-7"><div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1320px] overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-[.75fr_1.25fr]">
    <aside className="relative hidden overflow-hidden bg-[#101828] p-10 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,#315EFB_0,transparent_35%),radial-gradient(circle_at_80%_90%,#C9FF5C_0,transparent_30%)]"/><img src="/brand/moeasy-logo.png" alt="MoEasy" className="relative h-12 w-auto self-start object-contain"/><div className="relative"><p className="text-xs font-semibold tracking-[0.18em] text-[#8FAAFF]">START A NEW CIRCLE</p><h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em]">새로운 사람과<br/>새로운 일상을 시작해요.</h1><div className="mt-10 space-y-5">{['관심사에 맞는 모임 발견','일정과 장소를 한 번에 관리','함께한 순간과 비용까지 기록'].map((item,index)=><div key={item} className="flex items-center gap-3 text-sm text-slate-300"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px]">0{index+1}</span>{item}</div>)}</div></div></aside>
    <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-20"><div className="w-full max-w-xl"><button onClick={onBack} className="mb-10 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/>로그인으로</button><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-primary">STEP {step} OF 2</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{step===1?'기본 정보를 알려주세요':'관심사를 선택해주세요'}</h2></div><span className="text-sm text-muted-foreground">{step}/2</span></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{width:`${step*50}%`}}/></div>
      {step===1?<div className="mt-9 space-y-4"><SignupField icon={<User/>} placeholder="이름"/><SignupField icon={<Mail/>} placeholder="이메일 주소" type="email"/><SignupField icon={<Lock/>} placeholder="비밀번호 · 6자 이상" type="password"/><button onClick={continueWithEmail} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#101828] py-4 text-sm font-semibold text-white">다음으로 <ArrowRight className="h-4 w-4"/></button>{signupError&&<p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">{signupError}</p>}<div className="flex items-center gap-3"><span className="h-px flex-1 bg-border"/><span className="text-xs text-muted-foreground">간편 가입</span><span className="h-px flex-1 bg-border"/></div><div className="grid grid-cols-2 gap-3"><button disabled={socialLoading!==null} onClick={()=>void startSocialSignup('KAKAO')} className="rounded-xl bg-[#FEE500] py-3.5 text-sm font-semibold disabled:cursor-wait disabled:opacity-60">{socialLoading==='KAKAO'?'연결 중…':'카카오'}</button><button disabled={socialLoading!==null} onClick={()=>void startSocialSignup('GOOGLE')} className="rounded-xl py-3.5 text-sm font-semibold ring-1 ring-black/10 disabled:cursor-wait disabled:opacity-60">{socialLoading==='GOOGLE'?'연결 중…':'Google'}</button></div></div>:<div className="mt-9"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{['러닝','등산','스터디','독서','사진','맛집','보드게임','여행','봉사'].map((item,index)=><button key={item} className={`rounded-2xl p-4 text-left text-sm ring-1 ring-black/[0.06] ${index<3?'bg-accent font-semibold text-primary':'bg-white'}`}>{item}</button>)}</div><p className="mt-4 text-xs text-muted-foreground">관심사는 언제든 변경할 수 있어요.</p><button onClick={onSignup} className="mt-7 w-full rounded-xl bg-primary py-4 text-sm font-semibold text-white">MoEasy 시작하기</button></div>}
    </div></section>
  </div></main>;
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
  return <PageFrame eyebrow="Notifications" title="새로운 소식" description={`확인하지 않은 알림이 ${unread}개 있어요.`} onBack={onBack} action={unread > 0 ? <button onClick={() => setRead(items.map(i => i[0]))} className="flex items-center gap-2 rounded-full bg-[#101828] px-4 py-2.5 text-xs font-semibold text-white"><CheckCheck className="h-4 w-4" />모두 읽음</button> : undefined}>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="overflow-hidden rounded-[24px] bg-card ring-1 ring-black/[0.06]">{items.map(([id,title,message,time,color,icon], index) => { const isRead = read.includes(id); return <button key={id} onClick={() => setRead([...new Set([...read,id])])} className={`flex w-full gap-4 p-5 text-left transition hover:bg-secondary/60 sm:p-6 ${index < items.length-1 ? 'border-b border-border' : ''} ${isRead ? 'opacity-65' : ''}`}><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl [&>svg]:h-5 [&>svg]:w-5 ${color}`}>{icon}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{title}</h3><span className="shrink-0 text-xs text-muted-foreground">{time}</span></div><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{message}</p></div>{!isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}</button>; })}</div>
      <aside className="hidden lg:block"><div className="rounded-[24px] bg-[#101828] p-6 text-white"><Bell className="h-5 w-5 text-[#8FAAFF]" /><strong className="mt-7 block text-4xl">{unread}</strong><p className="mt-2 text-sm text-slate-400">읽지 않은 알림</p><div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary" style={{width:`${(read.length/items.length)*100}%`}} /></div></div></aside>
    </div>
  </PageFrame>;
}

export function MessagesExperience({ onBack, onChat }: { onBack: () => void; onChat: () => void }) {
  const rooms = [
    ['RUN','강남 러닝 크루','오늘 모임 장소가 변경되었습니다','10분 전','3','from-blue-400 to-blue-600'],
    ['DEV','판교 개발자 스터디','다음 주 스터디 자료 공유드립니다','1시간 전','','from-violet-400 to-violet-600'],
    ['MT','북한산 등산 클럽','다들 무사히 하산하셨나요?','3시간 전','1','from-emerald-400 to-emerald-600'],
    ['BOOK','홍대 독서 모임','이번 달 책 추천 받습니다','5시간 전','','from-amber-400 to-orange-500'],
  ];
  return <PageFrame eyebrow="Messages" title="모임 대화" description="참여 중인 모임의 이야기를 이어가세요." onBack={onBack} action={<button className="rounded-full bg-primary p-2.5 text-white"><Plus className="h-5 w-5" /></button>}>
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="overflow-hidden rounded-[24px] bg-card ring-1 ring-black/[0.06]"><div className="p-4"><label className="flex items-center gap-3 rounded-xl bg-secondary px-4"><Search className="h-4 w-4 text-muted-foreground"/><input className="w-full bg-transparent py-3 text-sm outline-none" placeholder="대화 검색"/></label></div>{rooms.map(([avatar,name,message,time,count,color]) => <button key={name} onClick={onChat} className="flex w-full items-center gap-3 border-t border-border p-4 text-left hover:bg-secondary/60"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xs font-semibold text-white ${color}`}>{avatar}</span><div className="min-w-0 flex-1"><div className="flex justify-between"><h3 className="truncate text-sm font-semibold">{name}</h3><span className="text-[11px] text-muted-foreground">{time}</span></div><p className="mt-1 truncate text-sm text-muted-foreground">{message}</p></div>{count && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">{count}</span>}</button>)}</section>
      <section className="hidden min-h-[520px] items-center justify-center rounded-[24px] bg-[#101828] text-center text-white lg:flex"><div><MessageCircle className="mx-auto h-8 w-8 text-[#8FAAFF]"/><h2 className="mt-5 text-xl font-semibold">대화를 선택하세요</h2><p className="mt-2 text-sm text-slate-400">모임에서 오간 이야기를 확인할 수 있어요.</p></div></section>
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
  return <PageFrame eyebrow="Admin · Requests" title="가입 신청 관리" description={`${name}에 함께하고 싶은 새로운 멤버들을 확인하세요.`} onBack={onBack}>
    <div className="grid gap-4 lg:grid-cols-3">{people.map(([person,intro,place,avatar],index)=><article key={person} className={`rounded-[24px] bg-card p-5 ring-1 ring-black/[0.06] ${handled.includes(index)?'opacity-50':''}`}><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 text-xs font-semibold text-white">{avatar}</span><div><h2 className="font-semibold">{person}</h2><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3"/>{place}</p></div></div><p className="mt-5 min-h-16 text-sm leading-6 text-muted-foreground">“{intro}”</p>{handled.includes(index)?<div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700"><Check className="h-4 w-4"/>처리 완료</div>:<div className="mt-5 flex gap-2"><button onClick={()=>setHandled([...handled,index])} className="flex-1 rounded-xl bg-secondary py-3 text-sm">거절</button><button onClick={()=>setHandled([...handled,index])} className="flex-1 rounded-xl bg-primary py-3 text-sm text-white">승인</button></div>}</article>)}</div>
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

export function ChatExperience({ onBack }: { onBack: () => void }) {
  const [message,setMessage]=useState('');
  return <div className="flex min-h-screen flex-col bg-[#EEF1F5]"><header className="sticky top-0 z-50 bg-[#101828] text-white"><div className="mx-auto flex h-[72px] max-w-5xl items-center justify-between px-4"><button onClick={onBack} className="rounded-full p-2 hover:bg-white/10"><ArrowLeft className="h-5 w-5"/></button><div className="text-center"><h1 className="font-semibold">강남 러닝 크루</h1><p className="text-[11px] text-slate-400">145명 · 12명 접속 중</p></div><button className="rounded-full p-2 hover:bg-white/10"><MoreHorizontal className="h-5 w-5"/></button></div></header><main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6"><div className="mb-6 self-center rounded-full bg-white px-3 py-1 text-[11px] text-muted-foreground">오늘</div><div className="space-y-5"><ChatBubble avatar="CH" name="김철수" text="오늘 저녁 러닝 장소가 달빛광장으로 변경됐어요!" time="오후 2:31"/><ChatBubble avatar="YH" name="이영희" text="확인했습니다. 7시 20분까지 갈게요 🙌" time="오후 2:34"/><div className="ml-auto max-w-[78%] rounded-[20px] rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-white shadow-sm">좋아요! 저는 물이랑 간단한 간식 챙겨갈게요.<span className="ml-2 text-[10px] text-white/60">오후 2:36</span></div></div></main><footer className="sticky bottom-0 border-t border-border bg-white/90 p-3 backdrop-blur-xl"><div className="mx-auto flex max-w-5xl items-end gap-2"><button className="rounded-full p-3 text-muted-foreground hover:bg-secondary"><Paperclip className="h-5 w-5"/></button><textarea value={message} onChange={e=>setMessage(e.target.value)} rows={1} placeholder="메시지를 입력하세요" className="max-h-28 min-h-12 flex-1 resize-none rounded-2xl bg-secondary px-4 py-3.5 text-sm outline-none"/><button className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white"><Send className="h-5 w-5"/></button></div></footer></div>;
}

export function FinanceExperience({ onBack, onReceipt }: { onBack: () => void; onReceipt: () => void }) {
  const [tab,setTab]=useState('거래 내역');
  const rows=[['회비 납부','김철수 외 7명','+120,000원','text-emerald-600'],['모임 회식','해운대 횟집','-120,000원','text-foreground'],['장비 구매','러닝 조끼 10개','-85,000원','text-foreground']];
  return <PageFrame eyebrow="Club finance" title="회비 관리" description="강남 러닝 크루의 공동 자금을 투명하게 관리하세요." onBack={onBack} action={<button onClick={onReceipt} className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-white"><Receipt className="h-4 w-4"/>영수증 등록</button>}>
    <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-[24px] bg-[#101828] p-6 text-white sm:col-span-2"><p className="text-xs text-slate-400">사용 가능 잔액</p><strong className="mt-3 block text-4xl tracking-tight">275,000원</strong><div className="mt-8 flex gap-6 text-xs"><span className="text-slate-400">이번 달 수입 <b className="ml-2 text-white">360,000원</b></span><span className="text-slate-400">지출 <b className="ml-2 text-white">85,000원</b></span></div></div><div className="rounded-[24px] bg-[#C9FF5C] p-6 text-[#193300]"><CreditCard className="h-5 w-5"/><strong className="mt-8 block text-2xl">8 / 10</strong><p className="mt-1 text-sm text-[#315B00]">9월 회비 납부 완료</p></div></section>
    <div className="mt-8 flex gap-2">{['거래 내역','회비 청구'].map(item=><button key={item} onClick={()=>setTab(item)} className={`rounded-full px-4 py-2 text-sm ${tab===item?'bg-[#101828] text-white':'bg-card text-muted-foreground ring-1 ring-black/[0.06]'}`}>{item}</button>)}</div>
    <section className="mt-4 overflow-hidden rounded-[24px] bg-card ring-1 ring-black/[0.06]">{rows.map(([title,meta,amount,color],index)=><div key={title} className={`flex items-center gap-4 p-5 ${index<rows.length-1?'border-b border-border':''}`}><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary"><Wallet className="h-5 w-5 text-muted-foreground"/></span><div className="flex-1"><h3 className="font-medium">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{meta} · 9월 {18-index*3}일</p></div><strong className={`text-sm ${color}`}>{amount}</strong></div>)}</section>
  </PageFrame>;
}

export function MembersExperience({ onBack }: { onBack: () => void }) {
  const members=[['김모이지','모임장','ME'],['김철수','운영진','CH'],['이영희','멤버','YH'],['박민수','멤버','MS'],['최수진','멤버','SJ']];
  return <PageFrame eyebrow="Admin · Members" title="멤버 관리" description="역할과 가입 상태를 관리하고 모임 구성원을 확인하세요." onBack={onBack} action={<button className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-white"><Plus className="h-4 w-4"/>멤버 초대</button>}>
    <div className="mb-5 flex items-center gap-3 rounded-[20px] bg-card p-3 ring-1 ring-black/[0.06]"><Search className="ml-2 h-4 w-4 text-muted-foreground"/><input className="flex-1 bg-transparent py-2 text-sm outline-none" placeholder="이름으로 검색"/><span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">145명</span></div><div className="grid gap-3 sm:grid-cols-2">{members.map(([name,role,avatar])=><article key={name} className="flex items-center gap-3 rounded-[20px] bg-card p-4 ring-1 ring-black/[0.06]"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 text-xs font-semibold text-white">{avatar}</span><div className="flex-1"><h3 className="font-semibold">{name}</h3><p className="mt-1 text-xs text-muted-foreground">{role} · 최근 활동 오늘</p></div><button className="rounded-full p-2 hover:bg-secondary"><MoreHorizontal className="h-4 w-4"/></button></article>)}</div>
  </PageFrame>;
}

export function ReceiptExperience({ onBack }: { onBack: () => void }) {
  return <PageFrame eyebrow="Smart settlement" title="영수증 정산" description="사진 한 장으로 지출 내역과 참여 인원을 빠르게 정리하세요." onBack={onBack}>
    <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]"><button className="group flex min-h-[420px] flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-slate-300 bg-card p-8 text-center transition hover:border-primary hover:bg-accent/30"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#101828] text-white"><Camera className="h-6 w-6"/></span><h2 className="mt-5 text-xl font-semibold">영수증을 촬영하거나 올려주세요</h2><p className="mt-2 text-sm text-muted-foreground">JPG, PNG · 최대 10MB</p><span className="mt-6 rounded-full bg-secondary px-4 py-2 text-sm font-medium">파일 선택</span></button><section className="space-y-4"><div className="rounded-[24px] bg-card p-6 ring-1 ring-black/[0.06]"><p className="text-xs font-semibold text-primary">EXTRACTED DATA</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><Info label="사용처" value="해운대 횟집"/><Info label="결제 일시" value="9월 7일 19:30"/><Info label="총 결제 금액" value="120,000원"/><Info label="참여 인원" value="8명"/></div></div><div className="rounded-[24px] bg-[#101828] p-6 text-white"><div className="flex items-end justify-between"><div><p className="text-xs text-slate-400">1인당 정산 금액</p><strong className="mt-2 block text-3xl">15,000원</strong></div><Users className="h-5 w-5 text-[#8FAAFF]"/></div><div className="mt-6 flex -space-x-2">{['ME','CH','YH','MS','SJ'].map(item=><span key={item} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#101828] bg-primary text-[9px]">{item}</span>)}</div><button className="mt-7 w-full rounded-xl bg-primary py-3.5 text-sm font-semibold">8명에게 정산 요청하기</button></div></section></div>
  </PageFrame>;
}

export function SchedulerExperience({ onBack }: { onBack: () => void }) {
  return <PageFrame eyebrow="Schedule together" title="일정 조율" description="멤버들이 가능한 시간을 선택하고 가장 좋은 시간을 찾아보세요." onBack={onBack}>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-semibold">주간 가능 시간</h2><p className="mt-1 text-sm text-muted-foreground">드래그해서 가능한 시간을 선택하세요.</p></div><span className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-primary">10명 참여</span></div><TimeGrid/></section><aside className="space-y-4"><OptimalTimeCard day="금요일" date="9월 12일" time="오후 7:30" participants={9} totalMembers={10}/><div className="rounded-[22px] bg-card p-5 ring-1 ring-black/[0.06]"><h3 className="font-semibold">응답 현황</h3><div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full w-[90%] rounded-full bg-primary"/></div><div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>9명 응답</span><span>1명 대기</span></div></div><button className="w-full rounded-xl bg-[#101828] py-4 text-sm font-semibold text-white">이 시간으로 확정하기</button></aside></div>
  </PageFrame>;
}

function FormField({label,children}:{label:string;children:React.ReactNode}) { return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>; }
function SignupField({icon,placeholder,type='text'}:{icon:React.ReactNode;placeholder:string;type?:string}) { return <label className="flex items-center gap-3 rounded-xl bg-secondary px-4 ring-1 ring-transparent focus-within:bg-white focus-within:ring-primary/40"><span className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</span><input required type={type} placeholder={placeholder} className="w-full bg-transparent py-4 text-sm outline-none"/></label>; }
function ChatBubble({avatar,name,text,time}:{avatar:string;name:string;text:string;time:string}) { return <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#101828] text-[10px] font-semibold text-white">{avatar}</span><div><p className="mb-1 text-xs text-muted-foreground">{name}</p><div className="max-w-md rounded-[20px] rounded-tl-md bg-white px-4 py-3 text-sm leading-6 shadow-sm">{text}<span className="ml-2 text-[10px] text-muted-foreground">{time}</span></div></div></div>; }
function Info({label,value}:{label:string;value:string}) { return <div className="rounded-2xl bg-secondary p-4"><p className="text-xs text-muted-foreground">{label}</p><strong className="mt-2 block text-sm">{value}</strong></div>; }
