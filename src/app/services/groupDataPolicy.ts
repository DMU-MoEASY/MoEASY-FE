export type GroupOrigin = {source?:'api';ownerMemberId?:number};
export function visibleServerGroups<T extends GroupOrigin>(groups:T[],memberId:number|undefined):T[] {
  return memberId===undefined || !Array.isArray(groups) ? [] : groups.filter(group=>group?.source==='api'&&group.ownerMemberId===memberId);
}
