import React, { useState } from 'react';
import { Music, User, ArrowRight, Check, AlertCircle } from 'lucide-react';
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

export function AuthStep({
  authMethod,
  isAuthenticated,
  username,
  onAuthMethodChange,
  onAuthenticate,
  onLogout,
  onNext
}: AuthStepProps) {
  const [lastfmInput, setLastfmInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  React.useEffect(() => {
    checkExistingAuth();
  }, [authMethod, isAuthenticated, onAuthenticate]);

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

  const handleSpotifyCallback = async (code: string, state: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { username } = await spotifyService.handleCallback(code, state);
      onAuthenticate(username);
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error: any) {
      console.error('Spotify callback error:', error);
      // Usar a mensagem de erro original sem adicionar prefixo
      setError(error.message || 'Erro desconhecido na autenticação');
    } finally {
      setIsLoading(false);
    }
  };

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

    if (code && state && !isAuthenticated) {
      onAuthMethodChange('spotify');
      handleSpotifyCallback(code, state);
    }
  }, [isAuthenticated, onAuthMethodChange]); // Adicionar dependências necessárias

  const handleSpotifyAuth = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const authUrl = spotifyService.getAuthUrl();
      
      // Abrir autenticação em nova janela popup
      const popup = window.open(
        authUrl,
        'spotify-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        throw new Error('Popup bloqueado pelo navegador. Permita popups para este site.');
      }
      
      // Monitorar quando a janela é fechada
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsLoading(false);
          // Verificar se há tokens armazenados
          checkExistingAuth();
        }
      }, 1000);
      
      // Monitorar mudanças na URL da janela popup
      const checkUrl = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkUrl);
            return;
          }
          
          const popupUrl = popup.location.href;
          if (popupUrl.includes('code=') && popupUrl.includes('state=')) {
            // Extrair code e state da URL
            const urlParams = new URLSearchParams(popupUrl.split('?')[1]);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            
            if (code && state) {
              clearInterval(checkUrl);
              popup.close();
              // Processar autenticação diretamente sem validação de estado
              processSpotifyAuth(code, state);
            }
          }
        } catch (error: any) {
          // Erro de cross-origin, continuar monitorando
        }
      }, 500);
      
    } catch (error: any) {
      console.error('Spotify auth error:', error);
      setError(error.message || 'Erro ao iniciar autenticação com Spotify');
      setIsLoading(false);
    }
  };

  // Função separada para processar autenticação do popup
  const processSpotifyAuth = async (code: string, state: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Usar o serviço diretamente sem validação de estado
      const { username } = await spotifyService.handleCallbackDirect(code, state);
      onAuthenticate(username);
    } catch (error: any) {
      console.error('Spotify callback error:', error);
      setError(error.message || 'Erro desconhecido na autenticação');
    } finally {
      setIsLoading(false);
    }
  };

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
                onClick={handleSpotifyAuth}
                disabled={isLoading}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center mx-auto"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Music className="h-5 w-5 mr-2" />
                    Conectar com Spotify
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
              <p className="text-white/60 text-xs mt-2">
                Certifique-se de que seu perfil Last.fm é público
              </p>
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