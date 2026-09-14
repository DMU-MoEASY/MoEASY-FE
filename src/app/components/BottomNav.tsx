import { Home, Search, Calendar, Map, User } from 'lucide-react';

export function BottomNav({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const tabs = [
    { id: 'home', icon: Home, label: '내 모임' },
    { id: 'search', icon: Search, label: '모임 찾기' },
    { id: 'map', icon: Map, label: '지도' },
    { id: 'schedule', icon: Calendar, label: '일정' },
    { id: 'profile', icon: User, label: '마이페이지' },
  ];

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-[20px] border border-white/60 bg-[#101828]/95 text-white shadow-2xl shadow-slate-900/25 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-[68px] max-w-md items-center justify-around px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex h-14 flex-1 flex-col items-center justify-center rounded-2xl transition-colors ${
                isActive ? 'text-white' : 'text-slate-500'
              }`}
            >
              {isActive && <span className="absolute inset-x-2 inset-y-1 rounded-xl bg-white/10" />}
              <Icon className="relative w-5 h-5 mb-1" />
              <span className="relative text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
