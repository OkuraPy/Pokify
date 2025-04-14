import { Inter, Poppins } from 'next/font/google';
import { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

// Carregando a fonte Inter usando o sistema de fontes do Next.js
const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

// Carregando a fonte Poppins para títulos
const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Dropfy - IA para Dropshipping',
  description: 'Dropfy é a primeira IA para dropshipping que faz tudo por você. Encontre, crie, traduza, melhore e venda com IA.',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} ${poppins.variable} min-h-screen bg-black text-white`}>
      {/* Script para animações AOS */}
      <Script src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js" strategy="afterInteractive" />
      
      {children}
    </div>
  );
} 