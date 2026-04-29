import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AdminStatsService } from '../../api';
import { MeetingCell } from '../../components/ui/MeetingCell';
import { MeetingLegend } from '../../components/ui/MeetingLegend';
import { EditAttendancePopup } from '../../components/popup/EditAttendancePopup';
import styles from './Overview.module.css';

interface MeetingStat {
  id: string;
  date: string;
  liveCheckedIn: boolean | null;
  postCheckedIn: boolean | null;
  isLate: boolean | null;
  excuseType: 'late' | 'absent' | null;
  infractions: number | null;
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
  current: MeetingStat | null;
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
        <MeetingLegend />
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
              <th className={`${styles.th} ${styles.summaryCol}`}>Abwesend</th>
              <th className={`${styles.th} ${styles.summaryCol}`}>Verspätet</th>
              <th className={`${styles.th} ${styles.summaryCol}`}>Entschuldigt</th>
              <th className={`${styles.th} ${styles.summaryCol} ${styles.kastenliste}`}>Strafstriche</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const byMeetingId = Object.fromEntries(
                user.meetings.map(m => [m.id, m])
              );
              const excusedCount = user.meetings.filter(m => m.excuseType === 'absent').length;
              return (
                <tr key={user.id} className={styles.row}>
                  <td className={`${styles.td} ${styles.nameCol}`}>
                    <span className={styles.fullName}>{user.lastName}, {user.firstName}</span>
                    <span className={styles.rzId}>{user.rzId}</span>
                  </td>
                  {meetings.map(m => {
                    const stat = byMeetingId[m.id];
                    return (
                      <td key={m.id} className={`${styles.td} ${styles.meetingCol}`}>
                        <button
                          className={styles.cellButton}
                          onClick={() => setEditTarget({
                            meetingId: m.id,
                            meetingDate: m.date,
                            userId: user.id,
                            userName: `${user.lastName}, ${user.firstName}`,
                            current: stat ?? null,
                          })}
                        >
                          <MeetingCell
                            liveCheckedIn={stat?.liveCheckedIn ?? null}
                            postCheckedIn={stat?.postCheckedIn ?? null}
                            isLate={stat?.isLate ?? null}
                            excuseType={stat?.excuseType ?? null}
                            infractions={stat?.infractions ?? null}
                          />
                        </button>
                      </td>
                    );
                  })}
                  <td className={`${styles.td} ${styles.summaryCol}`}>{user.stats.absent}</td>
                  <td className={`${styles.td} ${styles.summaryCol}`}>{user.stats.late}</td>
                  <td className={`${styles.td} ${styles.summaryCol}`}>{excusedCount}</td>
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
          current={editTarget.current}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); load(); }}
        />
      )}
    </div>
  );
}
