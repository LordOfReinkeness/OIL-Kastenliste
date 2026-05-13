import { useEffect, useState } from 'react';
import { MeetingsService, AttendanceService } from '../../api';
import { SearchInput } from '../../components/ui/SearchInput';
import { formatDateTime } from '../../utils/date';
import styles from './Standup.module.css';

interface Meeting {
  id: string;
  date: string;
}

interface StandupEntry {
  userId: string;
  firstName: string;
  lastName: string;
  rzId: string;
  excusedAt: string;
  statusLastWeek: string | null;
  statusNextWeek: string | null;
  statusProblems: string | null;
}

export function AdminStandup() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [entries, setEntries] = useState<StandupEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    MeetingsService.meetingsControllerFindAll().then(all => {
      const sorted = (all as Meeting[])
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMeetings(sorted);
      const now = new Date();
      const next = sorted.slice().reverse().find(m => new Date(m.date) >= now);
      setSelectedId((next ?? sorted[0])?.id ?? '');
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    AttendanceService.attendanceControllerGetAttendance(selectedId)
      .then((res: any) => {
        const absent: StandupEntry[] = (res.attendance ?? [])
          .filter((r: any) => r.excuseType === 'absent' && r.excusedAt)
          .map((r: any) => ({
            userId: r.userId,
            firstName: r.firstName,
            lastName: r.lastName,
            rzId: r.rzId,
            excusedAt: r.excusedAt,
            statusLastWeek: r.statusLastWeek ?? null,
            statusNextWeek: r.statusNextWeek ?? null,
            statusProblems: r.statusProblems ?? null,
          }));
        setEntries(absent);
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    return (
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.rzId.toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <select
          className={styles.select}
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          {meetings.map(m => (
            <option key={m.id} value={m.id}>
              {formatDateTime(m.date)}
            </option>
          ))}
        </select>
        <SearchInput value={search} onChange={setSearch} />
        {!loading && selectedId && (
          <span className={styles.summary}>
            {filtered.length === 0 ? 'Keine Statusmeldungen' : `${filtered.length} Abwesende${filtered.length === 1 ? 'r' : ''}`}
          </span>
        )}
      </div>

      {loading && <p className={styles.muted}>Laden…</p>}

      <div className={styles.list}>
        {filtered.map(entry => (
          <div key={entry.userId} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.name}>{entry.firstName} {entry.lastName}</span>
              <span className={styles.rzId}>{entry.rzId}</span>
              <span className={styles.excusedAt}>eingereicht {formatDateTime(entry.excusedAt)}</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Letzte Woche</span>
                <p className={styles.sectionText}>{entry.statusLastWeek ?? <em>–</em>}</p>
              </div>
              <div className={styles.divider} />
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Diese Woche</span>
                <p className={styles.sectionText}>{entry.statusNextWeek ?? <em>–</em>}</p>
              </div>
              {entry.statusProblems && (
                <>
                  <div className={styles.divider} />
                  <div className={`${styles.section} ${styles.problems}`}>
                    <span className={styles.sectionLabel}>⚠ Probleme</span>
                    <p className={styles.sectionText}>{entry.statusProblems}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
