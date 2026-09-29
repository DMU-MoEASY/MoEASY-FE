import { UserRound } from 'lucide-react';

type UserAvatarProps = {
  name: string | undefined;
  imageUrl?: string | null;
  className?: string;
  textClassName?: string;
};

export function UserAvatar({ name, imageUrl, className = '', textClassName = '' }: UserAvatarProps) {
  const initials = (name ?? '').trim().replace(/\s+/g, '').slice(0, 2);

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8EEFF] text-[#2446A8] ring-1 ring-[#315EFB]/15 ${className}`}
      aria-hidden="true"
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : initials ? (
        <span className={`font-semibold tracking-[-0.05em] ${textClassName}`}>{initials}</span>
      ) : (
        <UserRound className="h-[45%] w-[45%]" />
      )}
    </span>
  );
}
