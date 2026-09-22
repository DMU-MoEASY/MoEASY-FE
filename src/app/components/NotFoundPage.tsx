import { ArrowLeft, Compass } from 'lucide-react';

type NotFoundPageProps = {
  onHome: () => void;
};

export function NotFoundPage({ onHome }: NotFoundPageProps) {
  return (
    <main className="min-h-screen bg-background px-5 py-10 flex items-center justify-center">
      <section className="w-full max-w-lg rounded-[2rem] border border-border bg-card p-7 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Compass className="size-8" aria-hidden="true" />
        </div>
        <p className="mb-2 text-sm font-semibold tracking-wide text-primary">404</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">페이지를 찾을 수 없어요</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground sm:text-base">
          주소가 잘못되었거나 삭제된 모임일 수 있습니다. 홈에서 다시 원하는 모임을 찾아보세요.
        </p>
        <button
          type="button"
          onClick={onHome}
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 font-medium text-primary-foreground transition hover:opacity-90 active:scale-[0.98] sm:w-auto"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          홈으로 돌아가기
        </button>
      </section>
    </main>
  );
}
