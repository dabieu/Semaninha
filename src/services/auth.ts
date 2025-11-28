import { supabase } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

/**
 * Interface para o serviço de autenticação
 * Define os métodos que serão usados na aplicação
 */
export interface AuthService {
  signUp(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }>;
  signIn(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }>;
  signOut(): Promise<{ error: AuthError | null }>;
  getCurrentUser(): Promise<User | null>;
  getSession(): Promise<Session | null>;
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}

/**
 * Implementação do serviço de autenticação usando Supabase
 * 
 * Este serviço encapsula todas as operações de autenticação:
 * - Registro de novos usuários
 * - Login de usuários existentes
 * - Logout
 * - Verificação de usuário atual
 * - Escuta de mudanças de autenticação
 */
class SupabaseAuthService implements AuthService {
  /**
   * Registra um novo usuário
   * @param email Email do usuário
   * @param password Senha do usuário
   * @returns Objeto com usuário criado e possíveis erros
   */
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Opção: redirecionar após confirmação de email
      // options: {
      //   emailRedirectTo: `${window.location.origin}/auth/callback`
      // }
    });
    
    // Se o registro foi bem-sucedido, verificar se há sessão
    // (algumas configurações do Supabase podem não criar sessão automaticamente)
    if (data.user && !error) {
      // Tentar obter a sessão atual
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        // Se há sessão, o onAuthStateChange será disparado automaticamente
        console.log('✅ Usuário registrado e sessão criada');
      } else {
        console.log('⚠️ Usuário registrado, mas sem sessão (pode precisar confirmar email)');
      }
    }
    
    return { 
      user: data.user, 
      error: error as AuthError | null 
    };
  }

  /**
   * Faz login de um usuário existente
   * Aceita email ou username
   * @param emailOrUsername Email ou username do usuário
   * @param password Senha do usuário
   * @returns Objeto com usuário autenticado e possíveis erros
   */
  async signIn(emailOrUsername: string, password: string) {
    // Verificar se é email (contém @) ou username
    const isEmail = emailOrUsername.includes('@');
    
    if (isEmail) {
      // Login direto com email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailOrUsername.trim(),
        password,
      });
      
      return { 
        user: data.user, 
        error: error as AuthError | null 
      };
    } else {
      // É username - buscar email do usuário via RPC
      const { data: emailData, error: emailError } = await supabase
        .rpc('get_user_email_by_username', { 
          username_param: emailOrUsername.trim().toLowerCase() 
        });
      
      if (emailError || !emailData) {
        return {
          user: null,
          error: { 
            message: emailError?.message || 'Usuário não encontrado. Verifique o nome de usuário ou tente usar seu email.' 
          } as AuthError
        };
      }
      
      // Fazer login com o email encontrado
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailData,
        password,
      });
      
      return { 
        user: data.user, 
        error: error as AuthError | null 
      };
    }
  }

  /**
   * Faz logout do usuário atual
   * Remove a sessão e limpa o estado de autenticação
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error: error as AuthError | null };
  }

  /**
   * Obtém o usuário atualmente autenticado
   * @returns Usuário atual ou null se não houver autenticação
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
    
    return user;
  }

  /**
   * Obtém a sessão atual do usuário
   * @returns Sessão atual ou null se não houver sessão ativa
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao obter sessão:', error);
      return null;
    }
    
    return session;
  }

  /**
   * Escuta mudanças no estado de autenticação
   * Útil para atualizar a UI quando o usuário faz login/logout
   * 
   * @param callback Função chamada quando o estado de autenticação muda
   * @returns Função para cancelar a inscrição
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Eventos possíveis: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED
        console.log('Auth state changed:', event);
        callback(session?.user ?? null);
      }
    );
    
    // Retorna função para cancelar a inscrição quando necessário
    return () => subscription.unsubscribe();
  }
}

// Exportar instância única do serviço (Singleton pattern)
export const authService = new SupabaseAuthService();

