import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { ProfileSettings } from '../components/dashboard/ProfileSettings';
import { ConnectionsSettings } from '../components/dashboard/ConnectionsSettings';
import { CollageSettings } from '../components/dashboard/CollageSettings';
import { SubscriptionSettings } from '../components/dashboard/SubscriptionSettings';

export type DashboardSection = 'profile' | 'connections' | 'settings' | 'subscription';

export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<DashboardSection>('profile');

  // Redirecionar se não estiver logado
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Se ainda está carregando ou não há usuário, mostrar loading
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      {/* Dashboard Content */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <DashboardSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Main Content */}
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header com botão destacado para gerar colagens */}
            <div className="mb-6">
              <button
                onClick={() => navigate('/')}
                className="group flex items-center space-x-3 px-5 py-3 bg-gradient-to-r from-emerald-500/20 to-pink-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl transition-all duration-200 hover:from-emerald-500/30 hover:to-pink-500/30 mb-4 w-full md:w-auto"
              >
                <div className="relative">
                  <Music className="h-5 w-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                  <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <ArrowLeft className="h-4 w-4 text-emerald-300 group-hover:text-emerald-200 transition-colors" />
                <span className="font-semibold text-emerald-300 group-hover:text-emerald-200 transition-colors">
                  Gerar Nova Colagem
                </span>
              </button>
            </div>

            {/* Conteúdo da seção ativa */}
            <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-slate-600/30 p-6 md:p-8 shadow-2xl">
              {activeSection === 'profile' && <ProfileSettings />}
              {activeSection === 'connections' && <ConnectionsSettings />}
              {activeSection === 'settings' && <CollageSettings />}
              {activeSection === 'subscription' && <SubscriptionSettings />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

