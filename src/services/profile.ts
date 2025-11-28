import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
}

/**
 * Serviço para gerenciar perfis de usuário
 */
export class ProfileService {
  /**
   * Criar perfil de usuário
   */
  async createProfile(userId: string, username: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: username.trim().toLowerCase(),
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar perfil:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Erro ao criar perfil:', error);
      return null;
    }
  }

  /**
   * Buscar perfil por ID do usuário
   */
  async getProfileByUserId(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  }

  /**
   * Buscar perfil por username
   */
  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username.trim().toLowerCase())
        .single();

      if (error) {
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Erro ao buscar perfil por username:', error);
      return null;
    }
  }

  /**
   * Buscar email do usuário por username
   * Retorna o email para fazer login
   */
  async getEmailByUsername(username: string): Promise<string | null> {
    try {
      const profile = await this.getProfileByUsername(username);
      if (!profile) {
        return null;
      }

      // Buscar email do usuário na tabela auth.users
      const { data: { user }, error } = await supabase.auth.admin.getUserById(profile.id);
      
      // Como não temos acesso admin, vamos usar uma abordagem diferente
      // Buscar diretamente na tabela auth.users via RPC ou usar o perfil para fazer login
      // Por enquanto, retornamos null e vamos fazer login de outra forma
      return null;
    } catch (error) {
      console.error('Erro ao buscar email por username:', error);
      return null;
    }
  }

  /**
   * Verificar se username está disponível
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const profile = await this.getProfileByUsername(username);
      return profile === null;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade do username:', error);
      return false;
    }
  }

  /**
   * Atualizar username do perfil
   */
  async updateUsername(userId: string, newUsername: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername.trim().toLowerCase() })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao atualizar username:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar username:', error);
      return false;
    }
  }
}

export const profileService = new ProfileService();

