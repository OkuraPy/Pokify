import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

// Carregando a fonte Inter usando o sistema de fontes do Next.js
const inter = Inter({ 
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
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Dropfy - IA para Dropshipping</title>
        <meta name="description" content="Dropfy é a primeira IA para dropshipping que faz tudo por você. Encontre, crie, traduza, melhore e venda com IA." />
        
        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <Script src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js" strategy="afterInteractive" />
      </head>
      <body className={`${inter.variable} ${poppins.variable} min-h-screen bg-black text-white`}>
        {/* Remova o import do TailwindCSS via CDN - já está no projeto */}
        
        {children}
      </body>
    </html>
  );
} 