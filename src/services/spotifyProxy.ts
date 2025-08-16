// Simple proxy solution for Spotify authentication
// This creates a popup window to handle the OAuth flow

export class SpotifyProxy {
  private static instance: SpotifyProxy;
  
  static getInstance(): SpotifyProxy {
    if (!SpotifyProxy.instance) {
      SpotifyProxy.instance = new SpotifyProxy();
    }
    return SpotifyProxy.instance;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
    // Try Supabase Edge Function first, fallback to direct request
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (supabaseUrl) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/spotify-auth?action=token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            redirect_uri: redirectUri,
          }),
        });

        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn('Supabase function failed, trying alternative approach:', error);
      }
    }

    // Fallback: Use a different CORS proxy or direct request
    const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('Spotify credentials not configured');
    }

    const tokenData = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    try {
      // Try direct request first (works in some environments)
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenData,
      });

      if (response.ok) {
        return await response.json();
      }

      // If direct request fails, try a simple proxy
      const proxyResponse = await fetch('https://corsproxy.io/?https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenData,
      });

      if (!proxyResponse.ok) {
        const errorText = await proxyResponse.text();
        console.error('Proxy error response:', errorText);
        throw new Error(`HTTP ${proxyResponse.status}: ${errorText}`);
      }

      return await proxyResponse.json();
    } catch (error) {
      console.error('Token exchange failed:', error);
      // Retornar mensagem de erro mais específica sem duplicar prefixos
      if (error instanceof Error) {
        throw error; // Manter a mensagem original se já for um Error
      } else {
        throw new Error('Não foi possível conectar ao Spotify. Verifique suas credenciais e configuração do redirect URI.');
      }
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    // Try Supabase Edge Function first, fallback to direct request
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (supabaseUrl) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/spotify-auth?action=refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
        });

        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn('Supabase function failed, trying alternative approach:', error);
      }
    }

    // Fallback: Use direct request or alternative proxy
    const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('Spotify credentials not configured');
    }

    const refreshData = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    try {
      // Try direct request first
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: refreshData,
      });

      if (response.ok) {
        return await response.json();
      }

      // If direct request fails, try a simple proxy
      const proxyResponse = await fetch('https://corsproxy.io/?https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: refreshData,
      });

      if (!proxyResponse.ok) {
        const errorText = await proxyResponse.text();
        console.error('Proxy error response:', errorText);
        throw new Error(`HTTP ${proxyResponse.status}: ${errorText}`);
      }

      return await proxyResponse.json();
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Retornar mensagem de erro mais específica sem duplicar prefixos
      if (error instanceof Error) {
        throw error; // Manter a mensagem original se já for um Error
      } else {
        throw new Error('Não foi possível renovar a conexão com o Spotify.');
      }
    }
  }
}