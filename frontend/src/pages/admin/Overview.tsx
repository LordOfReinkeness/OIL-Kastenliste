import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AdminStatsService } from '../../api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EditAttendancePopup } from '../../components/popup/EditAttendancePopup';
import styles from './Overview.module.css';

interface MeetingStat {
  id: string;
  date: string;
  infraction: 'none' | 'late' | 'absent' | 'pending';
}

interface UserStats {
  id: string;
  rzId: string;
  firstName: string;
  lastName: string;
  stats: {
    totalMeetings: number;
    absent: number;
    late: number;
    infractions: number;
  };
  meetings: MeetingStat[];
}

interface EditTarget {
  meetingId: string;
  meetingDate: string;
  userId: string;
  userName: string;
}

function shortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

export function Overview() {
  const { refreshKey } = useOutletContext<{ refreshKey: number }>();
  const [data, setData] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  function load() {
    setLoading(true);
    AdminStatsService.adminStatsControllerGetStats()
      .then(setData)
      .catch(() => setError('Fehler beim Laden der Statistiken.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [refreshKey]);

  function handleExport() {
    window.open('/api/admin/stats/export?format=csv', '_blank');
  }

  if (loading) return <p className={styles.muted}>Wird geladen…</p>;
  if (error)   return <p className={styles.muted}>{error}</p>;
  if (!data.length) return <p className={styles.muted}>Keine Daten vorhanden.</p>;

  const meetings = [...data[0].meetings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const users = [...data].sort((a, b) => a.lastName.localeCompare(b.lastName));

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.legend}>
          <StatusBadge infraction="none" />    <span>Anwesend</span>
          <StatusBadge infraction="late" />    <span>Verspätet</span>
          <StatusBadge infraction="absent" />  <span>Abwesend</span>
          <StatusBadge infraction="pending" /> <span>Ausstehend</span>
        </div>
        <div className={styles.exportButtons}>
          <button className={styles.exportButton} onClick={handleExport}>
            Export CSV
          </button>
          <button className={styles.exportButton} onClick={() => window.open('/api/admin/stats/export?format=xlsx', '_blank')}>
            Export Excel
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={`${styles.th} ${styles.nameCol}`}>Name</th>
              {meetings.map(m => (
                <th key={m.id} className={`${styles.th} ${styles.meetingCol}`}>
                  {shortDate(m.date)}
                </th>
              ))}
              <th className={`${styles.th} ${styles.summaryCol}`}>Meetings</th>
              <th className={`${styles.th} ${styles.summaryCol}`}>Abwesend</th>
              <th className={`${styles.th} ${styles.summaryCol}`}>Verspätet</th>
              <th className={`${styles.th} ${styles.summaryCol} ${styles.kastenliste}`}>Kasten</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const byMeetingId = Object.fromEntries(
                user.meetings.map(m => [m.id, m.infraction])
              );
              return (
                <tr key={user.id} className={styles.row}>
                  <td className={`${styles.td} ${styles.nameCol}`}>
                    <span className={styles.fullName}>{user.lastName}, {user.firstName}</span>
                    <span className={styles.rzId}>{user.rzId}</span>
                  </td>
                  {meetings.map(m => (
                    <td key={m.id} className={`${styles.td} ${styles.meetingCol}`}>
                      <button
                        className={styles.cellButton}
                        onClick={() => setEditTarget({
                          meetingId: m.id,
                          meetingDate: m.date,
                          userId: user.id,
                          userName: `${user.lastName}, ${user.firstName}`,
                        })}
                      >
                        <StatusBadge infraction={byMeetingId[m.id] ?? 'pending'} />
                      </button>
                    </td>
                  ))}
                  <td className={`${styles.td} ${styles.summaryCol}`}>{user.stats.totalMeetings}</td>
                  <td className={`${styles.td} ${styles.summaryCol}`}>{user.stats.absent}</td>
                  <td className={`${styles.td} ${styles.summaryCol}`}>{user.stats.late}</td>
                  <td className={`${styles.td} ${styles.summaryCol} ${styles.kastenliste}`}>{user.stats.infractions}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <EditAttendancePopup
          meetingId={editTarget.meetingId}
          meetingDate={editTarget.meetingDate}
          userId={editTarget.userId}
          userName={editTarget.userName}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); load(); }}
        />
      )}
    </div>
  );
}
