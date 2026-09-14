import { MapPin, Users, Award } from 'lucide-react';

interface MeetupCardProps {
  name: string;
  region: string;
  description: string;
  members: number;
  tier: 'gold' | 'silver' | 'bronze';
  category: string;
  imageUrl?: string;
  onScheduleClick?: () => void;
}

const tierConfig = {
  gold: {
    color: 'bg-amber-50 border-amber-200',
    label: 'Gold',
    textColor: 'text-amber-700'
  },
  silver: {
    color: 'bg-slate-50 border-slate-200',
    label: 'Silver',
    textColor: 'text-slate-600'
  },
  bronze: {
    color: 'bg-orange-50 border-orange-200',
    label: 'Bronze',
    textColor: 'text-orange-600'
  }
};

export function MeetupCard({ name, region, description, members, tier, category, imageUrl, onScheduleClick }: MeetupCardProps) {
  const tierInfo = tierConfig[tier];

  return (
    <div
      className="bg-card rounded-2xl overflow-hidden shadow-sm shadow-slate-200/40 border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
      onClick={onScheduleClick}
    >
      <div className="relative">
        <div className="h-36 bg-accent relative overflow-hidden">
          {imageUrl && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"></div>
          )}
        </div>

        <div className={`absolute top-3 right-3 ${tierInfo.color} px-2.5 py-1 rounded-full flex items-center justify-center border`}>
          <span className={`text-xs font-medium ${tierInfo.textColor}`}>{tierInfo.label}</span>
        </div>

        <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs">
          {category}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="flex-1 line-clamp-1">{name}</h3>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>{region}</span>
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
          {description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{members}명</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-primary">
            <Award className="w-4 h-4" />
            <span>활발한 모임</span>
          </div>
        </div>
      </div>
    </div>
  );
}
