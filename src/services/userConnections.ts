import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';

// Chave para criptografar tokens (em produção, use uma chave segura)
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production';

export type ConnectionProvider = 'spotify' | 'lastfm';

export interface UserConnection {
  id: string;
  user_id: string;
  provider: ConnectionProvider;
  spotify_access_token?: string | null;
  spotify_refresh_token?: string | null;
  spotify_token_expires_at?: string | null;
  lastfm_username?: string | null;
  is_active: boolean;
  last_used_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Serviço para gerenciar conexões do usuário (Spotify/Last.fm)
 */
export class UserConnectionsService {
  /**
   * Criptografar token
   */
  private encryptToken(token: string): string {
    return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString();
  }

  /**
   * Descriptografar token
   */
  private decryptToken(encryptedToken: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Salvar conexão do Spotify
   */
  async saveSpotifyConnection(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ): Promise<UserConnection | null> {
    try {
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
      
      // Criptografar tokens antes de salvar
      const encryptedAccessToken = this.encryptToken(accessToken);
      const encryptedRefreshToken = this.encryptToken(refreshToken);

      const { data, error } = await supabase
        .from('user_connections')
        .upsert({
          user_id: userId,
          provider: 'spotify',
          spotify_access_token: encryptedAccessToken,
          spotify_refresh_token: encryptedRefreshToken,
          spotify_token_expires_at: expiresAt,
          is_active: true,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,provider'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar conexão Spotify:', error);
        return null;
      }

      return data as UserConnection;
    } catch (error) {
      console.error('Erro ao salvar conexão Spotify:', error);
      return null;
    }
  }

  /**
   * Salvar conexão do Last.fm
   */
  async saveLastFmConnection(
    userId: string,
    username: string
  ): Promise<UserConnection | null> {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .upsert({
          user_id: userId,
          provider: 'lastfm',
          lastfm_username: username,
          is_active: true,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,provider'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar conexão Last.fm:', error);
        return null;
      }

      return data as UserConnection;
    } catch (error) {
      console.error('Erro ao salvar conexão Last.fm:', error);
      return null;
    }
  }

  /**
   * Obter conexão do Spotify do usuário
   */
  async getSpotifyConnection(userId: string): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: string | null;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select('spotify_access_token, spotify_refresh_token, spotify_token_expires_at')
        .eq('user_id', userId)
        .eq('provider', 'spotify')
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      // Descriptografar tokens
      const accessToken = data.spotify_access_token 
        ? this.decryptToken(data.spotify_access_token)
        : null;
      const refreshToken = data.spotify_refresh_token
        ? this.decryptToken(data.spotify_refresh_token)
        : null;

      return {
        accessToken,
        refreshToken,
        expiresAt: data.spotify_token_expires_at,
      };
    } catch (error) {
      console.error('Erro ao obter conexão Spotify:', error);
      return null;
    }
  }

  /**
   * Obter conexão do Last.fm do usuário
   */
  async getLastFmConnection(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select('lastfm_username')
        .eq('user_id', userId)
        .eq('provider', 'lastfm')
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return data.lastfm_username;
    } catch (error) {
      console.error('Erro ao obter conexão Last.fm:', error);
      return null;
    }
  }

  /**
   * Obter todas as conexões do usuário
   */
  async getUserConnections(userId: string): Promise<UserConnection[]> {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_used_at', { ascending: false });

      if (error) {
        console.error('Erro ao obter conexões:', error);
        return [];
      }

      return (data || []) as UserConnection[];
    } catch (error) {
      console.error('Erro ao obter conexões:', error);
      return [];
    }
  }

  /**
   * Desconectar provider
   */
  async disconnectProvider(userId: string, provider: ConnectionProvider): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_connections')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('provider', provider);

      if (error) {
        console.error('Erro ao desconectar:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      return false;
    }
  }

  /**
   * Atualizar última utilização
   */
  async updateLastUsed(userId: string, provider: ConnectionProvider): Promise<void> {
    try {
      await supabase
        .from('user_connections')
        .update({ last_used_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('provider', provider);
    } catch (error) {
      console.error('Erro ao atualizar última utilização:', error);
    }
  }
}

export const userConnectionsService = new UserConnectionsService();

