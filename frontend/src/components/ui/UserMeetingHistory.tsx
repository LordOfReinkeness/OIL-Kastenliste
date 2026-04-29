import { useState } from 'react';
import styles from './UserMeetingHistory.module.css';

interface MeetingEntry {
  date: string;
  infractions: number | null;
}

interface UserMeetingHistoryProps {
  meetings: MeetingEntry[];
  totalInfractions: number;
  defaultOpen?: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function UserMeetingHistory({ meetings, totalInfractions, defaultOpen = false }: UserMeetingHistoryProps) {
  const [open, setOpen] = useState(defaultOpen);

  const sorted = [...meetings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className={styles.wrapper}>
      <button className={styles.toggle} onClick={() => setOpen(o => !o)}>
        <span className={styles.heading}>Meine Strafstriche</span>
        <span className={styles.headerRight}>
          <span className={totalInfractions > 0 ? styles.bad : styles.ok}>
            {totalInfractions} gesamt
          </span>
          <span className={styles.chevron}>{open ? '▲' : '▼'}</span>
        </span>
      </button>

      {open && (
        <table className={styles.table}>
          <tbody>
            {sorted.map(m => {
              const pending = m.infractions === null;
              return (
                <tr key={m.date} className={styles.row}>
                  <td className={styles.dateCell}>{formatDate(m.date)}</td>
                  <td className={styles.valueCell}>
                    {pending ? (
                      <span className={styles.pending}>Ausstehend</span>
                    ) : m.infractions === 0 ? (
                      <span className={styles.ok}>0</span>
                    ) : (
                      <span className={styles.bad}>{m.infractions}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
