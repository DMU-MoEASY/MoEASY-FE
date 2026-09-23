export type DataSourceMode = 'local' | 'api';

const configuredMode = import.meta.env.VITE_DATA_SOURCE;
const dataSource: DataSourceMode = configuredMode === 'api' ? 'api' : 'local';

export const runtimeConfig = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, ''),
  dataSource,
  oauth: {
    kakaoRestApiKey: import.meta.env.VITE_KAKAO_REST_API_KEY || '',
    googleWebClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || '',
  },
};

export const isApiMode = runtimeConfig.dataSource === 'api';
