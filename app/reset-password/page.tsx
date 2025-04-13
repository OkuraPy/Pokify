'use client';

import { useState, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { resetPassword } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor, insira seu email');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await resetPassword(email);
      
      if (error) {
        toast.error((error as any).message || 'Erro ao solicitar redefinição de senha');
        setError((error as any).message || 'Erro ao solicitar redefinição de senha');
        return;
      }
      
      setSuccess(true);
      toast.success('Link de recuperação enviado com sucesso!');
      
    } catch (err: any) {
      const errorMsg = err.message || 'Ocorreu um erro ao solicitar redefinição de senha';
      toast.error(errorMsg);
      setError(errorMsg);
      console.error('Erro de redefinição de senha:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push('/');
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
            Recupere seu acesso ao seu sistema de automação inteligente
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100/50 backdrop-blur-sm"
        >
          <div className="flex items-center mb-6">
            <button 
              onClick={() => router.push('/')} 
              className="mr-2 p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
            >
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              Recuperar senha
            </h2>
          </div>
          
          {success ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200 border text-green-800">
                <CheckCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  Um link para redefinição de senha foi enviado para seu email. Por favor, verifique sua caixa de entrada.
                </AlertDescription>
              </Alert>
              
              <Button 
                type="button" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-5 rounded-xl font-medium shadow-md shadow-blue-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
                onClick={() => router.push('/')}
              >
                <div className="flex items-center justify-center">
                  <span>Voltar para o login</span>
                  <svg className="ml-1.5 w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.75 6.75L19.25 12L13.75 17.25"></path>
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H4.75"></path>
                  </svg>
                </div>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert className="border border-red-200 bg-red-50/50 text-red-800">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium flex items-center">
                  <svg className="w-4 h-4 mr-1.5 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2 7L9.95404 12.5458C11.1874 13.4183 12.8126 13.4183 14.046 12.5458L22 7" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 bg-blue-50/50 border-blue-100 py-5 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${error ? 'border-red-300 bg-red-50/50 focus:ring-red-500/20 focus:border-red-400' : ''}`}
                    required
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M4 6L12.5 12L20 6"></path>
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1.5">
                  Digite o e-mail associado à sua conta para receber um link de recuperação
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-5 rounded-xl font-medium shadow-md shadow-blue-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Enviando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>Enviar link de recuperação</span>
                    <svg className="ml-1.5 w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.75 6.75L19.25 12L13.75 17.25"></path>
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H4.75"></path>
                    </svg>
                  </div>
                )}
              </Button>
            </form>
          )}
          
          <div className="text-center w-full text-sm text-gray-500 mt-6">
            <span>Lembrou sua senha?</span>{' '}
            <a href="/" onClick={handleBackToLogin} className="font-medium text-blue-600 hover:text-blue-800 transition-colors">
              Voltar para o login
            </a>
          </div>
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