'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { getUserProfile, updateUserProfile, supabase } from '@/lib/supabase';
import { Loader2, User, Mail, Building, UploadCloud, Lock, LogOut } from 'lucide-react';

// Schema para validação do formulário de perfil
const profileFormSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  avatar_url: z.string().optional(),
  company: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Schema para validação do formulário de senha
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, 'A senha atual deve ter pelo menos 6 caracteres'),
  newPassword: z.string().min(8, 'A nova senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'A confirmação de senha deve ter pelo menos 8 caracteres'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'], 
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Formulário de perfil
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: '',
      email: '',
      avatar_url: '',
      company: '',
    },
  });
  
  // Formulário de senha
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    async function loadUserProfile() {
      try {
        setIsLoading(true);
        
        // Buscar dados do usuário autenticado
        const { data: userData, error } = await getUserProfile();
        
        if (error) {
          console.error('Erro ao carregar perfil:', error);
          toast.error('Erro ao carregar dados do perfil');
          return;
        }
        
        if (!userData) {
          console.error('Usuário não encontrado');
          router.push('/auth/login');
          return;
        }
        
        setUser(userData);
        
        // Preencher o formulário com os dados do usuário
        profileForm.reset({
          full_name: userData.full_name || '',
          email: userData.email || '',
          avatar_url: userData.avatar_url || '',
          company: '',
        });
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        toast.error('Erro ao carregar dados do perfil');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserProfile();
  }, [router, profileForm]);

  // Função para atualizar o perfil
  const onProfileSubmit = async (values: ProfileFormValues) => {
    try {
      setIsSaving(true);
      
      const { error } = await updateUserProfile({
        full_name: values.full_name,
        company: values.company,
        avatar_url: values.avatar_url,
      });
      
      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        toast.error('Erro ao salvar alterações: ' + error.message);
        return;
      }
      
      toast.success('Perfil atualizado com sucesso!');
      
      // Atualizar os dados locais do usuário
      setUser({
        ...user,
        full_name: values.full_name,
        company: values.company,
        avatar_url: values.avatar_url,
      });
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  // Função para atualizar a senha
  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      setIsSaving(true);
      
      // Atualizar a senha usando o Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword
      });
      
      if (error) {
        console.error('Erro ao atualizar senha:', error);
        toast.error('Erro ao atualizar senha: ' + error.message);
        return;
      }
      
      toast.success('Senha atualizada com sucesso!');
      passwordForm.reset();
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
      toast.error('Erro ao atualizar senha');
    } finally {
      setIsSaving(false);
    }
  };

  // Função para fazer upload da imagem de perfil
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // Criar um nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-avatar.${fileExt}`;
      
      // Upload do arquivo para o bucket 'avatars' no Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });
      
      if (error) {
        console.error('Erro ao fazer upload do avatar:', error);
        toast.error('Erro ao fazer upload do avatar');
        return;
      }
      
      // Obter a URL pública do arquivo
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      const avatarUrl = publicUrlData.publicUrl;
      
      // Atualizar o valor no formulário
      profileForm.setValue('avatar_url', avatarUrl);
      
      // Atualizar o perfil do usuário com a nova URL do avatar
      await updateUserProfile({
        avatar_url: avatarUrl,
      });
      
      // Atualizar os dados locais do usuário
      setUser({
        ...user,
        avatar_url: avatarUrl,
      });
      
      toast.success('Avatar atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao fazer upload do avatar:', err);
      toast.error('Erro ao fazer upload do avatar');
    } finally {
      setIsUploading(false);
    }
  };

  // Função para fazer logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro ao fazer logout:', error);
        toast.error('Erro ao sair da conta');
        return;
      }
      
      router.push('/auth/login');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      toast.error('Erro ao sair da conta');
    }
  };

  if (isLoading) {
    return (
      <div className="container flex justify-center items-center h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar com informações básicas */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Meu Perfil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative mb-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatar_url || ''} alt={user?.full_name || 'Avatar'} />
                  <AvatarFallback className="text-3xl">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="absolute -right-2 bottom-0 rounded-full h-8 w-8"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="h-4 w-4" />
                  )}
                </Button>
                <input 
                  type="file" 
                  id="avatar-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
              </div>
              
              <h3 className="font-medium text-lg">{user?.full_name || 'Usuário'}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              
              {user?.company && (
                <div className="flex items-center gap-1 mt-1">
                  <Building className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{user.company}</span>
                </div>
              )}
              
              <div className="w-full pt-6">
                <Separator className="mb-6" />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Plano atual</span>
                    <span className="font-medium">{user?.billing_status || 'Gratuito'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lojas</span>
                    <span className="font-medium">{user?.stores_limit || 1}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Produtos</span>
                    <span className="font-medium">{user?.products_limit || 50}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair da conta
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">ID da conta</p>
                  <p className="text-xs font-mono text-muted-foreground">{user?.id}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">Membro desde</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user?.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Conteúdo principal */}
        <div className="md:col-span-2">
          <Tabs defaultValue="general">
            <TabsList className="mb-6">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Geral</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Segurança</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais</CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <FormField
                        control={profileForm.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="exemplo@email.com" {...field} disabled />
                            </FormControl>
                            <FormDescription>
                              Não é possível alterar o email diretamente
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Empresa (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da sua empresa" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          'Salvar alterações'
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                  <CardDescription>
                    Atualize sua senha para maior segurança
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha atual</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nova senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormDescription>
                              Pelo menos 8 caracteres
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar nova senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Atualizando...
                          </>
                        ) : (
                          'Atualizar senha'
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 