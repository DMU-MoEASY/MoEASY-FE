import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronUp, Home, LogOut, Map, Search, User } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userName: string;
  profileImageUrl?: string | null;
  memberId: number;
  onLogout: () => void;
}

export function Sidebar({ currentPage, onNavigate, userName, profileImageUrl, memberId, onLogout }: SidebarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const menuItems = [
    { id: 'home', icon: Home, label: '내 모임' },
    { id: 'search', icon: Search, label: '모임 찾기' },
    { id: 'map', icon: Map, label: '모임 지도' },
    { id: 'schedule', icon: Calendar, label: '내 일정' },
    { id: 'profile', icon: User, label: '마이페이지' },
  ];

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
    <aside className="fixed bottom-0 left-0 top-0 z-50 flex w-[272px] flex-col bg-[#101828] text-white">
      <div className="h-24 px-6 flex items-center">
        <img src="/brand/moeasy-logo.png" alt="MoEasy" className="h-11 w-auto max-w-[184px] object-contain" />
      </div>

      <nav className="flex-1 px-4 py-5">
        <p className="px-3 mb-3 text-[10px] font-medium text-slate-500">메뉴</p>
        <div className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-white text-[#101828] shadow-lg shadow-black/10'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div ref={userMenuRef} className="relative border-t border-white/10 p-4">
        {isUserMenuOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-2xl border border-white/10 bg-[#182230] p-1.5 shadow-2xl shadow-black/35">
            <button type="button" onClick={() => { setIsUserMenuOpen(false); onNavigate('profile'); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-white/10">
              <User className="h-4 w-4" />프로필 보기
            </button>
            <div className="my-1 h-px bg-white/10" />
            <button type="button" onClick={() => { setIsUserMenuOpen(false); onLogout(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-rose-300 transition-colors hover:bg-rose-400/10">
              <LogOut className="h-4 w-4" />로그아웃
            </button>
          </div>
        )}
        <button type="button" aria-expanded={isUserMenuOpen} aria-haspopup="menu" onClick={() => setIsUserMenuOpen(current => !current)} className="flex w-full items-center gap-3 rounded-2xl bg-white/[0.06] p-3 text-left transition-colors hover:bg-white/[0.1]">
          <UserAvatar name={userName} imageUrl={profileImageUrl} className="h-10 w-10" textClassName="text-xs" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="text-xs text-slate-400">회원 #{memberId}</p>
          </div>
          <ChevronUp className={`h-4 w-4 text-slate-500 transition-transform ${isUserMenuOpen ? '' : 'rotate-180'}`} />
        </button>
      </div>
    </aside>
  );
}
