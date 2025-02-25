"use client"

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Plus,
  Settings,
  HelpCircle
} from 'lucide-react';

interface DashboardShellProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
}

export function DashboardShell({
  children,
  sidebarOpen,
  onSidebarOpenChange
}: DashboardShellProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex">
      <div className="fixed inset-0 bg-background -z-10" />
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-r bg-card"
          >
            {children[0]}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col">
        <main className="flex-1 relative p-6">
          {children[1]}
        </main>
      </div>
    </div>
  );
}