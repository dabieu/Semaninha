import { Settings, Link2, Sliders, Crown, User, Music, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DashboardSection } from '../pages/Dashboard';

interface DashboardSidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

const sections = [
  {
    id: 'profile' as DashboardSection,
    label: 'Meu Perfil',
    icon: User,
    description: 'Gerenciar dados da conta'
  },
  {
    id: 'connections' as DashboardSection,
    label: 'Conexões',
    icon: Link2,
    description: 'Spotify e Last.fm'
  },
  {
    id: 'settings' as DashboardSection,
    label: 'Configurações',
    icon: Sliders,
    description: 'Padrões de colagem'
  },
  {
    id: 'subscription' as DashboardSection,
    label: 'Assinatura',
    icon: Crown,
    description: 'Gerenciar plano'
  },
];

export function DashboardSidebar({ activeSection, onSectionChange }: DashboardSidebarProps) {
  const navigate = useNavigate();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-slate-800/90 backdrop-blur-lg border-r border-slate-600/30 overflow-y-auto z-40">
      <nav className="p-4 space-y-2">
        {/* Botão para Gerar Colagens */}
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 bg-gradient-to-r from-emerald-500/20 to-pink-500/20 border border-emerald-500/30 hover:border-emerald-500/50 hover:from-emerald-500/30 hover:to-pink-500/30 group mb-2"
        >
          <div className="relative">
            <Music className="h-5 w-5 text-emerald-400 group-hover:text-emerald-300" />
            <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold text-emerald-300 group-hover:text-emerald-200">
              Gerar Colagem
            </div>
            <div className="text-xs text-emerald-200/70 mt-0.5">
              Criar nova colagem
            </div>
          </div>
        </button>

        {/* Divisor */}
        <div className="h-px bg-slate-600/50 my-3"></div>

        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                isActive
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                  : 'text-white/70 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-400' : 'text-white/50'}`} />
              <div className="flex-1">
                <div className={`font-medium ${isActive ? 'text-emerald-300' : 'text-white'}`}>
                  {section.label}
                </div>
                <div className="text-xs text-white/50 mt-0.5">
                  {section.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

