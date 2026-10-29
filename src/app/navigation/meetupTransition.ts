// Morph the selected photo while the surrounding pages crossfade in place.
// This scoped snapshot is used only for card entry, never for menu/tab changes.
function prepareImage(image: HTMLImageElement | null) {
  if (!image) return Promise.resolve();
  // Cold images need decoding before the browser can capture them. Never hold
  // navigation indefinitely on a failed or slow external image.
  return new Promise<void>(resolve => {
    const timeout = window.setTimeout(resolve, 200);
    void image.decode().catch(() => undefined).finally(() => {
      window.clearTimeout(timeout);
      resolve();
    });
  });
}

export async function openMeetupFromCard(card: HTMLElement, navigate: () => void) {
  const cover = card.querySelector<HTMLImageElement>('[data-meetup-cover] img');
  if (!cover || !document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    navigate();
    return;
  }
  if (document.documentElement.dataset.meetupTransition) return;
  document.documentElement.dataset.meetupTransition = 'active';
  const previousRootName = document.documentElement.style.viewTransitionName;
  try {
    await prepareImage(cover);
    if (!card.isConnected) return;
    document.documentElement.style.viewTransitionName = 'moeasy-page-background';
    cover.style.viewTransitionName = 'moeasy-meetup-cover';
    const transition = document.startViewTransition(async () => {
      navigate();
      // Flush route state, then allow the newly mounted hero and scroll position
      // to settle before capturing the destination, including on the first visit.
      await new Promise<void>(resolve => queueMicrotask(resolve));
      await prepareImage(document.querySelector<HTMLImageElement>('[data-meetup-hero]'));
    });
    void transition.ready.catch(error => {
      if (import.meta.env.DEV) console.warn('모임 화면 전환이 생략되었습니다.', error);
    });
    await transition.finished;
  } finally {
    cover.style.viewTransitionName = '';
    document.documentElement.style.viewTransitionName = previousRootName;
    delete document.documentElement.dataset.meetupTransition;
  }
}

const covers = [
  'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=85',
];
export const meetupCover = (id:number) => covers[Math.abs(id-1) % covers.length];
