'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export function LandingPage() {
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Detectar quando o usuário rola a página
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleAccordion = (index: number) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#050614] text-white">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md py-3 shadow-lg' : 'bg-transparent py-4'}`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src="/dropfy/logo.png" alt="Dropfy logo" className="h-8" />
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#home" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Home</a>
            <a href="#beneficios" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Benefícios</a>
            <a href="#planos" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Planos</a>
            <a href="#faq" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Login</Link>
            <a href="#planos" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300">Criar Conta</a>
          </div>
        </div>
      </header>
      
      {/* Hero Section com efeito de gradiente moderno */}
      <section id="home" className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#050614] via-[#0A1033] to-[#050614] z-0"></div>
        
        {/* Efeitos visuais de fundo */}
        <div className="absolute top-0 left-0 right-0 h-full overflow-hidden z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
            A primeira Inteligência<br />
            Artificial para<br />
            dropshipping que faz<br />
            tudo por você
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Encontre, crie, traduza, melhore e venda com IA.<br />
            Dropfy é a única plataforma 360° com inteligência artificial que cria páginas<br />
            de produtos prontas para vender, mesmo se você for um completo iniciante.
          </p>
          <a href="#planos" className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-medium text-lg hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300">
            Quero experimentar Dropfy agora
          </a>
          <p className="text-gray-400 text-sm mt-6">Sem risco. Sem compromisso.</p>
          
          {/* Indicador de scroll */}
          <div className="relative mt-8 animate-bounce">
            <svg className="w-6 h-6 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section - Modernizada */}
      <section id="beneficios" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050614] to-[#070920] z-0"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 inline-block bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
              A revolução do dropshipping com IA já começou
            </h2>
            <p className="text-blue-400 text-lg font-medium">
              E só os mais espertos perceberam
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature cards e demais conteúdos... */}
            {/* O restante do conteúdo da landing page */}
          </div>
        </div>
      </section>

      {/* Restante das seções... */}
    </div>
  );
} 