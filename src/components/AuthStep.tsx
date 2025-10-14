import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Music, User, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { useMobile } from '../hooks/useMobile';
import { AuthMethod } from '../App';
import { SpotifyService } from '../services/spotify';
import { LastFmService } from '../services/lastfm';

interface AuthStepProps {
  authMethod: AuthMethod | null;
  isAuthenticated: boolean;
  username: string;
  onAuthMethodChange: (method: AuthMethod) => void;
  onAuthenticate: (username: string) => void;
  onLogout: () => void;
  onNext: () => void;
}

export const AuthStep: React.FC<AuthStepProps> = ({
  authMethod,
  isAuthenticated,
  username,
  onAuthMethodChange,
  onAuthenticate,
  onLogout,
  onNext
}) => {
  const [lastfmInput, setLastfmInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [collageUrl, setCollageUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const isMobile = useMobile(); // Hook para detectar dispositivo móvel
  
  // Refs para controlar o foco da tela
  const spotifyButtonRef = useRef<HTMLButtonElement>(null);
  const lastfmInputRef = useRef<HTMLInputElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  
  const spotifyService = SpotifyService.getInstance();
  const lastfmService = LastFmService.getInstance();

  // Check if already authenticated on component mount
  const checkExistingAuth = async () => {
    if (authMethod === 'spotify' && !isAuthenticated) {
      const username = await spotifyService.getStoredUser();
      if (username) {
        onAuthenticate(username);
      }
    }
  };

  // Check existing authentication on mount
  React.useEffect(() => {
    checkExistingAuth();
  }, [authMethod, isAuthenticated, onAuthenticate]);

  // Controlar foco da tela baseado no authMethod
  useEffect(() => {
    if (authMethod === 'spotify') {
      // Focar no botão "Conectar com Spotify"
      setTimeout(() => {
        spotifyButtonRef.current?.focus();
        spotifyButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else if (authMethod === 'lastfm') {
      // Focar no campo de texto do Last.fm
      setTimeout(() => {
        lastfmInputRef.current?.focus();
        lastfmInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [authMethod]);

  // Controlar foco quando usuário retorna da autenticação Spotify
  useEffect(() => {
    if (isAuthenticated && authMethod === 'spotify') {
      // Focar no botão "Continuar" após autenticação
      setTimeout(() => {
        continueButtonRef.current?.focus();
        continueButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [isAuthenticated, authMethod]);

  // Processar autenticação Spotify
  const processSpotifyAuth = useCallback(async (code: string, state: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      console.log('Processando autenticação Spotify...');
      const result = await spotifyService.handleCallbackDirect(code, state);
      
      console.log('✅ Autenticação Spotify bem-sucedida:', result);
      
      // Limpar estado de loading e erro
      setIsLoading(false);
      setError(null);
      
      // Atualizar estado de autenticação
      onAuthMethodChange('spotify');
      onAuthenticate(result.username);
      
    } catch (error: any) {
      console.error('Spotify callback error:', error);
      
      // Em dispositivos móveis, suprimir completamente os erros
      if (isMobile) {
        console.log('📱 Dispositivo móvel - suprimindo erro para melhor UX');
        setIsLoading(false);
        setError(null);
        
        // Em mobile, sempre tentar continuar sem erro
        // O sistema já fez fallback adequado no SpotifyService
        // Mesmo com erro, continuar funcionando
        onAuthMethodChange('spotify');
        onAuthenticate('Usuário Spotify');
        return;
      }
      
      // Em desktop, manter comportamento original
      // Verificar se já temos um usuário autenticado (sucesso silencioso)
      if (spotifyService.isAuthenticated()) {
        console.log('✅ Usuário já autenticado, ignorando erro de proxy');
        setIsLoading(false);
        setError(null);
        onAuthMethodChange('spotify');
        onAuthenticate('Usuário Spotify');
        return;
      }
      
      // Se não temos usuário autenticado, mostrar erro (apenas em desktop)
      setIsLoading(false);
      setError('Erro na autenticação com Spotify. Tente novamente.');
    }
  }, [spotifyService, onAuthMethodChange, onAuthenticate, isMobile]);

  // Handle Spotify callback
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      setError(`Erro na autenticação: ${error}`);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Só processar callback se não estivermos já processando e se não estivermos autenticados
    if (code && state && !isAuthenticated && !isLoading) {
      console.log('Callback do Spotify detectado em dispositivo móvel');
      onAuthMethodChange('spotify');
      processSpotifyAuth(code, state);
    }
  }, [isAuthenticated, onAuthMethodChange, isLoading, processSpotifyAuth]);

  const handleSpotifyLogout = () => {
    if (authMethod === 'spotify') {
      // Mostrar feedback visual de que está desconectando
      setError(null);
      setIsLoading(true);
      
      // Pequeno delay para mostrar o loading
      setTimeout(() => {
        spotifyService.logout();
        // Sempre chamar onLogout para limpar o estado global
        onLogout();
        setIsLoading(false);
      }, 500);
    } else {
      // Para Last.fm, apenas limpar estado local
      onLogout();
    }
  };

  // Remover função handleSpotifyCallback que não está mais sendo usada
  
  // Handle Spotify callback
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      setError(`Erro na autenticação: ${error}`);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Só processar callback se não estivermos já processando e se não estivermos autenticados
    if (code && state && !isAuthenticated && !isLoading) {
      console.log('Callback do Spotify detectado em dispositivo móvel');
      onAuthMethodChange('spotify');
      processSpotifyAuth(code, state);
    }
  }, [isAuthenticated, onAuthMethodChange, isLoading, processSpotifyAuth]);

  const handleSpotifyAuth = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      if (isMobile) {
        // Em dispositivos móveis, redirecionar na mesma tela
        console.log('Dispositivo móvel detectado - redirecionando na mesma tela');
        const authUrl = spotifyService.getMobileAuthUrl();
        window.location.href = authUrl;
      } else {
        // Em desktop, usar popup
        console.log('Desktop detectado - abrindo popup');
        const authUrl = spotifyService.getAuthUrl();
        const popup = window.open(authUrl, 'spotify-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');
        
        if (!popup) {
          throw new Error('Popup bloqueado. Permita popups para este site.');
        }

        // Monitorar o popup
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setIsLoading(false);
            setError('Autenticação cancelada ou popup fechado.');
          }
        }, 1000);

        // Monitorar mudanças na URL do popup
        const checkUrl = setInterval(() => {
          try {
            const currentUrl = popup.location.href;
            if (currentUrl.includes('?code=')) {
              clearInterval(checkUrl);
              clearInterval(checkClosed);
              
              const urlParams = new URLSearchParams(currentUrl.split('?')[1]);
              const code = urlParams.get('code');
              const state = urlParams.get('state');
              
              if (code && state) {
                popup.close();
                processSpotifyAuth(code, state);
              }
            }
          } catch (error) {
            // Cross-origin error, popup ainda não carregou
          }
        }, 500);
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao iniciar autenticação com Spotify');
      setIsLoading(false);
    }
  };

  // Processar callback do Spotify quando for mobile (redirecionamento na mesma tela)
  useEffect(() => {
    if (isMobile && authMethod === 'spotify' && !isAuthenticated) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state) {
        console.log('Callback do Spotify detectado em dispositivo móvel');
        // Limpar a URL para não mostrar o code
        window.history.replaceState({}, document.title, window.location.pathname);
        processSpotifyAuth(code, state);
      }
    }
  }, [isMobile, authMethod, isAuthenticated, processSpotifyAuth]);

  const handleLastfmAuth = async () => {
    if (!lastfmInput.trim()) return;
    
    setError(null);
    setIsLoading(true);
    
    try {
      const isValid = await lastfmService.verifyUser(lastfmInput.trim());
      if (isValid) {
        onAuthenticate(lastfmInput.trim());
      } else {
        setError('Usuário não encontrado no Last.fm');
      }
    } catch (error: any) {
      console.error('Last.fm auth error:', error);
      setError(error.message || 'Erro ao verificar usuário do Last.fm');
    } finally {
      onAuthenticate(lastfmInput.trim());
      setIsLoading(false);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white mb-2">Como você escuta música?</h2>
      <p className="text-white/70 mb-8">Escolha sua plataforma favorita para começar</p>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
          <span className="text-red-200">{error}</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Spotify Option */}
        <div
          onClick={() => {
            if (authMethod !== 'spotify') {
              // Se estiver trocando para Spotify, limpar estado de autenticação
              if (isAuthenticated) {
                onLogout();
              }
              onAuthMethodChange('spotify');
            }
          }}
          className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
            authMethod === 'spotify'
              ? 'bg-emerald-500/20 border-2 border-emerald-400 shadow-lg scale-105'
              : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700 hover:scale-102'
          }`}
        >
          <div className="flex items-center justify-center mb-4">
            <svg className="h-16 w-16 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Spotify</h3>
          <p className="text-white/70 text-sm">Login seguro. Prometemos não vender seus dados 🩷</p>
        </div>

        {/* Last.fm Option */}
        <div
          onClick={() => {
            if (authMethod !== 'lastfm') {
              // Se estiver trocando para Last.fm, limpar estado de autenticação
              if (isAuthenticated) {
                onLogout();
              }
              onAuthMethodChange('lastfm');
            }
          }}
          className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
            authMethod === 'lastfm'
              ? 'bg-orange-500/20 border-2 border-orange-400 shadow-lg scale-105'
              : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700 hover:scale-102'
          }`}
        >
          <div className="flex items-center justify-center mb-4">
            <svg className="h-16 w-16 text-red-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.584 17.21l-.88-2.392s-1.43 1.594-3.573 1.594c-1.897 0-3.244-1.649-3.244-4.288 0-3.382 1.704-4.591 3.381-4.591 2.42 0 3.189 1.567 3.849 3.574l.88 2.75c.88 2.728 2.53 4.924 7.287 4.924 3.382 0 5.665-1.017 5.665-3.931 0-2.31-1.31-3.52-3.738-4.125l-1.809-.439c-1.348-.33-1.759-.742-1.759-1.527 0-.934.742-1.484 1.951-1.484 1.32 0 2.09.495 2.2 1.677l2.53-.275c-.22-2.255-1.924-3.436-4.62-3.436-2.585 0-4.729 1.457-4.729 3.795 0 1.924.907 3.052 3.188 3.601l1.991.495c1.457.357 2.145.907 2.145 1.759 0 1.017-.934 1.594-2.915 1.594-2.585 0-4.124-1.512-4.784-4.071l-.907-2.75C12.009 5.351 10.967 3.13 7.474 3.13 3.849 3.13.797 5.626.797 10.131c0 4.591 2.53 7.177 6.379 7.177 2.926 0 4.591-1.457 4.591-1.457l-.183.359z"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Last.fm</h3>
          <p className="text-white/70 text-sm">Apenas nome de usuário, sem senha</p>
        </div>
      </div>

      {/* Authentication Form */}
      {authMethod && (
        <div className="bg-slate-700/50 rounded-xl p-6 mb-6 backdrop-blur-sm">
          {authMethod === 'spotify' && !isAuthenticated && (
            <>
              <button
                ref={spotifyButtonRef}
                onClick={handleSpotifyAuth}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Conectando...
                  </>
                ) : (
                  <>
                    <Music className="h-5 w-5 mr-2" />
                    {isMobile ? 'Conectar com Spotify' : 'Conectar com Spotify'}
                  </>
                )}
              </button>
            </>
          )}

          {authMethod === 'lastfm' && !isAuthenticated && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Nome de usuário do Last.fm
              </label>
              <div className="flex gap-3">
                <input
                  ref={lastfmInputRef}
                  type="text"
                  value={lastfmInput}
                  onChange={(e) => setLastfmInput(e.target.value)}
                  placeholder="seu_usuario"
                  className="flex-1 px-4 py-3 bg-slate-600/50 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-slate-600 transition-all"
                />
                <button
                  onClick={handleLastfmAuth}
                  disabled={isLoading || !lastfmInput.trim()}
                  className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    'Conectar'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Mostrar status de autenticação apenas se estiver autenticado na plataforma selecionada */}
          {isAuthenticated && authMethod === 'spotify' && (
            <div className="text-center">
              <div className="flex items-center justify-center text-white mb-4">
                <Check className="h-6 w-6 text-emerald-400 mr-2" />
                <span>Conectado como <strong>{username}</strong></span>
              </div>
              <button
                onClick={handleSpotifyLogout}
                disabled={isLoading}
                className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-500/50 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 text-sm"
              >
                {isLoading ? 'Desconectando...' : 'Conectar com outra conta'}
              </button>
              <p className="text-white/60 text-xs mt-2">
                Encerrará a sessão atual e permitirá vincular outra conta
              </p>
            </div>
          )}

          {isAuthenticated && authMethod === 'lastfm' && (
            <div className="text-center">
              <div className="flex items-center justify-center text-white mb-4">
                <Check className="h-6 w-6 text-emerald-400 mr-2" />
                <span>Conectado como <strong>{username}</strong></span>
              </div>
              <button
                onClick={() => onLogout()}
                className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 text-sm"
              >
                Trocar de conta
              </button>
            </div>
          )}
        </div>
      )}

      {/* Continue Button */}
      {isAuthenticated && (
        <button
          ref={continueButtonRef}
          onClick={onNext}
          className="bg-emerald-500 text-white hover:bg-emerald-600 px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center mx-auto"
        >
          Continuar
          <ArrowRight className="h-5 w-5 ml-2" />
        </button>
      )}
    </div>
  );
}