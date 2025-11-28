import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Music, User, Crown, LogOut, Sparkles, Settings } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './hooks/useAuth';
import { HomePage } from './pages/HomePage';
import { Dashboard } from './pages/Dashboard';

export type AuthMethod = 'spotify' | 'lastfm';
export type GridSize = '3x3' | '5x5' | '10x10' | 'custom';
export type TimePeriod = '7day' | '1month' | '3month' | '12month' | 'custom';

function App() {
  // Hook de autenticação do Supabase
  // Fornece: user, plan, isPremium, username, loading, signIn, signUp, signOut
  const { user, isPremium, username, signOut } = useAuth();
  
  // Estado para controlar o modal de autenticação
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  // Handlers para o modal de autenticação
  const handleOpenAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      
      {/* Navbar */}
      <nav className="bg-slate-800/90 backdrop-blur-lg border-b border-slate-600/30 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <a href="/" className="flex items-center cursor-pointer">
              <Music className="h-8 w-8 text-white mr-2" />
              <span className="text-xl font-bold text-white">Semaninha</span>
            </a>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Indicador de Premium */}
              {user && isPremium && (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                  <Crown className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">Premium</span>
                </div>
              )}
              
              {/* Badge sutil para não-premium (incentivo) */}
              {user && !isPremium && (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-pink-500/10 border border-emerald-500/20 rounded-lg group cursor-pointer hover:border-emerald-500/40 transition-all">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400 group-hover:text-emerald-300" />
                  <span className="text-xs font-medium text-emerald-300/80 group-hover:text-emerald-300">
                    Upgrade
                  </span>
                </div>
              )}
              
              {/* Indicador de Login - Mostrar sempre que houver usuário */}
              {user ? (
                <a
                  href="/dashboard"
                  className="flex items-center space-x-2 text-white px-3 py-1.5 rounded-lg bg-slate-700/30 border border-emerald-500/20 hover:bg-slate-700/50 transition-colors"
                >
                  <User className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm max-w-[150px] truncate font-medium">
                    {username || user.email}
                  </span>
                </a>
              ) : null}
              
              {user && (
                <a
                  href="/dashboard"
                  className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors duration-200 font-medium px-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Dashboard</span>
                </a>
              )}
              
              <a 
                href="#" 
                className="text-white/70 hover:text-white transition-colors duration-200 font-medium px-2"
              >
                Sobre
              </a>
              <a 
                href="#" 
                className="text-white/70 hover:text-white transition-colors duration-200 font-medium px-2"
              >
                Contato
              </a>

              {/* Botão de Autenticação */}
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </button>
              ) : (
                <button
                  onClick={() => handleOpenAuthModal('signin')}
                  className="group relative flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-lg transition-all duration-200 text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                >
                  <User className="h-4 w-4" />
                  <span>Entrar</span>
                  {/* Brilho sutil no hover */}
                  <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </button>
              )}
            </div>

            {/* Mobile Menu - Botão de Autenticação */}
            <div className="md:hidden flex items-center space-x-3">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="text-white/70 hover:text-white transition-colors duration-200"
                  aria-label="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={() => handleOpenAuthModal('signin')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-lg transition-all duration-200 text-xs font-semibold"
                  aria-label="Entrar"
                >
                  <User className="h-4 w-4" />
                  <span>Entrar</span>
                </button>
              )}
              <button className="text-white/70 hover:text-white transition-colors duration-200">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<HomePage isPremium={isPremium} />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Modal de Autenticação */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        initialMode={authModalMode}
      />
    </div>
  );
}

export default App;