// Simple proxy solution for Spotify authentication
// This creates a popup window to handle the OAuth flow

import axios from 'axios'; // Added import for axios

export class SpotifyProxy {
  private static instance: SpotifyProxy;
  private currentProxyIndex = 0;
  
  // Função para verificar se é dispositivo móvel
  private isMobile(): boolean {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isMobileDevice = mobileRegex.test(userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    return isMobileDevice || isSmallScreen;
  }
  
  // Função para log condicional (suprimir em mobile)
  private log(message: string, data?: any): void {
    if (!this.isMobile()) {
      console.log(message, data);
    }
  }
  
  // Função para warn condicional (suprimir em mobile)
  private warn(message: string, data?: any): void {
    if (!this.isMobile()) {
      console.warn(message, data);
    }
  }
  
  // Lista de proxies alternativos
  private proxies = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://thingproxy.freeboard.io/fetch/',
    'https://cors.bridged.cc/',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://cors.eu.org/',
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://thingproxy.freeboard.io/fetch/',
    'https://cors.bridged.cc/',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://cors.eu.org/',
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
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

    const isMobileDevice = this.isMobile();
    
    // PRIMEIRA TENTATIVA: Conexão direta com a API do Spotify
    console.log('🔄 Tentativa 1: Conexão direta com API do Spotify...');
    try {
      const directResponse = await axios.post(tokenUrl, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000, // 15 segundos para tentativa direta
      });
      
      if (directResponse.data && directResponse.data.access_token) {
        console.log('✅ Conexão direta bem-sucedida! Ignorando proxies.');
        return directResponse.data;
      }
    } catch (directError) {
      console.log('❌ Conexão direta falhou, tentando proxies...');
    }

    // SEGUNDA TENTATIVA: Proxies CORS como fallback
    console.log('🔄 Tentativa 2: Usando proxies CORS como fallback...');
    let lastError: any;
    let successfulResponse: any = null;

    for (let attempt = 0; attempt < this.proxies.length; attempt++) {
      const currentProxy = this.proxies[attempt];
      
      try {
        this.log(`Tentativa ${attempt + 1}: Usando proxy ${currentProxy}`);
        
        const response = await axios.post(`${currentProxy}${tokenUrl}`, body, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000, // 10 segundos de timeout
        });

        this.log('Resposta do proxy:', {
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

        this.log('Token obtido com sucesso usando proxy:', currentProxy);
        this.resetProxy(); // Reset para primeiro proxy em caso de sucesso
        successfulResponse = response.data;
        break; // Sair do loop após sucesso
      } catch (error: any) {
        // Em mobile, suprimir completamente os erros de proxy
        if (isMobileDevice) {
          // Apenas log interno, sem propagar erro
          console.log(`📱 Mobile: Proxy ${currentProxy} falhou silenciosamente`);
        } else {
          this.warn(`Proxy ${currentProxy} falhou:`, error.message);
        }
        lastError = error;
        // Continuar para o próximo proxy
      }
    }

    // Se tivemos sucesso com pelo menos um proxy, retornar o resultado
    if (successfulResponse) {
      return successfulResponse;
    }

    // Se chegou até aqui, todos os métodos falharam
    if (isMobileDevice) {
      console.log('📱 Mobile: Conexão direta e todos os proxies falharam, usando fallback...');
      
      // Em vez de retornar dados falsos, deixar o sistema lidar com o erro
      // O SpotifyService irá interceptar e fazer fallback adequado
      throw new Error('MOBILE_PROXY_FAILURE');
    } else {
      // Em desktop, manter comportamento original
      console.error('Conexão direta e todos os proxies falharam');
      if (lastError instanceof Error) {
        throw lastError;
      } else {
        throw new Error('Não foi possível conectar ao Spotify. Conexão direta e todos os proxies falharam.');
      }
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

    const isMobileDevice = this.isMobile();
    
    // PRIMEIRA TENTATIVA: Conexão direta com a API do Spotify
    console.log('🔄 Refresh - Tentativa 1: Conexão direta com API do Spotify...');
    try {
      const directResponse = await axios.post(tokenUrl, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000, // 15 segundos para tentativa direta
      });
      
      if (directResponse.data && directResponse.data.access_token) {
        console.log('✅ Refresh - Conexão direta bem-sucedida! Ignorando proxies.');
        return directResponse.data;
      }
    } catch (directError) {
      console.log('❌ Refresh - Conexão direta falhou, tentando proxies...');
    }

    // SEGUNDA TENTATIVA: Proxies CORS como fallback
    console.log('🔄 Refresh - Tentativa 2: Usando proxies CORS como fallback...');
    let lastError: any;
    let successfulResponse: any = null;

    for (let attempt = 0; attempt < this.proxies.length; attempt++) {
      const currentProxy = this.proxies[attempt];
      
      try {
        this.log(`Refresh - Tentativa ${attempt + 1}: Usando proxy ${currentProxy}`);
        
        const response = await axios.post(`${currentProxy}${tokenUrl}`, body, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000, // 10 segundos de timeout
        });

        this.log('Refresh - Resposta do proxy:', {
          status: response.status,
          headers: response.headers,
          data: response.data,
          dataKeys: response.data ? Object.keys(response.data) : 'No data'
        });

        // Verificar se a resposta tem os campos necessários
        if (!response.data || !response.data.access_token) {
          console.error('Refresh - Resposta do proxy não contém access_token:', response.data);
          throw new Error('Refresh - Resposta inválida do proxy - sem access_token');
        }

        this.log('Refresh - Token obtido com sucesso usando proxy:', currentProxy);
        this.resetProxy(); // Reset para primeiro proxy em caso de sucesso
        successfulResponse = response.data;
        break; // Sair do loop após sucesso
      } catch (error: any) {
        // Em mobile, suprimir completamente os erros de proxy
        if (isMobileDevice) {
          // Apenas log interno, sem propagar erro
          console.log(`📱 Mobile: Refresh - Proxy ${currentProxy} falhou silenciosamente`);
        } else {
          this.warn(`Refresh - Proxy ${currentProxy} falhou:`, error.message);
        }
        lastError = error;
        // Continuar para o próximo proxy
      }
    }

    // Se tivemos sucesso com pelo menos um proxy, retornar o resultado
    if (successfulResponse) {
      return successfulResponse;
    }

    // Se chegou até aqui, todos os métodos falharam
    if (isMobileDevice) {
      console.log('📱 Mobile: Refresh - Conexão direta e todos os proxies falharam, usando fallback...');
      
      // Em vez de retornar dados falsos, deixar o sistema lidar com o erro
      // O SpotifyService irá interceptar e fazer fallback adequado
      throw new Error('MOBILE_REFRESH_PROXY_FAILURE');
    } else {
      // Em desktop, manter comportamento original
      console.error('Refresh - Conexão direta e todos os proxies falharam');
      if (lastError instanceof Error) {
        throw lastError;
      } else {
        throw new Error('Não foi possível renovar o token do Spotify. Conexão direta e todos os proxies falharam.');
      }
    }
  }
}