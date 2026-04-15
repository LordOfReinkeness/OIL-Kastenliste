import { useEffect, useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { TokenEntryPopup } from '../components/popup/TokenEntryPopup';
import { ExcusePopup } from '../components/popup/ExcusePopup';
import { useUserSession } from '../hooks/useUserSession';
import { UsersService } from '../api';
import styles from './Home.module.css';

interface UserStats {
  totalMeetings: number;
  absent: number;
  late: number;
  infractions: number;
}

export function Home() {
  const { user } = useUserSession();
  const [showExcuse, setShowExcuse] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [excuseSuccess, setExcuseSuccess] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (!user) return;
    UsersService.usersControllerGetUserStats(user.id)
      .then(setStats)
      .catch(() => {});
  }, [user]);

  function handleExcuseSuccess() {
    setShowExcuse(false);
    setExcuseSuccess(true);
  }

  return (
    <PageLayout>
      <div className={styles.content}>
        {user && <p className={styles.greeting}>Hallo, {user.firstName}</p>}

        {stats && (
          <p className={styles.stats}>
            {stats.totalMeetings} Meetings
            · {stats.absent} fehlend
            · {stats.late} verspätet
            · <strong>{stats.infractions} Kasten</strong>
          </p>
        )}

        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            onClick={() => setShowExcuse(true)}
            disabled={excuseSuccess}
          >
            Fürs nächste Weekly entschuldigen
          </button>
          <button
            className={styles.actionButton}
            onClick={() => setShowCheckin(true)}
          >
            Einchecken
          </button>
        </div>

        {excuseSuccess && (
          <p className={styles.successMessage}>Entschuldigung wurde eingereicht.</p>
        )}
      </div>

      {showExcuse && (
        <ExcusePopup
          onClose={() => setShowExcuse(false)}
          onSuccess={handleExcuseSuccess}
        />
      )}
      {showCheckin && <TokenEntryPopup onClose={() => setShowCheckin(false)} />}
    </PageLayout>
  );
}
