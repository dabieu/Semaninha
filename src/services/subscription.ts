import { supabase } from '../lib/supabase';

/**
 * Tipos de planos disponíveis
 */
export type PlanType = 'free' | 'premium' | 'premium_annual';

/**
 * Status possíveis de uma assinatura
 */
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'past_due';

/**
 * Interface que representa uma assinatura no banco de dados
 */
export interface Subscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  // Campos para integração com AbacatePay
  abacatepay_billing_id?: string | null; // ID da cobrança no AbacatePay
  abacatepay_customer_id?: string | null; // ID do cliente no AbacatePay
  payment_method?: string | null; // Método de pagamento (PIX, CREDIT_CARD, BOLETO)
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Serviço para gerenciar assinaturas e verificar acesso premium
 * 
 * Este serviço consulta a tabela 'subscriptions' no Supabase para:
 * - Verificar se o usuário tem acesso premium
 * - Obter informações da assinatura atual
 * - Verificar se features premium estão disponíveis
 */
export class SubscriptionService {
  /**
   * Verifica se o usuário tem acesso premium ativo
   * 
   * @param userId ID do usuário (UUID)
   * @returns true se o usuário tem assinatura premium ativa e não expirada
   */
  async isPremium(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan_type, current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        // Se não encontrar assinatura ou houver erro, usuário é free
        return false;
      }

      // Verificar se a assinatura não expirou
      const now = new Date();
      const periodEnd = new Date(data.current_period_end);
      
      // Verificar se é premium e não expirou
      const isPremiumPlan = data.plan_type === 'premium' || data.plan_type === 'premium_annual';
      const isNotExpired = periodEnd > now;
      
      return isPremiumPlan && isNotExpired;
    } catch (error) {
      console.error('Erro ao verificar status premium:', error);
      return false;
    }
  }

  /**
   * Obtém a assinatura ativa atual do usuário
   * 
   * @param userId ID do usuário
   * @returns Assinatura ativa ou null se não houver
   */
  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar assinatura:', error);
        return null;
      }

      return data as Subscription | null;
    } catch (error) {
      console.error('Erro ao obter assinatura atual:', error);
      return null;
    }
  }

  /**
   * Obtém o tipo de plano do usuário
   * 
   * @param userId ID do usuário
   * @returns Tipo de plano (free, premium, premium_annual)
   */
  async getUserPlan(userId: string): Promise<PlanType> {
    try {
      const subscription = await this.getCurrentSubscription(userId);
      return subscription?.plan_type || 'free';
    } catch (error) {
      console.error('Erro ao obter plano do usuário:', error);
      return 'free';
    }
  }

  /**
   * Verifica se o usuário pode acessar uma feature premium específica
   * 
   * Por enquanto, todas as features premium requerem apenas ter plano premium.
   * No futuro, pode ser expandido para verificar features específicas.
   * 
   * @param userId ID do usuário
   * @param feature Nome da feature (ex: 'custom_grid', 'custom_period')
   * @returns true se o usuário pode acessar a feature
   */
  async canAccessFeature(
    userId: string, 
    feature: 'custom_grid' | 'custom_period' | 'all'
  ): Promise<boolean> {
    // Por enquanto, todas as features premium requerem apenas ter plano premium
    // No futuro, pode ser expandido para verificar features específicas
    return await this.isPremium(userId);
  }

  /**
   * Verifica se o usuário pode usar grade customizada
   * 
   * @param userId ID do usuário
   * @returns true se pode usar grade customizada
   */
  async canUseCustomGrid(userId: string): Promise<boolean> {
    return await this.canAccessFeature(userId, 'custom_grid');
  }

  /**
   * Verifica se o usuário pode usar período customizado
   * 
   * @param userId ID do usuário
   * @returns true se pode usar período customizado
   */
  async canUseCustomPeriod(userId: string): Promise<boolean> {
    return await this.canAccessFeature(userId, 'custom_period');
  }
}

// Exportar instância única do serviço (Singleton pattern)
export const subscriptionService = new SubscriptionService();

