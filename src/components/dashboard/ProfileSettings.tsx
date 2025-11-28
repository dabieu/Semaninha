import { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { profileService } from '../../services/profile';
import { supabase } from '../../lib/supabase';

export function ProfileSettings() {
  const { user, username: currentUsername } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setUsername(currentUsername || '');
    }
  }, [user, currentUsername]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Atualizar username se mudou
      if (username.trim().toLowerCase() !== currentUsername?.toLowerCase()) {
        if (username.length < 3) {
          setError('Nome de usuário deve ter pelo menos 3 caracteres');
          setLoading(false);
          return;
        }

        const isAvailable = await profileService.isUsernameAvailable(username.trim().toLowerCase());
        if (!isAvailable) {
          setError('Este nome de usuário já está em uso');
          setLoading(false);
          return;
        }

        const updated = await profileService.updateUsername(user.id, username.trim().toLowerCase());
        if (!updated) {
          setError('Erro ao atualizar nome de usuário');
          setLoading(false);
          return;
        }
      }

      setSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (newPassword.length < 6) {
        setError('A nova senha deve ter pelo menos 6 caracteres');
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('As senhas não coincidem');
        setLoading(false);
        return;
      }

      // Atualizar senha no Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setError(updateError.message || 'Erro ao atualizar senha');
        setLoading(false);
        return;
      }

      setSuccess('Senha atualizada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Gerenciar Conta</h2>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-slate-600">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'profile'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Perfil
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'password'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Senha
        </button>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-200 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4 mb-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-emerald-400 mr-2" />
          <span className="text-emerald-200 text-sm">{success}</span>
        </div>
      )}

      {/* Tab: Perfil */}
      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Nome de usuário
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="seu_usuario"
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500"
                maxLength={20}
                disabled={loading}
              />
            </div>
            <p className="mt-1 text-xs text-white/50">
              Pode ser alterado a qualquer momento
            </p>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="email"
                value={email}
                disabled
                className="w-full pl-10 pr-4 py-3 bg-slate-700/30 border border-slate-600 rounded-lg text-white/50 cursor-not-allowed"
              />
            </div>
            <p className="mt-1 text-xs text-white/50">
              O email não pode ser alterado por questões de segurança
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || username === currentUsername}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Salvar Alterações
              </>
            )}
          </button>
        </form>
      )}

      {/* Tab: Senha */}
      {activeTab === 'password' && (
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Atualizando...
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 mr-2" />
                Atualizar Senha
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

