import { useEffect, useState } from 'react';
import { groupMembersApi } from '../services/groupMembersApi';
import { persistenceStore } from '../lib/persistence';
import { ApiError } from '../lib/apiClient';
import { usePersistentState } from './usePersistentState';

// There is no /members/me profile GET yet. A membership can establish only
// the nickname, and only when its account memberId matches the login session.
export function useOwnMemberNickname(memberId: number | undefined, groupIds: number[], enabled: boolean) {
  const [cache,setCache]=usePersistentState<Record<string,{nickname:string;verifiedAt:string}>>('moeasy:server-member-nicknames',{});
  const [loading,setLoading]=useState(false);
  const groups=[...new Set(groupIds)].sort((a,b)=>a-b).join(',');
  useEffect(()=>{
    if(!enabled||memberId===undefined||!groups){setLoading(false);return;}
    const controller=new AbortController();setLoading(true);
    void (async()=>{
      try {
        for(const id of groups.split(',').map(Number)) {
          try {
            const result=await groupMembersApi.list(id,controller.signal);
            const own=result.members.find(member=>member.memberId===memberId);
            if(own?.nickname.trim()) {
              if(!controller.signal.aborted&&persistenceStore.read<{memberId:number}>('moeasy:authSession')?.memberId===memberId)
                setCache(current=>({...current,[String(memberId)]:{nickname:own.nickname.trim(),verifiedAt:new Date().toISOString()}}));
              break;
            }
          } catch(error) { if(controller.signal.aborted||error instanceof ApiError&&error.status===401)break; }
        }
      } finally { if(!controller.signal.aborted)setLoading(false); }
    })();
    return()=>controller.abort();
  },[enabled,memberId,groups,setCache]);
  return { nickname:enabled&&memberId!==undefined?cache[String(memberId)]?.nickname:undefined,loading };
}
