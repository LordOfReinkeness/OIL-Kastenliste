import { useUserSession } from '../../hooks/useUserSession';
import styles from './Header.module.css';

export function Header() {
  const { user, clearUser } = useUserSession();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.mobileStack}>
          <div className={styles.logoGroup}>
            <img src="/oil-nsa.svg" alt="OIL NSA" className={styles.logo} />
            <p className={styles.subtitle}>Nachverfolgung, Sitzungen & Anwesenheit</p>
          </div>
          {user && (
            <button className={styles.logout} onClick={clearUser}>
              Abmelden
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

