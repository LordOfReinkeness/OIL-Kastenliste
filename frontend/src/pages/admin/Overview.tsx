import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AdminStatsService, MeetingsService } from '../../api';
import { MeetingCell } from '../../components/ui/MeetingCell';
import { MeetingLegend } from '../../components/ui/MeetingLegend';
import { formatDateShort } from '../../utils/date';
import { SearchInput } from '../../components/ui/SearchInput';
import { EditAttendancePopup } from '../../components/popup/EditAttendancePopup';
import styles from './Overview.module.css';

interface MeetingStat {
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

type SortField = 'name' | 'absent' | 'late' | 'excused' | 'infractions';
type SortDir = 'asc' | 'desc';

export function Overview() {
  const { refreshKey } = useOutletContext<{ refreshKey: number }>();
  const [data, setData] = useState<UserStats[]>([]);
  const [meetingIdByDate, setMeetingIdByDate] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterHasInfractions, setFilterHasInfractions] = useState(false);
  const [filterHasExcused, setFilterHasExcused] = useState(false);
  const [filterMissedLast, setFilterMissedLast] = useState(false);

  function load(silent = false) {
    if (!silent) setLoading(true);
    Promise.all([
      AdminStatsService.adminStatsControllerGetStats(),
      MeetingsService.meetingsControllerFindAll(),
    ])
      .then(([stats, meetings]) => {
        setData(stats);
        setMeetingIdByDate(Object.fromEntries(meetings.map((m: { date: string; id: string }) => [m.date, m.id])));
      })
      .catch(() => setError('Fehler beim Laden der Statistiken.'))
      .finally(() => { if (!silent) setLoading(false); });
  }

  useEffect(() => { load(); }, [refreshKey]);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  function sortIcon(field: SortField) {
    if (sortField !== field) return <span className={styles.sortIcon}>↕</span>;
    return <span className={`${styles.sortIcon} ${styles.sortIconActive}`}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  function handleExport() {
    window.open('/api/admin/stats/export?format=csv', '_blank');
  }

  if (loading) return <p className={styles.muted}>Wird geladen…</p>;
  if (error)   return <p className={styles.muted}>{error}</p>;
  if (!data.length) return <p className={styles.muted}>Keine Daten vorhanden.</p>;

  const meetings = [...data[0].meetings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const now = new Date();
  const pastMeetings = meetings.filter(m => new Date(m.date) <= now);
  const lastMeetingDate = pastMeetings.length > 0 ? pastMeetings[pastMeetings.length - 1].date : null;

  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let users = [...data];

  if (tokens.length > 0) {
    users = users.filter(u => tokens.every(t =>
      u.firstName.toLowerCase().includes(t) ||
      u.lastName.toLowerCase().includes(t) ||
      u.rzId.toLowerCase().includes(t)
    ));
  }
  if (filterHasInfractions) {
    users = users.filter(u => u.stats.infractions > 0);
  }

  if (filterHasExcused) {
    users = users.filter(u => u.meetings.some(m => m.excuseType === 'absent'));
  }
  if (filterMissedLast && lastMeetingDate) {
    users = users.filter(u => {
      const stat = u.meetings.find(m => m.date === lastMeetingDate);
      return stat?.liveCheckedIn !== true;
    });
  }

  users.sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'name':        cmp = a.lastName.localeCompare(b.lastName); break;
      case 'absent':      cmp = a.stats.absent - b.stats.absent; break;
      case 'late':        cmp = a.stats.late - b.stats.late; break;
      case 'excused':     cmp = a.meetings.filter(m => m.excuseType === 'absent').length - b.meetings.filter(m => m.excuseType === 'absent').length; break;
      case 'infractions': cmp = a.stats.infractions - b.stats.infractions; break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const isFiltered = tokens.length > 0 || filterHasInfractions || filterHasExcused || filterMissedLast;

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

      <div className={styles.controlsRow}>
        <SearchInput value={query} onChange={setQuery} />
        <div className={styles.filterBar}>
          <button
            className={`${styles.filterToggle} ${filterHasInfractions ? styles.filterActive : ''}`}
            onClick={() => setFilterHasInfractions(f => !f)}
          >
            Strafstriche
          </button>
          <button
            className={`${styles.filterToggle} ${filterHasExcused ? styles.filterActive : ''}`}
            onClick={() => setFilterHasExcused(f => !f)}
          >
            Entschuldigt
          </button>
          <button
            className={`${styles.filterToggle} ${filterMissedLast ? styles.filterActive : ''}`}
            onClick={() => setFilterMissedLast(f => !f)}
          >
            Zuletzt fehlend
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={`${styles.th} ${styles.nameCol}`}>
                <button className={`${styles.sortButton} ${sortField === 'name' ? styles.sortActive : ''}`} onClick={() => handleSort('name')}>
                  Name {sortIcon('name')}
                </button>
              </th>
              {meetings.map(m => (
                <th key={m.date} className={`${styles.th} ${styles.meetingCol}`}>
                  {formatDateShort(m.date)}
                </th>
              ))}
              <th className={`${styles.th} ${styles.summaryCol}`}>
                <button className={`${styles.sortButton} ${sortField === 'absent' ? styles.sortActive : ''}`} onClick={() => handleSort('absent')}>
                  Abwesend {sortIcon('absent')}
                </button>
              </th>
              <th className={`${styles.th} ${styles.summaryCol}`}>
                <button className={`${styles.sortButton} ${sortField === 'late' ? styles.sortActive : ''}`} onClick={() => handleSort('late')}>
                  Verspätet {sortIcon('late')}
                </button>
              </th>
              <th className={`${styles.th} ${styles.summaryCol}`}>
                <button className={`${styles.sortButton} ${sortField === 'excused' ? styles.sortActive : ''}`} onClick={() => handleSort('excused')}>
                  Entschuldigt {sortIcon('excused')}
                </button>
              </th>
              <th className={`${styles.th} ${styles.summaryCol} ${styles.kastenliste}`}>
                <button className={`${styles.sortButton} ${sortField === 'infractions' ? styles.sortActive : ''}`} onClick={() => handleSort('infractions')}>
                  Strafstriche {sortIcon('infractions')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const byMeetingDate = Object.fromEntries(
                user.meetings.map(m => [m.date, m])
              );
              const excusedCount = user.meetings.filter(m => m.excuseType === 'absent').length;
              return (
                <tr key={user.id} className={styles.row}>
                  <td className={`${styles.td} ${styles.nameCol}`}>
                    <span className={styles.fullName}>{user.lastName}, {user.firstName}</span>
                    <span className={styles.rzId}>{user.rzId}</span>
                  </td>
                  {meetings.map(m => {
                    const stat = byMeetingDate[m.date];
                    const meetingId = meetingIdByDate[m.date];
                    return (
                      <td key={m.date} className={`${styles.td} ${styles.meetingCol}`}>
                        <button
                          className={styles.cellButton}
                          onClick={() => setEditTarget({
                            meetingId,
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

      <p className={styles.summaryLine}>
        {isFiltered
          ? `${users.length} von ${data.length} Mitgliedern`
          : `${users.length} Mitglieder`}
        {' · '}{meetings.length} Meetings
      </p>

      {editTarget && (
        <EditAttendancePopup
          meetingId={editTarget.meetingId}
          meetingDate={editTarget.meetingDate}
          userId={editTarget.userId}
          userName={editTarget.userName}
          current={editTarget.current}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); load(true); }}
        />
      )}
    </div>
  );
}
