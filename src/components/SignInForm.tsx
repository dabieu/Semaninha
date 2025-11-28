import { useState } from 'react';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SignInFormProps {
  onSuccess?: () => void; // Callback quando login for bem-sucedido
  onSwitchToSignUp?: () => void; // Callback para alternar para registro
}

/**
 * Componente de formulário de login
 * 
 * Funcionalidades:
 * - Validação de email
 * - Campo de senha com opção de mostrar/ocultar
 * - Feedback visual de erros
 * - Integração com hook useAuth
 * - Link para alternar para registro
 */
export function SignInForm({ onSuccess, onSwitchToSignUp }: SignInFormProps) {
  const { signIn, loading } = useAuth();
  
  // Estados do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados de UI
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  /**
   * Valida o formulário antes de submeter
   * Aceita email ou username
   */
  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    // Validar email ou username
    if (!email.trim()) {
      errors.email = 'Email ou nome de usuário é obrigatório';
    }

    // Validar senha
    if (!password) {
      errors.password = 'Senha é obrigatória';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Limpa os erros quando o usuário começa a digitar
   */
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (validationErrors.email) {
      setValidationErrors(prev => ({ ...prev, email: undefined }));
    }
    if (error) setError(null);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (validationErrors.password) {
      setValidationErrors(prev => ({ ...prev, password: undefined }));
    }
    if (error) setError(null);
  };

  /**
   * Submete o formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpar erros anteriores
    setError(null);

    // Validar formulário
    if (!validateForm()) {
      return;
    }

    try {
      // Tentar fazer login
      const { user, error: signInError } = await signIn(email.trim(), password);

      if (signInError) {
        // Tratar erros comuns do Supabase
        let errorMessage = 'Erro ao fazer login. Tente novamente.';
        
        if (signInError.message?.includes('Invalid login credentials')) {
          errorMessage = 'Email/nome de usuário ou senha incorretos. Verifique e tente novamente.';
        } else if (signInError.message?.includes('Usuário não encontrado')) {
          errorMessage = 'Usuário não encontrado. Verifique o nome de usuário ou tente usar seu email.';
        } else if (signInError.message?.includes('Email not confirmed')) {
          errorMessage = 'Por favor, confirme seu email antes de fazer login.';
        } else if (signInError.message?.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
        } else if (signInError.message) {
          errorMessage = signInError.message;
        }

        setError(errorMessage);
        return;
      }

      if (user) {
        // Sucesso! Limpar formulário
        setEmail('');
        setPassword('');

        // Chamar callback de sucesso
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      console.error('Erro inesperado ao fazer login:', err);
      setError('Erro inesperado. Tente novamente mais tarde.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-3">
          <div className="relative">
            <LogIn className="h-10 w-10 text-emerald-400" />
            <Sparkles className="h-4 w-4 text-emerald-300 absolute -top-1 -right-1 opacity-60" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Entrar</h2>
        <p className="text-white/70 text-sm">
          Acesse sua conta e continue criando colagens incríveis
        </p>
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4 flex items-center animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
          <span className="text-red-200 text-sm">{error}</span>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo Email ou Username */}
        <div>
          <label htmlFor="signin-email" className="block text-white text-sm font-medium mb-2">
            Email ou nome de usuário
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              id="signin-email"
              type="text"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="seu@email.com ou seu_usuario"
              className={`w-full pl-10 pr-4 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                validationErrors.email
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500'
              }`}
              disabled={loading}
              autoComplete="username"
            />
          </div>
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-400">{validationErrors.email}</p>
          )}
        </div>

        {/* Campo Senha */}
        <div>
          <label htmlFor="signin-password" className="block text-white text-sm font-medium mb-2">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Digite sua senha"
              className={`w-full pl-10 pr-12 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                validationErrors.password
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500'
              }`}
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {validationErrors.password && (
            <p className="mt-1 text-sm text-red-400">{validationErrors.password}</p>
          )}
        </div>

        {/* Link "Esqueci minha senha" (opcional, pode ser implementado depois) */}
        <div className="text-right">
          <button
            type="button"
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            onClick={() => {
              // TODO: Implementar recuperação de senha
              alert('Funcionalidade de recuperação de senha será implementada em breve!');
            }}
          >
            Esqueci minha senha
          </button>
        </div>

        {/* Botão Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Entrando...
            </>
          ) : (
            <>
              <LogIn className="h-5 w-5 mr-2" />
              Entrar
            </>
          )}
        </button>
      </form>

      {/* Link para Registro */}
      {onSwitchToSignUp && (
        <div className="mt-6 text-center">
          <p className="text-white/70 text-sm">
            Não tem uma conta?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Criar conta
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

