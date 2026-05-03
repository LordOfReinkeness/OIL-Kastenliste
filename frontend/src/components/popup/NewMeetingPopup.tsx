import { useState } from 'react';
import { Popup } from './Popup';
import { MeetingsService } from '../../api';
import { DurationField } from '../ui/DurationField';
import { toUTC } from '../../utils/date';
import styles from './NewMeetingPopup.module.css';

interface NewMeetingPopupProps {
  onClose: () => void;
  onCreated: () => void;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

function defaultParts() {
  const d = new Date();
  d.setHours(13, 15, 0, 0);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function meetingAsDate(date: string, time: string): Date | undefined {
  if (!date || !time) return undefined;
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes]   = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

export function NewMeetingPopup({ onClose, onCreated }: NewMeetingPopupProps) {
  const init = defaultParts();
  const [meetingDate, setMeetingDate] = useState(init.date);
  const [meetingTime, setMeetingTime] = useState(init.time);

  // Excuse deadline: relative before meeting
  const [excuseDays, setExcuseDays]       = useState(0);
  const [excuseHours, setExcuseHours]     = useState(1);
  const [excuseMinutes, setExcuseMinutes] = useState(0);

  // Check-in deadline: relative after meeting (default +4 days)
  const [checkinDays, setCheckinDays]       = useState(4);
  const [checkinHours, setCheckinHours]     = useState(0);
  const [checkinMinutes, setCheckinMinutes] = useState(0);

  // Meetingdauer (live check-in window)
  const [windowDays, setWindowDays]       = useState(0);
  const [windowHours, setWindowHours]     = useState(1);
  const [windowMinutes, setWindowMinutes] = useState(0);

  const checkinWindowMinutes = windowDays * 1440 + windowHours * 60 + windowMinutes;

  const [capInfractions, setCapInfractions] = useState(false);

  const [useQuestion, setUseQuestion]   = useState(false);
  const [question, setQuestion]         = useState('');
  const [answer, setAnswer]             = useState('');
  const [checkAnswer, setCheckAnswer]   = useState(false);
  const [maxRetries, setMaxRetries]     = useState('3');
  const [allowCheckin, setAllowCheckin] = useState(true);

  const [fristenOpen, setFristenOpen]       = useState(false);
  const [settingsOpen, setSettingsOpen]     = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [copied, setCopied]         = useState(false);

  const meetingRef = meetingAsDate(meetingDate, meetingTime);

  const excuseDeadlineMinutes =
    excuseDays * 1440 + excuseHours * 60 + excuseMinutes;

  function checkinDeadlineUTC() {
    if (!meetingRef) return '';
    const ms = (checkinDays * 1440 + checkinHours * 60 + checkinMinutes) * 60_000;
    return new Date(meetingRef.getTime() + ms).toISOString();
  }

  async function handleCreate() {
    setSubmitting(true);
    setError('');
    try {
      const meeting = await MeetingsService.meetingsControllerCreate({
        date: toUTC(meetingDate, meetingTime),
        excuseDeadlineMinutes,
        checkinDeadline: checkinDeadlineUTC(),
        checkinWindowMinutes,
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
            <label className={styles.label}>Datum & Uhrzeit</label>
            <div className={styles.dateTimeRow}>
              <input className={styles.input} type="date"
                value={meetingDate} onChange={e => setMeetingDate(e.target.value)} />
              <input className={styles.inputTime} type="time" step={300}
                value={meetingTime} onChange={e => setMeetingTime(e.target.value)} />
            </div>
          </div>

          <button
            type="button"
            className={styles.sectionToggle}
            onClick={() => setFristenOpen(o => !o)}
          >
            Fristen
            <span className={styles.sectionChevron}>{fristenOpen ? '▲' : '▼'}</span>
          </button>

          {fristenOpen && (
            <div className={styles.section}>
              <DurationField
                label="Entschuldigungsfrist"
                days={excuseDays} hours={excuseHours} minutes={excuseMinutes}
                onChange={(d, h, m) => { setExcuseDays(d); setExcuseHours(h); setExcuseMinutes(m); }}
                direction="before"
                reference={meetingRef}
                info="Wie lange vor dem Meeting können sich Mitglieder noch entschuldigen?"
                disabled={submitting}
              />

              <DurationField
                label="Check-in Deadline"
                days={checkinDays} hours={checkinHours} minutes={checkinMinutes}
                onChange={(d, h, m) => { setCheckinDays(d); setCheckinHours(h); setCheckinMinutes(m); }}
                direction="after"
                reference={meetingRef}
                info="Bis wann kann nachträglich eingecheckt werden? Wird vom Meeting-Zeitpunkt vorgerechnet."
                disabled={submitting}
              />

              <DurationField
                label="Meetingdauer"
                days={windowDays} hours={windowHours} minutes={windowMinutes}
                onChange={(d, h, m) => { setWindowDays(d); setWindowHours(h); setWindowMinutes(m); }}
                direction="after"
                reference={meetingRef}
                info="Wie lange ist der Live-Check-in rund um den Meeting-Start geöffnet?"
                disabled={submitting}
              />
            </div>
          )}

          <button
            type="button"
            className={styles.sectionToggle}
            onClick={() => setSettingsOpen(o => !o)}
          >
            Weitere Einstellungen
            <span className={styles.sectionChevron}>{settingsOpen ? '▲' : '▼'}</span>
          </button>

          {settingsOpen && (
            <div className={styles.section}>
              <div className={styles.checkRow}>
                <input id="capInfractions" type="checkbox"
                  checked={capInfractions} onChange={e => setCapInfractions(e.target.checked)} />
                <label htmlFor="capInfractions" className={styles.checkLabel}>Strafstriche auf 1 begrenzen</label>
              </div>

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
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.button} onClick={handleCreate}
            disabled={submitting || !meetingDate || !meetingTime}>
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
