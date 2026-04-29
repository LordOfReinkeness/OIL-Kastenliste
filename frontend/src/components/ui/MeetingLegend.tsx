import { useState } from 'react';
import { MeetingBadge } from './MeetingCell';
import styles from './MeetingLegend.module.css';

interface MeetingLegendProps {
  defaultOpen?: boolean;
}

export function MeetingLegend({ defaultOpen = true }: MeetingLegendProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={styles.wrapper}>
      <button className={styles.toggle} onClick={() => setOpen(o => !o)}>
        <span className={styles.heading}>Legende</span>
        <span className={styles.chevron}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className={styles.legend}>
          <div className={styles.legendCol}>
            <span className={styles.legendTitle}>Entschuldigung</span>
            <span className={styles.legendGroup}><MeetingBadge type="excusedAbsent" label="E: abwesend" /> abwesend</span>
            <span className={styles.legendGroup}><MeetingBadge type="excusedLate" label="E: verspätet" /> verspätet</span>
            <span className={styles.legendGroup}><MeetingBadge type="lateUnexcused" label="! verspätet" /> unentschuldigt</span>
          </div>
          <div className={styles.legendCol}>
            <span className={styles.legendTitle}>Anwesenheit</span>
            <span className={styles.legendGroup}><MeetingBadge type="present" label="A ✓" /> anwesend</span>
            <span className={styles.legendGroup}><MeetingBadge type="absent" label="A ✗" /> abwesend</span>
            <span className={styles.legendGroup}><MeetingBadge type="pending" label="A —" /> ausstehend</span>
          </div>
          <div className={styles.legendCol}>
            <span className={styles.legendTitle}>Nachcheck-in</span>
            <span className={styles.legendGroup}><MeetingBadge type="present" label="N ✓" /> erledigt</span>
            <span className={styles.legendGroup}><MeetingBadge type="absent" label="N ✗" /> fehlt</span>
            <span className={styles.legendGroup}><MeetingBadge type="pending" label="N —" /> ausstehend</span>
          </div>
          <div className={styles.legendCol}>
            <span className={styles.legendTitle}>Strafstriche</span>
            <span className={styles.legendGroup}><MeetingBadge type="pillOk" label="0" /> keine</span>
            <span className={styles.legendGroup}><MeetingBadge type="pillBad" label="2" /> Anzahl</span>
          </div>
        </div>
      )}
    </div>
  );
}
