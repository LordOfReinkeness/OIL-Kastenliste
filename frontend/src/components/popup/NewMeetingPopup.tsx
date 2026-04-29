import { useEffect, useState } from 'react';
import { Popup } from './Popup';
import { MeetingsService } from '../../api';
import styles from './NewMeetingPopup.module.css';

interface NewMeetingPopupProps {
  onClose: () => void;
  onCreated: () => void;
}

function toUTC(local: string) {
  return new Date(local).toISOString();
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultDate() {
  const d = new Date();
  d.setHours(13, 15, 0, 0);
  return toLocalInput(d);
}

function checkinFrom(meetingLocal: string) {
  const d = new Date(meetingLocal);
  d.setDate(d.getDate() + 4);
  return toLocalInput(d);
}

export function NewMeetingPopup({ onClose, onCreated }: NewMeetingPopupProps) {
  const [date, setDate] = useState(defaultDate);
  const [checkinDeadline, setCheckinDeadline] = useState(() => checkinFrom(defaultDate()));
  const [checkinTouched, setCheckinTouched] = useState(false);

  const [excuseDays, setExcuseDays]       = useState('0');
  const [excuseHours, setExcuseHours]     = useState('1');
  const [excuseMinutes, setExcuseMinutes] = useState('0');

  const [checkinWindowMinutes, setCheckinWindowMinutes] = useState('60');
  const [capInfractions, setCapInfractions]             = useState(false);

  const [useQuestion, setUseQuestion]   = useState(false);
  const [question, setQuestion]         = useState('');
  const [answer, setAnswer]             = useState('');
  const [checkAnswer, setCheckAnswer]   = useState(false);
  const [maxRetries, setMaxRetries]     = useState('3');
  const [allowCheckin, setAllowCheckin] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [copied, setCopied]         = useState(false);

  // Auto-update checkin deadline when meeting date changes, unless user has edited it
  useEffect(() => {
    if (date && !checkinTouched) setCheckinDeadline(checkinFrom(date));
  }, [date, checkinTouched]);

  const excuseDeadlineMinutes =
    Number(excuseDays) * 24 * 60 + Number(excuseHours) * 60 + Number(excuseMinutes);

  async function handleCreate() {
    setSubmitting(true);
    setError('');
    try {
      const meeting = await MeetingsService.meetingsControllerCreate({
        date: toUTC(date),
        excuseDeadlineMinutes,
        checkinDeadline: toUTC(checkinDeadline),
        checkinWindowMinutes: Number(checkinWindowMinutes),
        capInfractions,
        ...(useQuestion && question.trim() ? {
          question: question.trim(),
          answer: answer.trim() || undefined,
          checkAnswer,
          maxRetries: Number(maxRetries),
        } : {
          checkAnswer: !allowCheckin,
        }),
      });
      setCreatedLink(`${window.location.origin}/post-checkin/${meeting.linkToken}`);
      onCreated();
    } catch {
      setError('Fehler beim Erstellen des Meetings.');
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(createdLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Popup title="Neues Meeting" closable onClose={onClose}>
      {!createdLink ? (
        <>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="date">Datum & Uhrzeit</label>
            <input id="date" className={styles.input} type="datetime-local" step={300}
              value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Entschuldigungsfrist vor Meeting</label>
            <div className={styles.durationRow}>
              <div className={styles.durationField}>
                <input className={styles.inputSmall} type="number" min="0"
                  value={excuseDays} onChange={e => setExcuseDays(e.target.value)} />
                <span className={styles.durationUnit}>Tage</span>
              </div>
              <div className={styles.durationField}>
                <input className={styles.inputSmall} type="number" min="0" max="23"
                  value={excuseHours} onChange={e => setExcuseHours(e.target.value)} />
                <span className={styles.durationUnit}>Stunden</span>
              </div>
              <div className={styles.durationField}>
                <input className={styles.inputSmall} type="number" min="0" max="59"
                  value={excuseMinutes} onChange={e => setExcuseMinutes(e.target.value)} />
                <span className={styles.durationUnit}>Minuten</span>
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="checkinDeadline">Check-in Deadline</label>
            <input id="checkinDeadline" className={styles.input} type="datetime-local" step={300}
              value={checkinDeadline}
              onChange={e => { setCheckinDeadline(e.target.value); setCheckinTouched(true); }} />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="checkinWindowMinutes">Live Check-in Fenster (Minuten)</label>
            <input id="checkinWindowMinutes" className={styles.input} type="number" min="1"
              value={checkinWindowMinutes} onChange={e => setCheckinWindowMinutes(e.target.value)} />
          </div>

          <div className={styles.checkRow}>
            <input id="capInfractions" type="checkbox"
              checked={capInfractions} onChange={e => setCapInfractions(e.target.checked)} />
            <label htmlFor="capInfractions" className={styles.checkLabel}>Strafstriche auf 1 begrenzen</label>
          </div>

          <div className={styles.divider} />

          <div className={styles.checkRow}>
            <input id="useQuestion" type="checkbox"
              checked={useQuestion} onChange={e => setUseQuestion(e.target.checked)} />
            <label htmlFor="useQuestion" className={styles.checkLabel}>Frage aktivieren</label>
          </div>

          {useQuestion ? (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="question">Frage</label>
                <input id="question" className={styles.input} type="text"
                  value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder="z.B. Was war das Hauptthema?" />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="answer">Antwort</label>
                <input id="answer" className={styles.input} type="text"
                  value={answer} onChange={e => setAnswer(e.target.value)} />
              </div>

              <div className={styles.checkRow}>
                <input id="checkAnswer" type="checkbox"
                  checked={checkAnswer} onChange={e => setCheckAnswer(e.target.checked)} />
                <label htmlFor="checkAnswer" className={styles.checkLabel}>Antwort prüfen</label>
              </div>

              {checkAnswer && (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="maxRetries">Max. Versuche</label>
                  <input id="maxRetries" className={styles.input} type="number" min="1"
                    value={maxRetries} onChange={e => setMaxRetries(e.target.value)} />
                </div>
              )}
            </>
          ) : (
            <div className={styles.checkRow}>
              <input id="allowCheckin" type="checkbox"
                checked={allowCheckin} onChange={e => setAllowCheckin(e.target.checked)} />
              <label htmlFor="allowCheckin" className={styles.checkLabel}>Check-in erlauben</label>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.button} onClick={handleCreate}
            disabled={submitting || !date || !checkinDeadline}>
            {submitting ? 'Wird erstellt…' : 'Meeting erstellen'}
          </button>
        </>
      ) : (
        <>
          <p className={styles.successHint}>Meeting erstellt. Teile diesen Link:</p>
          <div className={styles.linkRow}>
            <span className={styles.link}>{createdLink}</span>
            <button className={styles.copyButton} onClick={handleCopy}>
              {copied ? '✓' : 'Kopieren'}
            </button>
          </div>
          <button className={styles.button} onClick={onClose}>Schließen</button>
        </>
      )}
    </Popup>
  );
}
