import React, { useState, useCallback } from 'react';
import { Music, Instagram, Twitter, MessageCircle, Download, Copy, ArrowLeft, ArrowRight, AlignJustify as Spotify, User } from 'lucide-react';
import { AuthStep } from './components/AuthStep';
import { ConfigStep } from './components/ConfigStep';
import { GenerationStep } from './components/GenerationStep';
import { ResultStep } from './components/ResultStep';
import { StepIndicator } from './components/StepIndicator';

export type AuthMethod = 'spotify' | 'lastfm';
export type GridSize = '3x3' | '5x5' | '10x10' | 'custom';
export type TimePeriod = '7day' | '1month' | '3month' | '12month' | 'custom';

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
  albums: any[];
  collageUrl: string;
}

function App() {
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
    albums: [],
    collageUrl: ''
  });

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

  const resetFlow = () => {
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
      albums: [],
      collageUrl: ''
    });
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
      
      {/* Navbar */}
      <nav className="bg-slate-800/90 backdrop-blur-lg border-b border-slate-600/30 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center cursor-pointer" onClick={resetFlow}>
              <Music className="h-8 w-8 text-white mr-2" />
              <span className="text-xl font-bold text-white">Semaninha</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a 
                href="#" 
                className="text-white/70 hover:text-white transition-colors duration-200 font-medium"
              >
                Sobre
              </a>
              <a 
                href="#" 
                className="text-white/70 hover:text-white transition-colors duration-200 font-medium"
              >
                Contato
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button className="text-white/70 hover:text-white transition-colors duration-200">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

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
                onGridSizeChange={(size) => updateState({ gridSize: size })}
                onTimePeriodChange={(period) => updateState({ timePeriod: period })}
                onShowBandNameChange={(show) => updateState({ showBandName: show })}
                onShowAlbumNameChange={(show) => updateState({ showAlbumName: show })}
                onShowUsernameChange={(show) => updateState({ showUsername: show })}
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

export default App;