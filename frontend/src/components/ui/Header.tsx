import { useUserSession } from '../../hooks/useUserSession';
import styles from './Header.module.css';

export function Header() {
  const { user, clearUser } = useUserSession();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <img
          src="/OIL_logo.png"
          alt="OIL Logo"
          className={styles.logo}
        />
        <span className={styles.title}>Strafstriche</span>
        {user && (
          <button className={styles.logout} onClick={clearUser}>
            Abmelden
          </button>
        )}
      </div>
    </header>
  );
}

