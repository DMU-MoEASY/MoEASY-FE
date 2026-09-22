import { useEffect, useState } from 'react';
import { Download, RefreshCw, WifiOff, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const dismissedKey = 'moeasy:pwa-prompt-dismissed';

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function PwaPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(dismissedKey) === 'true');
  const [isIos] = useState(() => /iphone|ipad|ipod/i.test(navigator.userAgent));
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismissInstall = () => {
    sessionStorage.setItem(dismissedKey, 'true');
    setDismissed(true);
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  if (needRefresh) {
    return (
      <PromptShell icon={<RefreshCw className="h-5 w-5" />} title="새 버전이 준비됐어요" description="업데이트하면 최신 MoEasy를 바로 사용할 수 있어요.">
        <button onClick={() => void updateServiceWorker(true)} className="rounded-lg bg-[#101828] px-3 py-2 text-xs font-semibold text-white">업데이트</button>
        <button aria-label="나중에 업데이트" onClick={() => setNeedRefresh(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
      </PromptShell>
    );
  }

  if (offlineReady) {
    return (
      <PromptShell icon={<WifiOff className="h-5 w-5" />} title="오프라인 준비 완료" description="연결이 끊겨도 기본 화면을 다시 열 수 있어요.">
        <button aria-label="확인" onClick={() => setOfflineReady(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
      </PromptShell>
    );
  }

  const showInstall = !dismissed && !isStandalone() && (installPrompt || isIos);
  if (!showInstall) return null;

  return (
    <PromptShell
      icon={<Download className="h-5 w-5" />}
      title="MoEasy를 앱으로 설치하세요"
      description={isIos && !installPrompt ? '공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택하세요.' : '홈 화면에서 더 빠르고 편하게 실행할 수 있어요.'}
    >
      {installPrompt && <button onClick={() => void install()} className="rounded-lg bg-[#101828] px-3 py-2 text-xs font-semibold text-white">설치</button>}
      <button aria-label="설치 안내 닫기" onClick={dismissInstall} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
    </PromptShell>
  );
}

function PromptShell({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="fixed bottom-4 left-4 right-4 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/20 sm:left-auto sm:mx-0 sm:w-[420px]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</span>
      <div className="min-w-0 flex-1">
        <strong className="block text-sm text-slate-900">{title}</strong>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">{children}</div>
    </aside>
  );
}
