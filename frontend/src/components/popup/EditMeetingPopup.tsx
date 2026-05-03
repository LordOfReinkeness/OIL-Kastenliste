import { useEffect, useState } from 'react';
import { Popup } from './Popup';
import { MeetingsService } from '../../api';
import { DurationField } from '../ui/DurationField';
import { toUTC } from '../../utils/date';
import styles from './EditMeetingPopup.module.css';

interface EditMeetingPopupProps {
  meetingId: string;
  onClose: () => void;
  onSaved: () => void;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

function toLocalParts(d: Date) {
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function decomposeMins(total: number) {
  const days    = Math.floor(total / 1440);
  const hours   = Math.floor((total % 1440) / 60);
  const minutes = total % 60;
  return { days, hours, minutes };
}

function meetingAsDate(date: string, time: string): Date | undefined {
  if (!date || !time) return undefined;
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes]   = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

export function EditMeetingPopup({ meetingId, onClose, onSaved }: EditMeetingPopupProps) {
  const [fetching, setFetching]     = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  const [excuseDays, setExcuseDays]       = useState(0);
  const [excuseHours, setExcuseHours]     = useState(1);
  const [excuseMinutes, setExcuseMinutes] = useState(0);

  // Check-in deadline stored as offset from meeting
  const [checkinDays, setCheckinDays]       = useState(4);
  const [checkinHours, setCheckinHours]     = useState(0);
  const [checkinMinutes, setCheckinMinutes] = useState(0);

  const [windowDays, setWindowDays]       = useState(0);
  const [windowHours, setWindowHours]     = useState(1);
  const [windowMinutes, setWindowMinutes] = useState(0);

  const [capInfractions, setCapInfractions] = useState(false);
  const [liveCheckinOpen, setLiveCheckinOpen] = useState(false);

  const [useQuestion, setUseQuestion]   = useState(false);
  const [question, setQuestion]         = useState('');
  const [answer, setAnswer]             = useState('');
  const [checkAnswer, setCheckAnswer]   = useState(false);
  const [maxRetries, setMaxRetries]     = useState('3');
  const [allowCheckin, setAllowCheckin] = useState(true);

  const [fristenOpen, setFristenOpen]   = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    MeetingsService.meetingsControllerFindOne(meetingId)
      .then(m => {
        const meetingD = new Date(m.date);
        const checkinD = new Date(m.checkinDeadline);
        const { date, time } = toLocalParts(meetingD);
        setMeetingDate(date);
        setMeetingTime(time);

        // Compute checkin offset from meeting
        const offsetMs   = checkinD.getTime() - meetingD.getTime();
        const offsetMins = Math.round(offsetMs / 60_000);
        const co = decomposeMins(Math.max(0, offsetMins));
        setCheckinDays(co.days);
        setCheckinHours(co.hours);
        setCheckinMinutes(co.minutes);

        const { days, hours, minutes } = decomposeMins(m.excuseDeadlineMinutes ?? 0);
        setExcuseDays(days);
        setExcuseHours(hours);
        setExcuseMinutes(minutes);

        const winMins = m.checkinWindowMinutes ?? 60;
        setWindowDays(Math.floor(winMins / 1440));
        setWindowHours(Math.floor((winMins % 1440) / 60));
        setWindowMinutes(winMins % 60);

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

  const meetingRef = meetingAsDate(meetingDate, meetingTime);

  const excuseDeadlineMinutes = excuseDays * 1440 + excuseHours * 60 + excuseMinutes;
  const checkinWindowMinutes  = windowDays * 1440 + windowHours * 60 + windowMinutes;

  function checkinDeadlineUTC() {
    if (!meetingRef) return '';
    const ms = (checkinDays * 1440 + checkinHours * 60 + checkinMinutes) * 60_000;
    return new Date(meetingRef.getTime() + ms).toISOString();
  }

  async function handleSave() {
    setSubmitting(true);
    setError('');
    try {
      await MeetingsService.meetingsControllerUpdate(meetingId, {
        date: toUTC(meetingDate, meetingTime),
        excuseDeadlineMinutes,
        checkinDeadline: checkinDeadlineUTC(),
        checkinWindowMinutes,
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
            <label className={styles.label}>Datum & Uhrzeit</label>
            <div className={styles.dateTimeRow}>
              <input className={styles.input} type="date"
                value={meetingDate} onChange={e => setMeetingDate(e.target.value)}
                disabled={submitting} />
              <input className={styles.inputTime} type="time" step={300}
                value={meetingTime} onChange={e => setMeetingTime(e.target.value)}
                disabled={submitting} />
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
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button className={styles.buttonSecondary} onClick={onClose} disabled={submitting}>
              Abbrechen
            </button>
            <button className={styles.button} onClick={handleSave}
              disabled={submitting || !meetingDate || !meetingTime}>
              {submitting ? 'Wird gespeichert…' : 'Speichern'}
            </button>
          </div>
        </>
      )}
    </Popup>
  );
}
