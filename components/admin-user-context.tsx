'use client';

import { createContext, useContext } from 'react';

type AdminUser = { id: string; name: string };

const AdminUserContext = createContext<AdminUser | null>(null);

export function AdminUserProvider({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  return <AdminUserContext.Provider value={user}>{children}</AdminUserContext.Provider>;
}

export function useAdminUser(): AdminUser {
  const ctx = useContext(AdminUserContext);
  if (!ctx) throw new Error('useAdminUser must be used within AdminUserProvider');
  return ctx;
}