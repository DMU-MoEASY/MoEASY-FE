import { useState } from 'react';
import { ArrowRight, Award, CalendarDays, MapPin, Save, Settings, Sparkles, Users, X } from 'lucide-react';
import { onboardingInterestOptions, type UserProfile } from '../services/userProfile';

type Meetup = { id: number; name: string; region: string; category: string };
interface ProfileExperienceProps {
  onLogout: () => void;
  meetups: Meetup[];
  onSelectMeetup: (meetup: Meetup) => void;
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}

export function ProfileExperience({ onLogout, meetups, onSelectMeetup, profile, onProfileChange }: ProfileExperienceProps) {
  const [draft, setDraft] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
  const openEditor = () => { setDraft(profile); setIsEditing(true); };
  const saveProfile = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); onProfileChange({ ...draft, nickname: draft.nickname.trim(), bio: draft.bio.trim() }); setIsEditing(false); };
  const toggleInterest = (interest: string) => setDraft(current => ({ ...current, interests: current.interests.includes(interest) ? current.interests.filter(item => item !== interest) : [...current.interests, interest] }));

  return <div className="space-y-8 lg:space-y-10">
    <section className="relative overflow-hidden rounded-[28px] bg-[#101828] p-7 text-white sm:p-10">
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
      <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-5"><div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-blue-400 to-indigo-600 text-2xl font-semibold shadow-xl shadow-black/20">{profile.nickname.slice(0, 2)}</div><div><span className="rounded-full bg-[#C9FF5C] px-3 py-1 text-xs font-semibold text-[#193300]">매너온도 36.5°</span><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{profile.nickname}</h1><p className="mt-1 text-sm text-slate-400">{profile.bio}</p><p className="mt-2 flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3" />{profile.activityRegion || '활동 지역 미설정'}</p><div className="mt-3 flex flex-wrap gap-1.5">{profile.interests.map(item => <span key={item} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-slate-300">#{item}</span>)}</div></div></div>
        <button type="button" onClick={openEditor} className="flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"><Settings className="h-4 w-4" />프로필 편집</button>
      </div>
      <div className="relative mt-9 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-7 text-center"><Stat value="24" label="참여 일정"/><Stat value="12" label="작성 후기"/><Stat value="156" label="모임 친구"/></div>
    </section>

    {isEditing && <section aria-label="프로필 편집" className="rounded-[24px] bg-card p-5 ring-1 ring-black/[0.06] sm:p-7"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-semibold text-primary">EDIT PROFILE</p><h2 className="mt-1 text-xl font-semibold">내 정보 수정</h2></div><button type="button" aria-label="편집 닫기" onClick={() => setIsEditing(false)} className="rounded-full p-2 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button></div><form onSubmit={saveProfile} className="grid gap-5 lg:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-semibold">닉네임</span><input required minLength={2} maxLength={12} value={draft.nickname} onChange={event => setDraft({ ...draft, nickname: event.target.value })} className="form-input" /></label><label className="block"><span className="mb-2 block text-sm font-semibold">한 줄 소개</span><input required maxLength={60} value={draft.bio} onChange={event => setDraft({ ...draft, bio: event.target.value })} className="form-input" /></label><label className="block lg:col-span-2"><span className="mb-2 block text-sm font-semibold">주 활동 지역</span><input required value={draft.activityRegion || ''} onChange={event => setDraft({ ...draft, activityRegion: event.target.value })} placeholder="예: 서울 강남구" className="form-input" /></label><div className="lg:col-span-2"><span className="mb-2 block text-sm font-semibold">관심사</span><div className="flex flex-wrap gap-2">{onboardingInterestOptions.map(item => <button type="button" key={item} onClick={() => toggleInterest(item)} className={`rounded-full px-4 py-2 text-sm ${draft.interests.includes(item) ? 'bg-[#101828] text-white' : 'bg-secondary text-muted-foreground'}`}>#{item}</button>)}</div></div><div className="flex gap-2 lg:col-span-2 lg:justify-end"><button type="button" onClick={() => setIsEditing(false)} className="rounded-xl bg-secondary px-5 py-3 text-sm">취소</button><button type="submit" className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white"><Save className="h-4 w-4" />저장하기</button></div></form></section>}

    <section className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
      <div><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-semibold text-primary">MY CIRCLES</p><h2 className="mt-1 text-2xl font-semibold">참여 중인 모임</h2></div><span className="text-sm text-muted-foreground">{meetups.length}개</span></div><div className="space-y-3">{meetups.map((meetup, index)=><button key={meetup.id} onClick={() => onSelectMeetup(meetup)} className="flex w-full items-center gap-4 rounded-[20px] bg-card p-4 text-left ring-1 ring-black/[0.06] transition hover:-translate-y-0.5 hover:shadow-lg"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500'][index % 4]}`}><Users className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="font-semibold">{meetup.name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{meetup.region} · {meetup.category}</p></div><ArrowRight className="h-4 w-4 text-muted-foreground" /></button>)}</div></div>
      <aside><div className="mb-5"><p className="text-xs font-semibold text-primary">ACTIVITY</p><h2 className="mt-1 text-2xl font-semibold">최근 활동</h2></div><div className="rounded-[22px] bg-card p-5 ring-1 ring-black/[0.06]"><Activity icon={<Award />} title="첫 10회 참석 배지" meta="강남 러닝 크루 · 오늘"/><Activity icon={<CalendarDays />} title="주말 등산 참여 완료" meta="북한산 등산 클럽 · 3일 전"/><Activity icon={<Sparkles />} title="새로운 모임에 가입했어요" meta="판교 개발자 스터디 · 6일 전"/></div><button onClick={onLogout} className="mt-4 w-full rounded-xl py-3 text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground">로그아웃</button></aside>
    </section>
  </div>;
}

function Stat({value,label}:{value:string;label:string}) { return <div><strong className="block text-2xl">{value}</strong><span className="mt-1 block text-xs text-slate-400">{label}</span></div>; }
function Activity({icon,title,meta}:{icon:React.ReactNode;title:string;meta:string}) { return <div className="flex gap-3 border-b border-border py-4 first:pt-0 last:border-0 last:pb-0"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary [&>svg]:h-4 [&>svg]:w-4">{icon}</span><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs text-muted-foreground">{meta}</p></div></div>; }
