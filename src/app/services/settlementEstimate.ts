import type { GroupMember } from './groupMembersApi';
// Display-only estimate. Server preview is required again before creation.
export function estimateSettlement(total:number,members:GroupMember[],selected:number[],custom:boolean,amounts:Record<number,string>) {
  if(!Number.isSafeInteger(total)||total<=0)return {items:[],error:'총액을 입력하면 분할 금액을 확인할 수 있습니다.'};
  const targets=members.filter(member=>selected.includes(member.groupMemberId)).sort((a,b)=>a.groupMemberId-b.groupMemberId);
  if(!targets.length)return {items:[],error:'함께 결제한 모임 회원을 선택해주세요.'};
  const items=targets.map((member,index)=>({groupMemberId:member.groupMemberId,nickname:member.nickname,amount:custom?Number(amounts[member.groupMemberId]||0):Math.floor(total/targets.length)+(index<total%targets.length?1:0)}));
  const sum=items.reduce((value,item)=>value+item.amount,0);
  return {items,error:items.some(item=>!Number.isSafeInteger(item.amount)||item.amount<0)?'회원별 금액을 원 단위 정수로 입력해주세요.':sum!==total?`개별 금액 합계가 총액과 ${(total-sum).toLocaleString()}원 차이 납니다.`:undefined};
}
