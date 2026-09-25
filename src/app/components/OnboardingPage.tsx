import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MapPin, Sparkles, UserRound } from 'lucide-react';
import { onboardingInterestOptions, type UserProfile } from '../services/userProfile';

interface OnboardingPageProps {
  initialProfile: UserProfile;
  onComplete: (profile: UserProfile) => void;
}

export function OnboardingPage({ initialProfile, onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [nickname, setNickname] = useState(
    initialProfile.nickname === '김모이지' ? '' : initialProfile.nickname,
  );
  const [bio, setBio] = useState(
    initialProfile.nickname === '김모이지' ? '' : initialProfile.bio,
  );
  const [activityRegion, setActivityRegion] = useState(
    initialProfile.nickname === '김모이지' ? '' : (initialProfile.activityRegion || ''),
  );
  const [interests, setInterests] = useState<string[]>(
    initialProfile.nickname === '김모이지' ? [] : initialProfile.interests,
  );

  const trimmedNickname = nickname.trim();
  const nicknameIsValid = trimmedNickname.length >= 2 && trimmedNickname.length <= 12;
  const regionIsValid = activityRegion.trim().length >= 2;
  const interestsAreValid = interests.length >= 3;

  const toggleInterest = (interest: string) => {
    setInterests((current) => {
      if (current.includes(interest)) return current.filter((item) => item !== interest);
      if (current.length >= 5) return current;
      return [...current, interest];
    });
  };

  const finish = () => {
    if (!nicknameIsValid || !interestsAreValid) return;
    onComplete({
      nickname: trimmedNickname,
      bio: bio.trim() || '새로운 모임을 찾고 있어요.',
      activityRegion: activityRegion.trim(),
      interests,
    });
  };

  return (
    <main className="min-h-screen bg-[#F4F6FA] px-5 py-8 sm:py-14">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#101828] text-white shadow-lg shadow-slate-900/15">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-blue-600">MOEASY START</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">내 프로필 만들기</p>
            </div>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 ring-1 ring-black/[0.05]">
            {step} / 2
          </span>
        </header>

        <div className="mb-6 grid grid-cols-2 gap-2" aria-label="온보딩 진행률">
          <span className="h-1.5 rounded-full bg-blue-600" />
          <span className={`h-1.5 rounded-full ${step === 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
        </div>

        <section className="overflow-hidden rounded-[30px] bg-white shadow-xl shadow-slate-900/[0.07] ring-1 ring-black/[0.04]">
          {step === 1 ? (
            <div className="p-6 sm:p-10">
              <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-lg shadow-blue-600/20">
                {trimmedNickname ? trimmedNickname.slice(0, 2) : <UserRound className="h-8 w-8" />}
              </div>
              <p className="mt-8 text-sm font-semibold text-blue-600">반가워요!</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                어떻게 불러드릴까요?
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                모임에서 사용할 닉네임과 나를 표현하는 한 줄을 입력해주세요.
              </p>

              <div className="mt-9 space-y-6">
                <label className="block">
                  <span className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-800">
                    닉네임 <span className="text-xs font-normal text-slate-400">{nickname.length}/12</span>
                  </span>
                  <input
                    autoFocus
                    required
                    minLength={2}
                    maxLength={12}
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    placeholder="2~12자로 입력해주세요"
                    className="form-input"
                  />
                  {nickname.length > 0 && !nicknameIsValid && (
                    <p className="mt-2 text-xs text-red-600">닉네임은 공백을 제외하고 2자 이상 입력해주세요.</p>
                  )}
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-800">
                    한 줄 소개 <span className="text-xs font-normal text-slate-400">선택 · {bio.length}/60</span>
                  </span>
                  <input
                    maxLength={60}
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    placeholder="예: 퇴근 후 함께 달릴 친구를 찾고 있어요"
                    className="form-input"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-800">주 활동 지역</span>
                  <span className="relative block">
                    <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      value={activityRegion}
                      onChange={(event) => setActivityRegion(event.target.value)}
                      placeholder="예: 서울 강남구"
                      className="form-input pl-11"
                    />
                  </span>
                  <p className="mt-2 text-xs text-slate-400">주변 모임 추천의 기본 지역으로 사용돼요.</p>
                </label>
              </div>

              <button
                type="button"
                disabled={!nicknameIsValid || !regionIsValid}
                onClick={() => setStep(2)}
                className="mt-9 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101828] px-5 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
              >
                관심사 선택하기 <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="p-6 sm:p-10">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" /> 이전
              </button>
              <p className="mt-8 text-sm font-semibold text-blue-600">취향을 알려주세요</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                관심사 3개를 선택해주세요
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                선택한 관심사를 바탕으로 잘 맞는 모임을 추천해드려요. 최대 5개까지 선택할 수 있어요.
              </p>

              <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {onboardingInterestOptions.map((interest) => {
                  const selected = interests.includes(interest);
                  return (
                    <button
                      type="button"
                      key={interest}
                      aria-pressed={selected}
                      onClick={() => toggleInterest(interest)}
                      className={`flex min-h-16 items-center justify-between rounded-2xl px-4 text-left text-sm font-semibold ring-1 transition ${selected ? 'bg-[#101828] text-white ring-[#101828]' : 'bg-slate-50 text-slate-700 ring-black/[0.06] hover:bg-white hover:ring-blue-300'}`}
                    >
                      {interest}
                      {selected && <Check className="h-4 w-4 text-[#C9FF5C]" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-between text-xs text-slate-500">
                <span>{interests.length < 3 ? `${3 - interests.length}개 더 선택해주세요` : '시작할 준비가 됐어요'}</span>
                <span className="font-semibold text-slate-700">{interests.length}/5</span>
              </div>

              <button
                type="button"
                disabled={!interestsAreValid}
                onClick={finish}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
              >
                MoEasy 시작하기 <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          입력한 정보는 마이페이지에서 언제든 수정할 수 있어요.
        </p>
      </div>
    </main>
  );
}
