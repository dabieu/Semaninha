import { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { subscriptionService } from '../services/subscription';
import { profileService } from '../services/profile';
import type { User } from '@supabase/supabase-js';
import type { PlanType } from '../services/subscription';

/**
 * Hook personalizado para gerenciar autenticação e assinaturas
 * 
 * Este hook fornece:
 * - Estado do usuário atual
 * - Estado do plano (free/premium)
 * - Funções de autenticação (signIn, signUp, signOut)
 * - Estado de loading
 * - Atualização automática quando o estado de autenticação muda
 * 
 * @returns Objeto com estado e funções de autenticação
 */
export function useAuth() {
  // Estado do usuário atual
  const [user, setUser] = useState<User | null>(null);
  
  // Estado de loading (enquanto verifica autenticação)
  const [loading, setLoading] = useState(true);
  
  // Estado do plano do usuário
  const [plan, setPlan] = useState<PlanType>('free');
  
  // Estado do username do usuário
  const [username, setUsername] = useState<string | null>(null);

  // Efeito para verificar autenticação ao montar o componente
  useEffect(() => {
    let mounted = true;

    // Função para carregar dados do usuário
    const loadUserData = async (currentUser: User | null) => {
      if (!mounted) return;

      if (currentUser) {
        // Se há usuário, buscar o plano e username dele
        try {
          const [userPlan, profile] = await Promise.all([
            subscriptionService.getUserPlan(currentUser.id),
            profileService.getProfileByUserId(currentUser.id)
          ]);
          
          if (mounted) {
            setPlan(userPlan);
            setUsername(profile?.username || null);
          }
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error);
          if (mounted) {
            setPlan('free');
            setUsername(null);
          }
        }
      } else {
        // Se não há usuário, resetar tudo
        if (mounted) {
          setPlan('free');
          setUsername(null);
        }
      }

      if (mounted) {
        setLoading(false);
      }
    };

    // Verificar usuário atual ao montar
    authService.getCurrentUser().then((currentUser) => {
      if (mounted) {
        setUser(currentUser);
        loadUserData(currentUser);
      }
    });

    // Escutar mudanças no estado de autenticação
    // Isso atualiza automaticamente quando o usuário faz login/logout
    const unsubscribe = authService.onAuthStateChange(async (newUser) => {
      if (!mounted) return;

      console.log('🔄 Auth state changed:', newUser ? `User: ${newUser.email}` : 'No user');
      setUser(newUser);
      
      if (newUser) {
        // Se há novo usuário, buscar o plano e username dele
        try {
          const [userPlan, profile] = await Promise.all([
            subscriptionService.getUserPlan(newUser.id),
            profileService.getProfileByUserId(newUser.id)
          ]);
          
          if (mounted) {
            setPlan(userPlan);
            setUsername(profile?.username || null);
            console.log('✅ User plan loaded:', userPlan);
            console.log('✅ Username loaded:', profile?.username || 'Não encontrado');
          }
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error);
          if (mounted) {
            setPlan('free');
            setUsername(null);
          }
        }
      } else {
        // Se não há usuário, resetar tudo
        if (mounted) {
          setPlan('free');
          setUsername(null);
        }
      }

      if (mounted) {
        setLoading(false);
      }
    });

    // Cleanup: cancelar inscrição quando componente desmontar
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  /**
   * Função para fazer login
   * @param email Email do usuário
   * @param password Senha do usuário
   * @returns Objeto com usuário e possíveis erros
   */
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user, error } = await authService.signIn(email, password);
      
      if (user && !error) {
        // Se login bem-sucedido, buscar o plano do usuário
        const userPlan = await subscriptionService.getUserPlan(user.id);
        setPlan(userPlan);
        setUser(user);
      }
      
      setLoading(false);
      return { user, error };
    } catch (error) {
      setLoading(false);
      return { user: null, error: error as any };
    }
  };

  /**
   * Função para registrar novo usuário
   * @param email Email do usuário
   * @param password Senha do usuário
   * @returns Objeto com usuário e possíveis erros
   */
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user, error } = await authService.signUp(email, password);
      
      if (user && !error) {
        // Novo usuário começa como free
        setPlan('free');
        // Atualizar estado do usuário imediatamente
        setUser(user);
        setLoading(false);
      } else {
        setLoading(false);
      }
      
      return { user, error };
    } catch (error) {
      setLoading(false);
      return { user: null, error: error as any };
    }
  };

  /**
   * Função para fazer logout
   */
  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setPlan('free');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  };

  // Computar se o usuário é premium
  const isPremium = plan === 'premium' || plan === 'premium_annual';

  // Retornar estado e funções
  return {
    // Estado
    user,
    plan,
    isPremium,
    username,
    loading,
    
    // Funções
    signIn,
    signUp,
    signOut,
  };
}

