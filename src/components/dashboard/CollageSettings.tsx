import { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle, AlertCircle, Grid3X3, Calendar, Music, Disc, User, ImageOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { userSettingsService } from '../../services/userSettings';
import type { GridSize, TimePeriod } from '../../App';

export function CollageSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [gridSize, setGridSize] = useState<GridSize>('3x3');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7day');
  const [showBandName, setShowBandName] = useState(true);
  const [showAlbumName, setShowAlbumName] = useState(true);
  const [showUsername, setShowUsername] = useState(true);
  const [hideAlbumsWithoutCover, setHideAlbumsWithoutCover] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const settings = await userSettingsService.getUserSettings(user.id);
      setGridSize(settings.default_grid_size);
      setTimePeriod(settings.default_time_period);
      setShowBandName(settings.default_show_band_name);
      setShowAlbumName(settings.default_show_album_name);
      setShowUsername(settings.default_show_username);
      setHideAlbumsWithoutCover(settings.default_hide_albums_without_cover);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await userSettingsService.updateUserSettings(user.id, {
        default_grid_size: gridSize,
        default_time_period: timePeriod,
        default_show_band_name: showBandName,
        default_show_album_name: showAlbumName,
        default_show_username: showUsername,
        default_hide_albums_without_cover: hideAlbumsWithoutCover,
      });

      if (!updated) {
        setError('Erro ao salvar configurações');
        return;
      }

      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const gridSizes: { value: GridSize; label: string; description: string }[] = [
    { value: '3x3', label: '3x3', description: '9 álbuns' },
    { value: '5x5', label: '5x5', description: '25 álbuns' },
    { value: '10x10', label: '10x10', description: '100 álbuns' },
  ];

  const timePeriods: { value: TimePeriod; label: string; icon: string }[] = [
    { value: '7day', label: 'Últimos 7 dias', icon: '📅' },
    { value: '1month', label: 'Último mês', icon: '📆' },
    { value: '3month', label: 'Últimos 3 meses', icon: '🗓️' },
    { value: '12month', label: 'Último ano', icon: '📊' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Configurações Padrão</h2>
      <p className="text-white/70 mb-6 text-sm">
        Defina suas preferências padrão para gerar colagens mais rapidamente
      </p>

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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tamanho da Grade */}
        <div>
          <div className="flex items-center mb-3">
            <Grid3X3 className="h-5 w-5 text-white mr-2" />
            <h3 className="text-lg font-semibold text-white">Tamanho da Grade Padrão</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {gridSizes.map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={() => setGridSize(size.value)}
                className={`p-4 rounded-xl transition-all duration-300 text-center ${
                  gridSize === size.value
                    ? 'bg-emerald-500/20 border-2 border-emerald-400 shadow-lg scale-105'
                    : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700 hover:scale-102'
                }`}
              >
                <div className="text-lg font-bold text-white mb-1">{size.label}</div>
                <div className="text-white/70 text-sm">{size.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Período Padrão */}
        <div>
          <div className="flex items-center mb-3">
            <Calendar className="h-5 w-5 text-white mr-2" />
            <h3 className="text-lg font-semibold text-white">Período Padrão</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {timePeriods.map((period) => (
              <button
                key={period.value}
                type="button"
                onClick={() => setTimePeriod(period.value)}
                className={`p-4 rounded-xl transition-all duration-300 text-center ${
                  timePeriod === period.value
                    ? 'bg-emerald-500/20 border-2 border-emerald-400 shadow-lg scale-105'
                    : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700 hover:scale-102'
                }`}
              >
                <div className="text-xl mb-2">{period.icon}</div>
                <div className="text-white font-medium text-sm">{period.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Opções de Exibição */}
        <div>
          <div className="flex items-center mb-3">
            <Sliders className="h-5 w-5 text-white mr-2" />
            <h3 className="text-lg font-semibold text-white">Opções de Exibição Padrão</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600">
              <div className="flex items-center">
                <Music className="h-4 w-4 text-white mr-2" />
                <span className="text-white font-medium text-sm">Exibir nome da banda</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBandName}
                  onChange={(e) => setShowBandName(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600">
              <div className="flex items-center">
                <Disc className="h-4 w-4 text-white mr-2" />
                <span className="text-white font-medium text-sm">Exibir nome do álbum</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAlbumName}
                  onChange={(e) => setShowAlbumName(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600">
              <div className="flex items-center">
                <User className="h-4 w-4 text-white mr-2" />
                <span className="text-white font-medium text-sm">Exibir nome de usuário</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUsername}
                  onChange={(e) => setShowUsername(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600">
              <div className="flex items-center">
                <ImageOff className="h-4 w-4 text-white mr-2" />
                <span className="text-white font-medium text-sm">Ocultar álbuns sem capa</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideAlbumsWithoutCover}
                  onChange={(e) => setHideAlbumsWithoutCover(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Salvar Configurações
            </>
          )}
        </button>
      </form>
    </div>
  );
}

