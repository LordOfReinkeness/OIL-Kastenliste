import { ExcuseType } from './user-meeting.entity';

export interface InfractionInput {
  isLate: boolean | null;
  liveCheckedInAt: Date | null;
  postCheckedInAt: Date | null;
  excuseType: ExcuseType | null;
}

export function computeInfractions(record: InfractionInput, capInfractions: boolean): number {
  let count = 0;
  if (record.isLate && record.excuseType !== ExcuseType.LATE) count++;
  if (!record.liveCheckedInAt && record.excuseType !== ExcuseType.ABSENT) count++;
  if (!record.postCheckedInAt && record.excuseType !== ExcuseType.ABSENT) count++;
  return capInfractions ? Math.min(count, 1) : count;
}
