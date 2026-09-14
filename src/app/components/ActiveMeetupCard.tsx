import { Users, MapPin } from 'lucide-react';

interface ActiveMeetupCardProps {
  name: string;
  region: string;
  members: number;
  color: string;
}

export function ActiveMeetupCard({ name, region, members, color }: ActiveMeetupCardProps) {
  return (
    <div className={`${color} rounded-2xl p-5 min-w-[220px] shadow-sm transition-transform hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h4 className="line-clamp-1">{name}</h4>
        <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.18)]" />
      </div>

      <div className="space-y-1.5 text-sm opacity-80">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-xs">{region}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span className="text-xs">{members}명</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
        <span className="text-xs text-white/80">활동 중</span>
        <span className="text-xs font-medium">바로가기 →</span>
      </div>
    </div>
  );
}
