import { User } from "@supabase/supabase-js";

// Define o intervalo de cobrança dos planos
export type PlanInterval = 'mensal' | 'semestral' | 'anual' | 'vitalicio';
export type SubscriptionStatus = 'ativo' | 'pendente' | 'expirado' | 'cancelado';
export type HistoryAction = 'ativacao' | 'desativacao' | 'mudanca_plano' | 'renovacao';

// Interface para os tipos de planos
export interface PlanType {
  id: string;
  name: string;          // Ex: "STARTER", "GROWTH", "PRO"
  description: string | null;   // Descrição do plano
  price: number;         // Preço do plano (mensal, semestral, anual ou valor único para vitalício)
  interval: PlanInterval;  // Tipo de intervalo
  stores_limit: number;  // Limite de lojas
  is_lifetime: boolean;  // Se é vitalício ou não
  active: boolean;       // Se o plano está ativo
  created_at: string;
  updated_at: string;
}

// Interface para assinaturas de usuários
export interface UserSubscription {
  id: string;
  user_id: string;
  user_email: string;    // Email para facilitar busca manual
  plan_type_id: string;  // ID do tipo de plano
  status: SubscriptionStatus;
  interval: PlanInterval;
  start_date: string;    // Data de início
  end_date: string | null; // Data de término (null para vitalício)
  manually_activated: boolean; // Se foi ativado manualmente
  activated_by: string;  // Quem ativou (admin, sistema)
  created_at: string;
  updated_at: string;
  plan_type?: PlanType;
}

// Interface para histórico de assinaturas
export interface SubscriptionHistory {
  id: string;
  subscription_id: string;
  action: HistoryAction;
  action_date: string;
  previous_status: SubscriptionStatus | null;
  new_status: SubscriptionStatus | null;
  notes: string | null;
  created_at: string;
  subscription?: UserSubscription;
}

// Estrutura completa de um plano com detalhes
export interface PlanWithDetails {
  subscription: UserSubscription;
  plan: PlanType;
}

export interface UserPlanDetails {
  user: User;
  currentSubscription: UserSubscription | null;
  availableStores: number;
  usedStores: number;
  canAddStore: boolean;
} 