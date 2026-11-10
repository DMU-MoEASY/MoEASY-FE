import { useEffect, useState } from 'react';
import { groupMembersApi, type GroupMember } from '../services/groupMembersApi';
import { RequestError, ScreenLoading } from './ScreenStates';
export function RemoteMembersExperience({meetupId,onBack}:{meetupId:number;onBack:()=>void}){
 const [members,setMembers]=useState<GroupMember[]>();const [error,setError]=useState<unknown>();const [revision,setRevision]=useState(0);const [query,setQuery]=useState('');
 useEffect(()=>{const c=new AbortController();setError(undefined);setMembers(undefined);void groupMembersApi.list(meetupId,c.signal).then(v=>setMembers(v.members)).catch(e=>{if(!c.signal.aborted)setError(e);});return()=>c.abort();},[meetupId,revision]);
 return <main className="mx-auto max-w-4xl space-y-5 px-4 py-8"><button onClick={onBack} className="min-h-11">← 모임으로</button><h1 className="text-3xl font-semibold">모임 회원</h1><p className="text-sm text-muted-foreground">회원 목록은 백엔드 PR #35 배포 후 표시됩니다. 계정 ID와 모임 회원 ID를 구분해 사용합니다.</p>{error?<RequestError error={error} onRetry={()=>setRevision(v=>v+1)}/>:!members?<ScreenLoading/>:<><input aria-label="회원 검색" placeholder="닉네임으로 검색" value={query} onChange={e=>setQuery(e.target.value)} className="form-input"/>{members.filter(m=>m.nickname.includes(query)).map(m=><article key={m.groupMemberId} className="flex justify-between rounded-xl border border-border bg-card p-5"><strong>{m.nickname}</strong><span>{{OWNER:'모임장',MANAGER:'운영진',MEMBER:'회원'}[m.role]}</span></article>)}{!members.length&&<p>등록된 회원이 없습니다.</p>}</>}</main>;
}
