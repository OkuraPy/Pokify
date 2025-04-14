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
  title: 'Pokify - Gerenciamento de Produtos para E-commerce',
  description: 'Seamlessly sync products from AliExpress to your Shopify store',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
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