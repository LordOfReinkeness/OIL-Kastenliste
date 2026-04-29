import { useEffect, useState } from 'react';
import { Popup } from './Popup';
import { MeetingsService } from '../../api';
import styles from './EditMeetingPopup.module.css';

interface EditMeetingPopupProps {
  meetingId: string;
  onClose: () => void;
  onSaved: () => void;
}

function toUTC(local: string) {
  return new Date(local).toISOString();
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function decomposeMins(total: number) {
  const days    = Math.floor(total / 1440);
  const hours   = Math.floor((total % 1440) / 60);
  const minutes = total % 60;
  return { days, hours, minutes };
}

export function EditMeetingPopup({ meetingId, onClose, onSaved }: EditMeetingPopupProps) {
  const [fetching, setFetching]   = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [date, setDate]                     = useState('');
  const [checkinDeadline, setCheckinDeadline] = useState('');
  const [excuseDays, setExcuseDays]         = useState('0');
  const [excuseHours, setExcuseHours]       = useState('1');
  const [excuseMinutes, setExcuseMinutes]   = useState('0');

  const [checkinWindowMinutes, setCheckinWindowMinutes] = useState('60');
  const [capInfractions, setCapInfractions]             = useState(false);
  const [liveCheckinOpen, setLiveCheckinOpen]           = useState(false);

  const [useQuestion, setUseQuestion]   = useState(false);
  const [question, setQuestion]         = useState('');
  const [answer, setAnswer]             = useState('');
  const [checkAnswer, setCheckAnswer]   = useState(false);
  const [maxRetries, setMaxRetries]     = useState('3');
  const [allowCheckin, setAllowCheckin] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    MeetingsService.meetingsControllerFindOne(meetingId)
      .then(m => {
        setDate(toLocalInput(new Date(m.date)));
        setCheckinDeadline(toLocalInput(new Date(m.checkinDeadline)));
        const { days, hours, minutes } = decomposeMins(m.excuseDeadlineMinutes ?? 0);
        setExcuseDays(String(days));
        setExcuseHours(String(hours));
        setExcuseMinutes(String(minutes));
        setCheckinWindowMinutes(String(m.checkinWindowMinutes ?? 60));
        setCapInfractions(m.capInfractions ?? false);
        setLiveCheckinOpen(m.liveCheckinOpen ?? false);
        if (m.question) {
          setUseQuestion(true);
          setQuestion(m.question);
          setAnswer(m.answer ?? '');
          setCheckAnswer(m.checkAnswer ?? false);
          setMaxRetries(String(m.maxRetries ?? 3));
        } else {
          setAllowCheckin(!(m.checkAnswer ?? false));
        }
      })
      .catch(() => setFetchError('Meeting konnte nicht geladen werden.'))
      .finally(() => setFetching(false));
  }, [meetingId]);

  const excuseDeadlineMinutes =
    Number(excuseDays) * 24 * 60 + Number(excuseHours) * 60 + Number(excuseMinutes);

  async function handleSave() {
    setSubmitting(true);
    setError('');
    try {
      await MeetingsService.meetingsControllerUpdate(meetingId, {
        date: toUTC(date),
        excuseDeadlineMinutes,
        checkinDeadline: toUTC(checkinDeadline),
        checkinWindowMinutes: Number(checkinWindowMinutes),
        capInfractions,
        liveCheckinOpen,
        ...(useQuestion && question.trim() ? {
          question: question.trim(),
          answer: answer.trim() || undefined,
          checkAnswer,
          maxRetries: Number(maxRetries),
        } : {
          question: undefined,
          answer: undefined,
          checkAnswer: !allowCheckin,
        }),
      });
      onSaved();
    } catch {
      setError('Fehler beim Speichern.');
      setSubmitting(false);
    }
  }

  return (
    <Popup title="Meeting bearbeiten" closable onClose={onClose}>
      {fetching ? (
        <p className={styles.muted}>Wird geladen…</p>
      ) : fetchError ? (
        <p className={styles.error}>{fetchError}</p>
      ) : (
        <>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="date">Datum & Uhrzeit</label>
            <input id="date" className={styles.input} type="datetime-local" step={300}
              value={date} onChange={e => setDate(e.target.value)}
              disabled={submitting} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Entschuldigungsfrist vor Meeting</label>
            <div className={styles.durationRow}>
              <div className={styles.durationField}>
                <input className={styles.inputSmall} type="number" min="0"
                  value={excuseDays} onChange={e => setExcuseDays(e.target.value)}
                  disabled={submitting} />
                <span className={styles.durationUnit}>Tage</span>
              </div>
              <div className={styles.durationField}>
                <input className={styles.inputSmall} type="number" min="0" max="23"
                  value={excuseHours} onChange={e => setExcuseHours(e.target.value)}
                  disabled={submitting} />
                <span className={styles.durationUnit}>Stunden</span>
              </div>
              <div className={styles.durationField}>
                <input className={styles.inputSmall} type="number" min="0" max="59"
                  value={excuseMinutes} onChange={e => setExcuseMinutes(e.target.value)}
                  disabled={submitting} />
                <span className={styles.durationUnit}>Minuten</span>
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="checkinDeadline">Check-in Deadline</label>
            <input id="checkinDeadline" className={styles.input} type="datetime-local" step={300}
              value={checkinDeadline} onChange={e => setCheckinDeadline(e.target.value)}
              disabled={submitting} />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="checkinWindowMinutes">Live Check-in Fenster (Minuten)</label>
            <input id="checkinWindowMinutes" className={styles.input} type="number" min="1"
              value={checkinWindowMinutes} onChange={e => setCheckinWindowMinutes(e.target.value)}
              disabled={submitting} />
          </div>

          <div className={styles.checkRow}>
            <input id="capInfractions" type="checkbox"
              checked={capInfractions} onChange={e => setCapInfractions(e.target.checked)}
              disabled={submitting} />
            <label htmlFor="capInfractions" className={styles.checkLabel}>Strafstriche auf 1 begrenzen</label>
          </div>

          <div className={styles.checkRow}>
            <input id="liveCheckinOpen" type="checkbox"
              checked={liveCheckinOpen} onChange={e => setLiveCheckinOpen(e.target.checked)}
              disabled={submitting} />
            <label htmlFor="liveCheckinOpen" className={styles.checkLabel}>Live Check-in erlaubt (öffnet automatisch zum Meetingstart)</label>
          </div>

          <div className={styles.divider} />

          <div className={styles.checkRow}>
            <input id="useQuestion" type="checkbox"
              checked={useQuestion} onChange={e => setUseQuestion(e.target.checked)}
              disabled={submitting} />
            <label htmlFor="useQuestion" className={styles.checkLabel}>Frage aktivieren</label>
          </div>

          {useQuestion ? (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="question">Frage</label>
                <input id="question" className={styles.input} type="text"
                  value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder="z.B. Was war das Hauptthema?"
                  disabled={submitting} />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="answer">Antwort</label>
                <input id="answer" className={styles.input} type="text"
                  value={answer} onChange={e => setAnswer(e.target.value)}
                  disabled={submitting} />
              </div>

              <div className={styles.checkRow}>
                <input id="checkAnswer" type="checkbox"
                  checked={checkAnswer} onChange={e => setCheckAnswer(e.target.checked)}
                  disabled={submitting} />
                <label htmlFor="checkAnswer" className={styles.checkLabel}>Antwort prüfen</label>
              </div>

              {checkAnswer && (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="maxRetries">Max. Versuche</label>
                  <input id="maxRetries" className={styles.input} type="number" min="1"
                    value={maxRetries} onChange={e => setMaxRetries(e.target.value)}
                    disabled={submitting} />
                </div>
              )}
            </>
          ) : (
            <div className={styles.checkRow}>
              <input id="allowCheckin" type="checkbox"
                checked={allowCheckin} onChange={e => setAllowCheckin(e.target.checked)}
                disabled={submitting} />
              <label htmlFor="allowCheckin" className={styles.checkLabel}>Check-in erlauben</label>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button className={styles.buttonSecondary} onClick={onClose} disabled={submitting}>
              Abbrechen
            </button>
            <button className={styles.button} onClick={handleSave}
              disabled={submitting || !date || !checkinDeadline}>
              {submitting ? 'Wird gespeichert…' : 'Speichern'}
            </button>
          </div>
        </>
      )}
    </Popup>
  );
}
