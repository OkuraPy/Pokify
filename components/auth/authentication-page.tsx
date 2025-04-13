"use client"

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from './login-form';
import { ShoppingBag, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function AuthenticationPage() {
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Se o usuário já estiver autenticado, redirecione para o dashboard
  if (user) {
    router.push('/dashboard');
    return null;
  }

  const handleDemoAccess = async () => {
    setIsDemoLoading(true);
    try {
      // Simular chamada API
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push('/dashboard');
    } catch (error) {
      toast.error('Falha ao acessar a versão demo. Por favor, tente novamente.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      {/* Elementos decorativos flutuantes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-40 left-20 w-40 h-40 bg-blue-400/5 rounded-full blur-3xl"></div>
        
        {/* Padrão de grade */}
        <div className="absolute inset-0 bg-grid-blue-800/[0.02] [mask-image:linear-gradient(to_bottom,transparent,white,transparent)] z-0"></div>
        
        {/* Elementos decorativos relacionados a IA e e-commerce */}
        <svg className="absolute text-blue-500/20 top-20 right-1/4 w-40 h-40 rotate-12" viewBox="0 0 24 24" fill="none">
          <path d="M21 16V7.2C21 6.0799 21 5.51984 20.782 5.09202C20.5903 4.71569 20.2843 4.40973 19.908 4.21799C19.4802 4 18.9201 4 17.8 4H6.2C5.0799 4 4.51984 4 4.09202 4.21799C3.71569 4.40973 3.40973 4.71569 3.21799 5.09202C3 5.51984 3 6.0799 3 7.2V16" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          <path d="M3 16L3.10124 16.2985C3.31515 16.9173 3.42211 17.2267 3.61883 17.4633C3.79191 17.6734 4.01061 17.8392 4.25762 17.947C4.5373 18.0701 4.86137 18.071 5.50952 18.0727L18.5 18.0727C19.1448 18.0726 19.4672 18.0725 19.7443 17.9498C19.9878 17.8421 20.2031 17.6769 20.3758 17.4678C20.5718 17.2321 20.678 16.9241 20.891 16.308L21 16" stroke="currentColor" strokeWidth="1"/>
          <path d="M7.5 8L16.5 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          <path d="M8.5 11H15.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        </svg>
        
        <svg className="absolute text-blue-500/10 bottom-20 left-1/4 w-32 h-32 -rotate-12" viewBox="0 0 24 24" fill="none">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1"/>
          <path d="M12 8V11.5L15 14.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.4 2.8C8.4 2.8 7 6 7 11C7 16 9 19 9 19" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          <path d="M15.6 2.8C15.6 2.8 17 6 17 11C17 16 15 19 15 19" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          <path d="M3 10C3 10 8 10.5 12 10.5C16 10.5 21 10 21 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          <path d="M3 14C3 14 8 13.5 12 13.5C16 13.5 21 14 21 14" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        </svg>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-5 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30"
          >
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 3H14C18.4183 3 22 6.58172 22 11C22 15.4183 18.4183 19 14 19H6V3Z" fill="currentColor"/>
              <path d="M6 3V19" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </motion.div>
          
          <h1 className="text-5xl font-bold mb-3 text-center">
            <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-500 bg-clip-text text-transparent tracking-tight">Dropfy</span>
          </h1>
          
          <div className="flex items-center gap-1.5 text-lg text-center mb-3">
            <span className="text-blue-600 font-medium">Powered by</span>
            <div className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-0.5 rounded-md font-medium">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor" fillOpacity="0.2"/>
                <path d="M19.5 12C19.5 16.1421 16.1421 19.5 12 19.5M19.5 12C19.5 7.85786 16.1421 4.5 12 4.5M19.5 12H4.5M12 19.5C7.85786 19.5 4.5 16.1421 4.5 12M12 19.5C13.3807 19.5 14.5 16.1421 14.5 12C14.5 7.85786 13.3807 4.5 12 4.5M12 19.5C10.6193 19.5 9.5 16.1421 9.5 12C9.5 7.85786 10.6193 4.5 12 4.5M4.5 12C4.5 7.85786 7.85786 4.5 12 4.5" stroke="white" strokeWidth="1.5"/>
              </svg>
              <span>AI</span>
            </div>
          </div>
          
          <p className="text-gray-600 text-center max-w-sm mb-2">
            Descubra, automatize e escale seu drop com inteligência artificial
          </p>
          
          <div className="flex items-center gap-2 mb-2">
            {["Análise de Mercado", "Automação", "Geração de Conteúdo"].map((feature, index) => (
              <motion.span 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-200/50"
              >
                {feature}
              </motion.span>
            ))}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100/50 backdrop-blur-sm"
        >
          <h2 className="text-xl font-semibold text-center mb-6 text-gray-800">
            Acesse sua conta
          </h2>
          
          <LoginForm />
        </motion.div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Transforme seu negócio com IA • <span className="text-blue-600">Dropfy</span> © 2025
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}