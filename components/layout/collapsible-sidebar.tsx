'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Store,
  Package,
  Star,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    label: 'Lojas',
    href: '/dashboard/stores',
    icon: Store
  },
  {
    label: 'Produtos',
    href: '/dashboard/products',
    icon: Package
  },
  {
    label: 'Reviews',
    href: '/dashboard/reviews',
    icon: Star
  },
  {
    label: 'Configurações',
    href: '/dashboard/settings',
    icon: Settings
  }
];

export function CollapsibleSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDragStart = (event: MouseEvent | TouchEvent | PointerEvent) => {
    setIsDragging(true);
    if ('touches' in event) {
      dragStartX.current = event.touches[0].clientX;
    } else {
      dragStartX.current = (event as MouseEvent).clientX;
    }
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isDragging) return;

    const currentX = 'touches' in event 
      ? event.touches[0].clientX 
      : (event as MouseEvent).clientX;

    const dragDistance = currentX - dragStartX.current;

    if (isCollapsed && dragDistance > 50) {
      setIsCollapsed(false);
    } else if (!isCollapsed && dragDistance < -50) {
      setIsCollapsed(true);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <motion.div
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-card border-r touch-none select-none',
        isCollapsed ? 'w-16' : 'w-64'
      )}
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.3 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      dragMomentum={false}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xl font-bold"
            >
              Pokify
            </motion.div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="space-y-2 flex-1">
          <AnimatePresence>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block"
                >
                  <motion.div
                    className={cn(
                      'flex items-center px-3 py-2 rounded-lg transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive && 'bg-accent text-accent-foreground',
                      !isCollapsed && 'justify-start',
                      isCollapsed && 'justify-center'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="h-5 w-5" />
                    {!isCollapsed && (
                      <motion.span
                        className="ml-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </AnimatePresence>
        </nav>
      </div>
    </motion.div>
  );
}
