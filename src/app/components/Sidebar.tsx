import { Home, Search, Calendar, Map, User, Sparkles } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const menuItems = [
    { id: 'home', icon: Home, label: '내 모임' },
    { id: 'search', icon: Search, label: '모임 찾기' },
    { id: 'map', icon: Map, label: '모임 지도' },
    { id: 'schedule', icon: Calendar, label: '내 일정' },
    { id: 'profile', icon: User, label: '마이페이지' },
  ];

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-50 flex w-[272px] flex-col bg-[#101828] text-white">
      <div className="h-24 px-7 flex items-center gap-3">
        <div className="w-10 h-10 rounded-[13px] bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-blue-950/40">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">MoEasy</h1>
          <p className="text-xs text-slate-400">Meet people, easily.</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-5">
        <p className="px-3 mb-3 text-[10px] font-semibold tracking-[0.18em] text-slate-500">MENU</p>
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

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.06]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-sm font-semibold">ME</div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">김모이지</p>
            <p className="text-xs text-slate-400">이번 주 일정 3개</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
