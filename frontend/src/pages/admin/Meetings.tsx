import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MeetingsService, AttendanceService } from '../../api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EditMeetingPopup } from '../../components/popup/EditMeetingPopup';
import { ConfirmPopup } from '../../components/popup/ConfirmPopup';
import styles from './Meetings.module.css';

interface Meeting {
  id: string;
  date: string;
  linkToken: string;
  question: string | null;
  excuseDeadlineMinutes: number;
  checkinDeadline: string;
  checkinWindowMinutes: number;
  capInfractions: boolean;
  liveCheckinOpen: boolean;
  answer: string | null;
  checkAnswer: boolean;
  maxRetries: number | null;
}

interface AttendanceRecord {
  userId: string;
  firstName: string;
  lastName: string;
  rzId: string;
  infraction: 'none' | 'late' | 'absent' | 'pending';
  attendanceType: 'in_person' | 'remote' | null;
  checkedInAt: string | null;
  excusedAt: string | null;
  excuseType: 'late' | 'absent' | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  }) + ', ' + new Date(dateStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
}

function formatDeadline(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) + ', ' + new Date(dateStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
}

function formatDuration(totalMinutes: number) {
  const days    = Math.floor(totalMinutes / 1440);
  const hours   = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days)    parts.push(`${days} Tag${days !== 1 ? 'e' : ''}`);
  if (hours)   parts.push(`${hours} Std.`);
  if (minutes) parts.push(`${minutes} Min.`);
  return parts.length ? parts.join(' ') : '0 Min.';
}

function MeetingLinkCopy({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/post-checkin/${token}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <span className={styles.linkCopy}>
      <span className={styles.linkToken}>{token}</span>
      <button className={styles.copyButton} onClick={handleCopy}>
        {copied ? '✓' : 'Kopieren'}
      </button>
    </span>
  );
}

function MeetingRow({ meeting, onEdited, onDeleted }: { meeting: Meeting; onEdited: () => void; onDeleted: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [liveOpen, setLiveOpen] = useState(meeting.liveCheckinOpen);

  async function handleDelete() {
    setDeleting(true);
    try {
      await MeetingsService.meetingsControllerRemove(meeting.id);
      onDeleted();
    } catch {
      setDeleting(false);
    }
  }

  async function handleExpand() {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (attendance) return;
    setLoading(true);
    try {
      const data = await AttendanceService.attendanceControllerGetAttendance(meeting.id);
      const sorted = [...data.attendance].sort((a: AttendanceRecord, b: AttendanceRecord) =>
        a.lastName.localeCompare(b.lastName)
      );
      setAttendance(sorted);
    } finally {
      setLoading(false);
    }
  }

  const presentCount  = attendance?.filter(a => a.infraction === 'none' && a.checkedInAt).length ?? 0;
  const excusedCount  = attendance?.filter(a => a.infraction === 'none' && !a.checkedInAt).length ?? 0;
  const absentCount   = attendance?.filter(a => a.infraction === 'absent').length ?? 0;

  return (
    <>
      <div className={`${styles.meetingCard} ${expanded ? styles.open : ''}`}>
        <div className={styles.meetingRowWrapper}>
          <button className={styles.meetingRow} onClick={handleExpand}>
            <span className={styles.meetingDate}>{formatDate(meeting.date)}</span>
            <span className={styles.indicators}>
              {meeting.question && <span className={styles.questionDot} title="Frage gesetzt" />}
              {attendance && (
                <span className={styles.summary}>
                  {presentCount} anwesend · {excusedCount} entschuldigt · {absentCount} fehlend
                </span>
              )}
              <span className={styles.chevron}>{expanded ? '▲' : '▼'}</span>
            </span>
          </button>
          <button className={`${styles.editButton} ${liveOpen ? styles.liveActive : ''}`} onClick={() => window.open(`/live-screen/${meeting.linkToken}`, 'live-screen', 'width=420,height=600,popup=yes')}>
            QR
          </button>
          <button className={styles.editButton} onClick={() => setEditing(true)}>
            Bearbeiten
          </button>
          <button className={styles.deleteButton} onClick={() => setConfirmDelete(true)}>
            Löschen
          </button>
        </div>

        {expanded && (
          <div className={styles.attendancePanel}>
            <div className={styles.meetingDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Entschuldigungsfrist</span>
                <span className={styles.detailValue}>{formatDuration(meeting.excuseDeadlineMinutes)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Check-in Deadline</span>
                <span className={styles.detailValue}>{formatDeadline(meeting.checkinDeadline)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Check-in</span>
                <span className={styles.detailValue}>
                  {meeting.question
                    ? `Frage: „${meeting.question}"${meeting.checkAnswer ? ` (Antwort wird geprüft, max. ${meeting.maxRetries} Versuche)` : ' (Antwort nicht geprüft)'}`
                    : meeting.checkAnswer ? 'Gesperrt' : 'Erlaubt'}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Link</span>
                <MeetingLinkCopy token={meeting.linkToken} />
              </div>
            </div>

            {loading && <p className={styles.muted}>Wird geladen…</p>}
            {attendance && (
              <table className={styles.attTable}>
                <thead>
                  <tr>
                    <th className={styles.attTh}>Name</th>
                    <th className={styles.attTh}>Status</th>
                    <th className={styles.attTh}>Teilnahme</th>
                    <th className={styles.attTh}>Entschuldigung</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(a => (
                    <tr key={a.userId} className={styles.attRow}>
                      <td className={styles.attTd}>
                        <span className={styles.attName}>{a.lastName}, {a.firstName}</span>
                        <span className={styles.attRzId}>{a.rzId}</span>
                      </td>
                      <td className={styles.attTd}>
                        <StatusBadge infraction={a.infraction} />
                      </td>
                      <td className={styles.attTd}>
                        {a.attendanceType === 'in_person' ? 'Vor Ort' : a.attendanceType === 'remote' ? 'Online' : '—'}
                      </td>
                      <td className={styles.attTd}>
                        {a.excuseType === 'absent' ? 'Abwesend' : a.excuseType === 'late' ? 'Verspätet' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {editing && (
        <EditMeetingPopup
          meetingId={meeting.id}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onEdited(); }}
        />
      )}
      {confirmDelete && (
        <ConfirmPopup
          title="Meeting löschen"
          message={`Meeting vom ${formatDate(meeting.date)} wirklich löschen?`}
          confirmLabel="Löschen"
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(false)}
          busy={deleting}
        />
      )}
    </>
  );
}

export function AdminMeetings() {
  const { refreshKey } = useOutletContext<{ refreshKey: number }>();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    MeetingsService.meetingsControllerFindAll()
      .then(setMeetings)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [refreshKey]);

  if (loading) return <p className={styles.muted}>Wird geladen…</p>;

  const now = new Date();
  const future = meetings.filter(m => new Date(m.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = meetings.filter(m => new Date(m.date) <= now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className={styles.page}>
      {future.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Bevorstehend</h2>
          {future.map(m => <MeetingRow key={m.id} meeting={m} onEdited={load} onDeleted={load} />)}
        </section>
      )}

      {future.length > 0 && past.length > 0 && (
        <div className={styles.divider}>
          <span className={styles.dividerLabel}>Vergangene Meetings</span>
        </div>
      )}

      {past.length > 0 && (
        <section>
          {future.length === 0 && <h2 className={styles.sectionTitle}>Vergangene Meetings</h2>}
          {past.map(m => <MeetingRow key={m.id} meeting={m} onEdited={load} onDeleted={load} />)}
        </section>
      )}

      {!meetings.length && <p className={styles.muted}>Keine Meetings vorhanden.</p>}
    </div>
  );
}
