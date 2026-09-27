import { runtimeConfig } from '../config/runtime';
import { loadKakaoAuthSdk } from '../lib/kakaoAuth';
import { authApi, type SocialLoginResult, type SocialProvider } from './p0Api';

const callbackPath: Record<SocialProvider, string> = {
  KAKAO: '/auth/kakao/callback',
  GOOGLE: '/auth/google/callback',
};

function getRedirectUri(provider: SocialProvider) {
  return `${window.location.origin}${callbackPath[provider]}`;
}

export function getOAuthProviderFromPath(pathname: string): SocialProvider | null {
  if (pathname === callbackPath.KAKAO) return 'KAKAO';
  if (pathname === callbackPath.GOOGLE) return 'GOOGLE';
  return null;
}

export async function beginSocialLogin(provider: SocialProvider) {
  const { state } = await authApi.issueOAuthState(provider);
  const redirectUri = getRedirectUri(provider);

  if (provider === 'KAKAO') {
    const kakao = await loadKakaoAuthSdk(runtimeConfig.oauth.kakaoJavaScriptKey);
    kakao.Auth.authorize({ redirectUri, state });
    return;
  }

  const clientId = runtimeConfig.oauth.googleWebClientId;
  if (!clientId) throw new Error('Google 웹 클라이언트 ID가 설정되지 않았습니다.');

  const authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('state', state);

  authorizeUrl.searchParams.set('scope', 'openid');
  authorizeUrl.searchParams.set('prompt', 'select_account');

  window.location.assign(authorizeUrl.toString());
}

export async function completeSocialLogin(
  provider: SocialProvider,
  search: string,
): Promise<SocialLoginResult> {
  const params = new URLSearchParams(search);
  const error = params.get('error');
  if (error) {
    throw new Error(`소셜 로그인이 취소되었거나 실패했습니다. (${error})`);
  }

  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) throw new Error('소셜 로그인 응답에 code 또는 state가 없습니다.');

  await authApi.prepareCsrf();
  return authApi.loginWithSocial(provider, { code, state });
}
