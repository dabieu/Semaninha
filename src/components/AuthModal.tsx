import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SignUpForm } from './SignUpForm';
import { SignInForm } from './SignInForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup'; // Modo inicial do modal
}

/**
 * Modal de autenticação que alterna entre Login e Registro
 * 
 * Funcionalidades:
 * - Alterna entre SignIn e SignUp
 * - Overlay escuro com blur
 * - Fecha ao clicar no overlay ou botão X
 * - Previne scroll do body quando aberto
 * - Animações suaves
 * - Responsivo
 */
export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  // Atualizar modo quando initialMode mudar
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [initialMode, isOpen]);

  // Prevenir scroll do body quando modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      // Salvar scroll atual
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Restaurar scroll ao fechar
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Fechar modal ao pressionar ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  // Não renderizar se não estiver aberto
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Fechar apenas se clicar no overlay, não no conteúdo do modal
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSuccess = () => {
    // Fechar modal após login/registro bem-sucedido
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-200"
      onClick={handleOverlayClick}
      style={{ animation: 'fadeIn 0.2s ease-in-out' }}
    >
      <div
        className="bg-slate-800/95 backdrop-blur-lg rounded-2xl border border-slate-600/30 shadow-2xl w-full max-w-md relative transition-transform duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.2s ease-out' }}
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors duration-200 z-10"
          aria-label="Fechar modal"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Conteúdo do Modal */}
        <div className="p-6 md:p-8">
          {mode === 'signin' ? (
            <SignInForm
              onSuccess={handleSuccess}
              onSwitchToSignUp={() => setMode('signup')}
            />
          ) : (
            <SignUpForm
              onSuccess={handleSuccess}
              onSwitchToSignIn={() => setMode('signin')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

