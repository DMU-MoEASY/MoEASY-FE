import { apiRequest, clearCsrfToken, ensureCsrfToken } from '../lib/apiClient';

export type RegionOption = {
  code: string;
  name: string;
};

export type RegionProvince = {
  provinceName: string;
  regions: RegionOption[];
};

export type CompleteOnboardingInput = {
  nickname: string;
  statusMessage?: string;
  regionCode: string;
  categoryCodes: string[];
};

export type GroupDetail = {
  groupId: number;
  categoryId: number;
  name: string;
  description: string;
  regionCode: string;
  placeName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  maxMembers: number;
  joinPolicy: 'OPEN' | 'APPROVAL';
  status: 'ACTIVE' | 'CLOSED';
  coverImageUrl: string | null;
};

export type CreateGroupInput = {
  name: string;
  description: string;
  categoryId: number;
  regionCode: string;
  placeName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  maxMembers: number;
  joinPolicy: 'OPEN' | 'APPROVAL';
  coverImageKey?: string;
};

export type SocialProvider = 'KAKAO' | 'GOOGLE';

export type SocialLoginResult = {
  memberId: number;
  onboardingCompleted: boolean;
};

export const authApi = {
  prepareCsrf: () => ensureCsrfToken(true),
  issueOAuthState: (provider: SocialProvider) => apiRequest<{ state: string }>(
    '/auth/oauth/states',
    { method: 'POST', body: { provider } },
  ),
  loginWithSocial: (
    provider: SocialProvider,
    input: { code: string; state: string },
  ) => apiRequest<SocialLoginResult>(
    `/auth/oauth/${provider.toLowerCase()}`,
    { method: 'POST', body: input },
  ),
  reissue: () => apiRequest<void>('/auth/reissue', { method: 'POST' }),
  logout: async () => {
    try {
      await apiRequest<void>('/auth/logout', { method: 'POST' });
    } finally {
      clearCsrfToken();
    }
  },
};

// These endpoints mirror the contracts currently merged into MoEASY-BE/develop.
export const onboardingApi = {
  getRegions: () => apiRequest<RegionProvince[]>('/regions'),
  checkNickname: (nickname: string) => {
    const query = new URLSearchParams({ nickname });
    return apiRequest<{ available: boolean }>(`/members/nicknames/availability?${query.toString()}`);
  },
  complete: (input: CompleteOnboardingInput) => apiRequest<{
    memberId: number;
    onboardingCompleted: boolean;
  }>('/members/me/onboarding', { method: 'POST', body: input }),
};

export const groupApi = {
  create: (input: CreateGroupInput) => apiRequest<{ groupId: number }>('/groups', { method: 'POST', body: input }),
  get: (groupId: number | string) => apiRequest<GroupDetail>(`/groups/${groupId}`),
  update: (groupId: number | string, input: Partial<Omit<CreateGroupInput, 'maxMembers' | 'joinPolicy'>>) => (
    apiRequest<GroupDetail>(`/groups/${groupId}`, { method: 'PATCH', body: input })
  ),
  close: (groupId: number | string, input: { reason: string; confirmationText: string; archiveContent: boolean }) => (
    apiRequest<void>(`/groups/${groupId}`, { method: 'DELETE', body: input })
  ),
};
