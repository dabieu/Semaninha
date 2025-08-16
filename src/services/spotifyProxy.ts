// Simple proxy solution for Spotify authentication
// This creates a popup window to handle the OAuth flow

import axios from 'axios'; // Added import for axios

export class SpotifyProxy {
  private static instance: SpotifyProxy;
  private currentProxyIndex = 0;
  
  // Lista de proxies alternativos
  private proxies = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://thingproxy.freeboard.io/fetch/',
    'https://cors.bridged.cc/',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://cors.eu.org/'
  ];

  static getInstance(): SpotifyProxy {
    if (!SpotifyProxy.instance) {
      SpotifyProxy.instance = new SpotifyProxy();
    }
    return SpotifyProxy.instance;
  }

  // Obter proxy atual
  private getCurrentProxy(): string {
    return this.proxies[this.currentProxyIndex];
  }

  // Tentar próximo proxy em caso de falha
  private nextProxy(): void {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
    console.log(`Tentando próximo proxy: ${this.getCurrentProxy()}`);
  }

  // Reset para primeiro proxy
  private resetProxy(): void {
    this.currentProxyIndex = 0;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
      client_secret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
    });

    let lastError: any;
    let successfulResponse: any = null;

    for (let attempt = 0; attempt < this.proxies.length; attempt++) {
      const currentProxy = this.proxies[attempt];
      
      try {
        console.log(`Tentativa ${attempt + 1}: Usando proxy ${currentProxy}`);
        
        const response = await axios.post(`${currentProxy}${tokenUrl}`, body, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000, // 10 segundos de timeout
        });

        console.log('Resposta do proxy:', {
          status: response.status,
          headers: response.headers,
          data: response.data,
          dataKeys: response.data ? Object.keys(response.data) : 'No data'
        });

        // Verificar se a resposta tem os campos necessários
        if (!response.data || !response.data.access_token) {
          console.error('Resposta do proxy não contém access_token:', response.data);
          throw new Error('Resposta inválida do proxy - sem access_token');
        }

        console.log('Token obtido com sucesso usando proxy:', currentProxy);
        this.resetProxy(); // Reset para primeiro proxy em caso de sucesso
        successfulResponse = response.data;
        break; // Sair do loop após sucesso
      } catch (error: any) {
        console.warn(`Proxy ${currentProxy} falhou:`, error.message);
        lastError = error;
        // Continuar para o próximo proxy
      }
    }

    // Se tivemos sucesso com pelo menos um proxy, retornar o resultado
    if (successfulResponse) {
      return successfulResponse;
    }

    // Se chegou até aqui, todos os proxies falharam
    console.error('Todos os proxies falharam');
    if (lastError instanceof Error) {
      throw lastError;
    } else {
      throw new Error('Não foi possível conectar ao Spotify. Todos os proxies falharam.');
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
      client_secret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
    });

    // Tentar com diferentes proxies até funcionar
    let lastError: any;
    
    for (let attempt = 0; attempt < this.proxies.length; attempt++) {
      const currentProxy = this.proxies[attempt];
      
      try {
        console.log(`Refresh - Tentativa ${attempt + 1}: Usando proxy ${currentProxy}`);
        
        const response = await axios.post(`${currentProxy}${tokenUrl}`, body, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000, // 10 segundos de timeout
        });

        console.log('Refresh - Resposta do proxy:', {
          status: response.status,
          headers: response.headers,
          data: response.data,
          dataKeys: response.data ? Object.keys(response.data) : 'No data'
        });

        // Verificar se a resposta tem os campos necessários
        if (!response.data || !response.data.access_token) {
          console.error('Refresh - Resposta do proxy não contém access_token:', response.data);
          throw new Error('Resposta inválida do proxy - sem access_token');
        }

        console.log('Token renovado com sucesso usando proxy:', currentProxy);
        this.resetProxy(); // Reset para primeiro proxy em caso de sucesso
        return response.data;
        
      } catch (error: any) {
        console.warn(`Refresh - Proxy ${currentProxy} falhou:`, error.message);
        lastError = error;
        // Não precisa chamar nextProxy() aqui, o loop já avança
      }
    }

    // Se todos os proxies falharam
    console.error('Refresh - Todos os proxies falharam');
    if (lastError instanceof Error) {
      throw lastError;
    } else {
      throw new Error('Não foi possível renovar o token do Spotify. Todos os proxies falharam.');
    }
  }
}