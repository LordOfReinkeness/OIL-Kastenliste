import { Header } from '../ui/Header';
import { RzIdPopup } from '../popup/RzIdPopup';
import { useUserSession } from '../../hooks/useUserSession';
import styles from './PageLayout.module.css';

export function PageLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUserSession();

  return (
    <>
      <Header />
      <main className={styles.main}>
        {children}
      </main>
      {!user && <RzIdPopup />}
    </>
  );
}
