import { ExcuseType } from './user-meeting.entity';

export interface InfractionInput {
  isLate: boolean | null;
  liveCheckedInAt: Date | null;
  postCheckedInAt: Date | null;
  excuseType: ExcuseType | null;
  liveCheckinDeadline: Date; // meeting.date + checkinWindowMinutes
  checkinDeadline: Date;     // post check-in deadline
}

export function computeInfractions(record: InfractionInput, capInfractions: boolean): number {
  const now = new Date();
  const liveWindowClosed = now >= record.liveCheckinDeadline;
  const postWindowClosed = now >= record.checkinDeadline;
  let count = 0;

  // Late without a late excuse → infraction
  if (record.isLate && record.excuseType !== ExcuseType.LATE) count++;

  // Missed live check-in without an absent excuse → infraction
  // Only counted once the live check-in window has closed.
  if (liveWindowClosed && !record.liveCheckedInAt && record.excuseType !== ExcuseType.ABSENT) count++;

  // Missed live check-in and didn't do post check-in → infraction
  // Post check-in is the required substitute for attending in person.
  // No excuse type waives this — an absent excuse only covers the live check-in above.
  // Only counted once the post check-in window has closed.
  if (postWindowClosed && !record.liveCheckedInAt && !record.postCheckedInAt) count++;

  return capInfractions ? Math.min(count, 1) : count;
}
