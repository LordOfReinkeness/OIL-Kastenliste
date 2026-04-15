import { useState } from 'react';
import { Popup } from './Popup';
import { useAuth } from '../../context/AuthContext';
import styles from './RzIdPopup.module.css';

export function LoginPopup() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!password) return;
    setLoading(true);
    setError('');
    try {
      await login(password);
    } catch {
      setError('Falsches Passwort.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popup title="Admin Login">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">Passwort</label>
        <input
          id="password"
          className={styles.input}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          disabled={loading}
          autoFocus
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button
        className={styles.button}
        onClick={handleLogin}
        disabled={loading || !password}
      >
        {loading ? 'Laden…' : 'Anmelden'}
      </button>
    </Popup>
  );
}
