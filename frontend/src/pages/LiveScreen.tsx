import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { TokenService, MeetingsService } from '../api';
import styles from './LiveScreen.module.css';

export function LiveScreen() {
  const { token } = useParams<{ token: string }>();
  const [meeting, setMeeting] = useState<any>(null);
  const [liveOpen, setLiveOpen] = useState(false);

  const url = `${window.location.origin}/live-checkin/${token}`;

  useEffect(() => {
    TokenService.tokenControllerGetMeeting(token!)
      .then(m => setMeeting(m))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!meeting?.id) return;

    MeetingsService.meetingsControllerUpdate(meeting.id, { liveCheckinOpen: true })
      .then(() => setLiveOpen(true))
      .catch(() => {});

    const handleBeforeUnload = () => {
      fetch(`/api/meetings/${meeting.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveCheckinOpen: false }),
        keepalive: true,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [meeting?.id]);

  async function toggleLive() {
    if (!meeting?.id) return;
    const next = !liveOpen;
    await MeetingsService.meetingsControllerUpdate(meeting.id, { liveCheckinOpen: next });
    setLiveOpen(next);
  }

  const dateStr = meeting
    ? new Date(meeting.date).toLocaleDateString('de-DE', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      }) + ', ' + new Date(meeting.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'
    : '…';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.title}>Live Check-in</span>
        <button
          className={`${styles.status} ${liveOpen ? styles.statusOpen : styles.statusClosed}`}
          onClick={toggleLive}
          disabled={!meeting?.id}
        >
          {liveOpen ? 'Geöffnet' : 'Geschlossen'}
        </button>
      </div>

      <div className={styles.body}>
        <p className={styles.date}>{dateStr}</p>

        <div className={styles.qr}>
          <QRCodeSVG value={url} size={240} />
        </div>

        <p className={styles.token}>{token}</p>
        <p className={styles.urlHint}>{url}</p>

        <button
          className={liveOpen ? styles.buttonClose : styles.buttonOpen}
          onClick={toggleLive}
          disabled={!meeting?.id}
        >
          {liveOpen ? 'Check-in schließen' : 'Check-in öffnen'}
        </button>
      </div>
    </div>
  );
}
