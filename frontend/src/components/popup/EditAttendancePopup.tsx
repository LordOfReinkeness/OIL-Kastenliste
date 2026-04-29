import { useState } from 'react';
import { Popup } from './Popup';
import { AttendanceService } from '../../api';
import styles from './EditAttendancePopup.module.css';

interface MeetingStat {
  liveCheckedIn: boolean | null;
  postCheckedIn: boolean | null;
  isLate: boolean | null;
  excuseType: 'late' | 'absent' | null;
  infractions: number | null;
}

interface EditAttendancePopupProps {
  meetingId: string;
  userId: string;
  userName: string;
  meetingDate: string;
  current: MeetingStat | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditAttendancePopup({
  meetingId, userId, userName, meetingDate, current, onClose, onSaved,
}: EditAttendancePopupProps) {
  const [excuseType, setExcuseType]     = useState<'absent' | 'late' | null>(current?.excuseType ?? null);
  const [isLate, setIsLate]             = useState<boolean>(current?.isLate ?? false);
  const [liveCheckedIn, setLiveCheckedIn] = useState<boolean>(current?.liveCheckedIn ?? false);
  const [postCheckedIn, setPostCheckedIn] = useState<boolean>(current?.postCheckedIn ?? false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  async function handleSave() {
    setSubmitting(true);
    setError('');
    try {
      await AttendanceService.attendanceControllerPatchAttendance(meetingId, userId, {
        liveCheckedInAt:  liveCheckedIn  ? new Date().toISOString() : null,
        postCheckedInAt:  postCheckedIn  ? new Date().toISOString() : null,
        isLate:           isLate         ? true : null,
        excusedAt:        excuseType     ? new Date().toISOString() : null,
        excuseType:       excuseType     ?? null,
      } as any);
      onSaved();
    } catch {
      setError('Fehler beim Speichern.');
      setSubmitting(false);
    }
  }

  const dateStr = new Date(meetingDate).toLocaleDateString('de-DE', {
    weekday: 'short', day: 'numeric', month: 'long',
  });

  return (
    <Popup title="Anwesenheit bearbeiten" closable onClose={onClose}>
      <div className={styles.context}>
        <span className={styles.contextName}>{userName}</span>
        <span className={styles.contextDate}>{dateStr}</span>
      </div>

      <div className={styles.fields}>
        <div className={styles.field}>
          <span className={styles.label}>Entschuldigung</span>
          <div className={styles.segmented}>
            <button className={`${styles.segment} ${excuseType === null   ? styles.active : ''}`} onClick={() => setExcuseType(null)}     disabled={submitting}>—</button>
            <button className={`${styles.segment} ${excuseType === 'absent' ? styles.active : ''}`} onClick={() => setExcuseType('absent')} disabled={submitting}>Abwesend</button>
            <button className={`${styles.segment} ${excuseType === 'late'   ? styles.active : ''}`} onClick={() => setExcuseType('late')}   disabled={submitting}>Verspätet</button>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Verspätet</span>
          <div className={styles.segmented}>
            <button className={`${styles.segment} ${!isLate ? styles.active : ''}`} onClick={() => setIsLate(false)} disabled={submitting}>Nein</button>
            <button className={`${styles.segment} ${ isLate ? styles.active : ''}`} onClick={() => setIsLate(true)}  disabled={submitting}>Ja</button>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Live Check-in</span>
          <div className={styles.segmented}>
            <button className={`${styles.segment} ${!liveCheckedIn ? styles.active : ''}`} onClick={() => setLiveCheckedIn(false)} disabled={submitting}>Nein</button>
            <button className={`${styles.segment} ${ liveCheckedIn ? styles.active : ''}`} onClick={() => setLiveCheckedIn(true)}  disabled={submitting}>Ja</button>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Post Check-in</span>
          <div className={styles.segmented}>
            <button className={`${styles.segment} ${!postCheckedIn ? styles.active : ''}`} onClick={() => setPostCheckedIn(false)} disabled={submitting}>Nein</button>
            <button className={`${styles.segment} ${ postCheckedIn ? styles.active : ''}`} onClick={() => setPostCheckedIn(true)}  disabled={submitting}>Ja</button>
          </div>
        </div>

        <div className={styles.infractionRow}>
          <span className={styles.label}>Strafstriche (aktuell)</span>
          <span className={styles.infractionValue}>{current?.infractions ?? '—'}</span>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button className={styles.buttonSecondary} onClick={onClose} disabled={submitting}>
          Abbrechen
        </button>
        <button className={styles.buttonPrimary} onClick={handleSave} disabled={submitting}>
          {submitting ? 'Wird gespeichert…' : 'Speichern'}
        </button>
      </div>
    </Popup>
  );
}
