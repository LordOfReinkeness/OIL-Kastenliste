import { useEffect, useState } from 'react';
import { Popup } from './Popup';
import { MeetingsService, ApiError, ExcuseDto } from '../../api';
import { useUserSession } from '../../hooks/useUserSession';
import styles from './ExcusePopup.module.css';

interface ExcusePopupProps {
  onClose: () => void;
  onSuccess: () => void;
}

type ExcuseType = 'absent' | 'late';

function formatMeetingDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) + ', ' + date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  }) + ' Uhr';
}

export function ExcusePopup({ onClose, onSuccess }: ExcusePopupProps) {
  const { user } = useUserSession();
  const [meeting, setMeeting] = useState<any>(null);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [noMeeting, setNoMeeting] = useState(false);
  const [excuseType, setExcuseType] = useState<ExcuseType>('absent');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    MeetingsService.meetingsControllerFindNext()
      .then(m => setMeeting(m))
      .catch(e => {
        if (e instanceof ApiError && e.status === 404) setNoMeeting(true);
        else setError('Fehler beim Laden des Meetings.');
      })
      .finally(() => setLoadingMeeting(false));
  }, []);

  async function handleSubmit() {
    if (!user || !meeting) return;
    setSubmitting(true);
    setError('');
    try {
      await MeetingsService.meetingsControllerExcuseNextMeeting({
        rzId: user.rzId,
        excuseType: excuseType as ExcuseDto.excuseType,
      });
      onSuccess();
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 403) setError('Die Entschuldigungsfrist ist abgelaufen.');
        else if (e.status === 409) setError('Du hast dich bereits entschuldigt.');
        else setError('Fehler beim Server. Bitte erneut versuchen.');
      } else {
        setError('Fehler beim Server. Bitte erneut versuchen.');
      }
      setSubmitting(false);
    }
  }

  return (
    <Popup title="Entschuldigung einreichen" closable onClose={onClose}>
      {loadingMeeting && (
        <p className={styles.muted}>Nächstes Meeting wird geladen…</p>
      )}

      {noMeeting && (
        <p className={styles.muted}>Kein bevorstehendes Meeting gefunden.</p>
      )}

      {meeting && (
        <>
          <div className={styles.meetingInfo}>
            <span className={styles.meetingLabel}>Nächstes Meeting</span>
            <span className={styles.meetingDate}>{formatMeetingDate(meeting.date)}</span>

          </div>

          <div className={styles.field}>
            <span className={styles.label}>Grund</span>
            <div className={styles.segmented}>
              <button
                className={`${styles.segment} ${excuseType === 'absent' ? styles.active : ''}`}
                onClick={() => setExcuseType('absent')}
              >
                Abwesend
              </button>
              <button
                className={`${styles.segment} ${excuseType === 'late' ? styles.active : ''}`}
                onClick={() => setExcuseType('late')}
              >
                Verspätet
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.button}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Wird eingereicht…' : 'Entschuldigung einreichen'}
          </button>
        </>
      )}
    </Popup>
  );
}
