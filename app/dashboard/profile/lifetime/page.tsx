'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Store, 
  Clock, 
  CreditCard, 
  BadgeCheck, 
  Edit, 
  Gem,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface UserData {
  name: string;
  email: string;
  avatar?: string;
  memberSince: string;
  plan: 'annual' | 'lifetime';
  planExpiresAt?: string;
  stores: {
    id: string;
    name: string;
    url: string;
    productsCount: number;
  }[];
}

export default function LifetimeProfileDemo() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    // Simular carregamento de dados do usuário
    const loadUserData = () => {
      setIsLoading(true);
      
      // Simulação de dados - com plano vitalício
      setTimeout(() => {
        setUserData({
          name: 'Maria Oliveira',
          email: 'maria.oliveira@example.com',
          avatar: 'https://i.pravatar.cc/300?img=20',
          memberSince: '10/01/2022',
          plan: 'lifetime',
          stores: [
            {
              id: 'store-1',
              name: 'Anime Store Brasil',
              url: 'animestorebrasil.com.br',
              productsCount: 215
            },
            {
              id: 'store-2',
              name: 'Loja Geek',
              url: 'lojageek.com.br',
              productsCount: 147
            },
            {
              id: 'store-3',
              name: 'Colecionáveis JP',
              url: 'colecionaveisjp.com.br',
              productsCount: 83
            },
            {
              id: 'store-4',
              name: 'Figura Action',
              url: 'figuraaction.com.br',
              productsCount: 56
            }
          ]
        });
        setIsLoading(false);
      }, 1000);
    };

    loadUserData();
  }, []);

  const handleEditProfile = () => {
    if (isEditingProfile) {
      // Salvar as alterações
      if (userData) {
        setUserData({
          ...userData,
          name: editedName
        });
        toast.success('Perfil atualizado com sucesso!');
      }
    } else {
      // Iniciar edição
      if (userData) {
        setEditedName(userData.name);
      }
    }
    
    setIsEditingProfile(!isEditingProfile);
  };

  const getPlanDetails = () => {
    if (!userData) return null;
    
    if (userData.plan === 'annual') {
      return {
        name: 'Plano Anual',
        description: 'Acesso a todos os recursos por 12 meses',
        badge: <Badge className="bg-blue-500">Anual</Badge>,
        expires: userData.planExpiresAt,
        icon: <Clock className="h-5 w-5 text-blue-500" />
      };
    } else {
      return {
        name: 'Plano Vitalício',
        description: 'Acesso a todos os recursos para sempre',
        badge: <Badge className="bg-violet-500">Vitalício</Badge>,
        expires: null,
        icon: <Gem className="h-5 w-5 text-violet-500" />
      };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-4 text-muted-foreground">Carregando seu perfil...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Não foi possível carregar os dados do perfil.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard">Voltar para o Dashboard</Link>
        </Button>
      </div>
    );
  }

  const planDetails = getPlanDetails();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Meu Perfil</h1>
        <Button 
          onClick={handleEditProfile}
          variant={isEditingProfile ? "default" : "outline"}
        >
          {isEditingProfile ? 'Salvar Alterações' : 'Editar Perfil'}
          {isEditingProfile ? <BadgeCheck className="ml-2 h-4 w-4" /> : <Edit className="ml-2 h-4 w-4" />}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dados do usuário */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Gerencie suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userData.avatar} />
                  <AvatarFallback className="text-lg bg-primary/10">
                    {userData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  {isEditingProfile ? (
                    <Input 
                      id="name" 
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center h-10 px-3 text-sm border rounded-md bg-muted/50">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      {userData.name}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="flex items-center h-10 px-3 text-sm border rounded-md bg-muted/50">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    {userData.email}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Membro desde</Label>
                    <div className="flex items-center h-10 px-3 text-sm border rounded-md bg-muted/50">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      {userData.memberSince}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Total de Lojas</Label>
                    <div className="flex items-center h-10 px-3 text-sm border rounded-md bg-muted/50">
                      <Store className="h-4 w-4 mr-2 text-muted-foreground" />
                      {userData.stores.length} de 5 lojas
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Informações do Plano */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Seu Plano</CardTitle>
              {planDetails?.badge}
            </div>
            <CardDescription>
              Informações sobre sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30">
              {planDetails?.icon}
              <div>
                <p className="font-medium">{planDetails?.name}</p>
                <p className="text-sm text-muted-foreground">{planDetails?.description}</p>
              </div>
            </div>
            
            {userData.plan === 'annual' && userData.planExpiresAt && (
              <div className="space-y-2">
                <Label>Data de Renovação</Label>
                <div className="flex items-center h-10 px-3 text-sm border rounded-md bg-muted/50">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  {userData.planExpiresAt}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Recursos incluídos</Label>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-green-500" />
                  <span>Até 5 lojas</span>
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-green-500" />
                  <span>Produtos ilimitados</span>
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-green-500" />
                  <span>Ferramentas de IA</span>
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-green-500" />
                  <span>Suporte prioritário</span>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            {userData.plan === 'annual' ? (
              <Button className="w-full" variant="outline">
                Fazer Upgrade para Vitalício
              </Button>
            ) : (
              <Button className="w-full" variant="outline" disabled>
                Você possui o melhor plano
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
      
      {/* Lojas do usuário */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Minhas Lojas</CardTitle>
            {userData.stores.length < 5 && (
              <Button size="sm">
                Adicionar Nova Loja
              </Button>
            )}
          </div>
          <CardDescription>
            Gerencie suas lojas e produtos ({userData.stores.length}/5)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userData.stores.map((store) => (
              <Link 
                key={store.id}
                href={`/dashboard/stores/${store.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-4 rounded-md border hover:border-primary hover:bg-muted/5 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Store className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">{store.name}</p>
                      <p className="text-sm text-muted-foreground">{store.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">{store.productsCount}</p>
                      <p className="text-xs text-muted-foreground">Produtos</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
            
            {userData.stores.length === 0 && (
              <div className="flex flex-col items-center justify-center p-6 bg-muted/10 rounded-md text-center">
                <Store className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="font-medium">Você ainda não tem lojas</p>
                <p className="text-sm text-muted-foreground mb-4">Crie sua primeira loja para começar</p>
                <Button>Criar Loja</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Seção de Faturamento */}
      <Card>
        <CardHeader>
          <CardTitle>Faturamento e Assinatura</CardTitle>
          <CardDescription>
            Gerencie seus métodos de pagamento e histórico de faturas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-md border">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="font-medium">•••• •••• •••• 8142</p>
                <p className="text-sm text-muted-foreground">Mastercard - Expira em 06/2026</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Atualizar
            </Button>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Histórico de Faturas</p>
            <div className="rounded-md border divide-y">
              <div className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium">Plano Vitalício</p>
                  <p className="text-sm text-muted-foreground">10/01/2022</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">R$ 997,00</span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Visualizar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 