import { useEffect, useRef, useState } from 'react';
import { usePersistentState } from './hooks/usePersistentState';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MapPage } from './components/MapPage';
import { HomeExperience } from './components/HomeExperience';
import { ExploreExperience } from './components/ExploreExperience';
import { MeetupDetailExperience } from './components/MeetupDetailExperience';
import { ScheduleExperience } from './components/ScheduleExperience';
import { ProfileExperience } from './components/ProfileExperience';
import {
  SignupExperience,
  NotificationsExperience,
  MessagesExperience,
  GalleryExperience,
  RequestsExperience,
  CreateMeetupExperience,
  ChatExperience,
  FinanceExperience,
  MembersExperience,
  ReceiptExperience,
  SchedulerExperience,
} from './components/SecondaryExperiences';
import { SearchBar } from './components/SearchBar';
import { MeetupCard } from './components/MeetupCard';
import { ActiveMeetupCard } from './components/ActiveMeetupCard';
import { FeedPost } from './components/FeedPost';
import { BottomNav } from './components/BottomNav';
import { TimeGrid } from './components/TimeGrid';
import { OptimalTimeCard } from './components/OptimalTimeCard';
import { MeetupDetailHeader } from './components/MeetupDetailHeader';
import { TabMenu } from './components/TabMenu';
import { NoticeCard } from './components/NoticeCard';
import { UpcomingEventItem } from './components/UpcomingEventItem';
import { ReceiptScanner } from './components/ReceiptScanner';
import { ExtractedDataForm } from './components/ExtractedDataForm';
import { MemberSplitList } from './components/MemberSplitList';
import { ProfileHeader } from './components/ProfileHeader';
import { ActivityTimeline } from './components/ActivityTimeline';
import { MemberManagement } from './components/MemberManagement';
import { AccountBalanceCard } from './components/AccountBalanceCard';
import { TransactionItem } from './components/TransactionItem';
import { DuesItem } from './components/DuesItem';
import { FloatingActionButton } from './components/FloatingActionButton';
import { GroupChat } from './components/GroupChat';
import { MyDuesCard } from './components/MyDuesCard';
import { DuesHistoryItem } from './components/DuesHistoryItem';
import { CreateMeetupPage } from './components/CreateMeetupPage';
import { JoinRequestsPage } from './components/JoinRequestsPage';
import { CommunityFeed } from './components/CommunityFeed';
import { PhotoGalleryPage } from './components/PhotoGalleryPage';
import { NotificationCenter } from './components/NotificationCenter';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { DMListPage } from './components/DMListPage';
import { JoinMeetupModal } from './components/JoinMeetupModal';
import { ReviewModal } from './components/ReviewModal';
import { NotFoundPage } from './components/NotFoundPage';
import { beginSocialLogin, completeSocialLogin, getOAuthProviderFromPath } from './services/oauth';
import {
  AUTH_SESSION_KEY,
  createDemoAuthSession,
  createSocialAuthSession,
  getInitialAuthSession,
  removeLegacyLoginState,
  type AuthSession,
} from './services/authSession';
import { isApiMode } from './config/runtime';
import { Calendar, MapPin, Clock, ArrowLeft, Users, MessageSquare, DollarSign, Receipt, Settings, UserCog, Wallet, CreditCard, UserPlus, PenSquare, Star, LoaderCircle } from 'lucide-react';

type Meetup = {
  id: number;
  name: string;
  region: string;
  description: string;
  members: number;
  tier: 'gold' | 'silver' | 'bronze';
  category: string;
  imageUrl: string;
};

const meetups: Meetup[] = [
  {
    id: 1,
    name: '강남 러닝 크루',
    region: '서울 강남구',
    description: '매주 화요일 저녁 한강에서 함께 달려요! 초보자부터 마라토너까지 모두 환영합니다.',
    members: 145,
    tier: 'gold' as const,
    category: '운동',
    imageUrl: '/meetup1.jpg'
  },
  {
    id: 2,
    name: '홍대 독서 모임',
    region: '서울 마포구',
    description: '매월 한 권의 책을 읽고 토론하는 독서 모임입니다. 다양한 장르를 함께 읽어요.',
    members: 89,
    tier: 'silver' as const,
    category: '문화',
    imageUrl: '/meetup2.jpg'
  },
  {
    id: 3,
    name: '판교 개발자 스터디',
    region: '경기 성남시',
    description: '최신 웹 개발 기술을 함께 공부하고 프로젝트를 진행하는 스터디 그룹입니다.',
    members: 124,
    tier: 'gold' as const,
    category: '스터디',
    imageUrl: '/meetup3.jpg'
  },
  {
    id: 4,
    name: '이태원 맛집 탐방',
    region: '서울 용산구',
    description: '주말마다 이태원 곳곳의 맛집을 찾아다니며 리뷰를 작성하고 공유해요.',
    members: 67,
    tier: 'bronze' as const,
    category: '음식',
    imageUrl: '/meetup4.jpg'
  },
  {
    id: 5,
    name: '북한산 등산 클럽',
    region: '서울 강북구',
    description: '매주 토요일 아침 북한산을 등반하는 등산 동호회입니다. 자연을 사랑하는 분들 환영!',
    members: 198,
    tier: 'gold' as const,
    category: '운동',
    imageUrl: '/meetup5.jpg'
  },
  {
    id: 6,
    name: '여의도 사진 동호회',
    region: '서울 영등포구',
    description: '사진 촬영 기법을 함께 배우고 출사를 다니는 동호회입니다.',
    members: 52,
    tier: 'bronze' as const,
    category: '취미',
    imageUrl: '/meetup6.jpg'
  },
  {
    id: 7,
    name: '성수동 보드게임 모임',
    region: '서울 성동구',
    description: '다양한 보드게임을 즐기는 모임입니다. 매주 금요일 저녁에 만나요!',
    members: 78,
    tier: 'silver' as const,
    category: '게임',
    imageUrl: '/meetup7.jpg'
  },
  {
    id: 8,
    name: '분당 테니스 클럽',
    region: '경기 성남시',
    description: '주말 아침 테니스를 치며 건강을 챙기는 클럽입니다. 초보자 레슨도 가능해요.',
    members: 112,
    tier: 'silver' as const,
    category: '운동',
    imageUrl: '/meetup8.jpg'
  }
];

const discoverMeetups: Meetup[] = [
  {
    id: 101,
    name: '강남 요가 클래스',
    region: '서울 강남구',
    description: '매주 수요일 아침 요가로 하루를 시작해요. 초보자도 환영합니다!',
    members: 32,
    tier: 'bronze' as const,
    category: '운동',
    imageUrl: '/discover1.jpg'
  },
  {
    id: 102,
    name: '홍대 영어 회화 모임',
    region: '서울 마포구',
    description: '영어로 대화하며 실력을 키우는 모임. 부담없이 참여하세요!',
    members: 45,
    tier: 'silver' as const,
    category: '스터디',
    imageUrl: '/discover2.jpg'
  },
  {
    id: 103,
    name: '서초 주말 등산',
    region: '서울 서초구',
    description: '주말마다 서울 근교 산을 등반합니다. 등산 초보자 환영!',
    members: 67,
    tier: 'silver' as const,
    category: '운동',
    imageUrl: '/discover3.jpg'
  },
  {
    id: 104,
    name: '판교 커피 모임',
    region: '경기 성남시',
    description: '다양한 카페를 탐방하며 커피에 대해 공부하는 모임입니다.',
    members: 28,
    tier: 'bronze' as const,
    category: '취미',
    imageUrl: '/discover4.jpg'
  },
  {
    id: 105,
    name: '강북 배드민턴 동호회',
    region: '서울 강북구',
    description: '화목 저녁 배드민턴을 즐기는 동호회입니다. 실력 무관!',
    members: 156,
    tier: 'gold' as const,
    category: '운동',
    imageUrl: '/discover5.jpg'
  },
  {
    id: 106,
    name: '송파 영화 감상 모임',
    region: '서울 송파구',
    description: '매주 영화를 보고 함께 이야기를 나누는 시네마 클럽입니다.',
    members: 41,
    tier: 'bronze' as const,
    category: '문화',
    imageUrl: '/discover6.jpg'
  },
  {
    id: 107,
    name: '용산 스피닝 클래스',
    region: '서울 용산구',
    description: '신나는 음악과 함께하는 고강도 실내 사이클 운동!',
    members: 89,
    tier: 'silver' as const,
    category: '운동',
    imageUrl: '/discover7.jpg'
  },
  {
    id: 108,
    name: '성동 창업 스터디',
    region: '서울 성동구',
    description: '창업을 준비하는 사람들이 모여 아이디어를 공유하는 모임입니다.',
    members: 53,
    tier: 'silver' as const,
    category: '스터디',
    imageUrl: '/discover8.jpg'
  }
];

const mockMembers = [
  { id: 1, name: '김철수', avatar: '👨' },
  { id: 2, name: '이영희', avatar: '👩' },
  { id: 3, name: '박민수', avatar: '🧑' },
  { id: 4, name: '정지원', avatar: '👨' },
  { id: 5, name: '최수진', avatar: '👩' },
  { id: 6, name: '강동욱', avatar: '🧑' },
  { id: 7, name: '윤서연', avatar: '👩' },
  { id: 8, name: '조현우', avatar: '👨' },
];

const transactions = [
  {
    id: 1,
    type: 'income' as const,
    category: '회비 납부',
    description: '김철수 외 7명',
    amount: 120000,
    date: '2026.04.19',
    time: '14:30',
  },
  {
    id: 2,
    type: 'expense' as const,
    category: '영수증 정산',
    description: '해운대 횟집 - 모임 회식',
    amount: 120000,
    date: '2026.04.15',
    time: '20:15',
  },
  {
    id: 3,
    type: 'income' as const,
    category: '회비 납부',
    description: '이영희 외 5명',
    amount: 90000,
    date: '2026.04.10',
    time: '10:00',
  },
  {
    id: 4,
    type: 'expense' as const,
    category: '장비 구매',
    description: '러닝 조끼 10개',
    amount: 85000,
    date: '2026.04.08',
    time: '16:20',
  },
  {
    id: 5,
    type: 'income' as const,
    category: '회비 납부',
    description: '박민수 외 9명',
    amount: 150000,
    date: '2026.04.05',
    time: '09:30',
  },
];

const duesRequests = [
  {
    id: 1,
    title: '5월 월 회비',
    amount: 15000,
    dueDate: '2026.05.05',
    paidCount: 8,
    totalCount: 10,
    status: 'pending' as const,
  },
  {
    id: 2,
    title: '4월 월 회비',
    amount: 15000,
    dueDate: '2026.04.05',
    paidCount: 10,
    totalCount: 10,
    status: 'completed' as const,
  },
  {
    id: 3,
    title: '3월 월 회비',
    amount: 15000,
    dueDate: '2026.03.05',
    paidCount: 10,
    totalCount: 10,
    status: 'completed' as const,
  },
];

const tabPaths: Record<string, string> = {
  home: '/',
  search: '/explore',
  map: '/map',
  schedule: '/schedule',
  profile: '/profile',
};

const pathTabs: Record<string, string> = Object.fromEntries(
  Object.entries(tabPaths).map(([tab, path]) => [path, tab]),
);

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const oauthHandledPath = useRef<string | null>(null);
  const initialMeetupId = Number(pathname.match(/^\/meetups\/(\d+)$/)?.[1]);
  const [authSession, setAuthSession] = usePersistentState<AuthSession | null>(AUTH_SESSION_KEY, getInitialAuthSession());
  const isLoggedIn = authSession !== null;
  const [oauthCallback, setOauthCallback] = useState<{ status: 'idle' | 'loading' | 'error'; message?: string }>({ status: 'idle' });
  const [showSignup, setShowSignup] = useState(false);
  const [activeTab, setActiveTab] = useState(pathTabs[pathname] ?? 'home');
  const [myMeetups, setMyMeetups] = usePersistentState('moeasy:myMeetups', meetups);
  const [exploreMeetups, setExploreMeetups] = usePersistentState('moeasy:exploreMeetups', discoverMeetups);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showMeetupDetail, setShowMeetupDetail] = useState(Boolean(initialMeetupId));
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [showFinanceManagement, setShowFinanceManagement] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [showCreateMeetup, setShowCreateMeetup] = useState(false);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDMList, setShowDMList] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedMeetup, setSelectedMeetup] = useState<Meetup>(
    () => [...myMeetups, ...exploreMeetups].find(item => item.id === initialMeetupId) ?? myMeetups[0] ?? meetups[0]!,
  );
  const [joinTargetMeetup, setJoinTargetMeetup] = useState<Meetup>(discoverMeetups[0]!);
  const [reviewTargetEvent, setReviewTargetEvent] = useState({ title: '', id: '' });
  const [eventReviews, setEventReviews] = usePersistentState<Record<string, { rating: number; comment: string }>>('moeasy:eventReviews', {});
  const [detailTab, setDetailTab] = useState('홈');
  const [financeTab, setFinanceTab] = useState('입출금 내역');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    removeLegacyLoginState();
  }, []);

  useEffect(() => {
    const provider = getOAuthProviderFromPath(pathname);
    const callbackKey = `${pathname}${window.location.search}`;
    if (!provider || oauthHandledPath.current === callbackKey) return;

    oauthHandledPath.current = callbackKey;
    setOauthCallback({ status: 'loading' });
    void completeSocialLogin(provider, window.location.search)
      .then((result) => {
        setAuthSession(createSocialAuthSession(provider, result));
        window.history.replaceState({}, '', '/');
        setPathname('/');
      })
      .catch((error: unknown) => {
        setOauthCallback({
          status: 'error',
          message: error instanceof Error ? error.message : '소셜 로그인을 완료하지 못했습니다.',
        });
      });
  }, [pathname, setAuthSession]);

  useEffect(() => {
    const meetupId = Number(pathname.match(/^\/meetups\/(\d+)$/)?.[1]);
    if (meetupId) {
      const meetup = [...myMeetups, ...exploreMeetups].find(item => item.id === meetupId);
      if (meetup) {
        setSelectedMeetup(meetup);
        setShowMeetupDetail(true);
      } else {
        setShowMeetupDetail(false);
      }
      return;
    }

    const nextTab = pathTabs[pathname];
    if (nextTab) {
      setActiveTab(nextTab);
      setShowMeetupDetail(false);
    }
  }, [pathname, myMeetups, exploreMeetups]);

  const changePath = (path: string) => {
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    setPathname(path);
  };

  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
    setShowMeetupDetail(false);
    changePath(tabPaths[tab] ?? '/');
  };

  const openMeetup = (meetup: Meetup) => {
    setSelectedMeetup(meetup);
    setDetailTab('홈');
    setShowMeetupDetail(true);
    changePath(`/meetups/${meetup.id}`);
  };

  if (getOAuthProviderFromPath(pathname)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F6FA] px-5">
        <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-900/10">
          {oauthCallback.status === 'error' ? (
            <>
              <h1 className="text-xl font-semibold text-slate-900">로그인을 완료하지 못했어요</h1>
              <p role="alert" className="mt-3 text-sm leading-6 text-red-600">{oauthCallback.message}</p>
              <button
                onClick={() => {
                  window.history.replaceState({}, '', '/');
                  setPathname('/');
                  setOauthCallback({ status: 'idle' });
                }}
                className="mt-6 rounded-xl bg-[#101828] px-5 py-3 text-sm font-semibold text-white"
              >
                로그인 화면으로 돌아가기
              </button>
            </>
          ) : (
            <>
              <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-blue-600" />
              <h1 className="mt-5 text-xl font-semibold text-slate-900">소셜 로그인을 확인하고 있어요</h1>
              <p className="mt-2 text-sm text-slate-500">잠시만 기다려주세요.</p>
            </>
          )}
        </section>
      </main>
    );
  }

  // Show login/signup screens if not logged in
  if (!isLoggedIn) {
    if (showSignup) {
      return (
        <SignupExperience
          onSignup={() => {
            setAuthSession(createDemoAuthSession());
            setShowSignup(false);
          }}
          onBack={() => setShowSignup(false)}
          apiMode={isApiMode}
          onSocialSignup={beginSocialLogin}
        />
      );
    }

    return (
      <LoginPage
        onLogin={() => setAuthSession(createDemoAuthSession())}
        onSignupClick={() => setShowSignup(true)}
      />
    );
  }

  const meetupRouteMatch = pathname.match(/^\/meetups\/(\d+)$/);
  const routeMeetupExists = meetupRouteMatch
    ? [...myMeetups, ...exploreMeetups].some(item => item.id === Number(meetupRouteMatch[1]))
    : false;
  const isRouteNotFound = !pathTabs[pathname] && (!meetupRouteMatch || !routeMeetupExists);

  if (isRouteNotFound) {
    return <NotFoundPage onHome={() => navigateToTab('home')} />;
  }

  if (showNotifications) {
    return <NotificationsExperience onBack={() => setShowNotifications(false)} />;
  }

  if (showDMList) {
    return (
      <MessagesExperience
        onBack={() => setShowDMList(false)}
        onChat={() => {
          setShowDMList(false);
          setShowMeetupDetail(true);
          setShowGroupChat(true);
        }}
      />
    );
  }

  if (showPhotoGallery) {
    return (
      <GalleryExperience
        onBack={() => {
          setShowPhotoGallery(false);
          setShowMeetupDetail(true);
        }}
        name={selectedMeetup.name}
      />
    );
  }

  if (showJoinRequests) {
    return (
      <RequestsExperience
        onBack={() => {
          setShowJoinRequests(false);
          setShowMeetupDetail(true);
        }}
        name={selectedMeetup.name}
      />
    );
  }

  if (showCreateMeetup) {
    return <CreateMeetupExperience onBack={() => setShowCreateMeetup(false)} onCreate={(values) => {
      const createdMeetup = {
        id: Date.now(),
        name: values.name,
        region: values.region,
        description: values.description,
        members: 1,
        tier: 'bronze' as const,
        category: values.category,
        imageUrl: '/meetup-new.jpg',
      };
      setMyMeetups(current => [createdMeetup, ...current]);
      setExploreMeetups(current => [createdMeetup, ...current]);
      setSelectedMeetup(createdMeetup);
      setShowCreateMeetup(false);
      navigateToTab('home');
    }} />;
  }

  if (showGroupChat) {
    return <ChatExperience onBack={() => {
      setShowGroupChat(false);
      setShowMeetupDetail(true);
    }} />;
  }

  if (false && showGroupChat) {
    return (
      <div className="size-full bg-background flex flex-col">
        <header className="fixed top-0 left-0 right-0 bg-card border-b border-border z-40">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowGroupChat(false);
                  setShowMeetupDetail(true);
                }}
                className="p-2 hover:bg-secondary rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2>강남 러닝 크루</h2>
                <p className="text-xs text-muted-foreground">145명</p>
              </div>
            </div>
            <button className="p-2 hover:bg-secondary rounded-xl transition-colors">
              <Users className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 pt-16 max-w-md mx-auto w-full">
          <GroupChat />
        </main>
      </div>
    );
  }

  if (showFinanceManagement) {
    return <FinanceExperience
      onBack={() => {
        setShowFinanceManagement(false);
        setShowMeetupDetail(true);
      }}
      onReceipt={() => {
        setShowFinanceManagement(false);
        setShowReceiptScanner(true);
      }}
    />;
  }

  if (false && showFinanceManagement) {
    return (
      <div className="size-full bg-background overflow-y-auto">
        <header className="fixed top-0 left-0 right-0 bg-card border-b border-border z-40">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => {
                setShowFinanceManagement(false);
                setShowMeetupDetail(true);
              }}
              className="p-2 hover:bg-secondary rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2>회비 관리</h2>
              <p className="text-xs text-muted-foreground">강남 러닝 크루</p>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 pt-20 pb-32">
          <div className="space-y-4">
            <AccountBalanceCard
              balance={275000}
              totalIncome={360000}
              totalExpense={85000}
            />

            <div className="bg-card border-b border-border sticky top-16 z-30 -mx-4 px-4">
              <div className="flex gap-1">
                {(['입출금 내역', '회비 청구'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFinanceTab(tab)}
                    className={`px-4 py-3 whitespace-nowrap transition-all relative ${
                      financeTab === tab
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab}
                    {financeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {financeTab === '입출금 내역' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3>최근 거래 내역</h3>
                  <span className="text-sm text-muted-foreground">{transactions.length}건</span>
                </div>
                {transactions.map((transaction) => (
                  <TransactionItem key={transaction.id} {...transaction} />
                ))}
              </div>
            )}

            {financeTab === '회비 청구' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3>회비 청구 내역</h3>
                  <span className="text-sm text-muted-foreground">{duesRequests.length}건</span>
                </div>
                {duesRequests.map((dues) => (
                  <DuesItem key={dues.id} {...dues} />
                ))}
              </div>
            )}
          </div>
        </main>

        <FloatingActionButton
          onFundingRequest={() => alert('1차 펀딩 요청하기')}
          onSettlement={() => alert('초과금 사후 정산하기')}
        />
      </div>
    );
  }

  if (showMemberManagement) {
    return <MembersExperience onBack={() => {
      setShowMemberManagement(false);
      setShowMeetupDetail(true);
    }} />;
  }

  if (false && showMemberManagement) {
    return (
      <div className="size-full bg-background flex flex-col">
        <header className="fixed top-0 left-0 right-0 bg-card border-b border-border z-40">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => {
                setShowMemberManagement(false);
                setShowMeetupDetail(true);
              }}
              className="p-2 hover:bg-secondary rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span>강남 러닝 크루</span>
            </div>
          </div>
        </header>

        <main className="flex-1 pt-16 max-w-md mx-auto w-full">
          <MemberManagement />
        </main>
      </div>
    );
  }

  if (showReceiptScanner) {
    return <ReceiptExperience onBack={() => {
      setShowReceiptScanner(false);
      setShowFinanceManagement(true);
    }} />;
  }

  if (false && showReceiptScanner) {
    return (
      <div className="size-full bg-background overflow-y-auto">
        <header className="fixed top-0 left-0 right-0 bg-card border-b border-border z-40">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => {
                setShowReceiptScanner(false);
                setShowMeetupDetail(true);
              }}
              className="p-2 hover:bg-secondary rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2>영수증 등록</h2>
              <p className="text-xs text-muted-foreground">강남 러닝 크루</p>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 pt-20 pb-6">
          <div className="space-y-6">
            <ReceiptScanner />

            <ExtractedDataForm
              storeName="해운대 횟집"
              dateTime="2026년 4월 19일 오후 7:30"
              totalAmount="120,000원"
            />

            <MemberSplitList
              members={mockMembers}
              totalAmount={120000}
            />

            <button className="w-full bg-primary text-primary-foreground py-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
              <Receipt className="w-5 h-5" />
              <span>정산 요청하기</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (showMeetupDetail) {
    return (
      <MeetupDetailExperience
        key={selectedMeetup.id}
        meetup={selectedMeetup}
        activeTab={detailTab}
        onTabChange={setDetailTab}
        onBack={() => {
          setShowMeetupDetail(false);
          setDetailTab('홈');
          changePath(tabPaths[activeTab] ?? '/');
        }}
        onChat={() => {
          setShowMeetupDetail(false);
          setShowGroupChat(true);
        }}
        onSchedule={() => {
          setShowMeetupDetail(false);
          setShowScheduler(true);
        }}
        onGallery={() => {
          setShowMeetupDetail(false);
          setShowPhotoGallery(true);
        }}
        onMembers={() => {
          setShowMeetupDetail(false);
          setShowMemberManagement(true);
        }}
        onFinance={() => {
          setShowMeetupDetail(false);
          setShowFinanceManagement(true);
        }}
        onRequests={() => {
          setShowMeetupDetail(false);
          setShowJoinRequests(true);
        }}
        onReceipt={() => {
          setShowMeetupDetail(false);
          setShowReceiptScanner(true);
        }}
      />
    );
  }

  if (false && showMeetupDetail) {
    return (
      <div className="size-full bg-background overflow-y-auto">
        <header className="fixed top-0 left-0 right-0 bg-card border-b border-border z-40">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setShowMeetupDetail(false)}
              className="p-2 hover:bg-secondary rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span>모임 상세</span>
          </div>
        </header>

        <main className="max-w-md mx-auto pt-16 relative">
          <MeetupDetailHeader
            name={selectedMeetup.name}
            region={selectedMeetup.region}
            members={selectedMeetup.members}
            tier={selectedMeetup.tier}
          />

          <TabMenu
            tabs={['홈', '게시판', '일정', '회비', '정산']}
            activeTab={detailTab}
            onTabChange={setDetailTab}
          />

          <div className="px-4 py-4 space-y-4 pb-24">
            {detailTab === '홈' && (
              <>
                <section>
                  <h3 className="mb-3">📢 공지사항</h3>
                  <NoticeCard
                    title="이번 주 모임 장소 변경 안내"
                    content="안녕하세요! 이번 주 목요일 모임은 기존 뚝섬 한강공원에서 반포 한강공원으로 변경되었습니다. 참고 부탁드립니다!"
                    date="2일 전"
                    isPinned={true}
                  />
                </section>

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3>다가오는 일정</h3>
                    <button
                      onClick={() => {
                        setShowMeetupDetail(false);
                        setShowScheduler(true);
                      }}
                      className="text-sm text-primary"
                    >
                      일정 조율
                    </button>
                  </div>
                  <div className="space-y-3">
                    <UpcomingEventItem
                      title="주간 러닝 모임"
                      date="4월 22일 (화)"
                      time="오후 7:00"
                      location="반포 한강공원"
                      attendees={12}
                      maxAttendees={15}
                      defaultAttendance={true}
                    />
                    <UpcomingEventItem
                      title="주말 장거리 러닝"
                      date="4월 26일 (토)"
                      time="오전 7:00"
                      location="올림픽공원"
                      attendees={8}
                      maxAttendees={12}
                      defaultAttendance={false}
                    />
                    <UpcomingEventItem
                      title="5월 정기 모임"
                      date="5월 3일 (토)"
                      time="오전 8:00"
                      location="뚝섬 한강공원"
                      attendees={10}
                      maxAttendees={15}
                      defaultAttendance={true}
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-3">모임 소개</h3>
                  <div className="bg-card border border-border rounded-2xl p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      매주 화요일 저녁 한강에서 함께 달리는 러닝 크루입니다.
                      초보자부터 마라토너까지 모두 환영합니다.
                      건강한 러닝 문화를 만들어가며 함께 성장하는 것이 목표입니다.
                    </p>
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3>사진첩</h3>
                    <button
                      onClick={() => {
                        setShowMeetupDetail(false);
                        setShowPhotoGallery(true);
                      }}
                      className="text-sm text-primary"
                    >
                      전체보기
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-border rounded-2xl overflow-hidden border-2 border-border">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setShowMeetupDetail(false);
                          setShowPhotoGallery(true);
                        }}
                        className="aspect-square bg-secondary hover:opacity-80 transition-opacity flex items-center justify-center text-3xl"
                      >
                        {['📷', '🏃', '🌅', '🏞️', '👥', '🎉'][i - 1]}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="mb-3">운영진 메뉴</h3>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => {
                        setShowMeetupDetail(false);
                        setShowJoinRequests(true);
                      }}
                      className="w-full px-4 py-4 text-left hover:bg-purple-200/50 transition-colors flex items-center justify-between border-b border-purple-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white">
                          <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-purple-900">가입 승인</h4>
                          <p className="text-xs text-purple-700">대기 중인 신청 6건</p>
                        </div>
                      </div>
                      <ArrowLeft className="w-5 h-5 text-purple-700 rotate-180" />
                    </button>
                    <button
                      onClick={() => {
                        setShowMeetupDetail(false);
                        setShowMemberManagement(true);
                      }}
                      className="w-full px-4 py-4 text-left hover:bg-purple-200/50 transition-colors flex items-center justify-between border-b border-purple-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white">
                          <UserCog className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-purple-900">멤버 관리</h4>
                          <p className="text-xs text-purple-700">역할 변경 및 멤버 관리</p>
                        </div>
                      </div>
                      <ArrowLeft className="w-5 h-5 text-purple-700 rotate-180" />
                    </button>
                    <button
                      onClick={() => {
                        setShowMeetupDetail(false);
                        setShowFinanceManagement(true);
                      }}
                      className="w-full px-4 py-4 text-left hover:bg-purple-200/50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white">
                          <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-purple-900">회비 관리</h4>
                          <p className="text-xs text-purple-700">입출금 내역 및 회비 청구</p>
                        </div>
                      </div>
                      <ArrowLeft className="w-5 h-5 text-purple-700 rotate-180" />
                    </button>
                  </div>
                </section>
              </>
            )}

            {detailTab === '게시판' && <CommunityFeed />}

            {detailTab === '일정' && (
              <div className="space-y-4">
                <section>
                  <h4 className="mb-3 text-sm text-muted-foreground">다가오는 일정</h4>
                  <div className="space-y-3">
                    <UpcomingEventItem
                      title="주간 러닝 모임"
                      date="4월 22일 (화)"
                      time="오후 7:00"
                      location="반포 한강공원"
                      attendees={12}
                      maxAttendees={15}
                      defaultAttendance={true}
                    />
                    <UpcomingEventItem
                      title="주말 장거리 러닝"
                      date="4월 26일 (토)"
                      time="오전 7:00"
                      location="올림픽공원"
                      attendees={8}
                      maxAttendees={12}
                      defaultAttendance={false}
                    />
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 text-sm text-muted-foreground">지난 일정</h4>
                  <div className="space-y-3">
                    <UpcomingEventItem
                      title="봄맞이 한강 러닝"
                      date="4월 15일 (화)"
                      time="오후 7:00"
                      location="뚝섬 한강공원"
                      attendees={14}
                      maxAttendees={15}
                      defaultAttendance={true}
                      isPastEvent={true}
                    />
                  </div>
                </section>
              </div>
            )}

            {detailTab === '회비' && (
              <>
                <MyDuesCard
                  amount={15000}
                  dueDate="2026.05.05"
                  isPaid={false}
                  onPay={() => {}}
                  meetupName={selectedMeetup.name}
                />

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3>납부 내역</h3>
                    <span className="text-sm text-muted-foreground">최근 6개월</span>
                  </div>
                  <div className="space-y-2">
                    <DuesHistoryItem
                      month="2026년 4월"
                      amount={15000}
                      isPaid={true}
                      paidDate="2026.04.03"
                    />
                    <DuesHistoryItem
                      month="2026년 3월"
                      amount={15000}
                      isPaid={true}
                      paidDate="2026.03.05"
                    />
                    <DuesHistoryItem
                      month="2026년 2월"
                      amount={15000}
                      isPaid={true}
                      paidDate="2026.02.04"
                    />
                    <DuesHistoryItem
                      month="2026년 1월"
                      amount={15000}
                      isPaid={true}
                      paidDate="2026.01.06"
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-3">회비 안내</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0 text-white">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-blue-900 mb-1">월 회비 안내</h4>
                        <p className="text-sm text-blue-700 leading-relaxed">
                          매월 15,000원의 회비로 모임 운영 및 활동 비용을 지원합니다.
                          매월 5일까지 납부해주시기 바랍니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}

            {detailTab === '정산' && (
              <>
                <button
                  onClick={() => {
                    setShowMeetupDetail(false);
                    setShowReceiptScanner(true);
                  }}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <Receipt className="w-5 h-5" />
                  <span>영수증 등록하기</span>
                </button>

                <div className="space-y-3">
                  <h4>최근 정산 내역</h4>

                  <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="mb-1">해운대 횟집</h4>
                        <p className="text-sm text-muted-foreground">4월 15일</p>
                      </div>
                      <div className="text-right">
                        <div className="text-primary">120,000원</div>
                        <div className="text-xs text-muted-foreground">8명 참여</div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">1인당</span>
                      <span className="text-sm">15,000원</span>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="mb-1">스타벅스</h4>
                        <p className="text-sm text-muted-foreground">4월 10일</p>
                      </div>
                      <div className="text-right">
                        <div className="text-primary">45,000원</div>
                        <div className="text-xs text-muted-foreground">6명 참여</div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">1인당</span>
                      <span className="text-sm">7,500원</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Floating Action Buttons - Only show on 게시판 tab */}
          {detailTab === '게시판' && (
            <button
              onClick={() => alert('새 글 작성하기')}
              className="fixed bottom-24 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 hover:shadow-xl z-50"
              style={{ right: 'max(1.5rem, calc((100vw - 28rem) / 2 + 1.5rem))' }}
            >
              <PenSquare className="w-6 h-6" />
            </button>
          )}
        </main>
      </div>
    );
  }

  if (showScheduler) {
    return <SchedulerExperience onBack={() => {
      setShowScheduler(false);
      setShowMeetupDetail(true);
    }} />;
  }

  if (false && showScheduler) {
    return (
      <div className="size-full bg-background overflow-y-auto">
        <header className="fixed top-0 left-0 right-0 bg-card border-b border-border z-40">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => {
                setShowScheduler(false);
                setShowMeetupDetail(true);
              }}
              className="p-2 hover:bg-secondary rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2>일정 조율</h2>
              <p className="text-xs text-muted-foreground">강남 러닝 크루</p>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 pt-20 pb-6">
          <div className="space-y-4">
            <div className="bg-accent/50 border border-primary/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="mb-1">참여 인원</h4>
                  <p className="text-sm text-muted-foreground">
                    총 10명의 멤버가 일정을 입력했습니다
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3">주간 가능 시간</h3>
              <p className="text-sm text-muted-foreground mb-3">
                색이 진할수록 더 많은 사람이 참여 가능한 시간입니다
              </p>
              <TimeGrid />
            </div>

            <OptimalTimeCard
              day="금요일"
              date="4월 25일"
              time="19:00 - 21:00"
              participants={9}
              totalMembers={10}
            />

            <button className="w-full bg-primary text-primary-foreground py-4 rounded-2xl shadow-lg transition-transform active:scale-95">
              일정 확정하기
            </button>

            <button className="w-full bg-secondary text-secondary-foreground py-3 rounded-2xl transition-transform active:scale-95">
              내 일정 다시 입력하기
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="size-full min-h-screen bg-background overflow-y-auto">
      <div className="hidden lg:block">
        <Sidebar currentPage={activeTab} onNavigate={navigateToTab} />
      </div>

      <div className="lg:pl-[272px]">
        <Header
          onNotificationClick={() => setShowNotifications(true)}
          onDMClick={() => setShowDMList(true)}
        />

      <main className="max-w-md lg:max-w-[1440px] mx-auto px-4 lg:px-8 pt-24 lg:pt-28 pb-28 lg:pb-16">
        <div className="space-y-4">
          {activeTab === 'home' && (
            <HomeExperience
              meetups={myMeetups}
              onCreate={() => setShowCreateMeetup(true)}
              onOpenMap={() => navigateToTab('map')}
              onSelect={(item) => {
                const meetup = myMeetups.find(candidate => candidate.id === item.id);
                if (meetup) {
                  openMeetup(meetup);
                }
              }}
            />
          )}

          {activeTab === '__legacy_home' && (
            <>
              {/* Active Meetups - Horizontal Scroll */}
              <section>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-primary font-medium mb-1">좋은 아침이에요 👋</p>
                    <h2 className="text-2xl font-semibold tracking-tight">오늘도 모임을 가볍게 시작해요</h2>
                  </div>
                  <button
                    onClick={() => setShowCreateMeetup(true)}
                    className="hidden lg:block text-sm bg-primary text-primary-foreground px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    새 모임 만들기
                  </button>
                </div>
                <div className="-mx-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory lg:mx-0 lg:overflow-visible">
                  <div className="flex gap-3 px-4 lg:px-0 lg:grid lg:grid-cols-3">
                    {meetups.map((meetup, index) => (
                      <button
                        key={meetup.id}
                        onClick={() => {
                          setSelectedMeetup(meetup);
                          setShowMeetupDetail(true);
                        }}
                        className="flex-shrink-0 w-64 snap-center text-left lg:w-auto"
                      >
                        <ActiveMeetupCard
                          name={meetup.name}
                          region={meetup.region}
                          members={meetup.members}
                          color="bg-primary text-white"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Feed Posts - Vertical Scroll */}
              <section className="lg:max-w-3xl lg:mt-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">커뮤니티</p>
                    <h2>최근 게시글</h2>
                  </div>
                  <button className="text-sm text-primary">전체보기</button>
                </div>
                <div className="space-y-4">
                  <FeedPost
                    id={1}
                    author="김철수"
                    authorAvatar="👨"
                    timeAgo="10분 전"
                    content="오늘 아침 러닝 너무 좋았어요! 날씨도 딱 좋고 함께 뛰니까 더 즐겁네요 🏃‍♂️"
                    images={['img1.jpg']}
                    likes={24}
                    comments={5}
                    isLiked={false}
                  />
                  <FeedPost
                    id={2}
                    author="이영희"
                    authorAvatar="👩"
                    timeAgo="1시간 전"
                    content="주말 장거리 러닝 참여하실 분들! 올림픽공원에서 만나요~ 저는 7시까지 도착할 예정입니다 💪"
                    likes={18}
                    comments={12}
                    isLiked={true}
                  />
                  <FeedPost
                    id={3}
                    author="박민수"
                    authorAvatar="🧑"
                    timeAgo="3시간 전"
                    content="어제 개인 베스트 기록 갱신했습니다! 5km를 23분대로! 크루 여러분 덕분에 실력이 늘고 있어요 감사합니다 🎉"
                    images={['img1.jpg', 'img2.jpg']}
                    likes={45}
                    comments={18}
                    isLiked={true}
                  />
                  <FeedPost
                    id={4}
                    author="정지원"
                    authorAvatar="👨"
                    timeAgo="5시간 전"
                    content="러닝화 추천 좀 부탁드려요! 초보자인데 어떤 걸 사야할지 모르겠네요 😅"
                    likes={12}
                    comments={23}
                    isLiked={false}
                  />
                  <FeedPost
                    id={5}
                    author="최수진"
                    authorAvatar="👩"
                    timeAgo="8시간 전"
                    content="아침 6시 러닝 정말 추천합니다. 공기도 맑고 사람도 적어서 너무 좋아요!"
                    images={['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg']}
                    likes={31}
                    comments={9}
                    isLiked={false}
                  />
                </div>
              </section>
            </>
          )}

          {activeTab === 'search' && (
            <ExploreExperience
              meetups={exploreMeetups}
              onSelect={(item) => {
                const meetup = exploreMeetups.find(candidate => candidate.id === item.id);
                if (meetup) {
                  setJoinTargetMeetup(meetup);
                  setShowJoinModal(true);
                }
              }}
            />
          )}

          {activeTab === '__legacy_search' && (
            <>
              <SearchBar />

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2>내 주변 모임</h2>
                  <button
                    onClick={() => setShowCreateMeetup(true)}
                    className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    + 모임 만들기
                  </button>
                </div>
                <div className="-mx-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory lg:mx-0 lg:overflow-visible">
                  <div className="flex lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4">
                    {discoverMeetups.map((meetup) => (
                      <div key={meetup.id} className="flex-shrink-0 w-full px-4 snap-center lg:px-0">
                        <MeetupCard
                          {...meetup}
                          onScheduleClick={() => {
                            setJoinTargetMeetup(meetup);
                            setShowJoinModal(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <JoinMeetupModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                meetupName={joinTargetMeetup.name}
                meetupRegion={joinTargetMeetup.region}
                members={joinTargetMeetup.members}
                onSubmit={(greeting) => {
                  alert(`${joinTargetMeetup.name} 가입 신청이 완료되었습니다!\n\n가입 인사:\n${greeting}`);
                  setShowJoinModal(false);
                }}
              />
            </>
          )}

          <JoinMeetupModal
            isOpen={showJoinModal}
            onClose={() => setShowJoinModal(false)}
            meetupName={joinTargetMeetup.name}
            meetupRegion={joinTargetMeetup.region}
            members={joinTargetMeetup.members}
            onSubmit={(greeting) => {
              alert(`${joinTargetMeetup.name} 가입 신청이 완료되었습니다!\n\n가입 인사:\n${greeting}`);
              setShowJoinModal(false);
            }}
          />

          <ReviewModal
            isOpen={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            eventTitle={reviewTargetEvent.title}
            onSubmit={(rating, comment) => {
              setEventReviews({
                ...eventReviews,
                [reviewTargetEvent.id]: { rating, comment }
              });
              alert(`후기가 등록되었습니다!\n\n별점: ${rating}점\n후기: ${comment || '(없음)'}`);
            }}
          />

          {activeTab === 'map' && <MapPage />}

          {activeTab === 'schedule' && <ScheduleExperience onOpenMap={() => navigateToTab('map')} />}

          {activeTab === '__legacy_schedule' && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-6 h-6 text-primary" />
                <h2>내 일정</h2>
              </div>

              <div className="space-y-3">
                {/* Upcoming Events */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h4>강남 러닝 크루</h4>
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">예정</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>4월 22일 (화) 오후 7:00</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>서울 강남구</span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4>판교 개발자 스터디</h4>
                      <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">진행중</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>4월 20일 (일) 오후 2:00</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>경기 성남시</span>
                    </div>
                  </div>
                </div>

                {/* Completed Events */}
                <div>
                  <h4 className="mb-3 text-sm text-muted-foreground">완료된 일정</h4>

                  <div className="bg-card rounded-2xl border border-border overflow-hidden mb-3">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4>북한산 등산 클럽</h4>
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">완료</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>4월 12일 (토) 오전 7:00</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>서울 강북구</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        {eventReviews['event-1'] ? (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-green-700 font-medium">✓ 후기 작성완료</span>
                              <div className="flex items-center gap-1 ml-auto">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= eventReviews['event-1']!.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {eventReviews['event-1']!.comment && (
                              <p className="text-sm text-green-700 leading-relaxed">
                                "{eventReviews['event-1']!.comment}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReviewTargetEvent({ title: '북한산 등산 클럽', id: 'event-1' });
                              setShowReviewModal(true);
                            }}
                            className="w-full py-2 bg-primary text-primary-foreground rounded-xl text-sm transition-transform active:scale-95"
                          >
                            후기 작성하기
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4>홍대 독서 모임</h4>
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">완료</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>4월 8일 (화) 오후 8:00</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>서울 마포구</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        {eventReviews['event-2'] ? (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-green-700 font-medium">✓ 후기 작성완료</span>
                              <div className="flex items-center gap-1 ml-auto">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= eventReviews['event-2']!.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {eventReviews['event-2']!.comment && (
                              <p className="text-sm text-green-700 leading-relaxed">
                                "{eventReviews['event-2']!.comment}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReviewTargetEvent({ title: '홍대 독서 모임', id: 'event-2' });
                              setShowReviewModal(true);
                            }}
                            className="w-full py-2 bg-primary text-primary-foreground rounded-xl text-sm transition-transform active:scale-95"
                          >
                            후기 작성하기
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'profile' && (
            <ProfileExperience
              meetups={myMeetups}
              onSelectMeetup={(item) => {
                const meetup = myMeetups.find(candidate => candidate.id === item.id);
                if (meetup) {
                  openMeetup(meetup);
                }
              }}
              onLogout={() => {
                setAuthSession(null);
                navigateToTab('home');
              }}
            />
          )}

          {activeTab === '__legacy_profile' && (
            <div className="-mx-4 -mt-4">
              <ProfileHeader
                name="김모이지"
                bio="건강한 러닝으로 하루를 시작합니다 🏃‍♂️"
                profileImage="👤"
                mannerScore={36.5}
              />

              <div className="px-4 pt-6 pb-4 space-y-6">
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3>참여 중인 모임</h3>
                    <span className="text-sm text-muted-foreground">3개</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                    <ActiveMeetupCard
                      name="강남 러닝 크루"
                      region="서울 강남구"
                      members={145}
                      color="bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                    />
                    <ActiveMeetupCard
                      name="판교 개발자 스터디"
                      region="경기 성남시"
                      members={124}
                      color="bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                    />
                    <ActiveMeetupCard
                      name="북한산 등산 클럽"
                      region="서울 강북구"
                      members={198}
                      color="bg-gradient-to-br from-green-500 to-green-600 text-white"
                    />
                  </div>
                </section>

                <section>
                  <div className="bg-card rounded-2xl p-4 border border-border">
                    <h4 className="mb-3">활동 통계</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl text-primary mb-1">24</div>
                        <div className="text-xs text-muted-foreground">참여한 일정</div>
                      </div>
                      <div>
                        <div className="text-2xl text-primary mb-1">12</div>
                        <div className="text-xs text-muted-foreground">작성한 후기</div>
                      </div>
                      <div>
                        <div className="text-2xl text-primary mb-1">156</div>
                        <div className="text-xs text-muted-foreground">모임 친구</div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3>활동 이력</h3>
                    <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                      <Settings className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                  <ActivityTimeline />
                </section>

                <section>
                  <button
                    onClick={() => {
                      if (confirm('로그아웃 하시겠습니까?')) {
                        setAuthSession(null);
                        setActiveTab('home');
                      }
                    }}
                    className="w-full py-3 bg-secondary border-2 border-border text-foreground rounded-2xl transition-transform active:scale-95 font-medium"
                  >
                    로그아웃
                  </button>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={navigateToTab} />
      </div>
    </div>
  );
}
