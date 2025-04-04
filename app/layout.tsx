import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/use-auth';
import { StoresProvider } from '@/hooks/use-stores';

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
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
            </StoresProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}