export type PollParticipant = { id: string; name: string };
export type SchedulePoll = {
  mode?: 'GRID';
  ownerId: string;
  participants: PollParticipant[];
  candidates: string[];
  responses: Record<string, string[]>;
  confirmedSlot?: string;
};
export function validateCandidates(candidates: string[], now = Date.now(), grid = false) {
  const unique = [...new Set(candidates)].sort();
  if (unique.length < 2 || unique.length > (grid ? 672 : 12)) throw new Error(grid ? '시간표 범위를 다시 선택해주세요.' : '서로 다른 후보 시간을 2~12개 입력해주세요.');
  if (unique.some(value => !Number.isFinite(new Date(value).getTime()) || new Date(value).getTime() <= now)) throw new Error('후보 시간은 현재 이후로 선택해주세요.');
  return unique;
}
export function recordAvailability(poll: SchedulePoll, memberId: string, slots: string[]): SchedulePoll {
  if (poll.confirmedSlot) throw new Error('이미 확정된 투표입니다.');
  if (!poll.participants.some(member => member.id === memberId)) throw new Error('이 투표의 참여 대상이 아닙니다.');
  if (slots.some(slot => !poll.candidates.includes(slot))) throw new Error('존재하지 않는 후보 시간입니다.');
  return {...poll, responses: {...poll.responses, [memberId]: [...new Set(slots)]}};
}
export function confirmAvailability(poll: SchedulePoll, memberId: string, slot: string, now = Date.now()): SchedulePoll {
  if (poll.ownerId !== memberId) throw new Error('투표를 만든 사람만 확정할 수 있습니다.');
  if (poll.confirmedSlot) throw new Error('이미 확정된 일정입니다.');
  if (!poll.candidates.includes(slot) || new Date(slot).getTime() <= now) throw new Error('현재 이후의 후보 시간을 선택해주세요.');
  return {...poll, confirmedSlot:slot};
}
