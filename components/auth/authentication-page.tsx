"use client"

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from './login-form';
import { SignupForm } from './signup-form';
import { ShoppingBag, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function AuthenticationPage() {
  const [activeTab, setActiveTab] = useState('login');
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
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-br from-primary to-primary/90 rounded-full mb-4 shadow-lg shadow-primary/20 ring-1 ring-primary/20">
            <ShoppingBag className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-br from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent tracking-tight">Pokify</span>
          </h1>
          <p className="text-muted-foreground text-center">
            Gerencie seus produtos de e-commerce de forma simples e eficiente
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-lg p-8 border">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="login">
                  <LoginForm />
                </TabsContent>
                <TabsContent value="signup">
                  <SignupForm />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              className="text-primary hover:text-primary/90"
              onClick={handleDemoAccess}
              disabled={isDemoLoading}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              {isDemoLoading ? 'Carregando Demo...' : 'Testar Versão Demo'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}