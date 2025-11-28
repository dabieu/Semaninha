import { useState } from 'react';
import { Mail, Lock, UserPlus, AlertCircle, CheckCircle, Eye, EyeOff, Sparkles, Crown, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { profileService } from '../services/profile';

interface SignUpFormProps {
  onSuccess?: () => void; // Callback quando registro for bem-sucedido
  onSwitchToSignIn?: () => void; // Callback para alternar para login
}

/**
 * Componente de formulário de registro
 * 
 * Funcionalidades:
 * - Validação de email
 * - Validação de senha (mínimo 6 caracteres)
 * - Confirmação de senha
 * - Feedback visual de erros e sucesso
 * - Integração com hook useAuth
 */
export function SignUpForm({ onSuccess, onSwitchToSignIn }: SignUpFormProps) {
  const { signUp, loading } = useAuth();
  
  // Estados do formulário
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados de UI
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  /**
   * Valida o email
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Valida a senha
   */
  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres';
    }
    return null;
  };

  /**
   * Valida o username
   */
  const validateUsername = (username: string): string | null => {
    if (!username.trim()) {
      return 'Nome de usuário é obrigatório';
    }
    if (username.length < 3) {
      return 'Nome de usuário deve ter pelo menos 3 caracteres';
    }
    if (username.length > 20) {
      return 'Nome de usuário deve ter no máximo 20 caracteres';
    }
    // Apenas letras, números, underscore e hífen
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return 'Nome de usuário pode conter apenas letras, números, _ e -';
    }
    return null;
  };

  /**
   * Valida o formulário antes de submeter
   */
  const validateForm = async (): Promise<boolean> => {
    const errors: typeof validationErrors = {};

    // Validar email
    if (!email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!validateEmail(email)) {
      errors.email = 'Email inválido';
    }

    // Validar username
    const usernameError = validateUsername(username);
    if (usernameError) {
      errors.username = usernameError;
    } else {
      // Verificar se username está disponível
      setCheckingUsername(true);
      const isAvailable = await profileService.isUsernameAvailable(username.trim().toLowerCase());
      setCheckingUsername(false);
      if (!isAvailable) {
        errors.username = 'Este nome de usuário já está em uso';
      }
    }

    // Validar senha
    const passwordError = validatePassword(password);
    if (passwordError) {
      errors.password = passwordError;
    }

    // Validar confirmação de senha
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirme sua senha';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
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

  const handleUsernameChange = (value: string) => {
    // Remover espaços e converter para lowercase
    const cleaned = value.trim().toLowerCase();
    setUsername(cleaned);
    if (validationErrors.username) {
      setValidationErrors(prev => ({ ...prev, username: undefined }));
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

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (validationErrors.confirmPassword) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
    if (error) setError(null);
  };

  /**
   * Submete o formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpar estados anteriores
    setError(null);
    setSuccess(false);

    // Validar formulário (agora é async)
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    try {
      // Tentar registrar o usuário
      const { user, error: signUpError } = await signUp(email.trim(), password);

      if (signUpError) {
        // Tratar erros comuns do Supabase
        let errorMessage = 'Erro ao criar conta. Tente novamente.';
        
        if (signUpError.message?.includes('already registered')) {
          errorMessage = 'Este email já está cadastrado. Tente fazer login.';
        } else if (signUpError.message?.includes('Invalid email')) {
          errorMessage = 'Email inválido. Verifique e tente novamente.';
        } else if (signUpError.message?.includes('Password')) {
          errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
        } else if (signUpError.message) {
          errorMessage = signUpError.message;
        }

        setError(errorMessage);
        return;
      }

      if (user) {
        // Criar perfil com username
        const profile = await profileService.createProfile(user.id, username.trim().toLowerCase());
        
        if (!profile) {
          console.error('Erro ao criar perfil, mas usuário foi criado');
          // Continuar mesmo assim, o perfil pode ser criado depois
        }

        // Sucesso!
        setSuccess(true);
        
        // Limpar formulário
        setEmail('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');

        // Verificar se há sessão ativa (usuário está realmente logado)
        // Se não houver sessão, pode ser que precise confirmar email
        const { supabase } = await import('../lib/supabase');
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          // Há sessão - usuário está logado, fechar modal após delay
          setTimeout(() => {
            if (onSuccess) {
              onSuccess();
            }
          }, 1000);
        } else {
          // Não há sessão - pode precisar confirmar email
          // Mas ainda assim fechar o modal e deixar o hook detectar quando logar
          setTimeout(() => {
            if (onSuccess) {
              onSuccess();
            }
          }, 2000);
        }
      }
    } catch (err: any) {
      console.error('Erro inesperado ao registrar:', err);
      setError('Erro inesperado. Tente novamente mais tarde.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-3">
          <div className="relative">
            <UserPlus className="h-10 w-10 text-emerald-400" />
            <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Criar Conta</h2>
        <p className="text-white/70 text-sm mb-3">
          Registre-se gratuitamente e desbloqueie recursos exclusivos
        </p>
        {/* Badge sutil de incentivo */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-emerald-500/10 to-pink-500/10 border border-emerald-500/20 rounded-full">
          <Crown className="h-3 w-3 text-yellow-400" />
          <span className="text-xs text-emerald-300/90 font-medium">
            Acesso a recursos premium disponível
          </span>
        </div>
      </div>

      {/* Mensagem de Sucesso */}
      {success && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4 mb-4 animate-in fade-in">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-5 w-5 text-emerald-400 mr-2 flex-shrink-0" />
            <span className="text-emerald-200 text-sm font-medium">
              Conta criada com sucesso!
            </span>
          </div>
          <p className="text-emerald-200/80 text-xs ml-7">
            Você está sendo logado automaticamente...
          </p>
        </div>
      )}

      {/* Mensagem de Erro */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4 flex items-center animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
          <span className="text-red-200 text-sm">{error}</span>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo Email */}
        <div>
          <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="seu@email.com"
              className={`w-full pl-10 pr-4 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                validationErrors.email
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500'
              }`}
              disabled={loading || success}
              autoComplete="email"
            />
          </div>
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-400">{validationErrors.email}</p>
          )}
        </div>

        {/* Campo Nome de Usuário */}
        <div>
          <label htmlFor="username" className="block text-white text-sm font-medium mb-2">
            Nome de usuário
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="seu_usuario"
              className={`w-full pl-10 pr-4 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                validationErrors.username
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500'
              }`}
              disabled={loading || success || checkingUsername}
              autoComplete="username"
              maxLength={20}
            />
            {checkingUsername && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400"></div>
              </div>
            )}
          </div>
          {validationErrors.username && (
            <p className="mt-1 text-sm text-red-400">{validationErrors.username}</p>
          )}
          <p className="mt-1 text-xs text-white/50">Pode ser alterado mais tarde</p>
        </div>

        {/* Campo Senha */}
        <div>
          <label htmlFor="password" className="block text-white text-sm font-medium mb-2">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={`w-full pl-10 pr-12 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                validationErrors.password
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500'
              }`}
              disabled={loading || success}
              autoComplete="new-password"
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

        {/* Campo Confirmar Senha */}
        <div>
          <label htmlFor="confirmPassword" className="block text-white text-sm font-medium mb-2">
            Confirmar Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              placeholder="Digite a senha novamente"
              className={`w-full pl-10 pr-12 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                validationErrors.confirmPassword
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500'
              }`}
              disabled={loading || success}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-400">{validationErrors.confirmPassword}</p>
          )}
        </div>

        {/* Botão Submit */}
        <button
          type="submit"
          disabled={loading || success}
          className="group relative w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-emerald-500/50 disabled:to-emerald-600/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:shadow-none"
        >
          {/* Brilho sutil no hover */}
          <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Criando conta...
            </>
          ) : success ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Conta criada!
            </>
          ) : (
            <>
              <UserPlus className="h-5 w-5 mr-2" />
              Criar Conta Grátis
            </>
          )}
        </button>
      </form>

      {/* Link para Login */}
      {onSwitchToSignIn && (
        <div className="mt-6 text-center">
          <p className="text-white/70 text-sm">
            Já tem uma conta?{' '}
            <button
              onClick={onSwitchToSignIn}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Fazer login
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

