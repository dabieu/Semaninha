import { createClient } from '@supabase/supabase-js';

// Obter variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação das variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Variáveis do Supabase não configuradas!\n' +
    'Adicione ao seu arquivo .env:\n' +
    'VITE_SUPABASE_URL=seu-projeto-url\n' +
    'VITE_SUPABASE_ANON_KEY=sua-chave-anon'
  );
}

// Criar cliente Supabase
// Este cliente será usado em toda a aplicação para:
// - Autenticação (login, registro, logout)
// - Acesso ao banco de dados (consultas, inserções)
// - Gerenciamento de sessão automático
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // Auto-refresh do token quando expirar
      autoRefreshToken: true,
      // Persistir sessão no localStorage
      persistSession: true,
      // Detectar sessão na URL (útil para callbacks OAuth)
      detectSessionInUrl: true,
    },
  }
);

