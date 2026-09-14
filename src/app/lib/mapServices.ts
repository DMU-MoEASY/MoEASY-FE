declare global {
  interface Window {
    google?: any;
    kakao?: any;
    __moeasyGoogleMapsReady?: () => void;
  }
}

let googlePromise: Promise<any> | null = null;
let kakaoPromise: Promise<any> | null = null;

const appendScript = (id: string, src: string) => {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) return existing;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
  return script;
};

export const hasGoogleMapsKey = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
export const hasKakaoMapsKey = Boolean(import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY);

export function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (!hasGoogleMapsKey) return Promise.reject(new Error('Google Maps API key is missing.'));
  if (googlePromise) return googlePromise;

  googlePromise = new Promise((resolve, reject) => {
    window.__moeasyGoogleMapsReady = () => resolve(window.google);
    const params = new URLSearchParams({
      key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      callback: '__moeasyGoogleMapsReady',
      loading: 'async',
      language: 'ko',
      region: 'KR',
      v: 'weekly',
    });
    const script = appendScript('moeasy-google-maps', `https://maps.googleapis.com/maps/api/js?${params}`);
    script.onerror = () => reject(new Error('Google Maps failed to load.'));
  });
  return googlePromise;
}

export function loadKakaoPlaces() {
  if (window.kakao?.maps?.services) return Promise.resolve(window.kakao);
  if (!hasKakaoMapsKey) return Promise.reject(new Error('Kakao JavaScript key is missing.'));
  if (kakaoPromise) return kakaoPromise;

  kakaoPromise = new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      appkey: import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY,
      libraries: 'services',
      autoload: 'false',
    });
    const script = appendScript('moeasy-kakao-maps', `https://dapi.kakao.com/v2/maps/sdk.js?${params}`);
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
    script.onerror = () => reject(new Error('Kakao Places failed to load.'));
  });
  return kakaoPromise;
}

export {};
