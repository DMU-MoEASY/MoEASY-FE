import type { DuesMember } from './meetupOperations';

export function allocateSettlement(total: number, members: Pick<DuesMember, 'id' | 'name'>[], mode: 'EQUAL' | 'CUSTOM', amounts: Record<string, string>) {
  if (!Number.isSafeInteger(total) || total <= 0) throw new Error('총액은 1원 이상의 정수로 입력해주세요.');
  if (!members.length) throw new Error('정산 대상을 한 명 이상 선택해주세요.');
  if (mode === 'EQUAL' && total < members.length) throw new Error('총액은 정산 인원수 이상이어야 합니다.');
  const items = members.map((member, index) => ({ memberId: member.id, name: member.name, amount: mode === 'EQUAL' ? Math.floor(total / members.length) + (index < total % members.length ? 1 : 0) : Number(amounts[member.id] || 0) }));
  if (items.some(item => !Number.isSafeInteger(item.amount) || item.amount <= 0)) throw new Error('회원별 금액은 1원 이상의 정수로 입력해주세요.');
  if (items.reduce((sum, item) => sum + item.amount, 0) !== total) throw new Error('회원별 금액 합계가 총액과 일치해야 합니다.');
  return items;
}
