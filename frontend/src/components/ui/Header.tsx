import { useUserSession } from '../../hooks/useUserSession';
import styles from './Header.module.css';

export function Header() {
  const { user, clearUser } = useUserSession();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logoGroup}>
          <img src="/oil-stasi.svg" alt="OIL STASI" className={styles.logo} />
          <p className={styles.subtitle}>Strichlisten-Tool zur Anwesenheits- und Sitzungs-Inspektion</p>
        </div>
        {user && (
          <button className={styles.logout} onClick={clearUser}>
            Abmelden
          </button>
        )}
      </div>
    </header>
  );
}

