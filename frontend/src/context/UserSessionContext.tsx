import { createContext, useState } from 'react';

export interface SessionUser {
  id: string;
  rzId: string;
  firstName: string;
  lastName: string;
}

interface UserSessionContextValue {
  user: SessionUser | null;
  setUser: (user: SessionUser) => void;
  clearUser: () => void;
}

const STORAGE_KEY = 'kastenliste_user';

function loadFromStorage(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export const UserSessionContext = createContext<UserSessionContextValue>({
  user: null,
  setUser: () => {},
  clearUser: () => {},
});

export function UserSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<SessionUser | null>(loadFromStorage);

  function setUser(user: SessionUser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setUserState(user);
  }

  function clearUser() {
    localStorage.removeItem(STORAGE_KEY);
    setUserState(null);
  }

  return (
    <UserSessionContext value={{ user, setUser, clearUser }}>
      {children}
    </UserSessionContext>
  );
}
