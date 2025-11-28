import { supabase } from '../lib/supabase';
import type { GridSize, TimePeriod } from '../App';

export interface UserSettings {
  id: string;
  user_id: string;
  default_grid_size: GridSize;
  default_time_period: TimePeriod;
  default_show_band_name: boolean;
  default_show_album_name: boolean;
  default_show_username: boolean;
  default_hide_albums_without_cover: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Serviço para gerenciar configurações do usuário
 */
export class UserSettingsService {
  /**
   * Obter configurações do usuário (ou criar padrão se não existir)
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Configurações não existem, criar padrão
        return await this.createDefaultSettings(userId);
      }

      if (error) {
        console.error('Erro ao obter configurações:', error);
        return this.getDefaultSettings(userId);
      }

      return data as UserSettings;
    } catch (error) {
      console.error('Erro ao obter configurações:', error);
      return this.getDefaultSettings(userId);
    }
  }

  /**
   * Criar configurações padrão
   */
  async createDefaultSettings(userId: string): Promise<UserSettings> {
    try {
      const defaultSettings = {
        user_id: userId,
        default_grid_size: '3x3' as GridSize,
        default_time_period: '7day' as TimePeriod,
        default_show_band_name: true,
        default_show_album_name: true,
        default_show_username: true,
        default_hide_albums_without_cover: false,
      };

      const { data, error } = await supabase
        .from('user_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar configurações padrão:', error);
        return this.getDefaultSettings(userId);
      }

      return data as UserSettings;
    } catch (error) {
      console.error('Erro ao criar configurações padrão:', error);
      return this.getDefaultSettings(userId);
    }
  }

  /**
   * Obter configurações padrão (sem salvar no banco)
   */
  private getDefaultSettings(userId: string): UserSettings {
    return {
      id: '',
      user_id: userId,
      default_grid_size: '3x3',
      default_time_period: '7day',
      default_show_band_name: true,
      default_show_album_name: true,
      default_show_username: true,
      default_hide_albums_without_cover: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Atualizar configurações do usuário
   */
  async updateUserSettings(
    userId: string,
    settings: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<UserSettings | null> {
    try {
      // Verificar se configurações existem
      const existing = await this.getUserSettings(userId);
      
      const { data, error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar configurações:', error);
        return null;
      }

      return data as UserSettings;
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      return null;
    }
  }
}

export const userSettingsService = new UserSettingsService();

