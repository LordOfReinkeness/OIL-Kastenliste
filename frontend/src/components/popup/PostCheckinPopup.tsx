import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popup } from './Popup';
import { TokenService, ApiError } from '../../api';
import { useUserSession } from '../../hooks/useUserSession';
import { formatDateTimeLong } from '../../utils/date';
import styles from './CheckinPopup.module.css';

type Step = 'loading' | 'form' | 'submitting' | 'success' | 'error';

interface PostCheckinPopupProps {
  token: string;
}

export function PostCheckinPopup({ token }: PostCheckinPopupProps) {
  const { user } = useUserSession();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('loading');
  const [meeting, setMeeting] = useState<any>(null);
  const [answer, setAnswer] = useState('');
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
      await TokenService.tokenControllerPostCheckIn(token, {
        rzId: user.rzId,
        ...(meeting.question ? { answer: answer.trim() } : {}),
      });
      setStep('success');
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 409) setErrorMsg('Du hast dich bereits eingecheckt.');
        else if (e.status === 403) setErrorMsg('Die Frist ist abgelaufen oder die maximale Anzahl an Versuchen wurde erreicht.');
        else setErrorMsg('Fehler beim Server. Bitte erneut versuchen.');
      } else {
        setErrorMsg('Fehler beim Server. Bitte erneut versuchen.');
      }
      setStep('error');
    }
  }

  const isSubmitting = step === 'submitting';

  return (
    <Popup title="Nachträglicher Check-in">

      {step === 'loading' && (
        <p className={styles.muted}>Meeting wird geladen…</p>
      )}

      {(step === 'form' || step === 'submitting') && meeting && (
        <>
          <div className={styles.meetingInfo}>
            <span className={styles.meetingLabel}>Meeting</span>
            <span className={styles.meetingDate}>
              {formatDateTimeLong(meeting.date)}
            </span>
          </div>

          {meeting.question && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="answer">{meeting.question}</label>
              <input
                id="answer"
                className={styles.input}
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCheckin()}
                placeholder="Deine Antwort"
                disabled={isSubmitting}
              />
            </div>
          )}

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
