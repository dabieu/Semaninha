import axios from 'axios';
import { SpotifyProxy } from './spotifyProxy';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3000';

// Debug: verificar se as variáveis estão sendo carregadas
console.log('Spotify Service - Variáveis de ambiente:', {
  CLIENT_ID: CLIENT_ID ? '✅ Carregado' : '❌ Não carregado',
  REDIRECT_URI: REDIRECT_URI,
  VITE_SPOTIFY_REDIRECT_URI: import.meta.env.SPOTIFY_REDIRECT_URI
});

export interface SpotifyAlbum {
  id: string;
  name: string;
  artist: string;
  image: string;
  playCount?: number;
}

export class SpotifyService {
  private static instance: SpotifyService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private spotifyProxy = SpotifyProxy.getInstance();

  static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  // Generate authorization URL
  getAuthUrl(): string {
    const scopes = [
      'user-top-read',
      'user-read-private',
      'user-read-email'
    ].join(' ');

    // Clear any existing state before generating new one
    localStorage.removeItem('spotify_auth_state');
    
    const state = this.generateRandomString(16);
    localStorage.setItem('spotify_auth_state', state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: scopes,
      redirect_uri: REDIRECT_URI,
      state: state,
      prompt: 'login', // Force login screen to appear
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  // Handle callback and exchange code for tokens
  async handleCallback(code: string, state: string): Promise<{ username: string }> {
    try {
      // Validate state parameter to prevent CSRF attacks
      const storedState = localStorage.getItem('spotify_auth_state');
      console.log('State validation:', { storedState, receivedState: state, match: storedState === state });
      
      if (!storedState || storedState !== state) {
        throw new Error('Estado de autenticação inválido. Tente novamente.');
      }

      // Use proxy to avoid CORS issues
      const data = await this.spotifyProxy.exchangeCodeForToken(code, REDIRECT_URI);

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;

      // Store tokens in localStorage
      if (this.accessToken) {
        localStorage.setItem('spotify_access_token', this.accessToken);
      }
      if (this.refreshToken) {
        localStorage.setItem('spotify_refresh_token', this.refreshToken);
      }

      // Clear the state after successful authentication
      localStorage.removeItem('spotify_auth_state');

      // Get user profile
      const userResponse = await this.makeAuthenticatedRequest('https://api.spotify.com/v1/me');
      return { username: userResponse.display_name || userResponse.id };
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error; // Não adicionar prefixo, deixar a mensagem original
    }
  }

  // Handle callback without state validation (for popup authentication)
  async handleCallbackDirect(code: string, state: string): Promise<{ username: string }> {
    try {
      console.log('Processing callback without state validation for popup');
      
      // Use proxy to avoid CORS issues
      const data = await this.spotifyProxy.exchangeCodeForToken(code, REDIRECT_URI);

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;

      // Store tokens in localStorage
      if (this.accessToken) {
        localStorage.setItem('spotify_access_token', this.accessToken);
      }
      if (this.refreshToken) {
        localStorage.setItem('spotify_refresh_token', this.refreshToken);
      }

      // Clear the state after successful authentication
      localStorage.removeItem('spotify_auth_state');

      // Get user profile
      const userResponse = await this.makeAuthenticatedRequest('https://api.spotify.com/v1/me');
      return { username: userResponse.display_name || userResponse.id };
    } catch (error) {
      console.error('Error exchanging code for token (direct):', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('spotify_access_token');
    return !!token;
  }

  // Get stored username
  async getStoredUser(): Promise<string | null> {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) return null;

    try {
      this.accessToken = token;
      const userResponse = await this.makeAuthenticatedRequest('https://api.spotify.com/v1/me');
      return userResponse.display_name || userResponse.id;
    } catch (error) {
      // Token might be expired, clear it
      this.clearTokens();
      return null;
    }
  }

  // Get top albums
  async getTopAlbums(timeRange: string, limit: number): Promise<SpotifyAlbum[]> {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('spotify_access_token');
    }

    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      // Get top tracks first (Spotify doesn't have direct top albums endpoint)
      const tracksResponse = await this.makeAuthenticatedRequest(
        `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`
      );

      // Extract unique albums from tracks
      const albumsMap = new Map<string, SpotifyAlbum>();
      
      tracksResponse.items.forEach((track: any) => {
        const album = track.album;
        if (!albumsMap.has(album.id)) {
          albumsMap.set(album.id, {
            id: album.id,
            name: album.name,
            artist: album.artists[0].name,
            image: album.images[0]?.url || '',
            playCount: 1
          });
        } else {
          const existingAlbum = albumsMap.get(album.id)!;
          existingAlbum.playCount = (existingAlbum.playCount || 0) + 1;
        }
      });

      // Convert to array and sort by play count
      const albums = Array.from(albumsMap.values())
        .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
        .slice(0, limit);

      return albums;
    } catch (error) {
      console.error('Error fetching top albums:', error);
      throw new Error('Failed to fetch top albums');
    }
  }

  // Make authenticated request with token refresh
  private async makeAuthenticatedRequest(url: string): Promise<any> {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken || ''}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      if (error.message?.includes('401') || error.status === 401) {
        // Token expired, try to refresh
        try {
          await this.refreshAccessToken();
        } catch (refreshError) {
          throw new Error('Token expirado e não foi possível renovar');
        }
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.accessToken || ''}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
      }
      throw error;
    }
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<void> {
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const data = await this.spotifyProxy.refreshToken(refreshToken);

      this.accessToken = data.access_token;
      if (this.accessToken) {
        localStorage.setItem('spotify_access_token', this.accessToken);
      }

      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearTokens();
      throw new Error('Falha ao renovar token');
    }
  }

  // Clear stored tokens
  clearTokens(): void {
    console.log('Clearing Spotify tokens from localStorage');
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_auth_state');
    console.log('Spotify tokens cleared successfully');
  }

  // Logout user from Spotify
  logout(): void {
    console.log('Spotify logout called - clearing tokens and redirecting to logout');
    this.clearTokens();
    
    // Force complete logout by redirecting to Spotify logout page
    // This ensures the user can authenticate with a different account
    const logoutUrl = 'https://accounts.spotify.com/logout';
    
    // Open logout in a new window/tab to avoid disrupting the main app
    const logoutWindow = window.open(logoutUrl, '_blank', 'width=400,height=300');
    
    // Close the logout window after a short delay
    if (logoutWindow) {
      setTimeout(() => {
        logoutWindow.close();
      }, 2000);
    }
  }

  // Generate random string for state parameter
  private generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  // Convert time period to Spotify format
  static convertTimePeriod(period: string): string {
    switch (period) {
      case '7day':
        return 'short_term'; // ~4 weeks
      case '1month':
        return 'short_term';
      case '3month':
        return 'medium_term'; // ~6 months
      case '12month':
        return 'long_term'; // several years
      default:
        return 'medium_term';
    }
  }
}