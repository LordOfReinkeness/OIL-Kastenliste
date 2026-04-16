import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { TokenService } from '../api';
import styles from './LiveScreen.module.css';

export function LiveScreen() {
  const { token } = useParams<{ token: string }>();
  const [meeting, setMeeting] = useState<any>(null);
  const [liveOpen, setLiveOpen] = useState(false);

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

      </div>
    </div>
  );
}
