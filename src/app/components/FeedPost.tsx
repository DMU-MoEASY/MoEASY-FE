import { Heart, Image as ImageIcon, MessageCircle, Share2, MoreVertical } from 'lucide-react';
import { useState } from 'react';

interface FeedPostProps {
  id: number;
  author: string;
  authorAvatar: string;
  timeAgo: string;
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  isLiked?: boolean;
}

export function FeedPost({
  author,
  authorAvatar,
  timeAgo,
  content,
  images,
  likes,
  comments,
  isLiked = false,
}: FeedPostProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount(likeCount - 1);
    } else {
      setLiked(true);
      setLikeCount(likeCount + 1);
    }
  };

  return (
    <article className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm shadow-slate-200/40">
      {/* Author Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent border border-primary/10 flex items-center justify-center text-xl flex-shrink-0">
            {authorAvatar}
          </div>
          <div>
            <h4 className="text-sm">{author}</h4>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        <button className="p-2 hover:bg-secondary rounded-xl transition-colors">
          <MoreVertical className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed whitespace-pre-line">{content}</p>
      </div>

      {/* Images */}
      {images && images.length > 0 && (
        <div className="border-y border-border">
          {images.length === 1 ? (
            <div className="w-full h-64 bg-secondary flex items-center justify-center">
              <span className="flex items-center gap-2 text-muted-foreground text-sm"><ImageIcon className="w-4 h-4" /> 이미지</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-0.5">
              {images.slice(0, 4).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square bg-secondary flex items-center justify-center"
                >
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <Heart
              className={`w-5 h-5 ${
                liked ? 'fill-red-500 text-red-500' : 'text-foreground'
              }`}
            />
            <span className="text-sm">{likeCount}</span>
          </button>
          <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{comments}</span>
          </button>
          <button className="ml-auto hover:opacity-70 transition-opacity">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {comments > 0 && (
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            댓글 {comments}개 모두 보기
          </button>
        )}
      </div>
    </article>
  );
}
