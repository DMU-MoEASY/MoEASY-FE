import { useEffect, useState } from 'react';
import { groupMembersApi, type GroupMember } from '../services/groupMembersApi';
import { persistenceStore } from '../lib/persistence';
export function useGroupMembership(groupId: string | number) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<unknown>();
  const [revision, setRevision] = useState(0);
  const memberId = persistenceStore.read<{ memberId: number }>('moeasy:authSession')?.memberId;
  useEffect(() => {
    const controller = new AbortController(); setLoaded(false); setMembers([]); setError(undefined);
    void groupMembersApi.list(groupId, controller.signal).then(value => {
      if (!controller.signal.aborted) { setMembers(value.members); setLoaded(true); }
    }).catch(e => { if (!controller.signal.aborted) setError(e); });
    return () => controller.abort();
  }, [groupId, memberId, revision]);
  const role = loaded ? members.find(member => member.memberId === memberId)?.role : undefined;
  return { members, role, loaded, error, canManage: role === 'OWNER' || role === 'MANAGER', retry: () => setRevision(value => value + 1) };
}
