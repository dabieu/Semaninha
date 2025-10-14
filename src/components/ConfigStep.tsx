import React, { useEffect } from 'react';
import { ArrowRight, ArrowLeft, Grid3X3, Calendar, Music, Disc, Crown, Lock, User } from 'lucide-react';
import { GridSize, TimePeriod } from '../App';
import { Tooltip } from './Tooltip';

interface ConfigStepProps {
  gridSize: GridSize;
  timePeriod: TimePeriod;
  showBandName: boolean;
  showAlbumName: boolean;
  showUsername: boolean;
  onGridSizeChange: (size: GridSize) => void;
  onTimePeriodChange: (period: TimePeriod) => void;
  onShowBandNameChange: (show: boolean) => void;
  onShowAlbumNameChange: (show: boolean) => void;
  onShowUsernameChange: (show: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

const gridSizes = [
  { value: '3x3' as GridSize, label: '3x3', description: '9 álbuns', preview: 3, premium: false },
  { value: '5x5' as GridSize, label: '5x5', description: '25 álbuns', preview: 5, premium: false },
  { value: '10x10' as GridSize, label: '10x10', description: '100 álbuns', preview: 10, premium: false },
  { value: 'custom' as GridSize, label: 'Personalizado', description: 'Tamanho customizado', preview: 4, premium: true }
];

const timePeriods = [
  { value: '7day' as TimePeriod, label: 'Últimos 7 dias', icon: '📅', premium: false },
  { value: '1month' as TimePeriod, label: 'Último mês', icon: '📆', premium: false },
  { value: '3month' as TimePeriod, label: 'Últimos 3 meses', icon: '🗓️', premium: false },
  { value: '12month' as TimePeriod, label: 'Último ano', icon: '📊', premium: false },
  { value: 'custom' as TimePeriod, label: 'Personalizado', icon: '🎯', premium: true }
];

export function ConfigStep({
  gridSize,
  timePeriod,
  showBandName,
  showAlbumName,
  showUsername,
  onGridSizeChange,
  onTimePeriodChange,
  onShowBandNameChange,
  onShowAlbumNameChange,
  onShowUsernameChange,
  onNext,
  onBack
}: ConfigStepProps) {
  // Focar no topo da tela quando o componente for montado
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-1">Personalize sua colagem</h2>
      <p className="text-white/70 mb-4 text-sm">Escolha o tamanho e período que preferir</p>

      {/* Grid Size Selection */}
      <div className="mb-4">
        <div className="flex items-center justify-center mb-2">
          <Grid3X3 className="h-5 w-5 text-white mr-2" />
          <h3 className="text-lg font-semibold text-white">Tamanho da Grade</h3>
        </div>
        
        <div className="grid md:grid-cols-4 gap-3">
          {gridSizes.map((size) => {
            const cardContent = (
              <div
                onClick={() => !size.premium && onGridSizeChange(size.value)}
                className={`p-3 rounded-xl transition-all duration-300 flex flex-col justify-center items-center text-center ${
                  size.premium
                    ? 'bg-slate-600/50 border border-slate-500 cursor-not-allowed opacity-60'
                    : gridSize === size.value
                    ? 'bg-emerald-500/20 border-2 border-emerald-400 shadow-lg scale-105 cursor-pointer'
                    : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700 hover:scale-102 cursor-pointer'
                }`}
              >
                {/* Premium Badge */}
                {size.premium && (
                  <div className="flex items-center justify-center mb-2">
                    <Crown className="h-3 w-3 text-yellow-400 mr-1" />
                    <span className="text-yellow-400 text-xs font-medium">PREMIUM</span>
                  </div>
                )}

                {/* Preview Grid */}
                <div className="flex justify-center mb-2">
                  <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${Math.min(size.preview, 4)}, 1fr)` }}
                  >
                    {Array.from({ length: Math.min(size.preview * size.preview, 16) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-slate-400 rounded-sm"
                      />
                    ))}
                  </div>
                </div>
                
                <div className="text-lg font-bold text-white mb-1">{size.label}</div>
                <div className="text-white/70 text-xs">{size.description}</div>
                
                {/* Lock Icon for Premium */}
                {size.premium && (
                  <div className="flex items-center justify-center mt-1">
                    <Lock className="h-3 w-3 text-slate-400" />
                  </div>
                )}
              </div>
            );

            return size.premium ? (
              <Tooltip 
                key={size.value}
                content="Seja livre, customize o tamanho, adapte para storys, ou para onde quiser"
                position="top"
              >
                {cardContent}
              </Tooltip>
            ) : (
              <React.Fragment key={size.value}>
                {cardContent}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Time Period Selection */}
      <div className="mb-4">
        <div className="flex items-center justify-center mb-2">
          <Calendar className="h-5 w-5 text-white mr-2" />
          <h3 className="text-lg font-semibold text-white">Período de Escuta</h3>
        </div>
        
        <div className="grid md:grid-cols-3 gap-3">
          {timePeriods.map((period) => {
            const cardContent = (
              <div
                onClick={() => !period.premium && onTimePeriodChange(period.value)}
                className={`p-3 rounded-xl transition-all duration-300 flex flex-col justify-center items-center text-center ${
                  period.premium
                    ? 'bg-slate-600/50 border border-slate-500 cursor-not-allowed opacity-60'
                    : timePeriod === period.value
                    ? 'bg-emerald-500/20 border-2 border-emerald-400 shadow-lg scale-105 cursor-pointer'
                    : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700 hover:scale-102 cursor-pointer'
                }`}
              >
                {/* Premium Badge */}
                {period.premium && (
                  <div className="flex items-center justify-center mb-2">
                    <Crown className="h-3 w-3 text-yellow-400 mr-1" />
                    <span className="text-yellow-400 text-xs font-medium">PREMIUM</span>
                  </div>
                )}

                <div className="text-xl mb-2">{period.icon}</div>
                <div className="text-white font-medium text-sm">{period.label}</div>
                
                {/* Lock Icon for Premium */}
                {period.premium && (
                  <div className="flex items-center justify-center mt-1">
                    <Lock className="h-3 w-3 text-slate-400" />
                  </div>
                )}
              </div>
            );

            return period.premium ? (
              <Tooltip 
                key={period.value}
                content="Intervalo customizado, últimos 54 dias? Desde a criação da sua conta? o céu é o limite"
                position="top"
              >
                {cardContent}
              </Tooltip>
            ) : (
              <React.Fragment key={period.value}>
                {cardContent}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Display Options */}
      <div className="mb-4">
        <div className="flex items-center justify-center mb-2">
          <Music className="h-5 w-5 text-white mr-2" />
          <h3 className="text-lg font-semibold text-white">Opções de Exibição</h3>
        </div>
        
        <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl border border-slate-600">
            <div className="flex items-center">
              <Music className="h-4 w-4 text-white mr-2" />
              <div>
                <div className="text-white font-medium text-sm">Exibir nome da banda</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showBandName}
                onChange={(e) => onShowBandNameChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl border border-slate-600">
            <div className="flex items-center">
              <Disc className="h-4 w-4 text-white mr-2" />
              <div>
                <div className="text-white font-medium text-sm">Exibir nome do álbum</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showAlbumName}
                onChange={(e) => onShowAlbumNameChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl border border-slate-600">
            <div className="flex items-center">
              <User className="h-4 w-4 text-white mr-2" />
              <div>
                <div className="text-white font-medium text-sm">Exibir nome de usuário</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showUsername}
                onChange={(e) => onShowUsernameChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-4">
        <button
          onClick={onBack}
          className="bg-slate-600 text-white hover:bg-slate-500 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </button>
        
        <button
          onClick={onNext}
          className="bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center"
        >
          Gerar Colagem
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
}