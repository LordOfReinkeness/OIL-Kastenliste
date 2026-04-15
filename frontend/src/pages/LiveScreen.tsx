import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { TokenService, MeetingsService } from '../api';
import styles from './LiveScreen.module.css';

export function LiveScreen() {
  const { token } = useParams<{ token: string }>();
  const [meeting, setMeeting] = useState<any>(null);
  const [liveOpen, setLiveOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const url = `${window.location.origin}/live-checkin/${token}`;

  function load() {
    TokenService.tokenControllerGetMeeting(token!)
      .then(m => {
        setMeeting(m);
        setLiveOpen(m.liveCheckinOpen ?? false);
      })
      .catch(() => {});
  }

  useEffect(() => { load(); }, [token]);

  async function handleToggle() {
    if (!meeting) return;
    setToggling(true);
    try {
      await MeetingsService.meetingsControllerUpdate(meeting.id, { liveCheckinOpen: !liveOpen });
      setLiveOpen(v => !v);
    } finally {
      setToggling(false);
    }
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
        <span className={`${styles.status} ${liveOpen ? styles.statusOpen : styles.statusClosed}`}>
          {liveOpen ? 'Geöffnet' : 'Geschlossen'}
        </span>
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
          onClick={handleToggle}
          disabled={toggling || !meeting}
        >
          {toggling ? '…' : liveOpen ? 'Fenster schließen' : 'Fenster öffnen'}
        </button>
      </div>
    </div>
  );
}
