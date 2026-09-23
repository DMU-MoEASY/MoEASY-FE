import { apiRequest } from '../lib/apiClient';

export type Id = string;
export type RsvpStatus = 'ATTENDING' | 'NOT_ATTENDING' | 'UNDECIDED';

export type UserSummary = {
  id: Id;
  nickname: string;
  profileImageUrl?: string | null;
};

export type MeetupSummary = {
  id: Id;
  name: string;
  description: string;
  category: string;
  region: { code?: string; name: string };
  memberCount: number;
  imageUrl?: string | null;
  myRole?: string | null;
};

export type MeetupSchedule = {
  id: Id;
  clubId: Id;
  title: string;
  startsAt: string;
  endsAt?: string | null;
  place: {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  status: 'DRAFT' | 'OPEN' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  myRsvp: RsvpStatus;
  attendingCount: number;
};

export type PageResult<T> = {
  items: T[];
  page: { nextCursor: string | null; hasNext: boolean; size: number };
};

export type CreateMeetupInput = {
  name: string;
  description: string;
  categoryId: string;
  regionCode: string;
  maxMembers: number;
  joinPolicy: 'OPEN' | 'APPROVAL';
};

export type CreateScheduleInput = {
  title: string;
  startsAt: string;
  endsAt?: string;
  place: MeetupSchedule['place'];
  capacity?: number;
  notice?: string;
};

export type SocialProvider = 'KAKAO' | 'GOOGLE';

export type SocialLoginResult = {
  memberId: number;
  onboardingCompleted: boolean;
};

export const authApi = {
  issueOAuthState: (provider: SocialProvider, correlationId: string) => apiRequest<{ state: string }>(
    '/auth/oauth/states',
    { method: 'POST', body: { provider, correlationId } },
  ),
  loginWithSocial: (
    provider: SocialProvider,
    input: { code: string; state: string; redirectUri: string; correlationId: string },
  ) => apiRequest<SocialLoginResult>(
    `/auth/oauth/${provider.toLowerCase()}`,
    { method: 'POST', body: input },
  ),
};

export const userApi = {
  getMe: () => apiRequest<UserSummary>('/users/me'),
  getMyMeetups: () => apiRequest<PageResult<MeetupSummary>>('/users/me/clubs'),
};

export const meetupApi = {
  search: (params: { q?: string; category?: string; regionCode?: string; cursor?: string; size?: number } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    const suffix = query.size ? `?${query.toString()}` : '';
    return apiRequest<PageResult<MeetupSummary>>(`/clubs${suffix}`);
  },
  get: (clubId: Id) => apiRequest<MeetupSummary>(`/clubs/${clubId}`),
  create: (input: CreateMeetupInput) => apiRequest<MeetupSummary>('/clubs', { method: 'POST', body: input }),
};

export const scheduleApi = {
  list: (clubId: Id) => apiRequest<PageResult<MeetupSchedule>>(`/clubs/${clubId}/schedules`),
  create: (clubId: Id, input: CreateScheduleInput) => apiRequest<MeetupSchedule>(
    `/clubs/${clubId}/schedules`,
    { method: 'POST', body: input },
  ),
  update: (scheduleId: Id, input: Partial<CreateScheduleInput>) => apiRequest<MeetupSchedule>(
    `/schedules/${scheduleId}`,
    { method: 'PATCH', body: input },
  ),
  remove: (scheduleId: Id) => apiRequest<void>(`/schedules/${scheduleId}`, { method: 'DELETE' }),
  updateRsvp: (scheduleId: Id, status: RsvpStatus) => apiRequest<{
    scheduleId: Id;
    myRsvp: RsvpStatus;
    attendingCount: number;
    capacity?: number;
  }>(`/schedules/${scheduleId}/rsvp`, { method: 'PUT', body: { status } }),
};

export const boardApi = {
  createPost: (clubId: Id, content: string, imageFileIds: Id[] = []) => apiRequest<{
    id: Id;
    content: string;
    author: UserSummary;
    likeCount: number;
    commentCount: number;
    createdAt: string;
  }>(`/clubs/${clubId}/posts`, { method: 'POST', body: { content, imageFileIds } }),
};
