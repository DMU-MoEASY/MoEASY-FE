import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, MessageSquare, Search, User } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface HeaderProps {
  onNotificationClick?: () => void;
  onDMClick?: () => void;
  activityRegion: string;
  onRegionClick?: () => void;
  userName: string;
  profileImageUrl?: string | null;
  memberId: number;
  onProfileClick: () => void;
  onLogout: () => void;
}

export function Header({ onNotificationClick, onDMClick, activityRegion, onRegionClick, userName, profileImageUrl, memberId, onProfileClick, onLogout }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const closeMenu = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) setIsUserMenuOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, [isUserMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-[272px] bg-background/85 backdrop-blur-xl z-40">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-[72px] flex items-center justify-between">
        <img
          src="/brand/moeasy-logo.png"
          alt="MoEasy"
          className="h-8 w-auto max-w-[116px] object-contain lg:hidden"
        />

        {/* Location */}
        <button
          onClick={onRegionClick}
          className="hidden items-center gap-2 hover:bg-card px-2 py-1.5 rounded-xl transition-colors sm:flex"
        >
          <div className="text-left">
            <p className="text-[10px] font-medium text-muted-foreground">내 활동 지역</p>
            <p className="text-sm font-semibold">{activityRegion || '활동 지역 설정'}</p>
          </div>
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button className="hidden h-10 items-center gap-2 rounded-full bg-card px-4 text-sm text-muted-foreground ring-1 ring-black/[0.06] xl:flex"><Search className="h-4 w-4" />빠른 검색 <kbd className="ml-6 text-[10px] text-slate-400">⌘ K</kbd></button>
          <button
            onClick={onDMClick}
            className="relative rounded-full bg-card p-2.5 ring-1 ring-black/[0.06] transition-colors hover:bg-secondary"
            aria-label="메시지"
          >
            <MessageSquare className="w-5 h-5 text-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
          </button>
          <button
            onClick={onNotificationClick}
            className="relative rounded-full bg-card p-2.5 ring-1 ring-black/[0.06] transition-colors hover:bg-secondary"
            aria-label="알림"
          >
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
          </button>
          <div ref={userMenuRef} className="relative lg:hidden">
            <button type="button" aria-label="내 정보" aria-expanded={isUserMenuOpen} aria-haspopup="menu" onClick={() => setIsUserMenuOpen(current => !current)} className="ml-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <UserAvatar name={userName} imageUrl={profileImageUrl} className="h-10 w-10" textClassName="text-xs" />
            </button>
            {isUserMenuOpen && (
              <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl bg-white p-2 shadow-2xl shadow-slate-900/15 ring-1 ring-black/[0.08]">
                <div className="flex items-center gap-3 px-3 py-3">
                  <UserAvatar name={userName} imageUrl={profileImageUrl} className="h-11 w-11" textClassName="text-xs" />
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{userName}</p><p className="text-xs text-muted-foreground">회원 #{memberId}</p></div>
                </div>
                <div className="my-1 h-px bg-border" />
                <button type="button" onClick={() => { setIsUserMenuOpen(false); onProfileClick(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-secondary"><User className="h-4 w-4" />프로필 보기</button>
                <button type="button" onClick={() => { setIsUserMenuOpen(false); onLogout(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" />로그아웃</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
