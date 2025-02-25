"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Sidebar } from '@/components/dashboard/sidebar';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const currentStoreId = params?.storeId as string;

  return (
    <div className="min-h-screen bg-background">
      <DashboardShell
        sidebarOpen={sidebarOpen}
        onSidebarOpenChange={setSidebarOpen}
      >
        {[
          <Sidebar key="sidebar" currentStoreId={currentStoreId} isCollapsed={!sidebarOpen} />,
          children
        ]}
      </DashboardShell>
    </div>
  )
}
