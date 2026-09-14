import React, { useState } from 'react';
import { X, Users, MapPin } from 'lucide-react';

interface JoinMeetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetupName: string;
  meetupRegion: string;
  members: number;
  onSubmit: (greeting: string) => void;
}

export function JoinMeetupModal({
  isOpen,
  onClose,
  meetupName,
  meetupRegion,
  members,
  onSubmit,
}: JoinMeetupModalProps) {
  const [greeting, setGreeting] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!greeting.trim()) {
      alert('가입 인사를 입력해주세요');
      return;
    }
    onSubmit(greeting);
    setGreeting('');
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 z-[60] flex items-end justify-center bg-[#101828]/70 p-3 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="max-h-[calc(100vh-24px)] w-full max-w-md animate-scale-in overflow-y-auto rounded-[28px] bg-card p-6 shadow-2xl sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Join request</p><h3 className="mt-1 text-2xl font-semibold tracking-tight">모임 가입 신청</h3></div>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Meetup Info */}
            <div className="rounded-[20px] bg-[#101828] p-5 text-white">
              <h4 className="font-semibold mb-3">{meetupName}</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{meetupRegion}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>멤버 {members}명</span>
                </div>
              </div>
            </div>

            {/* Greeting Input */}
            <div>
              <label className="block text-sm mb-2">
                가입 인사 <span className="text-destructive">*</span>
              </label>
              <textarea
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="모임에 가입하고 싶은 이유와 간단한 인사를 남겨주세요"
                rows={4}
                className="w-full resize-none rounded-xl bg-secondary px-4 py-3.5 text-sm outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-primary/40"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {greeting.length}/200자
              </p>
            </div>

            {/* Info */}
            <div className="rounded-xl bg-accent p-3">
              <p className="text-xs leading-relaxed text-primary">
                가입 신청 후 운영진의 승인을 기다려주세요
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-secondary py-3 text-foreground transition-transform active:scale-95"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-xl bg-primary py-3 text-primary-foreground shadow-lg transition-transform active:scale-95"
              >
                신청하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
