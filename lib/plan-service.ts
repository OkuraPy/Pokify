import { supabase } from '@/lib/supabase';
import { PlanType, UserSubscription, SubscriptionHistory, PlanInterval } from '@/types/plans';
import { addMonths, addYears, format } from 'date-fns';

/**
 * Serviço para gerenciar planos e assinaturas
 */
export class PlanService {
  /**
   * Busca todos os tipos de planos ativos
   */
  async getAllPlanTypes(): Promise<PlanType[]> {
    const { data, error } = await supabase
      .from('plan_types')
      .select('*')
      .eq('active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Erro ao buscar tipos de planos:', error);
      throw new Error(`Falha ao buscar planos: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca um tipo de plano pelo ID
   */
  async getPlanTypeById(id: string): Promise<PlanType | null> {
    const { data, error } = await supabase
      .from('plan_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar tipo de plano:', error);
      return null;
    }

    return data;
  }

  /**
   * Busca a assinatura ativa de um usuário pelo ID
   */
  async getUserActiveSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ativo')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Erro ao buscar assinatura ativa:', error);
      return null;
    }

    return data;
  }

  /**
   * Busca assinatura pelo e-mail do usuário (para uso administrativo)
   */
  async getSubscriptionByEmail(email: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Erro ao buscar assinatura por e-mail:', error);
      return null;
    }

    return data;
  }

  /**
   * Cria uma nova assinatura para um usuário
   */
  async createSubscription(
    userId: string,
    userEmail: string,
    planTypeId: string,
    interval: PlanInterval,
    manuallyActivated: boolean = false,
    activatedBy: string = 'sistema'
  ): Promise<UserSubscription | null> {
    // Buscar detalhes do plano
    const planType = await this.getPlanTypeById(planTypeId);
    if (!planType) {
      throw new Error('Tipo de plano não encontrado');
    }

    // Calcular data de término com base no intervalo
    const startDate = new Date();
    let endDate: Date | null = null;

    if (planType.is_lifetime) {
      // Plano vitalício não tem data de término
      endDate = null;
    } else {
      // Calcular data de término baseada no intervalo
      switch (interval) {
        case 'mensal':
          endDate = addMonths(startDate, 1);
          break;
        case 'semestral':
          endDate = addMonths(startDate, 6);
          break;
        case 'anual':
          endDate = addYears(startDate, 1);
          break;
        default:
          throw new Error('Tipo de intervalo inválido');
      }
    }

    // Criar a assinatura
    const subscription: Partial<UserSubscription> = {
      user_id: userId,
      user_email: userEmail,
      plan_type_id: planTypeId,
      status: 'ativo',
      interval,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      manually_activated: manuallyActivated,
      activated_by: activatedBy
    };

    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert(subscription)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar assinatura:', error);
      throw new Error(`Falha ao criar assinatura: ${error.message}`);
    }

    // Registrar no histórico
    await this.addSubscriptionHistory(
      data.id,
      'ativacao',
      null,
      'ativo',
      `Assinatura ${manuallyActivated ? 'ativada manualmente' : 'criada'} por ${activatedBy}`
    );

    // Atualizar limites do usuário
    await this.updateUserLimits(userId, planType.stores_limit);

    return data;
  }

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(subscriptionId: string, cancelledBy: string = 'sistema', reason: string = ''): Promise<boolean> {
    // Buscar assinatura
    const { data: subscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !subscription) {
      console.error('Erro ao buscar assinatura para cancelamento:', fetchError);
      return false;
    }

    // Atualizar status da assinatura
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelado',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Erro ao cancelar assinatura:', error);
      return false;
    }

    // Registrar no histórico
    await this.addSubscriptionHistory(
      subscriptionId,
      'desativacao',
      'ativo',
      'cancelado',
      `Assinatura cancelada por ${cancelledBy}. ${reason}`
    );

    return true;
  }

  /**
   * Muda o plano de um usuário
   */
  async changePlan(
    userId: string,
    userEmail: string,
    newPlanTypeId: string,
    interval: PlanInterval,
    manuallyActivated: boolean = true,
    activatedBy: string = 'admin'
  ): Promise<UserSubscription | null> {
    // Cancelar assinatura atual se existir
    const currentSub = await this.getUserActiveSubscription(userId);
    if (currentSub) {
      await this.cancelSubscription(
        currentSub.id,
        activatedBy,
        'Troca de plano iniciada'
      );
    }

    // Criar nova assinatura
    return this.createSubscription(
      userId,
      userEmail,
      newPlanTypeId,
      interval,
      manuallyActivated,
      activatedBy
    );
  }

  /**
   * Adiciona um registro ao histórico de assinaturas
   */
  private async addSubscriptionHistory(
    subscriptionId: string,
    action: 'ativacao' | 'desativacao' | 'mudanca_plano' | 'renovacao',
    previousStatus: string | null,
    newStatus: string | null,
    notes: string = ''
  ): Promise<void> {
    const history: Partial<SubscriptionHistory> = {
      subscription_id: subscriptionId,
      action,
      action_date: new Date().toISOString(),
      previous_status: previousStatus || undefined,
      new_status: newStatus || undefined,
      notes
    };

    const { error } = await supabase
      .from('subscription_history')
      .insert(history);

    if (error) {
      console.error('Erro ao registrar histórico de assinatura:', error);
    }
  }

  /**
   * Atualiza os limites do usuário com base no plano
   */
  private async updateUserLimits(userId: string, storesLimit: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        stores_limit: storesLimit,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Erro ao atualizar limites do usuário:', error);
    }
  }

  /**
   * Verifica se o usuário pode adicionar uma nova loja
   */
  async canAddStore(userId: string): Promise<boolean> {
    // Buscar usuário para verificar o limite de lojas
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stores_limit')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Erro ao buscar usuário:', userError);
      return false;
    }

    // Contar lojas atuais do usuário
    const { count, error: countError } = await supabase
      .from('stores')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('Erro ao contar lojas do usuário:', countError);
      return false;
    }

    // Verificar se o usuário ainda pode adicionar lojas
    return (count || 0) < user.stores_limit;
  }

  /**
   * Verifica se o usuário tem uma assinatura ativa
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getUserActiveSubscription(userId);
    return subscription !== null;
  }

  /**
   * Cria os planos padrão no banco de dados, se não existirem
   */
  async createDefaultPlans(): Promise<void> {
    const { count, error: countError } = await supabase
      .from('plan_types')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.error('Erro ao verificar planos existentes:', countError);
      return;
    }

    // Se já existem planos, não criar novos
    if (count && count > 0) {
      console.log('Planos já existem, pulando criação de planos padrão');
      return;
    }

    // Definir planos padrão
    const defaultPlans: Partial<PlanType>[] = [
      {
        name: 'STARTER',
        description: 'Plano mensal com limite de 2 lojas',
        price: 49.90,
        interval: 'mensal',
        stores_limit: 2,
        is_lifetime: false,
        active: true
      },
      {
        name: 'GROWTH',
        description: 'Plano semestral com limite de 5 lojas',
        price: 249.90,
        interval: 'semestral',
        stores_limit: 5,
        is_lifetime: false,
        active: true
      },
      {
        name: 'PRO',
        description: 'Plano vitalício com limite de 5 lojas',
        price: 999.90,
        interval: 'vitalicio',
        stores_limit: 5,
        is_lifetime: true,
        active: true
      }
    ];

    // Criar planos
    const { error } = await supabase
      .from('plan_types')
      .insert(defaultPlans);

    if (error) {
      console.error('Erro ao criar planos padrão:', error);
    } else {
      console.log('Planos padrão criados com sucesso');
    }
  }
} 