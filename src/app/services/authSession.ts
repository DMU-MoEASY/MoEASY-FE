import { persistenceStore } from '../lib/persistence';
import type { SocialLoginResult, SocialProvider } from './p0Api';

export type AuthSession =
  | {
      mode: 'demo';
      onboardingCompleted: true;
    }
  | {
      mode: 'social';
      provider: SocialProvider;
      memberId: number;
      onboardingCompleted: boolean;
    };

export const AUTH_SESSION_KEY = 'moeasy:authSession';
const LEGACY_LOGIN_KEY = 'moeasy:isLoggedIn';

export function getInitialAuthSession(): AuthSession | null {
  const savedSession = persistenceStore.read<AuthSession>(AUTH_SESSION_KEY);
  if (savedSession) return savedSession;

  return persistenceStore.read<boolean>(LEGACY_LOGIN_KEY)
    ? { mode: 'demo', onboardingCompleted: true }
    : null;
}

export function createDemoAuthSession(onboardingCompleted = true): AuthSession {
  return { mode: 'demo', onboardingCompleted };
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
