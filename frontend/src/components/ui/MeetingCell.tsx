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
  layout?: 'compact' | 'expanded';
}

export function MeetingCell({ liveCheckedIn, postCheckedIn, isLate, excuseType, infractions, layout = 'compact' }: MeetingCellProps) {
  const exp = layout === 'expanded';
  const isExcusedAbsent  = excuseType === 'absent';
  const isExcusedLate    = excuseType === 'late';
  const isLateUnexcused  = isLate && !excuseType;

  const badgeCls = (type: string) =>
    [styles.badge, styles[type], exp ? styles.badgeExpanded : ''].join(' ');

  const excuseBadge = isExcusedAbsent ? (
    <span className={badgeCls('excusedAbsent')}>{exp ? 'Entschuldigt: abwesend' : 'E: abwesend'}</span>
  ) : isExcusedLate ? (
    <span className={badgeCls('excusedLate')}>{exp ? 'Entschuldigt: verspätet' : 'E: verspätet'}</span>
  ) : isLateUnexcused ? (
    <span className={badgeCls('lateUnexcused')}>{exp ? 'Unentschuldigt verspätet' : '! verspätet'}</span>
  ) : null;

  const liveBadge = !isExcusedAbsent ? (
    liveCheckedIn === true  ? <span className={badgeCls('present')}>{exp ? 'Anwesend' : 'A ✓'}</span> :
    liveCheckedIn === false ? <span className={badgeCls('absent')}>{exp ? 'Abwesend' : 'A ✗'}</span> :
                              <span className={badgeCls('pending')}>{exp ? 'Ausstehend' : 'A —'}</span>
  ) : null;

  const postBadge = liveCheckedIn !== true ? (
    postCheckedIn === true  ? <span className={badgeCls('present')}>{exp ? 'Nachcheck-in ✓' : 'N ✓'}</span> :
    postCheckedIn === false ? <span className={badgeCls('absent')}>{exp ? 'Nachcheck-in fehlt' : 'N ✗'}</span> :
                              <span className={badgeCls('pending')}>{exp ? 'Nachcheck-in ausstehend' : 'N —'}</span>
  ) : null;

  const pillCls = (type: string) =>
    [styles.pill, styles[type], exp ? styles.pillExpanded : ''].join(' ');

  const pill = infractions === null
    ? <span className={pillCls('pillPending')}>{exp ? '— Strafstriche' : '—'}</span>
    : infractions === 0
    ? <span className={pillCls('pillOk')}>{exp ? '0 Strafstriche' : '0'}</span>
    : <span className={pillCls('pillBad')}>{exp ? `${infractions} Strafstriche` : infractions}</span>;

  return (
    <div className={`${styles.cell} ${exp ? styles.cellExpanded : ''}`}>
      <div className={`${styles.badges} ${exp ? styles.badgesExpanded : ''}`}>
        {excuseBadge}
        {liveBadge}
        {postBadge}
      </div>
      {pill}
    </div>
  );
}
