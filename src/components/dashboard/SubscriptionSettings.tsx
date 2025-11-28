import { useState, useEffect } from 'react';
import { Crown, Sparkles, Check, X, AlertCircle, Zap, Star, Gift } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { subscriptionService } from '../../services/subscription';

type BillingPeriod = 'monthly' | 'annual';

export function SubscriptionSettings() {
  const { user, isPremium, plan } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const sub = await subscriptionService.getCurrentSubscription(user.id);
      setSubscription(sub);
    } catch (err) {
      console.error('Erro ao carregar assinatura:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (period: BillingPeriod) => {
    // Placeholder - será implementado com AbacatePay depois
    const price = period === 'monthly' ? 'R$ 9,90/mês' : 'R$ 79,90/ano';
    alert(`Funcionalidade de upgrade será implementada em breve com AbacatePay!\n\nPlano Premium ${period === 'monthly' ? 'Mensal' : 'Anual'}: ${price} 🚀`);
  };

  const handleCancel = () => {
    // Placeholder - será implementado com AbacatePay depois
    if (confirm('Tem certeza que deseja cancelar sua assinatura?')) {
      alert('Funcionalidade de cancelamento será implementada em breve!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const freePlanFeatures = [
    'Grade: 3x3, 5x5, 10x10',
    'Período: 7 dias, 1 mês, 3 meses, 12 meses',
    'Geração ilimitada de colagens',
    'Colagem com marca d\'água',
  ];

  const premiumPlanFeatures = [
    'Tudo do plano gratuito',
    'Tamanho de grade customizado',
    'Período de escuta customizado',
    'Sem marca d\'água',
    'Histórico de colagens geradas',
  ];

  const currentPlan = isPremium ? 'premium' : 'free';
  const currentBillingPeriod = plan === 'premium_annual' ? 'annual' : 'monthly';

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Escolha seu Plano</h2>
        <p className="text-white/70 text-sm max-w-2xl mx-auto">
          Planos personalizados para suas necessidades. Descubra a opção ideal para seu orçamento e objetivos.
        </p>
      </div>

      {/* Toggle Mensal/Anual */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-slate-700/50 rounded-xl p-1 border border-slate-600">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              billingPeriod === 'monthly'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 relative ${
              billingPeriod === 'annual'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Anual
            <span className="ml-2 text-xs bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full">
              -33% 😉
            </span>
          </button>
        </div>
      </div>

      {/* Cards de Planos */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
        {/* Plano Gratuito */}
        <div
          className={`relative rounded-2xl p-6 border-2 transition-all duration-300 ${
            currentPlan === 'free'
              ? 'bg-gradient-to-br from-slate-700/80 to-slate-800/80 border-emerald-500/50 shadow-lg shadow-emerald-500/20 scale-105'
              : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
          }`}
        >
          {currentPlan === 'free' && (
            <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Plano Atual
            </div>
          )}
          
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="h-6 w-6 text-white/70" />
              <h3 className="text-2xl font-bold text-white">Gratuito</h3>
            </div>
            <div className="mb-4">
              <div className="text-3xl font-bold text-white">R$ 0</div>
              <div className="text-white/60 text-sm">para sempre</div>
            </div>
            <p className="text-white/70 text-sm">Para novos usuários</p>
          </div>

          <button
            onClick={() => handleUpgrade('monthly')}
            disabled={currentPlan === 'free'}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 mb-6 ${
              currentPlan === 'free'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                : 'bg-slate-600 hover:bg-slate-500 text-white'
            }`}
          >
            {currentPlan === 'free' ? 'Plano Atual' : 'Escolher Plano'}
          </button>

          <div className="space-y-3">
            {freePlanFeatures.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-white/80 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plano Premium */}
        <div
          className={`relative rounded-2xl p-6 border-2 transition-all duration-300 ${
            currentPlan === 'premium'
              ? 'bg-gradient-to-br from-emerald-500/20 to-pink-500/20 border-emerald-400 shadow-xl shadow-emerald-500/30 scale-105'
              : 'bg-gradient-to-br from-slate-700/80 to-slate-800/80 border-emerald-500/50 hover:border-emerald-400'
          }`}
        >
          {currentPlan === 'premium' && (
            <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1">
              <Star className="h-3 w-3" />
              <span>Plano Atual</span>
            </div>
          )}
          
          {currentPlan !== 'premium' && (
            <div className="absolute -top-3 left-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1">
              <Gift className="h-3 w-3" />
              <span>Melhor Valor</span>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="h-6 w-6 text-yellow-400" />
              <h3 className="text-2xl font-bold text-white">Premium</h3>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline space-x-2">
                <div className="text-3xl font-bold text-white">
                  {billingPeriod === 'monthly' ? 'R$ 9,90' : 'R$ 79,90'}
                </div>
                <div className="text-white/60 text-sm">
                  /{billingPeriod === 'monthly' ? 'mês' : 'ano'}
                </div>
              </div>
              {billingPeriod === 'annual' && (
                <div className="text-emerald-400 text-xs mt-1 flex items-center space-x-1">
                  <Zap className="h-3 w-3" />
                  <span>Economize 33% em relação ao mensal</span>
                </div>
              )}
            </div>
            <p className="text-white/70 text-sm">Para usuários avançados</p>
          </div>

          <button
            onClick={() => handleUpgrade(billingPeriod)}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 mb-6 ${
              currentPlan === 'premium'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30'
            }`}
          >
            {currentPlan === 'premium' ? 'Plano Atual' : 'Escolher Plano'}
          </button>

          <div className="space-y-3">
            {premiumPlanFeatures.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-white/80 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Informações do Plano Atual (se Premium) */}
      {isPremium && subscription && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-pink-500/10 border border-emerald-500/20 rounded-xl p-6 mb-6 max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-4">
            <Crown className="h-6 w-6 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">Seu Plano Premium</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-white/70 text-sm mb-1">Tipo de plano</p>
              <p className="text-white font-semibold">
                {plan === 'premium' ? 'Premium Mensal' : 'Premium Anual'}
              </p>
            </div>
            {subscription.current_period_end && (
              <div>
                <p className="text-white/70 text-sm mb-1">Próxima renovação</p>
                <p className="text-white font-semibold">
                  {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aviso sobre AbacatePay */}
      {isPremium && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 max-w-4xl mx-auto mb-6">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-200 text-sm font-medium mb-1">
                Integração com AbacatePay
              </p>
              <p className="text-yellow-200/80 text-xs">
                A funcionalidade de gerenciamento de pagamentos será implementada em breve.
                Por enquanto, sua assinatura está ativa.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botão Cancelar (se Premium) */}
      {isPremium && (
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleCancel}
            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center border border-red-500/20"
          >
            Cancelar Assinatura
          </button>
        </div>
      )}
    </div>
  );
}
