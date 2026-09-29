import { useState } from 'react';
import { CalendarDays, LoaderCircle, MapPin, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { beginSocialLogin } from '../services/oauth';
import type { SocialProvider } from '../services/p0Api';

export function LoginPage() {
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [loginError, setLoginError] = useState('');

  const startSocialLogin = async (provider: SocialProvider) => {
    setLoginError('');
    try {
      setSocialLoading(provider);
      await beginSocialLogin(provider);
    } catch (error) {
      setSocialLoading(null);
      setLoginError(error instanceof Error ? error.message : '소셜 로그인을 시작하지 못했습니다.');
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F6FA] p-3 sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1480px] overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-900/10 sm:min-h-[calc(100vh-40px)] lg:grid-cols-[1.1fr_.9fr] lg:min-h-[calc(100vh-56px)]">
        <section className="relative hidden overflow-hidden bg-[#101828] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=90" alt="함께하는 사람들" className="absolute inset-0 h-full w-full object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#101828]/35 via-[#101828]/15 to-[#101828]/95" />
          <div className="relative self-start"><BrandLogo className="h-12" /></div>
          <div className="relative max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs backdrop-blur"><Sparkles className="h-3.5 w-3.5 text-[#C9FF5C]" />모임의 모든 순간을 하나로</div>
            <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.05em] xl:text-6xl">좋아하는 일을,<br />좋아할 사람들과.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/70">새로운 모임을 발견하고 일정과 장소를 정하고, 함께한 순간까지 오래 간직하세요.</p>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              <Stat icon={<Users />} value="12.4K" label="활동 멤버" /><Stat icon={<MapPin />} value="840" label="주변 모임" /><Stat icon={<CalendarDays />} value="2.1K" label="이번 주 일정" />
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-24">
          <div className="w-full max-w-[430px]">
            <div className="mb-12 lg:hidden"><BrandLogo className="h-11" /></div>
            <p className="text-sm font-semibold text-primary">WELCOME TO MOEASY</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">소셜 계정으로 시작해요.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">처음 방문했다면 로그인 후 간단한 프로필 설정이 이어져요.</p>
            <div className="mt-9 space-y-3">
              <button disabled={socialLoading !== null} onClick={() => void startSocialLogin('KAKAO')} className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#FEE500] px-4 py-4 text-sm font-semibold text-[#181600] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{socialLoading === 'KAKAO' ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] text-[#FEE500]">K</span>}카카오로 로그인</button>
              <button disabled={socialLoading !== null} onClick={() => void startSocialLogin('GOOGLE')} className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-4 text-sm font-semibold ring-1 ring-black/10 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{socialLoading === 'GOOGLE' ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <span className="font-bold text-[#4285F4]">G</span>}Google로 로그인</button>
            </div>
            {loginError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">{loginError}</p>}
            <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>MoEasy는 비밀번호를 별도로 저장하지 않으며 카카오 또는 Google 계정으로 안전하게 연결됩니다.</span></div>
          </div>
        </section>
      </div>
    </main>
  );
}

function BrandLogo({ className }: { className: string }) { return <img src="/brand/moeasy-logo.png" alt="MoEasy" className={`${className} w-auto object-contain`} />; }
function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"><span className="[&>svg]:h-4 [&>svg]:w-4 text-white/70">{icon}</span><strong className="mt-4 block text-xl">{value}</strong><span className="mt-1 block text-xs text-white/55">{label}</span></div>; }
