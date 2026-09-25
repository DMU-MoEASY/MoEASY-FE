export type UserProfile = {
  nickname: string;
  bio: string;
  activityRegion: string;
  interests: string[];
};

export const USER_PROFILE_KEY = 'moeasy:userProfile';

export const defaultUserProfile: UserProfile = {
  nickname: '김모이지',
  bio: '건강한 모임으로 일상을 더 즐겁게 만들어요.',
  activityRegion: '서울 강남구',
  interests: ['러닝', '개발', '등산'],
};

export const onboardingInterestOptions = [
  '러닝',
  '등산',
  '스터디',
  '독서',
  '사진',
  '맛집',
  '보드게임',
  '여행',
  '봉사',
  '개발',
];
