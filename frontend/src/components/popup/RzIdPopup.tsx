import { useState } from 'react';
import { Popup } from './Popup';
import { UsersService, ApiError } from '../../api';
import { useUserSession } from '../../hooks/useUserSession';
import styles from './RzIdPopup.module.css';

const DESCRIPTION = 'Gib deine HTWG RZ-ID ein, um dein Profil zu laden. Kein Passwort nötig.';

const RZ_ID_REGEX = /^[a-z]{2}\d{3}[a-z]{3}$/;
const RZ_ID_EXCEPTIONS = ['terb'];

function isValidRzId(value: string): boolean {
  return RZ_ID_REGEX.test(value) || RZ_ID_EXCEPTIONS.includes(value);
}

export function RzIdPopup() {
  const { setUser } = useUserSession();

  const [rzId, setRzId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLookup() {
    if (!rzId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const found = await UsersService.usersControllerFindByRzId(rzId.trim());
      const fullUser = await UsersService.usersControllerFindOne(found.id);
      setUser(fullUser);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setExpanded(true);
      } else {
        setError('Fehler beim Server. Bitte erneut versuchen.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!firstName.trim() || !lastName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const user = await UsersService.usersControllerCreate({
        rzId: rzId.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setUser(user);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('Diese RZ-ID ist bereits vergeben.');
      } else {
        setError('Fehler beim Server. Bitte erneut versuchen.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, action: () => void) {
    if (e.key === 'Enter') action();
  }

  return (
    <Popup title="Profil laden">
      <p className={styles.hint}>{DESCRIPTION}</p>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="rzId">RZ-ID</label>
        <input
          id="rzId"
          className={styles.input}
          type="text"
          value={rzId}
          onChange={e => setRzId(e.target.value.toLowerCase())}
          onBlur={e => setRzId(e.target.value.trim().toLowerCase())}
          onKeyDown={e => !expanded && handleKeyDown(e, handleLookup)}
          placeholder="z.B. ma12mus"
          disabled={loading || expanded}
          autoFocus
        />
      </div>

      <div className={`${styles.expandable} ${expanded ? styles.expanded : ''}`}>
        <div className={styles.expandableInner}>
          <p className={styles.hint}>
            Diese RZ-ID ist noch nicht registriert. Gib deinen Namen ein, um ein Konto zu erstellen.
          </p>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="firstName">Vorname</label>
            <input
              id="firstName"
              className={styles.input}
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              onBlur={e => setFirstName(e.target.value.trim())}
              disabled={loading}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="lastName">Nachname</label>
            <input
              id="lastName"
              className={styles.input}
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              onBlur={e => setLastName(e.target.value.trim())}
              onKeyDown={e => handleKeyDown(e, handleRegister)}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {!expanded && rzId && !isValidRzId(rzId) && (
        <p className={styles.error}>Format: ab123cde (z.B. ma123mus)</p>
      )}

      {!expanded ? (
        <button
          className={styles.button}
          onClick={handleLookup}
          disabled={loading || !rzId.trim() || !isValidRzId(rzId)}
        >
          {loading ? 'Laden…' : 'Weiter'}
        </button>
      ) : (
        <button
          className={styles.button}
          onClick={handleRegister}
          disabled={loading || !firstName.trim() || !lastName.trim()}
        >
          {loading ? 'Laden…' : 'Registrieren'}
        </button>
      )}
    </Popup>
  );
}
