import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MeetingsService, AttendanceService } from '../../api';
import { MeetingCell } from '../../components/ui/MeetingCell';
import { MeetingLegend } from '../../components/ui/MeetingLegend';
import { EditMeetingPopup } from '../../components/popup/EditMeetingPopup';
import { ConfirmPopup } from '../../components/popup/ConfirmPopup';
import { formatDateTime } from '../../utils/date';
import { config } from '../../config';
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
  liveCheckedInAt: string | null;
  postCheckedInAt: string | null;
  isLate: boolean | null;
  excuseType: 'late' | 'absent' | null;
  attendanceType: 'in_person' | 'remote' | null;
  infractions: number | null;
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
    setTimeout(() => setCopied(false), config.ui.copyFeedbackMs);
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
  const liveOpen = meeting.liveCheckinOpen;

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

  const presentCount  = attendance?.filter(a => a.liveCheckedInAt !== null).length ?? 0;
  const excusedCount  = attendance?.filter(a => a.excuseType === 'absent').length ?? 0;
  const absentCount   = attendance?.filter(a => a.liveCheckedInAt === null && !a.excuseType && a.infractions !== null).length ?? 0;

  return (
    <>
      <div className={`${styles.meetingCard} ${expanded ? styles.open : ''}`}>
        <div className={styles.meetingRowWrapper}>
          <button className={styles.meetingRow} onClick={handleExpand}>
            <span className={styles.meetingDate}>{formatDateTime(meeting.date)}</span>
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
          <button className={`${styles.editButton} ${liveOpen ? styles.liveActive : ''}`} onClick={() => window.open(`/live-screen/${meeting.linkToken}`, 'live-screen', `width=${config.ui.liveScreenPopup.width},height=${config.ui.liveScreenPopup.height},popup=yes`)}>
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
                <span className={styles.detailValue}>{formatDateTime(meeting.checkinDeadline)}</span>
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
                    <th className={`${styles.attTh} ${styles.attNameCol}`}>Name</th>
                    <th className={`${styles.attTh} ${styles.attCellCol}`}>Anwesenheit</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(a => (
                    <tr key={a.userId} className={styles.attRow}>
                      <td className={`${styles.attTd} ${styles.attNameCol}`}>
                        <span className={styles.attName}>{a.lastName}, {a.firstName}</span>
                        <span className={styles.attRzId}>{a.rzId}</span>
                      </td>
                      <td className={`${styles.attTd} ${styles.attCellCol}`}>
                        <div className={styles.attCellCenter}>
                          <MeetingCell
                            liveCheckedIn={a.liveCheckedInAt !== null ? true : (a.infractions !== null ? false : null)}
                            postCheckedIn={a.postCheckedInAt !== null ? true : (a.infractions !== null ? false : null)}
                            isLate={a.isLate}
                            excuseType={a.excuseType}
                            infractions={a.infractions}
                            layout="expanded"
                          />
                        </div>
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
          message={`Meeting vom ${formatDateTime(meeting.date)} wirklich löschen?`}
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

  function load(silent = false) {
    if (!silent) setLoading(true);
    MeetingsService.meetingsControllerFindAll()
      .then(setMeetings)
      .finally(() => { if (!silent) setLoading(false); });
  }

  useEffect(() => { load(); }, [refreshKey]);

  if (loading) return <p className={styles.muted}>Wird geladen…</p>;

  const now = new Date();
  const sorted = [...meetings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past   = sorted.filter(m => new Date(m.date) <= now);
  const future = sorted.filter(m => new Date(m.date) > now);

  return (
    <div className={styles.page}>
      <MeetingLegend defaultOpen={false} />

      {past.map(m => <MeetingRow key={m.id} meeting={m} onEdited={() => load(true)} onDeleted={load} />)}

      {past.length > 0 && future.length > 0 && (
        <div className={styles.divider}>
          <span className={styles.dividerLabel}>Bevorstehende Meetings</span>
        </div>
      )}

      {future.map(m => <MeetingRow key={m.id} meeting={m} onEdited={() => load(true)} onDeleted={load} />)}

      {!meetings.length && <p className={styles.muted}>Keine Meetings vorhanden.</p>}

      <p className={styles.summaryLine}>{meetings.length} Meetings · {past.length} vergangen · {future.length} bevorstehend</p>
    </div>
  );
}
