import type { Attendance } from './pendingBackendApi';
export type RecordedAttendance = 'PRESENT'|'LATE'|'ABSENT';
// UNRECORDED is a valid response state, but must be omitted from replacement input.
export function attendanceEntries(members: Attendance['members']): {groupMemberId:number;status:RecordedAttendance}[] {
  return members.flatMap(member => member.status === 'UNRECORDED' ? [] : [{ groupMemberId:member.groupMemberId, status:member.status }]);
}
