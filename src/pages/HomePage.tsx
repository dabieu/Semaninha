import { useState, useCallback, useEffect } from 'react';
import { Music } from 'lucide-react';
import { AuthStep } from '../components/AuthStep';
import { ConfigStep } from '../components/ConfigStep';
import { GenerationStep } from '../components/GenerationStep';
import { ResultStep } from '../components/ResultStep';
import { StepIndicator } from '../components/StepIndicator';
import { useAuth } from '../hooks/useAuth';
import { userSettingsService } from '../services/userSettings';
import type { AuthMethod, GridSize, TimePeriod } from '../App';

interface AppState {
  step: number;
  authMethod: AuthMethod | null;
  isAuthenticated: boolean;
  username: string;
  gridSize: GridSize;
  timePeriod: TimePeriod;
  showBandName: boolean;
  showAlbumName: boolean;
  showUsername: boolean;
  hideAlbumsWithoutCover: boolean;
  albums: any[];
  collageUrl: string;
}

interface HomePageProps {
  isPremium: boolean;
}

export function HomePage({ isPremium }: HomePageProps) {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>({
    step: 1,
    authMethod: null,
    isAuthenticated: false,
    username: '',
    gridSize: '3x3',
    timePeriod: '7day',
    showBandName: true,
    showAlbumName: true,
    showUsername: true,
    hideAlbumsWithoutCover: false,
    albums: [],
    collageUrl: ''
  });

  // Carregar configurações salvas do usuário quando ele estiver logado
  useEffect(() => {
    const loadUserSettings = async () => {
      if (user) {
        try {
          const settings = await userSettingsService.getUserSettings(user.id);
          // Atualizar estado com as configurações salvas do usuário
          setState(prev => ({
            ...prev,
            gridSize: settings.default_grid_size,
            timePeriod: settings.default_time_period,
            showBandName: settings.default_show_band_name,
            showAlbumName: settings.default_show_album_name,
            showUsername: settings.default_show_username,
            hideAlbumsWithoutCover: settings.default_hide_albums_without_cover,
          }));
        } catch (error) {
          console.error('Erro ao carregar configurações do usuário:', error);
          // Se houver erro, manter valores padrão
        }
      }
    };

    loadUserSettings();
  }, [user]);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = () => {
    if (state.step < 4) {
      updateState({ step: state.step + 1 });
    }
  };

  const prevStep = () => {
    if (state.step > 1) {
      updateState({ step: state.step - 1 });
    }
  };

  const resetFlow = async () => {
    // Se usuário está logado, recarregar configurações salvas
    if (user) {
      try {
        const settings = await userSettingsService.getUserSettings(user.id);
        setState({
          step: 1,
          authMethod: null,
          isAuthenticated: false,
          username: '',
          gridSize: settings.default_grid_size,
          timePeriod: settings.default_time_period,
          showBandName: settings.default_show_band_name,
          showAlbumName: settings.default_show_album_name,
          showUsername: settings.default_show_username,
          hideAlbumsWithoutCover: settings.default_hide_albums_without_cover,
          albums: [],
          collageUrl: ''
        });
      } catch (error) {
        console.error('Erro ao recarregar configurações:', error);
        // Fallback para valores padrão se houver erro
        setState({
          step: 1,
          authMethod: null,
          isAuthenticated: false,
          username: '',
          gridSize: '3x3',
          timePeriod: '7day',
          showBandName: true,
          showAlbumName: true,
          showUsername: true,
          hideAlbumsWithoutCover: false,
          albums: [],
          collageUrl: ''
        });
      }
    } else {
      // Se não está logado, usar valores padrão
      setState({
        step: 1,
        authMethod: null,
        isAuthenticated: false,
        username: '',
        gridSize: '3x3',
        timePeriod: '7day',
        showBandName: true,
        showAlbumName: true,
        showUsername: true,
        hideAlbumsWithoutCover: false,
        albums: [],
        collageUrl: ''
      });
    }
  };

  const handleLogout = () => {
    console.log('App handleLogout called - clearing global state');
    updateState({ 
      isAuthenticated: false, 
      username: '', 
      authMethod: null 
    });
    console.log('Global state cleared successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Music className="h-12 w-12 text-white mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">Semaninha</h1>
          </div>
          <p className="text-white/80 text-lg max-w-md mx-auto">
            Crie colagens dos seus álbuns mais tocados
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={state.step} />

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-slate-600/30 p-6 md:p-8 shadow-2xl">
            {state.step === 1 && (
              <AuthStep
                authMethod={state.authMethod}
                isAuthenticated={state.isAuthenticated}
                username={state.username}
                onAuthMethodChange={(method) => updateState({ authMethod: method })}
                onAuthenticate={(username) => updateState({ isAuthenticated: true, username })}
                onLogout={handleLogout}
                onNext={nextStep}
              />
            )}

            {state.step === 2 && (
              <ConfigStep
                gridSize={state.gridSize}
                timePeriod={state.timePeriod}
                showBandName={state.showBandName}
                showAlbumName={state.showAlbumName}
                showUsername={state.showUsername}
                hideAlbumsWithoutCover={state.hideAlbumsWithoutCover}
                isPremium={isPremium}
                onGridSizeChange={(size) => updateState({ gridSize: size })}
                onTimePeriodChange={(period) => updateState({ timePeriod: period })}
                onShowBandNameChange={(show) => updateState({ showBandName: show })}
                onShowAlbumNameChange={(show) => updateState({ showAlbumName: show })}
                onShowUsernameChange={(show) => updateState({ showUsername: show })}
                onHideAlbumsWithoutCoverChange={(hide) => updateState({ hideAlbumsWithoutCover: hide })}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}

            {state.step === 3 && (
              <GenerationStep
                authMethod={state.authMethod!}
                username={state.username}
                gridSize={state.gridSize}
                timePeriod={state.timePeriod}
                showBandName={state.showBandName}
                showAlbumName={state.showAlbumName}
                showUsername={state.showUsername}
                hideAlbumsWithoutCover={state.hideAlbumsWithoutCover}
                onGenerated={(albums, collageUrl) => updateState({ albums, collageUrl })}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}

            {state.step === 4 && (
              <ResultStep
                collageUrl={state.collageUrl}
                albums={state.albums}
                gridSize={state.gridSize}
                timePeriod={state.timePeriod}
                onReset={resetFlow}
                onBack={prevStep}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 mb-4">
          <p className="text-white/60 text-sm">
            Por{' '}
            <a 
              href="https://x.com/dabieu" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-pink-400 hover:text-pink-300 transition-colors duration-200 font-medium"
            >
              Dabi
            </a>
            {' '}🩷 |{' '}
            <a 
              href="#" 
              className="text-amber-400 hover:text-amber-300 transition-colors duration-200 font-medium"
            >
              Me pague um café
            </a>
            {' '}☕
          </p>
        </div>
      </div>
    </div>
  );
}

