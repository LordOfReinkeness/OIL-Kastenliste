import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { NewMeetingPopup } from '../popup/NewMeetingPopup';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleCreated() {
    setRefreshKey(k => k + 1);
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div className={styles.topBarLogoGroup}>
          <img src="/oil-stasi.svg" alt="OIL STASI" className={styles.topBarLogo} />
          <p className={styles.topBarSubtitle}>Strichlisten-Tool zur Anwesenheits- und Sitzungs-Inspektion</p>
        </div>
        <div className={styles.topBarActions}>
          <button className={styles.newMeetingButton} onClick={() => setShowNewMeeting(true)}>
            + Neues Meeting
          </button>
          <button className={styles.logoutButton} onClick={handleLogout}>
            Abmelden
          </button>
        </div>
      </header>
      <nav className={styles.tabBar}>
        <NavLink to="/admin" end
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}>
          Übersicht
        </NavLink>
        <NavLink to="/admin/meetings"
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}>
          Meetings
        </NavLink>
        <NavLink to="/admin/users"
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}>
          Benutzer
        </NavLink>
      </nav>
      <main className={styles.content}>
        <Outlet context={{ refreshKey }} />
      </main>

      {showNewMeeting && (
        <NewMeetingPopup
          onClose={() => setShowNewMeeting(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
