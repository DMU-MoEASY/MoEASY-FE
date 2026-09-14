import { useState } from 'react';
import { X, Star } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  onSubmit: (rating: number, comment: string) => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  eventTitle,
  onSubmit,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (rating === 0) {
      alert('별점을 선택해주세요');
      return;
    }
    onSubmit(rating, comment);
    setRating(0);
    setComment('');
    onClose();
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
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Meetup review</p><h3 className="mt-1 text-2xl font-semibold">후기 작성</h3></div>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Event Title */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">{eventTitle}</p>
              <h4 className="text-lg">오늘 모임은 어떠셨나요?</h4>
            </div>

            {/* Star Rating */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform active:scale-90 hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 transition-colors sm:h-12 sm:w-12 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-border'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Rating Text */}
            <div className="text-center">
              {rating === 0 && (
                <p className="text-sm text-muted-foreground">별점을 선택해주세요</p>
              )}
              {rating === 1 && (
                <p className="text-sm text-amber-600">아쉬웠어요</p>
              )}
              {rating === 2 && (
                <p className="text-sm text-orange-600">그저 그랬어요</p>
              )}
              {rating === 3 && (
                <p className="text-sm text-yellow-600">괜찮았어요</p>
              )}
              {rating === 4 && (
                <p className="text-sm text-green-600">좋았어요</p>
              )}
              {rating === 5 && (
                <p className="text-sm text-blue-600">최고였어요! ⭐</p>
              )}
            </div>

            {/* Comment Input */}
            <div>
              <label className="block text-sm mb-2">
                후기 남기기 <span className="text-muted-foreground">(선택)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="오늘 모임에 대한 짧은 소감을 남겨주세요"
                rows={4}
                className="w-full resize-none rounded-xl bg-secondary px-4 py-3.5 text-sm outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-primary/40"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {comment.length}/200자
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
                등록
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
