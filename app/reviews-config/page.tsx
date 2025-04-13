"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import ConfigModal from "./components/config-modal";

export default function ReviewsConfigPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  // const { toast } = useToast();  // Removido por enquanto
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Buscar configurações do usuário
  useEffect(() => {
    const fetchUserAndConfig = async () => {
      try {
        // Buscar informações do usuário atual
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error("Usuário não autenticado");
        }
        
        // Buscar loja do usuário
        const { data: storeData, error: storeError } = await supabase
          .from("stores")
          .select("id")
          .eq("user_id", user.id)
          .single();
        
        if (storeError || !storeData) {
          throw new Error("Loja não encontrada");
        }
        
        setStoreId(storeData.id);
        
        // Buscar configurações da loja
        const { data: configData, error: configError } = await supabase
          .from("review_configs")
          .select("*")
          .eq("user_id", user.id)
          .single();
        
        if (!configError && configData) {
          setConfig(configData);
        } else {
          // Criar configuração padrão se não existir
          const { data: newConfig, error: createError } = await supabase
            .from("review_configs")
            .insert({
              product_id: null,  // Pode ser definido depois
              user_id: user.id,
              shop_domain: '',
              review_position: 'bottom',
              position_type: 'bottom',
              primary_color: '#7e3af2',
              secondary_color: '#c4b5fd',
              active: true
            })
            .select()
            .single();
          
          if (createError) {
            console.error("Erro ao criar configuração padrão:", createError);
          } else {
            setConfig(newConfig);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        alert("Ocorreu um erro ao carregar suas configurações");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndConfig();
  }, [supabase]);

  const saveConfig = async (formData: any) => {
    if (!storeId) return;

    const { error } = await supabase
      .from("review_configs")
      .upsert({
        ...formData,
        user_id: config.user_id,
        shop_domain: config.shop_domain || '',
        active: true,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error("Erro ao salvar configurações:", error);
      throw error;
    }

    setConfig({ ...config, ...formData });
  };

  const generateEmbedCode = () => {
    if (!storeId) return;

    const code = `<div id="pokify-reviews" data-store-id="${storeId}" data-primary-color="${config.primary_color || '#7e3af2'}" data-secondary-color="${config.secondary_color || '#c4b5fd'}"></div>
<script async src="${window.location.origin}/api/reviews-embed.js"></script>`;

    setGeneratedCode(code);

    alert("Código gerado. Copie e cole este código em sua loja Shopify");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    alert("O código foi copiado para a área de transferência");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2">Carregando configurações...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Configuração de Reviews</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Configurar Reviews
          </button>
          
          <ConfigModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={saveConfig}
            defaultConfig={config}
          />
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Código para Incorporação</h2>
          <p className="mb-4 text-gray-600">
            Gere o código para incorporar os reviews em sua loja Shopify.
          </p>
          
          <button
            onClick={generateEmbedCode}
            className="mb-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Gerar Código
          </button>
          
          {generatedCode && (
            <div className="mt-4">
              <div className="bg-gray-100 p-4 rounded-md">
                <pre className="text-sm whitespace-pre-wrap break-all">{generatedCode}</pre>
              </div>
              
              <button
                onClick={copyToClipboard}
                className="mt-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                Copiar para área de transferência
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
