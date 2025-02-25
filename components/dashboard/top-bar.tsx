"use client"

import { Button } from '@/components/ui/button';
import {
  Bell,
  User,
  HelpCircle
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export function TopBar() {
  const [notifications, setNotifications] = useState(3);

  return (
    <div className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="hover:bg-secondary transition-soft relative">
          <HelpCircle className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="hover:bg-secondary transition-soft relative">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {notifications > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center"
              >
                <span className="text-[10px] font-medium text-white">{notifications}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
        <Link href="/dashboard/profile">
          <Button variant="ghost" size="icon" className="hover:bg-secondary transition-soft">
            <User className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}