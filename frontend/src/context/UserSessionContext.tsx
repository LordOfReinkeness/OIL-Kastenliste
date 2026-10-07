import { createContext, useEffect, useState } from 'react';
import { UsersService, isUserNotFound } from '../api';

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

  // the stored session may be stale: validate it once against the backend
  useEffect(() => {
    const stored = loadFromStorage();
    if (!stored) return;
    UsersService.usersControllerFindByRzId(stored.rzId)
      .then(found => UsersService.usersControllerFindOne(found.id))
      .then((fresh: SessionUser) => {
        const changed =
          fresh.id !== stored.id ||
          fresh.firstName !== stored.firstName ||
          fresh.lastName !== stored.lastName;
        if (changed) setUser(fresh);
      })
      .catch(e => {
        // keep the session on network/server errors
        if (isUserNotFound(e)) clearUser();
      });
  }, []);

  return (
    <UserSessionContext value={{ user, setUser, clearUser }}>
      {children}
    </UserSessionContext>
  );
}
