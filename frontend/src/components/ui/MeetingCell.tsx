import styles from './MeetingCell.module.css';

export function MeetingBadge({ type, label }: { type: 'present' | 'absent' | 'pending' | 'excusedAbsent' | 'excusedLate' | 'lateUnexcused' | 'pillOk' | 'pillBad' | 'pillPending'; label: string }) {
  const isPill = type.startsWith('pill');
  return <span className={`${isPill ? styles.pill : styles.badge} ${styles[type]}`}>{label}</span>;
}

interface MeetingCellProps {
  liveCheckedIn: boolean | null;
  postCheckedIn: boolean | null;
  isLate: boolean | null;
  excuseType: 'late' | 'absent' | null;
  infractions: number | null;
}

export function MeetingCell({ liveCheckedIn, postCheckedIn, isLate, excuseType, infractions }: MeetingCellProps) {
  const isExcusedAbsent = excuseType === 'absent';
  const isExcusedLate   = excuseType === 'late';
  const isLateUnexcused = isLate && !excuseType;

  const excuseBadge = isExcusedAbsent ? (
    <span className={`${styles.badge} ${styles.excusedAbsent}`}>E: abwesend</span>
  ) : isExcusedLate ? (
    <span className={`${styles.badge} ${styles.excusedLate}`}>E: verspätet</span>
  ) : isLateUnexcused ? (
    <span className={`${styles.badge} ${styles.lateUnexcused}`}>! verspätet</span>
  ) : null;

  const liveBadge = !isExcusedAbsent ? (
    liveCheckedIn === true  ? <span className={`${styles.badge} ${styles.present}`}>L ✓</span> :
    liveCheckedIn === false ? <span className={`${styles.badge} ${styles.absent}`}>L ✗</span> :
                              <span className={`${styles.badge} ${styles.pending}`}>L —</span>
  ) : null;

  const postBadge = liveCheckedIn !== true ? (
    postCheckedIn === true  ? <span className={`${styles.badge} ${styles.present}`}>P ✓</span> :
    postCheckedIn === false ? <span className={`${styles.badge} ${styles.absent}`}>P ✗</span> :
                              <span className={`${styles.badge} ${styles.pending}`}>P —</span>
  ) : null;

  const pill = infractions === null
    ? <span className={`${styles.pill} ${styles.pillPending}`}>—</span>
    : infractions === 0
    ? <span className={`${styles.pill} ${styles.pillOk}`}>0</span>
    : <span className={`${styles.pill} ${styles.pillBad}`}>{infractions}</span>;

  return (
    <div className={styles.cell}>
      <div className={styles.badges}>
        {excuseBadge}
        {liveBadge}
        {postBadge}
      </div>
      {pill}
    </div>
  );
}
