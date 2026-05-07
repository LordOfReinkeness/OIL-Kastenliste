import { useEffect, useState } from 'react';
import { Popup } from './Popup';
import { MeetingsService, ApiError, ExcuseDto } from '../../api';
import { useUserSession } from '../../hooks/useUserSession';
import { formatDateTimeLong } from '../../utils/date';
import styles from './ExcusePopup.module.css';

interface ExcusePopupProps {
  onClose: () => void;
  onSuccess: () => void;
}

type ExcuseType = 'absent' | 'late';

type Step = 'form' | 'submitting' | 'success';

export function ExcusePopup({ onClose, onSuccess }: ExcusePopupProps) {
  const { user } = useUserSession();
  const [meeting, setMeeting] = useState<any>(null);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [noMeeting, setNoMeeting] = useState(false);
  const [excuseType, setExcuseType] = useState<ExcuseType>('absent');
  const [step, setStep] = useState<Step>('form');
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
    setStep('submitting');
    setError('');
    try {
      await MeetingsService.meetingsControllerExcuseNextMeeting({
        rzId: user.rzId,
        excuseType: excuseType as ExcuseDto.excuseType,
      });
      setStep('success');
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 403) setError('Die Entschuldigungsfrist ist abgelaufen.');
        else if (e.status === 409) setError('Du hast dich bereits entschuldigt.');
        else setError('Fehler beim Server. Bitte erneut versuchen.');
      } else {
        setError('Fehler beim Server. Bitte erneut versuchen.');
      }
      setStep('form');
    }
  }

  const isSubmitting = step === 'submitting';

  return (
    <Popup title="Entschuldigung einreichen" closable onClose={onClose}>
      {loadingMeeting && (
        <p className={styles.muted}>Nächstes Meeting wird geladen…</p>
      )}

      {noMeeting && (
        <p className={styles.muted}>Kein bevorstehendes Meeting gefunden.</p>
      )}

      {(step === 'form' || step === 'submitting') && meeting && (
        <>
          <div className={styles.meetingInfo}>
            <span className={styles.meetingLabel}>Nächstes Meeting</span>
            <span className={styles.meetingDate}>{formatDateTimeLong(meeting.date)}</span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Grund</span>
            <div className={styles.segmented}>
              <button
                className={`${styles.segment} ${excuseType === 'absent' ? styles.active : ''}`}
                onClick={() => setExcuseType('absent')}
                disabled={isSubmitting}
              >
                Abwesend
              </button>
              <button
                className={`${styles.segment} ${excuseType === 'late' ? styles.active : ''}`}
                onClick={() => setExcuseType('late')}
                disabled={isSubmitting}
              >
                Verspätet
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.button}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Wird eingereicht…' : 'Entschuldigung einreichen'}
          </button>
        </>
      )}

      {step === 'success' && meeting && (
        <>
          <div className={styles.success}>
            <span>Entschuldigung erfolgreich eingereicht.</span>
            <span>{formatDateTimeLong(meeting.date)}</span>
          </div>
          <button className={styles.button} onClick={onSuccess}>
            Schließen
          </button>
        </>
      )}
    </Popup>
  );
}
