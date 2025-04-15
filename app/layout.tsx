import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/use-auth';
import { StoresProvider } from '@/hooks/use-stores';
import { PasswordChangeModal } from '@/components/auth/password-change-modal';

// Configuração da fonte Inter
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'Dropfy - Inteligência Artificial para Dropshipping',
  description: 'Encontre, crie, traduza, melhore e venda com IA. Dropfy é a única plataforma 360° com inteligência artificial para dropshipping.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link 
          rel="icon" 
          href="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' rx='4' fill='%232563EB'/%3E%3Cpath d='M6 3H14C18.4183 3 22 6.58172 22 11C22 15.4183 18.4183 19 14 19H6V3Z' fill='white'/%3E%3Cpath d='M6 3V19' stroke='%232563EB' strokeWidth='1.5' strokeLinecap='round'/%3E%3C/svg%3E"
        />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <StoresProvider>
              {children}
              <Toaster />
              <PasswordChangeModal />
            </StoresProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}