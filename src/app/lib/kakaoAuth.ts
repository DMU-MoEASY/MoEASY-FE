type KakaoAuthorizeOptions = {
  redirectUri: string;
  state: string;
};

type KakaoAuthSdk = {
  init: (javascriptKey: string) => void;
  isInitialized: () => boolean;
  Auth: {
    authorize: (options: KakaoAuthorizeOptions) => void;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoAuthSdk;
  }
}

const KAKAO_SDK_ID = 'moeasy-kakao-auth-sdk';
const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js';
const KAKAO_SDK_INTEGRITY = 'sha384-oroumrnFVE0xtgqyDZJARgERibXg2C28380uaUZz2kHDS5CR7tu20eGiOU6GkTpy';

let kakaoSdkPromise: Promise<KakaoAuthSdk> | null = null;

function initializeKakao(javascriptKey: string) {
  if (!window.Kakao) {
    throw new Error('카카오 JavaScript SDK를 불러오지 못했습니다.');
  }

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(javascriptKey);
  }

  return window.Kakao;
}

export function loadKakaoAuthSdk(javascriptKey: string) {
  if (!javascriptKey) {
    return Promise.reject(new Error('카카오 JavaScript 키가 설정되지 않았습니다.'));
  }

  if (window.Kakao) {
    return Promise.resolve(initializeKakao(javascriptKey));
  }

  if (kakaoSdkPromise) return kakaoSdkPromise;

  kakaoSdkPromise = new Promise<KakaoAuthSdk>((resolve, reject) => {
    const onLoad = () => {
      try {
        resolve(initializeKakao(javascriptKey));
      } catch (error) {
        reject(error);
      }
    };
    const onError = () => reject(new Error('카카오 JavaScript SDK를 불러오지 못했습니다.'));

    const existing = document.getElementById(KAKAO_SDK_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener('error', onError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = KAKAO_SDK_ID;
    script.async = true;
    script.src = KAKAO_SDK_URL;
    script.integrity = KAKAO_SDK_INTEGRITY;
    script.crossOrigin = 'anonymous';
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    kakaoSdkPromise = null;
    throw error;
  });

  return kakaoSdkPromise;
}

export {};
