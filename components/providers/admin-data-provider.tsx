'use client';

import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';

interface AdminData {
  fullName: string;
  email: string;
}

interface AdminDataContextValue {
  admin: AdminData | null;
  complianceCount: number | null;
}

const AdminDataContext = createContext<AdminDataContextValue>({
  admin: null,
  complianceCount: null,
});

export function useAdminData() {
  return useContext(AdminDataContext);
}

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const { data: meData } = useQuery({
    queryKey: ['admin-me'],
    queryFn: () => fetch('/api/me').then((r) => r.json()),
    staleTime: 10 * 60 * 1000,
  });

  const { data: complianceData } = useQuery({
    queryKey: ['compliance-summary'],
    queryFn: () => fetch('/api/compliance').then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const admin: AdminData | null = meData?.ok ? meData.data : null;
  const complianceCount: number | null = complianceData?.ok
    ? (complianceData.data.summary.totalIssues ?? null)
    : null;

  return (
    <AdminDataContext.Provider value={{ admin, complianceCount }}>
      {children}
    </AdminDataContext.Provider>
  );
}
