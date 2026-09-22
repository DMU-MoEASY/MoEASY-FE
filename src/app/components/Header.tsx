import { Bell, MessageCircle, ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onNotificationClick?: () => void;
  onDMClick?: () => void;
}

export function Header({ onNotificationClick, onDMClick }: HeaderProps) {
  const [currentLocation, setCurrentLocation] = useState('강남구');

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
          onClick={() => alert('위치 변경')}
          className="hidden items-center gap-2 hover:bg-card px-2 py-1.5 rounded-xl transition-colors sm:flex"
        >
          <div className="text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">My neighborhood</p>
            <p className="text-sm font-semibold">서울 {currentLocation}</p>
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
            <MessageCircle className="w-5 h-5 text-foreground" />
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
        </div>
      </div>
    </header>
  );
}
