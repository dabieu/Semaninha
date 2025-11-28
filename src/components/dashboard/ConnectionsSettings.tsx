import { useState, useEffect } from 'react';
import { Link2, Check, X, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { userConnectionsService } from '../../services/userConnections';
import { SpotifyService } from '../../services/spotify';
import { LastFmService } from '../../services/lastfm';
import type { UserConnection } from '../../services/userConnections';

export function ConnectionsSettings() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<'spotify' | 'lastfm' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLastFmInput, setShowLastFmInput] = useState(false);
  const [lastFmUsername, setLastFmUsername] = useState('');

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  const loadConnections = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const conns = await userConnectionsService.getUserConnections(user.id);
      setConnections(conns);
    } catch (err) {
      console.error('Erro ao carregar conexões:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSpotify = async () => {
    if (!user) return;

    setConnecting('spotify');
    setError(null);

    try {
      const spotifyService = SpotifyService.getInstance();
      const authUrl = spotifyService.getAuthUrl();
      
      // Abrir popup para autenticação
      const popup = window.open(
        authUrl,
        'spotify-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        setError('Popup bloqueado. Permita popups para este site.');
        setConnecting(null);
        return;
      }

      // Monitorar popup
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setConnecting(null);
          // Recarregar conexões após fechar popup
          setTimeout(() => loadConnections(), 1000);
        }
      }, 1000);

      // Monitorar callback
      const checkUrl = setInterval(async () => {
        try {
          const currentUrl = popup.location.href;
          if (currentUrl.includes('?code=')) {
            clearInterval(checkUrl);
            clearInterval(checkClosed);
            
            const urlParams = new URLSearchParams(currentUrl.split('?')[1]);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            
            if (code && state && user) {
              popup.close();
              
              // Processar callback e salvar conexão
              const spotifyService = SpotifyService.getInstance();
              await spotifyService.handleCallback(code, state);
              
              // Obter tokens do localStorage (já foram salvos pelo SpotifyService)
              const accessToken = localStorage.getItem('spotify_access_token');
              const refreshToken = localStorage.getItem('spotify_refresh_token');
              
              if (accessToken && refreshToken && user) {
                // Salvar no banco de dados
                await userConnectionsService.saveSpotifyConnection(
                  user.id,
                  accessToken,
                  refreshToken,
                  3600 // 1 hora (padrão do Spotify)
                );
                
                await loadConnections();
              }
            }
          }
        } catch (err) {
          // Cross-origin error, popup ainda não carregou
        }
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com Spotify');
      setConnecting(null);
    }
  };

  const handleConnectLastFm = () => {
    if (!user) return;
    setShowLastFmInput(true);
    setError(null);
  };

  const handleSubmitLastFm = async () => {
    if (!user || !lastFmUsername.trim()) {
      setError('Digite um nome de usuário válido');
      return;
    }

    setConnecting('lastfm');
    setError(null);

    try {
      const lastfmService = LastFmService.getInstance();
      const isValid = await lastfmService.verifyUser(lastFmUsername.trim());
      
      if (!isValid) {
        setError('Usuário não encontrado no Last.fm');
        setConnecting(null);
        return;
      }

      // Salvar conexão
      await userConnectionsService.saveLastFmConnection(user.id, lastFmUsername.trim());
      await loadConnections();
      setConnecting(null);
      setShowLastFmInput(false);
      setLastFmUsername('');
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com Last.fm');
      setConnecting(null);
    }
  };

  const handleCancelLastFm = () => {
    setShowLastFmInput(false);
    setLastFmUsername('');
    setError(null);
  };

  const handleDisconnect = async (provider: 'spotify' | 'lastfm') => {
    if (!user) return;

    if (!confirm(`Tem certeza que deseja desconectar o ${provider === 'spotify' ? 'Spotify' : 'Last.fm'}?`)) {
      return;
    }

    try {
      await userConnectionsService.disconnectProvider(user.id, provider);
      await loadConnections();
    } catch (err: any) {
      setError(err.message || 'Erro ao desconectar');
    }
  };

  const spotifyConnection = connections.find(c => c.provider === 'spotify');
  const lastfmConnection = connections.find(c => c.provider === 'lastfm');
  const [spotifyUsername, setSpotifyUsername] = useState<string | null>(null);

  // Buscar username do Spotify quando houver conexão
  useEffect(() => {
    const loadSpotifyUsername = async () => {
      if (spotifyConnection && user) {
        try {
          const connection = await userConnectionsService.getSpotifyConnection(user.id);
          if (connection && connection.accessToken) {
            const spotifyService = SpotifyService.getInstance();
            const loaded = await spotifyService.loadTokensFromDatabase(
              connection.accessToken,
              connection.refreshToken || ''
            );
            if (loaded) {
              const username = spotifyService.getCurrentUsername();
              setSpotifyUsername(username);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar username do Spotify:', error);
        }
      } else {
        setSpotifyUsername(null);
      }
    };

    loadSpotifyUsername();
  }, [spotifyConnection, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Conexões</h2>
      <p className="text-white/70 mb-6">
        Conecte suas contas para não precisar autenticar toda vez que gerar uma colagem
      </p>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-200 text-sm">{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Spotify Connection */}
        <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Spotify</h3>
                <p className="text-white/60 text-sm">
                  {spotifyConnection 
                    ? spotifyUsername 
                      ? `Conectado como ${spotifyUsername}`
                      : 'Conectado'
                    : 'Não conectado'}
                </p>
                {spotifyConnection && spotifyConnection.last_used_at && (
                  <p className="text-white/40 text-xs mt-1">
                    Último uso: {new Date(spotifyConnection.last_used_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {spotifyConnection ? (
                <>
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Check className="h-5 w-5" />
                    <span className="text-sm font-medium">Conectado</span>
                  </div>
                  <button
                    onClick={() => handleDisconnect('spotify')}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Desconectar</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnectSpotify}
                  disabled={connecting === 'spotify'}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  {connecting === 'spotify' ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Conectando...</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4" />
                      <span>Conectar</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Last.fm Connection */}
        <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10.584 17.21l-.88-2.392s-1.43 1.594-3.573 1.594c-1.897 0-3.244-1.649-3.244-4.288 0-3.382 1.704-4.591 3.381-4.591 2.42 0 3.189 1.567 3.849 3.574l.88 2.75c.88 2.728 2.53 4.924 7.287 4.924 3.382 0 5.665-1.017 5.665-3.931 0-2.31-1.31-3.52-3.738-4.125l-1.809-.439c-1.348-.33-1.759-.742-1.759-1.527 0-.934.742-1.484 1.951-1.484 1.32 0 2.09.495 2.2 1.677l2.53-.275c-.22-2.255-1.924-3.436-4.62-3.436-2.585 0-4.729 1.457-4.729 3.795 0 1.924.907 3.052 3.188 3.601l1.991.495c1.457.357 2.145.907 2.145 1.759 0 1.017-.934 1.594-2.915 1.594-2.585 0-4.124-1.512-4.784-4.071l-.907-2.75C12.009 5.351 10.967 3.13 7.474 3.13 3.849 3.13.797 5.626.797 10.131c0 4.591 2.53 7.177 6.379 7.177 2.926 0 4.591-1.457 4.591-1.457l-.183.359z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Last.fm</h3>
                <p className="text-white/60 text-sm">
                  {lastfmConnection 
                    ? `Conectado como ${lastfmConnection.lastfm_username}`
                    : 'Não conectado'}
                </p>
                {lastfmConnection && lastfmConnection.last_used_at && (
                  <p className="text-white/40 text-xs mt-1">
                    Último uso: {new Date(lastfmConnection.last_used_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {lastfmConnection ? (
                <>
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Check className="h-5 w-5" />
                    <span className="text-sm font-medium">Conectado</span>
                  </div>
                  <button
                    onClick={() => handleDisconnect('lastfm')}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Desconectar</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnectLastFm}
                  disabled={connecting === 'lastfm' || showLastFmInput}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  {connecting === 'lastfm' ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Conectando...</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4" />
                      <span>Conectar</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Campo de input para Last.fm quando mostrar */}
          {showLastFmInput && !lastfmConnection && (
            <div className="mt-4 pt-4 border-t border-slate-600">
              <label className="block text-white text-sm font-medium mb-2">
                Nome de usuário do Last.fm
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={lastFmUsername}
                  onChange={(e) => setLastFmUsername(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-600/50 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmitLastFm();
                    } else if (e.key === 'Escape') {
                      handleCancelLastFm();
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSubmitLastFm}
                  disabled={connecting === 'lastfm' || !lastFmUsername.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {connecting === 'lastfm' ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    'Confirmar'
                  )}
                </button>
                <button
                  onClick={handleCancelLastFm}
                  disabled={connecting === 'lastfm'}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-600/50 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

