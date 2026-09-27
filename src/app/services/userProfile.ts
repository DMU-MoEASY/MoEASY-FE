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

export const activityRegionGroups = [
  {
    label: '서울특별시',
    regions: [
      '서울 강남구', '서울 강동구', '서울 강북구', '서울 강서구', '서울 관악구',
      '서울 광진구', '서울 구로구', '서울 금천구', '서울 노원구', '서울 도봉구',
      '서울 동대문구', '서울 동작구', '서울 마포구', '서울 서대문구', '서울 서초구',
      '서울 성동구', '서울 성북구', '서울 송파구', '서울 양천구', '서울 영등포구',
      '서울 용산구', '서울 은평구', '서울 종로구', '서울 중구', '서울 중랑구',
    ],
  },
  {
    label: '경기도',
    regions: [
      '경기 고양시', '경기 과천시', '경기 광명시', '경기 광주시', '경기 구리시',
      '경기 군포시', '경기 김포시', '경기 남양주시', '경기 부천시', '경기 성남시',
      '경기 수원시', '경기 시흥시', '경기 안산시', '경기 안양시', '경기 양주시',
      '경기 용인시', '경기 의정부시', '경기 이천시', '경기 파주시', '경기 평택시',
      '경기 하남시', '경기 화성시',
    ],
  },
  {
    label: '인천광역시',
    regions: [
      '인천 강화군', '인천 계양구', '인천 남동구', '인천 동구', '인천 미추홀구',
      '인천 부평구', '인천 서구', '인천 연수구', '인천 옹진군', '인천 중구',
    ],
  },
  {
    label: '광역시·특별자치시',
    regions: [
      '부산광역시', '대구광역시', '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
    ],
  },
  {
    label: '도·특별자치도',
    regions: [
      '강원특별자치도', '충청북도', '충청남도', '전북특별자치도', '전라남도',
      '경상북도', '경상남도', '제주특별자치도',
    ],
  },
] as const;

export const activityRegionOptions: readonly string[] = activityRegionGroups.flatMap((group) => group.regions);
