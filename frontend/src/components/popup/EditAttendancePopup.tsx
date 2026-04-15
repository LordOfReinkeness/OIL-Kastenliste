import { useState } from 'react';
import { Popup } from './Popup';
import { AttendanceService } from '../../api';
import styles from './EditAttendancePopup.module.css';

interface EditAttendancePopupProps {
  meetingId: string;
  userId: string;
  userName: string;
  meetingDate: string;
  onClose: () => void;
  onSaved: () => void;
}

export function EditAttendancePopup({
  meetingId, userId, userName, meetingDate, onClose, onSaved,
}: EditAttendancePopupProps) {
  const [busy, setBusy] = useState<'late' | 'absent' | null>(null);
  const [error, setError] = useState('');

  async function handle(action: 'late' | 'absent') {
    setBusy(action);
    setError('');
    const payload = action === 'late'
      ? { isLate: true }
      : { liveCheckedInAt: null, postCheckedInAt: null, isLate: false, excusedAt: null, excuseType: null };
    try {
      await AttendanceService.attendanceControllerPatchAttendance(meetingId, userId, payload as any);
      onSaved();
    } catch {
      setError('Fehler beim Speichern.');
      setBusy(null);
    }
  }

  const dateStr = new Date(meetingDate).toLocaleDateString('de-DE', {
    weekday: 'short', day: 'numeric', month: 'long',
  });

  return (
    <Popup title="Status setzen" closable onClose={onClose}>
      <div className={styles.context}>
        <span className={styles.contextName}>{userName}</span>
        <span className={styles.contextDate}>{dateStr}</span>
      </div>

      <div className={styles.actions}>
        <button className={styles.buttonLate} onClick={() => handle('late')} disabled={busy !== null}>
          {busy === 'late' ? '…' : '! Verspätet'}
        </button>
        <button className={styles.buttonAbsent} onClick={() => handle('absent')} disabled={busy !== null}>
          {busy === 'absent' ? '…' : '✗ Abwesend'}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </Popup>
  );
}
