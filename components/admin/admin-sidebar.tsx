'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartBarIcon, UsersIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    name: 'Dashboard Admin',
    href: '/admin',
    icon: ChartBarIcon
  },
  {
    name: 'Usuários',
    href: '/admin/usuarios',
    icon: UsersIcon
  }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 h-full bg-gray-900 text-white p-5">
      <div className="text-2xl font-bold mb-8 text-blue-400">Área Admin</div>
      
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-3 rounded-lg transition-colors',
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
