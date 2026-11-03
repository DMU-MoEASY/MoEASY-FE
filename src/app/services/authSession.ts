import { persistenceStore } from '../lib/persistence';
import type { SocialLoginResult, SocialProvider } from './p0Api';

export type AuthSession = {
  mode: 'social';
  provider: SocialProvider;
  memberId: number;
  onboardingCompleted: boolean;
};

export const AUTH_SESSION_KEY = 'moeasy:authSession';
const LEGACY_LOGIN_KEY = 'moeasy:isLoggedIn';

export function getInitialAuthSession(): AuthSession | null {
  const savedSession = persistenceStore.read<AuthSession | { mode?: string }>(AUTH_SESSION_KEY);
  if (savedSession?.mode === 'social') return savedSession as AuthSession;

  persistenceStore.remove(AUTH_SESSION_KEY);
  persistenceStore.remove(LEGACY_LOGIN_KEY);
  return null;
}

export function createSocialAuthSession(
  provider: SocialProvider,
  result: SocialLoginResult,
): AuthSession {
  return {
    mode: 'social',
    provider,
    memberId: result.memberId,
    onboardingCompleted: result.onboardingCompleted,
  };
}

export function removeLegacyLoginState() {
  persistenceStore.remove(LEGACY_LOGIN_KEY);
}

// An unfinished profile is not an entry screen on a later visit. Only a social
// login completed during this visit can open onboarding; completed users retain
// their existing login restoration behavior.
export function resolveAuthEntry(session:AuthSession|null, authenticatedThisVisit:boolean):'login'|'onboarding'|'home' {
  if(!session) return 'login';
  if(session.onboardingCompleted) return 'home';
  return authenticatedThisVisit ? 'onboarding' : 'login';
}
