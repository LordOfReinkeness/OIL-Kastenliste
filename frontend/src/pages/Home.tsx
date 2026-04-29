import { useEffect, useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { TokenEntryPopup } from '../components/popup/TokenEntryPopup';
import { ExcusePopup } from '../components/popup/ExcusePopup';
import { useUserSession } from '../hooks/useUserSession';
import { UsersService } from '../api';
import { UserMeetingHistory } from '../components/ui/UserMeetingHistory';
import styles from './Home.module.css';

interface MeetingEntry {
  id: string;
  date: string;
  infractions: number | null;
}

interface UserStats {
  totalInfractions: number;
  meetings: MeetingEntry[];
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

        {stats && (
          <UserMeetingHistory
            meetings={stats.meetings}
            totalInfractions={stats.totalInfractions}
          />
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
