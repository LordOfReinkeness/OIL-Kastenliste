import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popup } from './Popup';
import { TokenService, ApiError } from '../../api';
import { useUserSession } from '../../hooks/useUserSession';
import styles from './CheckinPopup.module.css';

type Step = 'loading' | 'form' | 'submitting' | 'success' | 'error';
type AttendanceType = 'in_person' | 'remote';

interface LiveCheckinPopupProps {
  token: string;
}

export function LiveCheckinPopup({ token }: LiveCheckinPopupProps) {
  const { user } = useUserSession();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('loading');
  const [meeting, setMeeting] = useState<any>(null);
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('in_person');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    TokenService.tokenControllerGetMeeting(token)
      .then(m => {
        setMeeting(m);
        setStep('form');
      })
      .catch(e => {
        if (e instanceof ApiError && e.status === 404) {
          setErrorMsg('Dieses Meeting wurde nicht gefunden.');
        } else {
          setErrorMsg('Fehler beim Laden des Meetings.');
        }
        setStep('error');
      });
  }, [token]);

  async function handleCheckin() {
    if (!user || !meeting) return;
    setStep('submitting');
    try {
      await TokenService.tokenControllerLiveCheckIn(token, {
        rzId: user.rzId,
        attendanceType,
      });
      setStep('success');
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 409) setErrorMsg('Du bist bereits eingecheckt.');
        else if (e.status === 403) setErrorMsg('Das Live-Check-in-Fenster ist nicht geöffnet.');
        else setErrorMsg('Fehler beim Server. Bitte erneut versuchen.');
      } else {
        setErrorMsg('Fehler beim Server. Bitte erneut versuchen.');
      }
      setStep('error');
    }
  }

  const isSubmitting = step === 'submitting';

  return (
    <Popup title="Live-Einchecken">

      {step === 'loading' && (
        <p className={styles.muted}>Meeting wird geladen…</p>
      )}

      {(step === 'form' || step === 'submitting') && meeting && (
        <>
          <div className={styles.meetingInfo}>
            <span className={styles.meetingLabel}>Meeting</span>
            <span className={styles.meetingDate}>
              {new Date(meeting.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, {new Date(meeting.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
            </span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Teilnahme</span>
            <div className={styles.segmented}>
              <button
                className={`${styles.segment} ${attendanceType === 'in_person' ? styles.active : ''}`}
                onClick={() => setAttendanceType('in_person')}
                disabled={isSubmitting}
              >
                Vor Ort
              </button>
              <button
                className={`${styles.segment} ${attendanceType === 'remote' ? styles.active : ''}`}
                onClick={() => setAttendanceType('remote')}
                disabled={isSubmitting}
              >
                Online
              </button>
            </div>
          </div>

          <button
            className={styles.button}
            onClick={handleCheckin}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Wird eingecheckt…' : 'Einchecken'}
          </button>
        </>
      )}

      {step === 'success' && (
        <>
          <p className={styles.success}>Erfolgreich eingecheckt!</p>
          <button className={styles.buttonSecondary} onClick={() => navigate('/')}>
            Zur Startseite
          </button>
        </>
      )}

      {step === 'error' && (
        <>
          <p className={styles.error}>{errorMsg}</p>
          <button className={styles.buttonSecondary} onClick={() => navigate('/')}>
            Zur Startseite
          </button>
        </>
      )}

    </Popup>
  );
}
