'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const testimonialSliderRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Total de depoimentos para controle de navegação
  const totalTestimonials = 3;
  
  // Timer de contagem regressiva para a promoção
  useEffect(() => {
    // Verificar se já existe uma data de expiração no localStorage
    const savedExpireDate = localStorage.getItem('promoExpireDate');
    const expireDate = savedExpireDate 
      ? new Date(savedExpireDate) 
      : new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias
    
    // Se não existe, salvar a nova data de expiração
    if (!savedExpireDate) {
      localStorage.setItem('promoExpireDate', expireDate.toString());
    }
    
    const updateTimer = () => {
      const now = new Date();
      const diff = expireDate.getTime() - now.getTime();
      
      // Se a data expirou, resetar o timer
      if (diff <= 0) {
        localStorage.removeItem('promoExpireDate');
        return;
      }
      
      // Calcular dias, horas, minutos e segundos
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      // Atualizar os elementos do timer
      const daysElement = document.getElementById('days');
      const hoursElement = document.getElementById('hours');
      const minutesElement = document.getElementById('minutes');
      const secondsElement = document.getElementById('seconds');
      
      if (daysElement) daysElement.textContent = days.toString().padStart(2, '0');
      if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
      if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
      if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');
    };
    
    // Atualizar o timer a cada segundo
    const timerInterval = setInterval(updateTimer, 1000);
    updateTimer(); // Executar imediatamente
    
    return () => clearInterval(timerInterval);
  }, []);
  
  // Detectar quando o usuário rola a página
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Inicializar e configurar o slider
  useEffect(() => {
    if (testimonialSliderRef.current) {
      const slider = testimonialSliderRef.current;
      
      // Detectar quando o usuário arrasta o slider
      let startX: number;
      let scrollLeft: number;
      
      const onTouchStart = (e: TouchEvent) => {
        startX = e.touches[0].pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      };
      
      const onTouchMove = (e: TouchEvent) => {
        if (!startX) return;
        const x = e.touches[0].pageX - slider.offsetLeft;
        const dist = (startX - x);
        slider.scrollLeft = scrollLeft + dist;
      };
      
      const onTouchEnd = () => {
        startX = undefined as any;
        
        // Determinar para qual card navegar com base na posição atual do scroll
        const cardWidth = slider.querySelector('.testimonial-card')?.clientWidth || 0;
        const scrollPosition = slider.scrollLeft;
        const newIndex = Math.round(scrollPosition / cardWidth);
        
        if (newIndex !== currentTestimonial && newIndex >= 0 && newIndex < totalTestimonials) {
          setCurrentTestimonial(newIndex);
        }
      };
      
      // Adicionar event listeners para touch devices
      slider.addEventListener('touchstart', onTouchStart, { passive: true });
      slider.addEventListener('touchmove', onTouchMove, { passive: true });
      slider.addEventListener('touchend', onTouchEnd, { passive: true });
      
      // Limpeza
      return () => {
        slider.removeEventListener('touchstart', onTouchStart);
        slider.removeEventListener('touchmove', onTouchMove);
        slider.removeEventListener('touchend', onTouchEnd);
      };
    }
  }, [currentTestimonial, totalTestimonials]);

  const toggleAccordion = (index: number) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };
  
  // Função para navegar para o depoimento anterior
  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev === 0 ? totalTestimonials - 1 : prev - 1));
    scrollToTestimonial(currentTestimonial === 0 ? totalTestimonials - 1 : currentTestimonial - 1);
  };
  
  // Função para navegar para o próximo depoimento
  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev === totalTestimonials - 1 ? 0 : prev + 1));
    scrollToTestimonial(currentTestimonial === totalTestimonials - 1 ? 0 : currentTestimonial + 1);
  };
  
  // Função para ir para um depoimento específico
  const goToTestimonial = (index: number) => {
    setCurrentTestimonial(index);
    scrollToTestimonial(index);
  };
  
  // Função para rolar para um depoimento específico
  const scrollToTestimonial = (index: number) => {
    if (testimonialSliderRef.current) {
      const slider = testimonialSliderRef.current;
      const cards = slider.querySelectorAll('.testimonial-card');
      if (cards[index]) {
        // Usar scrollIntoView com comportamento suave
        cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
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
            <a href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Login</a>
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
            {/* Feature 1 */}
            <div className="feature-card group p-8 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/60 to-gray-950/60 backdrop-blur-sm hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
              <div className="mb-6 bg-blue-600/10 w-16 h-16 rounded-xl flex items-center justify-center group-hover:bg-blue-600/20 transition-all duration-300">
                <img src="/images/dropfy/icon-product-pages.png" alt="AI icon for product pages" className="h-10 w-10" />
              </div>
              <p className="text-blue-400 text-sm font-medium mb-2">Treinamos 60 bilhões</p>
              <h3 className="text-xl font-bold mb-3 group-hover:text-blue-300 transition-colors">Páginas de produto geradas por IA</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                A IA cria, em tempo real, páginas de alta conversão com textos persuasivos, imagens e tudo pronto para venda.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card group p-8 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/60 to-gray-950/60 backdrop-blur-sm hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
              <div className="mb-6 bg-blue-600/10 w-16 h-16 rounded-xl flex items-center justify-center group-hover:bg-blue-600/20 transition-all duration-300">
                <img src="/images/dropfy/icon-translation.png" alt="Translation icon" className="h-10 w-10" />
              </div>
              <p className="text-blue-400 text-sm font-medium mb-2">Acabou com aquele robô</p>
              <h3 className="text-xl font-bold mb-3 group-hover:text-blue-300 transition-colors">Tradução nativa e instantânea</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                Venda em qualquer idioma com textos fluentes como se fossem escritos por nativos no Brasil, América Latina e mundo.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card group p-8 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/60 to-gray-950/60 backdrop-blur-sm hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
              <div className="mb-6 bg-blue-600/10 w-16 h-16 rounded-xl flex items-center justify-center group-hover:bg-blue-600/20 transition-all duration-300">
                <img src="/images/dropfy/icon-description.png" alt="AI description icon" className="h-10 w-10" />
              </div>
              <p className="text-blue-400 text-sm font-medium mb-2">O impossível é possível</p>
              <h3 className="text-xl font-bold mb-3 group-hover:text-blue-300 transition-colors">Melhoria automática de descrição</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                Transforme qualquer texto básico em uma obra persuasiva com um clique.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="feature-card group p-8 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/60 to-gray-950/60 backdrop-blur-sm hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
              <div className="mb-6 bg-blue-600/10 w-16 h-16 rounded-xl flex items-center justify-center group-hover:bg-blue-600/20 transition-all duration-300">
                <img src="/images/dropfy/icon-reviews.png" alt="Reviews icon" className="h-10 w-10" />
              </div>
              <p className="text-blue-400 text-sm font-medium mb-2">Já instalamos pronto para você</p>
              <h3 className="text-xl font-bold mb-3 group-hover:text-blue-300 transition-colors">Reviews humanizados e traduzidos</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                Seus produtos já vêm com reviews otimizados para conversão e adaptados ao idioma do cliente.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="feature-card group p-8 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/60 to-gray-950/60 backdrop-blur-sm hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
              <div className="mb-6 bg-blue-600/10 w-16 h-16 rounded-xl flex items-center justify-center group-hover:bg-blue-600/20 transition-all duration-300">
                <img src="/images/dropfy/icon-image-translation.png" alt="Product research icon" className="h-10 w-10" />
              </div>
              <p className="text-blue-400 text-sm font-medium mb-2">O impossível agora é possível</p>
              <h3 className="text-xl font-bold mb-3 group-hover:text-blue-300 transition-colors">Tradução automática de imagens</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                A IA detecta e traduz automaticamente textos nas imagens dos produtos — algo inimaginável até hoje.
              </p>
            </div>
            
            {/* Espaço para mais funcionalidades ou CTA */}
            <div className="feature-card group p-8 rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-900/20 to-gray-950/60 backdrop-blur-sm hover:border-blue-500/80 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center justify-center text-center">
              <h3 className="text-xl font-bold mb-3 group-hover:text-blue-300 transition-colors">Pronto para decolar?</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors mb-6">
                A plataforma escolhida por quem entende de escala e resultado.
              </p>
              <a href="#planos" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300">
                Ver planos
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Modernizada */}
      <section id="depoimentos" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#070920] to-[#050614] z-0"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 inline-block bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
              Mais de 1.000 usuários já escalam com Dropfy
            </h2>
          </div>

          <div className="testimonial-slider relative max-w-6xl mx-auto">
            <div className="slider-controls absolute top-1/2 transform -translate-y-1/2 w-full flex justify-between pointer-events-none">
              <button 
                onClick={prevTestimonial}
                className="slider-prev bg-gradient-to-r from-gray-900 to-black/70 backdrop-blur-md text-white p-3 rounded-full shadow-lg pointer-events-auto opacity-75 hover:opacity-100 transition-all duration-300 -ml-4 z-10"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button 
                onClick={nextTestimonial}
                className="slider-next bg-gradient-to-l from-gray-900 to-black/70 backdrop-blur-md text-white p-3 rounded-full shadow-lg pointer-events-auto opacity-75 hover:opacity-100 transition-all duration-300 -mr-4 z-10"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-hidden">
              <div 
                className="flex items-stretch space-x-6 pb-12 px-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide" 
                ref={testimonialSliderRef}
                style={{ 
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {/* Testimonial 1 */}
                <div className="testimonial-card min-w-[280px] w-full md:w-[340px] max-w-[380px] flex-shrink-0 p-6 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/60 to-gray-950/60 backdrop-blur-md hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 snap-start flex flex-col h-auto">
                  <div className="flex items-center mb-4 text-yellow-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                  </div>
                  <div className="mb-4 flex-grow">
                    <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                      "O que mais me impressionou foi a velocidade. Eu montei 5 páginas prontas em menos de 20 minutos. E o melhor: com qualidade muito profissional. Vale cada centavo, nunca vi nada no mercado igual a Dropfy"
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-4">
                      <img src="/images/dropfy/avatar-neto.png" alt="Foto de perfil" className="w-12 h-12 rounded-full border-2 border-blue-500 object-cover" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Neto</h4>
                      <p className="text-sm text-blue-400">Empreendedor Digital</p>
                    </div>
                  </div>
                </div>

                {/* Testimonial 2 */}
                <div className="testimonial-card min-w-[280px] w-full md:w-[340px] max-w-[380px] flex-shrink-0 p-6 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/60 to-gray-950/60 backdrop-blur-md hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 snap-start flex flex-col h-auto">
                  <div className="flex items-center mb-4 text-yellow-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                  </div>
                  <div className="mb-4 flex-grow">
                    <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                      "Antigamente eu fazia tudo no braço. Era exaustivo subir produto, criar copy, traduzir no tradutor, fazer reviews e revisar tudo… Agora com a Dropfy, eu só escolho o produto e pronto, a IA monta tudo em segundos. Sem dúvidas essa ferramenta mudou meu jogo"
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-4">
                      <img src="/images/dropfy/avatar-henrique.png" alt="Foto de perfil" className="w-12 h-12 rounded-full border-2 border-blue-500 object-cover" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Henrique F.</h4>
                      <p className="text-sm text-blue-400">Lojista</p>
                    </div>
                  </div>
                </div>

                {/* Testimonial 3 */}
                <div className="testimonial-card min-w-[280px] w-full md:w-[340px] max-w-[380px] flex-shrink-0 p-6 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/60 to-gray-950/60 backdrop-blur-md hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 snap-start flex flex-col h-auto">
                  <div className="flex items-center mb-4 text-yellow-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                  </div>
                  <div className="mb-4 flex-grow">
                    <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                      "Eu traduzi um produtinho com um clique e começou a vender na Colômbia no mesmo dia. Nunca pensei que escalar pra fora fosse tão simples. Dropfy virou essencial na minha operação"
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-4">
                      <img src="/images/dropfy/avatar-luan.png" alt="Foto de perfil" className="w-12 h-12 rounded-full border-2 border-blue-500 object-cover" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Luan Maccario</h4>
                      <p className="text-sm text-blue-400">E-commerce Manager</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pagination dots */}
            <div className="flex justify-center space-x-2 mt-8">
              <button 
                onClick={() => goToTestimonial(0)} 
                className={`w-3 h-3 rounded-full transition-colors ${currentTestimonial === 0 ? 'bg-blue-600' : 'bg-gray-600 hover:bg-blue-400'}`}
              ></button>
              <button 
                onClick={() => goToTestimonial(1)} 
                className={`w-3 h-3 rounded-full transition-colors ${currentTestimonial === 1 ? 'bg-blue-600' : 'bg-gray-600 hover:bg-blue-400'}`}
              ></button>
              <button 
                onClick={() => goToTestimonial(2)} 
                className={`w-3 h-3 rounded-full transition-colors ${currentTestimonial === 2 ? 'bg-blue-600' : 'bg-gray-600 hover:bg-blue-400'}`}
              ></button>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-xl text-blue-400 font-medium">Chega de perder tempo com processos manuais que não vendem.</p>
          </div>
        </div>
      </section>

      {/* Before/After Transformation Section - Modernizada */}
      <section id="transformacao" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050614] to-[#070920] z-0"></div>
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob"></div>
        <div className="absolute bottom-40 right-1/4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob animation-delay-2000"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 inline-block bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
              Veja a transformação que a IA da Dropfy<br className="hidden md:block" /> faz na sua loja em minutos
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Com a Dropfy, você só escolhe o produto. A IA escreve, traduz, revisa e cria páginas prontas pra vender.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {/* Before */}
            <div className="transform transition-all duration-500 hover:scale-105">
              <div className="relative bg-gradient-to-b from-gray-900/80 to-gray-950/80 rounded-2xl border border-red-500/30 p-8 shadow-xl backdrop-blur-sm">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-red-600 to-red-400 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-red-500/20">
                    ANTES
                  </div>
                </div>
                
                <div className="pt-6">
                  <ul className="space-y-6">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4 bg-red-500/20 p-1 rounded-full">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">Traduz com Google</h3>
                        <p className="text-gray-400 text-sm">Traduções robóticas que afastam seus clientes.</p>
                      </div>
                    </li>
                    
                    <li className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4 bg-red-500/20 p-1 rounded-full">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">Descrição copiada</h3>
                        <p className="text-gray-400 text-sm">Textos repetitivos que não geram engajamento.</p>
                      </div>
                    </li>
                    
                    <li className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4 bg-red-500/20 p-1 rounded-full">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">Sem reviews</h3>
                        <p className="text-gray-400 text-sm">Falta de social proof que impacta negativamente vendas.</p>
                      </div>
                    </li>
                    
                    <li className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4 bg-red-500/20 p-1 rounded-full">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">Página genérica</h3>
                        <p className="text-gray-400 text-sm">Visual sem identidade que não transmite confiança.</p>
                      </div>
                    </li>
                    
                    <li className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4 bg-red-500/20 p-1 rounded-full">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">Concorrência espia sua loja</h3>
                        <p className="text-gray-400 text-sm">Sua estratégia fica exposta para qualquer um copiar.</p>
                      </div>
                    </li>
                    
                    <li className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4 bg-red-500/20 p-1 rounded-full">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">Horas editando páginas</h3>
                        <p className="text-gray-400 text-sm">Desperdício de tempo que você poderia usar para escalar.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* After */}
            <div className="transform transition-all duration-500 hover:scale-105">
              <div className="relative bg-gradient-to-b from-gray-900/80 to-gray-950/80 rounded-2xl border border-green-500/30 p-8 shadow-xl backdrop-blur-sm">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-green-600 to-green-400 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-green-500/20">
                    DEPOIS
                  </div>
                </div>
                
                <div className="pt-6">
                  <ul className="space-y-6">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4 bg-green-500/20 p-1 rounded-full">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">Tradução nativa com IA</h3>
                        <p className="text-gray-400 text-sm">Textos que parecem escritos por um nativo do idioma.</p>
                      </div>
                    </li>
                    
                    <li className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4 bg-green-500/20 p-1 rounded-full">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">Copy profissional e otimizada</h3>
                        <p className="text-gray-400 text-sm">Descrições persuasivas que realmente vendem.</p>
                      </div>
                    </li>
                    
                    <li className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4 bg-green-500/20 p-1 rounded-full">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">Reviews humanizados e traduzidos</h3>
                        <p className="text-gray-400 text-sm">Avaliações que criam confiança e aumentam a conversão.</p>
                      </div>
                    </li>
                    
                    <li className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4 bg-green-500/20 p-1 rounded-full">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">Página com identidade e conversão</h3>
                        <p className="text-gray-400 text-sm">Design que transmite profissionalismo e exclusividade.</p>
                      </div>
                    </li>
                    
                    <li className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4 bg-green-500/20 p-1 rounded-full">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">Loja blindada contra espiões</h3>
                        <p className="text-gray-400 text-sm">Proteção para sua estratégia e diferenciais competitivos.</p>
                      </div>
                    </li>
                    
                    <li className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4 bg-green-500/20 p-1 rounded-full">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">Página pronta em segundos</h3>
                        <p className="text-gray-400 text-sm">Economize tempo e foque no que realmente importa: vender.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <span className="inline-block bg-gradient-to-r from-green-600 to-green-400 text-white px-6 py-3 rounded-full font-medium shadow-lg shadow-green-500/20 border border-green-500/30 transition-all duration-300 hover:shadow-green-500/20 hover:scale-105 cursor-pointer">
              Teste com 7 dias de garantia
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Section - Modernizada */}
      <section id="planos" className="py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#070920] to-[#050614] z-0"></div>
        
        {/* Blobs de fundo mais suaves e translúcidos */}
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob"></div>
        <div className="absolute bottom-40 left-10 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob animation-delay-4000"></div>
        
        {/* Elementos decorativos de pontos e linhas */}
        <div className="absolute top-20 left-20 w-[1px] h-32 bg-gradient-to-b from-blue-500/0 via-blue-500/20 to-blue-500/0"></div>
        <div className="absolute top-60 right-40 w-[1px] h-24 bg-gradient-to-b from-purple-500/0 via-purple-500/20 to-purple-500/0"></div>
        <div className="absolute bottom-40 left-1/3 w-[1px] h-40 bg-gradient-to-b from-indigo-500/0 via-indigo-500/20 to-indigo-500/0"></div>
        
        {/* Círculos decorativos sutis */}
        <div className="absolute left-1/4 top-1/3 w-6 h-6 rounded-full bg-blue-500/10 blur-sm"></div>
        <div className="absolute right-1/4 top-2/3 w-3 h-3 rounded-full bg-indigo-500/10 blur-sm"></div>
        <div className="absolute left-1/3 bottom-1/4 w-4 h-4 rounded-full bg-purple-500/10 blur-sm"></div>
        <div className="absolute right-1/3 top-1/4 w-2 h-2 rounded-full bg-amber-500/10 blur-sm"></div>
        <div className="absolute left-2/3 bottom-1/3 w-5 h-5 rounded-full bg-yellow-500/10 blur-sm"></div>
        
        {/* Promo Banner com design aprimorado */}
        <div className="relative z-10 max-w-5xl mx-auto mb-36">
          <div className="bg-gradient-to-r from-amber-500/60 via-yellow-500/60 to-orange-500/60 rounded-2xl p-[1px] shadow-xl shadow-yellow-500/20 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 rounded-2xl opacity-30"></div>
            <div className="bg-gradient-to-b from-gray-900/90 to-black/90 rounded-2xl p-10 text-center backdrop-blur-md relative overflow-hidden">
              {/* Elementos decorativos dentro do banner */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-yellow-500/10 rounded-full blur-xl"></div>
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-amber-500/10 rounded-full blur-xl"></div>
              
              <h3 className="text-3xl md:text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-yellow-500 tracking-tight">
                PROMOÇÃO ESPECIAL POR TEMPO LIMITADO
              </h3>
              <p className="text-white text-xl mb-10">
                Preços com <span className="font-bold text-yellow-400">até 60% OFF</span> por apenas 7 dias!
              </p>
              
              {/* Countdown Timer com design refinado */}
              <div className="flex flex-wrap justify-center items-center gap-6 mb-8" id="countdown-container">
                <div className="flex flex-col items-center">
                  <div className="bg-gradient-to-b from-gray-800/60 to-gray-900/60 rounded-xl p-4 w-24 text-center shadow-inner border border-gray-700/30 backdrop-blur-sm">
                    <span className="text-4xl font-bold text-white" id="days">07</span>
                  </div>
                  <span className="text-sm mt-2 text-gray-300">Dias</span>
                </div>
                <div className="text-2xl text-yellow-500 font-bold">:</div>
                <div className="flex flex-col items-center">
                  <div className="bg-gradient-to-b from-gray-800/60 to-gray-900/60 rounded-xl p-4 w-24 text-center shadow-inner border border-gray-700/30 backdrop-blur-sm">
                    <span className="text-4xl font-bold text-white" id="hours">24</span>
                  </div>
                  <span className="text-sm mt-2 text-gray-300">Horas</span>
                </div>
                <div className="text-2xl text-yellow-500 font-bold">:</div>
                <div className="flex flex-col items-center">
                  <div className="bg-gradient-to-b from-gray-800/60 to-gray-900/60 rounded-xl p-4 w-24 text-center shadow-inner border border-gray-700/30 backdrop-blur-sm">
                    <span className="text-4xl font-bold text-white" id="minutes">60</span>
                  </div>
                  <span className="text-sm mt-2 text-gray-300">Minutos</span>
                </div>
                <div className="text-2xl text-yellow-500 font-bold">:</div>
                <div className="flex flex-col items-center">
                  <div className="bg-gradient-to-b from-gray-800/60 to-gray-900/60 rounded-xl p-4 w-24 text-center shadow-inner border border-gray-700/30 backdrop-blur-sm">
                    <span className="text-4xl font-bold text-white" id="seconds">60</span>
                  </div>
                  <span className="text-sm mt-2 text-gray-300">Segundos</span>
                </div>
              </div>
              
              <div className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-full backdrop-blur-sm border border-yellow-600/10">
                <p className="text-yellow-300 font-medium animate-pulse">
                  Não perca esta oportunidade! Preços sobem quando o contador chegar a zero.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-36">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 inline-block bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-200 tracking-tight">
              Planos para você vender todo dia
            </h2>
            
            <div className="flex justify-center mb-6">
              <div className="inline-block px-6 py-2.5 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-xl backdrop-blur-md border border-blue-500/20 shadow-lg shadow-blue-500/10 animate-pulse-slow">
                <span className="text-blue-300 font-semibold tracking-wide flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path>
                  </svg>
                  Planos Flexíveis
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path>
                  </svg>
                </span>
              </div>
            </div>
            
            <p className="text-gray-300 text-xl max-w-3xl mx-auto mb-8">
              Escolha o plano ideal para o seu negócio e comece a vender mais com a Dropfy
            </p>
            
            {/* Linha decorativa abaixo do título */}
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/80 to-blue-500/0 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 max-w-6xl mx-auto">
            {/* Plano Starter */}
            <div className="pricing-card rounded-2xl border border-gray-800/50 transition-all duration-500 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-3 bg-gradient-to-b from-gray-900/60 to-gray-950/60 backdrop-blur-sm relative group overflow-hidden">
              {/* Efeito de luz no canto superior */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              {/* Discount Badge corrigido */}
              <div className="absolute -top-2 -right-2 bg-blue-600 text-white font-bold rounded-full w-20 h-20 flex items-center justify-center z-20 shadow-lg shadow-blue-500/30 border-2 border-blue-400">
                <div className="text-center">
                  <span className="block text-xs font-light">POUPE</span>
                  <span className="block text-xl font-extrabold">50%</span>
                </div>
              </div>
              
              <div className="p-8 lg:p-10">
                <div className="flex justify-center mb-10">
                  <div className="bg-gradient-to-b from-gray-800/40 to-gray-900/40 rounded-full w-24 h-24 flex items-center justify-center shadow-inner backdrop-blur-sm border border-gray-700/20 transition-all duration-500 group-hover:scale-110 group-hover:shadow-blue-500/5 overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-full"></div>
                    <img src="/images/dropfy/rocket-black.png" alt="Starter" className="h-12 w-12 relative z-10" />
                  </div>
                </div>
                
                <h3 className="text-2xl lg:text-3xl font-bold text-center mb-6">Starter</h3>
                <div className="text-center mb-3">
                  <span className="text-lg text-gray-400 line-through inline-block mr-2">R$ 299,80</span>
                  <span className="text-sm text-white bg-gradient-to-r from-green-600/90 to-emerald-500/90 px-3 py-1 rounded-full inline-block shadow-sm border border-green-500/20">-50%</span>
                </div>
                <div className="text-center mb-10">
                  <span className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">R$ 149,90</span>
                  <span className="text-gray-400 ml-1">/mês</span>
                </div>
                <div className="py-3 px-4 bg-blue-900/5 rounded-xl mb-10 text-center backdrop-blur-sm border border-blue-800/10">
                  <span className="text-blue-400 text-sm font-medium">Economize R$ 149,90 por mês!</span>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Até 2 lojas cadastradas</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Importações ilimitadas de produtos</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Geração e Melhoria de Páginas de Produto com IA (até 3 idiomas)</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Tradução de Páginas de Produto com IA</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Descrição, Variantes e Reviews com IA (até 3 idiomas)</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Geração e Tradução de Imagens com IA</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Busca inteligente de fornecedores com IA</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Acesse o produto em AliExpress com IA Avançada</span>
                  </li>
                </ul>
              </div>
              
              <div className="px-8 pb-8">
                <div className="mb-4 flex justify-center">
                  <div className="flex items-center bg-green-900/10 px-4 py-2 rounded-lg border border-green-900/10">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm text-white">7 dias de garantia</span>
                  </div>
                </div>
                <a href="https://pay.kiwify.com.br/ECAEU9v" className="block w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white py-4 rounded-xl font-medium text-center hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 animate-pulse-slow">
                  Comece Agora
                </a>
              </div>
            </div>

            {/* Plano Growth (Popular) */}
            <div className="pricing-card rounded-2xl border border-yellow-500/30 transition-all duration-500 hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/20 hover:-translate-y-3 bg-gradient-to-b from-gray-900/60 to-gray-950/60 backdrop-blur-sm relative group overflow-hidden scale-105 z-10">
              {/* Efeito de luz no canto superior */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              {/* Faixa "MAIS POPULAR" refinada */}
              <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-yellow-600/80 via-amber-500/80 to-yellow-600/80 text-white font-bold py-2 rounded-t-xl text-center text-sm tracking-wider shadow-md backdrop-blur-sm border-b border-yellow-500/30">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <span className="font-semibold tracking-wider">MAIS POPULAR</span>
                </div>
              </div>
              
              {/* Discount Badge corrigido */}
              <div className="absolute -top-2 -right-2 bg-yellow-600 text-white font-bold rounded-full w-20 h-20 flex items-center justify-center z-20 shadow-lg shadow-yellow-500/30 border-2 border-yellow-400">
                <div className="text-center">
                  <span className="block text-xs font-light">POUPE</span>
                  <span className="block text-xl font-extrabold">60%</span>
                </div>
              </div>
              
              <div className="p-8 lg:p-10 pt-14">
                <div className="flex justify-center mb-10">
                  <div className="bg-gradient-to-b from-yellow-500/20 to-amber-600/20 rounded-full w-24 h-24 flex items-center justify-center shadow-inner backdrop-blur-sm border border-yellow-500/20 transition-all duration-500 group-hover:scale-110 group-hover:shadow-yellow-500/10 overflow-hidden">
                    <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-full"></div>
                    <img src="/images/dropfy/rocket-gold.png" alt="Growth" className="h-12 w-12 relative z-10" />
                  </div>
                </div>
                
                <h3 className="text-2xl lg:text-3xl font-bold text-center mb-6">Growth</h3>
                <div className="text-center mb-3">
                  <span className="text-lg text-gray-400 line-through inline-block mr-2">12x R$ 124,75</span>
                  <span className="text-sm text-white bg-gradient-to-r from-green-600/90 to-emerald-500/90 px-3 py-1 rounded-full inline-block shadow-sm border border-green-500/20">-60%</span>
                </div>
                <div className="text-center mb-3">
                  <span className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-yellow-200">12x R$ 49,90</span>
                </div>
                <div className="text-center mb-3">
                  <span className="text-lg text-gray-400 line-through inline-block mr-2">R$ 1.247,50 à vista</span>
                  <span className="text-sm text-white bg-gradient-to-r from-green-600/90 to-emerald-500/90 px-3 py-1 rounded-full inline-block shadow-sm border border-green-500/20">-60%</span>
                </div>
                <p className="text-center text-gray-400 mb-6">ou R$ 499 à vista (6 Meses)</p>
                <div className="py-3 px-4 bg-yellow-900/5 rounded-xl mb-10 text-center backdrop-blur-sm border border-yellow-800/10">
                  <span className="text-yellow-400 text-sm font-medium">Economize R$ 748,50 agora!</span>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Até 3 lojas cadastradas</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Importações ilimitadas de produtos</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Geração e Melhoria de Páginas de Produto com IA (até 5 idiomas)</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Tradução de Páginas de Produto com IA</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Geração, Melhoria e Tradução de Reviews com IA (até 5 idiomas)</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Geração e Tradução de Imagens com IA</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Busca inteligente de fornecedores com IA</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Acesse o produto em AliExpress com IA Avançada</span>
                  </li>
                </ul>
              </div>
              
              <div className="px-8 pb-8">
                <div className="mb-4 flex justify-center">
                  <div className="flex items-center bg-green-900/10 px-4 py-2 rounded-lg border border-green-900/10">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm text-white">7 dias de garantia</span>
                  </div>
                </div>
                <a href="https://pay.kiwify.com.br/CFAs8xx" className="block w-full bg-gradient-to-r from-yellow-600 to-yellow-400 text-gray-900 py-4 rounded-xl font-bold text-center hover:shadow-lg hover:shadow-yellow-500/30 hover:scale-105 transition-all duration-300 relative overflow-hidden group">
                  <span className="relative z-10">Comece Agora</span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </a>
              </div>
            </div>

            {/* Plano Pro */}
            <div className="pricing-card rounded-2xl border border-indigo-500/30 transition-all duration-500 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-3 bg-gradient-to-b from-gray-900/60 to-gray-950/60 backdrop-blur-sm relative group overflow-hidden">
              {/* Efeito de luz no canto superior */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              {/* Discount Badge corrigido */}
              <div className="absolute -top-2 -right-2 bg-indigo-600 text-white font-bold rounded-full w-20 h-20 flex items-center justify-center z-20 shadow-lg shadow-indigo-500/30 border-2 border-indigo-400">
                <div className="text-center">
                  <span className="block text-xs font-light">POUPE</span>
                  <span className="block text-xl font-extrabold">60%</span>
                </div>
              </div>
              
              <div className="p-8 lg:p-10">
                <div className="flex justify-center mb-10">
                  <div className="bg-gradient-to-b from-indigo-500/20 to-purple-600/20 rounded-full w-24 h-24 flex items-center justify-center shadow-inner backdrop-blur-sm border border-indigo-500/20 transition-all duration-500 group-hover:scale-110 group-hover:shadow-indigo-500/10 overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-full"></div>
                    <img src="/images/dropfy/rocket-blue.png" alt="Pro" className="h-12 w-12 relative z-10" />
                  </div>
                </div>
                
                <h3 className="text-2xl lg:text-3xl font-bold text-center mb-6">Pro</h3>
                <div className="text-center mb-3">
                  <span className="text-lg text-gray-400 line-through inline-block mr-2">12x R$ 249,75</span>
                  <span className="text-sm text-white bg-gradient-to-r from-green-600/90 to-emerald-500/90 px-3 py-1 rounded-full inline-block shadow-sm border border-green-500/20">-60%</span>
                </div>
                <div className="text-center mb-3">
                  <span className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">12x R$ 99,90</span>
                </div>
                <div className="text-center mb-3">
                  <span className="text-lg text-gray-400 line-through inline-block mr-2">R$ 2.492,50 à vista</span>
                  <span className="text-sm text-white bg-gradient-to-r from-green-600/90 to-emerald-500/90 px-3 py-1 rounded-full inline-block shadow-sm border border-green-500/20">-60%</span>
                </div>
                <p className="text-center text-gray-400 mb-6">ou R$ 997 à vista (Vitalício)</p>
                <div className="py-3 px-4 bg-indigo-900/5 rounded-xl mb-10 text-center backdrop-blur-sm border border-indigo-800/10">
                  <span className="text-indigo-400 text-sm font-medium">Economize R$ 1.495,50 agora!</span>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>5 lojas</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Importações ilimitadas de produtos</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Geração e Melhoria de Páginas de Produto com IA (até 5 idiomas)</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Tradução de Páginas de Produto com IA</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Geração, Melhoria e Tradução de Reviews com IA (até 5 idiomas)</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Geração e Tradução de Imagens com IA</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Busca inteligente de fornecedores com IA</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Acesso completo ao painel de tendências</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Monitoramento de concorrentes sem limite</span>
                  </li>
                  
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Comunidade Dropfy + Masterclasses</span>
                  </li>
                  
                  <li className="flex items-start font-medium text-white">
                    <svg className="w-5 h-5 text-pink-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    <span>Bônus: Vitalício sem mensalidade nunca mais</span>
                  </li>
                  
                  <li className="flex items-start font-medium text-white">
                    <svg className="w-5 h-5 text-pink-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    <span>Bônus: Acesso antecipado a novidades</span>
                  </li>
                </ul>
              </div>
              
              <div className="px-8 pb-8">
                <div className="mb-4 flex justify-center">
                  <div className="flex items-center bg-green-900/10 px-4 py-2 rounded-lg border border-green-900/10">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm text-white">7 dias de garantia</span>
                  </div>
                </div>
                <a href="https://pay.kiwify.com.br/h5Q8YNF" className="block w-full bg-gradient-to-r from-indigo-600 to-indigo-400 text-white py-4 rounded-xl font-medium text-center hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-300 animate-pulse-slow">
                  Comece Agora
                </a>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-16">
            <span className="inline-block bg-gradient-to-r from-green-600/80 to-green-400/80 text-white px-6 py-3 rounded-full font-medium shadow-lg shadow-green-500/10 border border-green-500/30 transition-all duration-300 hover:shadow-green-500/20 hover:scale-105 cursor-pointer">
              Teste com 7 dias de garantia
            </span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">
          Perguntas Frequentes
        </h2>

        <div className="max-w-3xl mx-auto">
          <div className="accordion-item py-4 border-b border-gray-800">
            <div 
              className="flex justify-between items-center cursor-pointer" 
              onClick={() => toggleAccordion(0)}
            >
              <h3 className="font-medium">O que é a Dropfy?</h3>
              <i className={`fas fa-chevron-${activeAccordion === 0 ? 'up' : 'down'} text-gray-400`}></i>
            </div>
            {activeAccordion === 0 && (
              <div className="mt-3 text-gray-400 text-sm">
                <p>A Dropfy é uma plataforma de dropshipping com inteligência artificial que automatiza a criação e otimização de páginas de produtos. Nossa IA gera descrições persuasivas, traduz conteúdo, melhora textos e cria reviews humanizados - tudo para aumentar suas vendas.</p>
              </div>
            )}
          </div>

          <div className="accordion-item py-4 border-b border-gray-800">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleAccordion(1)}
            >
              <h3 className="font-medium">Para quem é a Dropfy?</h3>
              <i className={`fas fa-chevron-${activeAccordion === 1 ? 'up' : 'down'} text-gray-400`}></i>
            </div>
            {activeAccordion === 1 && (
              <div className="mt-3 text-gray-400 text-sm">
                <p>A Dropfy é ideal para empreendedores e lojistas que querem escalar seus negócios de dropshipping de forma rápida e eficiente. Se você é iniciante, a plataforma facilita sua entrada no mercado. Se já tem experiência, a Dropfy automatiza processos e aumenta sua escalabilidade.</p>
              </div>
            )}
          </div>

          <div className="accordion-item py-4 border-b border-gray-800">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleAccordion(2)}
            >
              <h3 className="font-medium">Posso usar fora do Brasil?</h3>
              <i className={`fas fa-chevron-${activeAccordion === 2 ? 'up' : 'down'} text-gray-400`}></i>
            </div>
            {activeAccordion === 2 && (
              <div className="mt-3 text-gray-400 text-sm">
                <p>Sim! A Dropfy é totalmente otimizada para uso global. Nossa IA traduz páginas de produtos para qualquer idioma, permitindo que você venda em qualquer país. A plataforma é especialmente popular entre empreendedores que vendem para Brasil, América Latina, Portugal e Estados Unidos.</p>
              </div>
            )}
          </div>

          <div className="accordion-item py-4">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleAccordion(3)}
            >
              <h3 className="font-medium">Tenho garantia?</h3>
              <i className={`fas fa-chevron-${activeAccordion === 3 ? 'up' : 'down'} text-gray-400`}></i>
            </div>
            {activeAccordion === 3 && (
              <div className="mt-3 text-gray-400 text-sm">
                <p>Sim! Oferecemos garantia de 7 dias. Se você não estiver satisfeito com a plataforma por qualquer motivo, basta solicitar o reembolso dentro deste período e devolveremos 100% do seu investimento, sem perguntas.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A0A0E] pt-16 pb-8 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <img src="/dropfy/logo.png" alt="Dropfy logo" className="h-8 mb-4" />
              <p className="text-gray-400 text-sm">
                Inteligência Artificial para Dropshipping
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-4">Links Úteis</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#home" className="hover:text-white">Política de Privacidade</a></li>
                <li><a href="#home" className="hover:text-white">Termos de Uso</a></li>
                <li><a href="#home" className="hover:text-white">Termos de Serviço</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#home" className="hover:text-white">Sobre a Dropfy</a></li>
                <li><a href="#home" className="hover:text-white">Suporte</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-4">Redes Sociais</h4>
              <div className="flex space-x-4">
                <a href="#home" className="text-gray-400 hover:text-white">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>© 2025 Dropfy. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 