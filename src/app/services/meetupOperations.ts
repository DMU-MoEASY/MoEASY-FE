import { persistenceStore } from '../lib/persistence';

export type ClubSchedule = {
  id: string | number;
  date: string;
  dateValue: string;
  title: string;
  time: string;
  place: string;
  attending: boolean;
  source?: 'chat' | 'schedule';
  chatMessageId?: string;
};

export type GlobalScheduleEvent = {
  id: string | number;
  dateValue: string;
  day: string;
  dow: string;
  title: string;
  group: string;
  time: string;
  place: string;
  color: string;
  attending: boolean;
  meetupId?: string | number;
  chatMessageId?: string;
};

export type DuesMember = {
  id: string;
  name: string;
  role: string;
  paid: boolean;
  paidAt?: string;
  lastRemindedAt?: string;
};

export type SettlementRecord = {
  id: string;
  chatMessageId: string;
  title: string;
  totalAmount: number;
  participants: number;
  shareAmount: number;
  paidCount: number;
  completed: boolean;
  createdAt: string;
  source: 'chat';
};

export type TransferRecord = {
  id: string;
  chatMessageId: string;
  recipient: string;
  amount: number;
  memo: string;
  completed: boolean;
  createdAt: string;
  source: 'chat';
};

export type DuesManagementState = {
  title: string;
  amount: number;
  dueDate: string;
  account: string;
  members: DuesMember[];
  settlements?: SettlementRecord[];
  transfers?: TransferRecord[];
};

export const INITIAL_CLUB_SCHEDULES: ClubSchedule[] = [
  { id: 1, date: '9월 9일 화요일', dateValue: '2026-09-09', title: '주간 정기 모임', time: '19:30', place: '반포 한강공원', attending: true },
  { id: 2, date: '9월 14일 월요일', dateValue: '2026-09-14', title: '주말 특별 모임', time: '07:00', place: '올림픽공원', attending: false },
  { id: 3, date: '9월 20일 일요일', dateValue: '2026-09-20', title: '신입 멤버 환영회', time: '18:00', place: '강남역 11번 출구', attending: true },
];

export const INITIAL_GLOBAL_SCHEDULES: GlobalScheduleEvent[] = [
  { id: 1, dateValue: '2026-09-09', day: '09', dow: '수', title: '주간 러닝 모임', group: '강남 러닝 크루', time: '19:30', place: '반포 한강공원', color: 'bg-blue-500', attending: true },
  { id: 2, dateValue: '2026-09-12', day: '12', dow: '토', title: '프론트엔드 아키텍처', group: '판교 개발자 스터디', time: '20:00', place: '스타트업캠퍼스', color: 'bg-violet-500', attending: true },
  { id: 3, dateValue: '2026-09-14', day: '14', dow: '월', title: '초보자 백운대 코스', group: '북한산 등산 클럽', time: '08:00', place: '북한산 우이역', color: 'bg-emerald-500', attending: true },
];

export const INITIAL_DUES_STATE: DuesManagementState = {
  title: '9월 정기 회비',
  amount: 15000,
  dueDate: '2026-09-30',
  account: '카카오뱅크 3333-01-1234567 김모이지',
  members: [
    { id: 'member-1', name: '김모이지', role: '모임장', paid: true, paidAt: '2026-09-03' },
    { id: 'member-2', name: '김철수', role: '운영진', paid: true, paidAt: '2026-09-04' },
    { id: 'member-3', name: '이영희', role: '멤버', paid: true, paidAt: '2026-09-05' },
    { id: 'member-4', name: '박민수', role: '멤버', paid: true, paidAt: '2026-09-06' },
    { id: 'member-5', name: '최수진', role: '멤버', paid: true, paidAt: '2026-09-07' },
    { id: 'member-6', name: '강동욱', role: '멤버', paid: true, paidAt: '2026-09-09' },
    { id: 'member-7', name: '윤서연', role: '멤버', paid: true, paidAt: '2026-09-12' },
    { id: 'member-8', name: '조현우', role: '멤버', paid: true, paidAt: '2026-09-15' },
    { id: 'member-9', name: '한지민', role: '멤버', paid: false },
    { id: 'member-10', name: '오세훈', role: '멤버', paid: false },
  ],
  settlements: [],
  transfers: [],
};

export const meetupScheduleKey = (meetupId: string | number) => `moeasy:meetup:${meetupId}:schedules`;
export const meetupFinanceKey = (meetupId: string | number) => `moeasy:dues-management:${meetupId}`;
export const meetupChatKey = (meetupId: string | number) => `moeasy:group-chat:${meetupId}`;
export const globalScheduleKey = 'moeasy:scheduleEvents';

function formatClubDate(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${weekday}요일`;
}

function normalizeFinance(value?: DuesManagementState): DuesManagementState {
  return {
    ...INITIAL_DUES_STATE,
    ...value,
    members: value?.members ?? INITIAL_DUES_STATE.members,
    settlements: value?.settlements ?? [],
    transfers: value?.transfers ?? [],
  };
}

export function linkScheduleFromChat({ meetupId, meetupName, chatMessageId, title, dateValue, time, place, attending }: {
  meetupId: string | number;
  meetupName: string;
  chatMessageId: string;
  title: string;
  dateValue: string;
  time: string;
  place: string;
  attending: boolean;
}) {
  const clubSchedule: ClubSchedule = {
    id: `chat-schedule-${chatMessageId}`,
    date: formatClubDate(dateValue),
    dateValue,
    title,
    time,
    place,
    attending,
    source: 'chat',
    chatMessageId,
  };
  const clubSchedules = persistenceStore.read<ClubSchedule[]>(meetupScheduleKey(meetupId)) ?? INITIAL_CLUB_SCHEDULES;
  persistenceStore.write(meetupScheduleKey(meetupId), [...clubSchedules.filter(item => item.chatMessageId !== chatMessageId), clubSchedule]);

  const date = new Date(`${dateValue}T00:00:00`);
  const globalSchedule: GlobalScheduleEvent = {
    id: `chat-schedule-${chatMessageId}`,
    dateValue,
    day: String(date.getDate()).padStart(2, '0'),
    dow: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()] ?? '',
    title,
    group: meetupName,
    time,
    place,
    color: 'bg-violet-500',
    attending,
    meetupId,
    chatMessageId,
  };
  const globalSchedules = persistenceStore.read<GlobalScheduleEvent[]>(globalScheduleKey) ?? INITIAL_GLOBAL_SCHEDULES;
  persistenceStore.write(globalScheduleKey, [...globalSchedules.filter(item => item.chatMessageId !== chatMessageId), globalSchedule].sort((a, b) => a.dateValue.localeCompare(b.dateValue)));
}

export function syncScheduleAttendance(meetupId: string | number, chatMessageId: string, attending: boolean) {
  const clubSchedules = persistenceStore.read<ClubSchedule[]>(meetupScheduleKey(meetupId)) ?? INITIAL_CLUB_SCHEDULES;
  persistenceStore.write(meetupScheduleKey(meetupId), clubSchedules.map(item => item.chatMessageId === chatMessageId ? { ...item, attending } : item));
  const globalSchedules = persistenceStore.read<GlobalScheduleEvent[]>(globalScheduleKey) ?? INITIAL_GLOBAL_SCHEDULES;
  persistenceStore.write(globalScheduleKey, globalSchedules.map(item => item.chatMessageId === chatMessageId ? { ...item, attending } : item));
}

export function linkSettlementFromChat(meetupId: string | number, record: SettlementRecord) {
  const finance = normalizeFinance(persistenceStore.read<DuesManagementState>(meetupFinanceKey(meetupId)));
  persistenceStore.write(meetupFinanceKey(meetupId), {
    ...finance,
    settlements: [...(finance.settlements ?? []).filter(item => item.chatMessageId !== record.chatMessageId), record],
  });
}

export function linkTransferFromChat(meetupId: string | number, record: TransferRecord) {
  const finance = normalizeFinance(persistenceStore.read<DuesManagementState>(meetupFinanceKey(meetupId)));
  persistenceStore.write(meetupFinanceKey(meetupId), {
    ...finance,
    transfers: [...(finance.transfers ?? []).filter(item => item.chatMessageId !== record.chatMessageId), record],
  });
}

export function syncFinanceCompletion(meetupId: string | number, chatMessageId: string, completed: boolean, paidCount?: number) {
  const finance = normalizeFinance(persistenceStore.read<DuesManagementState>(meetupFinanceKey(meetupId)));
  persistenceStore.write(meetupFinanceKey(meetupId), {
    ...finance,
    settlements: (finance.settlements ?? []).map(item => item.chatMessageId === chatMessageId ? { ...item, completed, paidCount: paidCount ?? item.paidCount } : item),
    transfers: (finance.transfers ?? []).map(item => item.chatMessageId === chatMessageId ? { ...item, completed } : item),
  });
}

export function patchLinkedChatMessage(meetupId: string | number, chatMessageId: string, patch: Record<string, unknown>) {
  const messages = persistenceStore.read<Array<Record<string, unknown>>>(meetupChatKey(meetupId)) ?? [];
  persistenceStore.write(meetupChatKey(meetupId), messages.map(message => message.id === chatMessageId ? { ...message, ...patch } : message));
}
