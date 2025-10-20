'use client';

import { createContext, useContext, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  role: string;
}

interface UserContextType {
  user: User | null;
}

const UserContext = createContext<UserContextType>({ user: null });

export function UserProvider({ children, user }: { children: ReactNode; user: User | null }) {
  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

