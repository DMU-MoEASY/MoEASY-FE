import { runtimeConfig } from '../config/runtime';
import { authApi, type SocialLoginResult, type SocialProvider } from './p0Api';

const callbackPath: Record<SocialProvider, string> = {
  KAKAO: '/oauth/kakao/callback',
  GOOGLE: '/oauth/google/callback',
};

const correlationKey = (provider: SocialProvider) => `moeasy:oauth-correlation:${provider}`;

function getRedirectUri(provider: SocialProvider) {
  return `${window.location.origin}${callbackPath[provider]}`;
}

function getClientId(provider: SocialProvider) {
  return provider === 'KAKAO'
    ? runtimeConfig.oauth.kakaoRestApiKey
    : runtimeConfig.oauth.googleWebClientId;
}

export function getOAuthProviderFromPath(pathname: string): SocialProvider | null {
  if (pathname === callbackPath.KAKAO) return 'KAKAO';
  if (pathname === callbackPath.GOOGLE) return 'GOOGLE';
  return null;
}

export async function beginSocialLogin(provider: SocialProvider) {
  const clientId = getClientId(provider);
  if (!clientId) {
    throw new Error(`${provider === 'KAKAO' ? '카카오 REST API 키' : 'Google 웹 클라이언트 ID'}가 설정되지 않았습니다.`);
  }

  const correlationId = crypto.randomUUID();
  sessionStorage.setItem(correlationKey(provider), correlationId);
  let state: string;
  try {
    ({ state } = await authApi.issueOAuthState(provider, correlationId));
  } catch (error) {
    sessionStorage.removeItem(correlationKey(provider));
    throw error;
  }
  const redirectUri = getRedirectUri(provider);
  const authorizeUrl = new URL(
    provider === 'KAKAO'
      ? 'https://kauth.kakao.com/oauth/authorize'
      : 'https://accounts.google.com/o/oauth2/v2/auth',
  );
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('state', state);

  if (provider === 'GOOGLE') {
    authorizeUrl.searchParams.set('scope', 'openid profile email');
    authorizeUrl.searchParams.set('prompt', 'select_account');
  }

  window.location.assign(authorizeUrl.toString());
}

export async function completeSocialLogin(
  provider: SocialProvider,
  search: string,
): Promise<SocialLoginResult> {
  const params = new URLSearchParams(search);
  const error = params.get('error');
  if (error) {
    sessionStorage.removeItem(correlationKey(provider));
    throw new Error(`소셜 로그인이 취소되었거나 실패했습니다. (${error})`);
  }

  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) throw new Error('소셜 로그인 응답에 code 또는 state가 없습니다.');

  const correlationId = sessionStorage.getItem(correlationKey(provider));
  if (!correlationId) {
    throw new Error('로그인 요청을 시작한 브라우저 정보를 확인할 수 없습니다. 다시 로그인해주세요.');
  }

  try {
    return await authApi.loginWithSocial(provider, {
      code,
      state,
      redirectUri: getRedirectUri(provider),
      correlationId,
    });
  } finally {
    sessionStorage.removeItem(correlationKey(provider));
  }
}
