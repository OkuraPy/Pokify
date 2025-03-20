'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getUserProfile, updateUserProfile } from '@/lib/supabase';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function EditProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: ''
  });

  useEffect(() => {
    async function loadProfileData() {
      try {
        setIsLoading(true);
        
        // Carregar dados do perfil do usuário
        const { data: userData, error: userError } = await getUserProfile();
        
        if (userError || !userData) {
          console.error('Erro ao carregar perfil:', userError);
          toast.error("Erro ao carregar perfil. Tente novamente mais tarde.");
          return;
        }
        
        setFormData({
          full_name: userData.full_name || '',
          avatar_url: userData.avatar_url || '',
        });
      } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error);
        toast.error("Ocorreu um erro inesperado. Tente novamente mais tarde.");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProfileData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      const { error } = await updateUserProfile({
        full_name: formData.full_name,
        avatar_url: formData.avatar_url
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Perfil atualizado com sucesso!");
      
      // Voltar para a página de perfil
      router.push('/dashboard/profile');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error("Erro ao atualizar perfil. Tente novamente mais tarde.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2 p-0 h-8 w-8" 
          onClick={() => router.push('/dashboard/profile')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Editar Perfil</h1>
      </div>
      
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Informações Pessoais</h2>
          <p className="text-sm text-muted-foreground">
            Atualize suas informações pessoais
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input 
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Seu nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="avatar_url">URL da foto de perfil</Label>
              <Input 
                id="avatar_url"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleChange}
                placeholder="https://exemplo.com/sua-foto.jpg (opcional)"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push('/dashboard/profile')}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar alterações'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
