'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TestSubscriptionEdge() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function checkUser() {
      const supabase = createClientComponentClient();
      
      try {
        // Buscar sessão do usuário
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUserId(session.user.id);
          console.log('ID do usuário:', session.user.id);
        } else {
          setError('Usuário não autenticado');
        }
      } catch (err) {
        console.error(err);
        setError('Erro ao verificar autenticação');
      } finally {
        setLoading(false);
      }
    }
    
    checkUser();
  }, []);
  
  const testEdgeFunction = async () => {
    if (!userId) {
      setError('Usuário não autenticado');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Chamar a edge function
      const response = await fetch(`/api/subscription/edge?userId=${userId}`);
      const data = await response.json();
      
      setResult(data);
      console.log('Resposta da edge function:', data);
    } catch (err) {
      console.error(err);
      setError('Erro ao chamar a edge function');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste da Edge Function</h1>
      
      {loading ? (
        <p>Carregando...</p>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded-md border border-red-300 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p>ID do usuário: <span className="font-mono">{userId}</span></p>
          </div>
          
          <button
            onClick={testEdgeFunction}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-6"
          >
            Testar Edge Function
          </button>
          
          {result && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Resultado:</h2>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-w-full">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
} 