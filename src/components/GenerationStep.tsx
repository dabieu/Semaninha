import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { AuthMethod, GridSize, TimePeriod } from '../App';
import { SpotifyService } from '../services/spotify';
import { LastFmService } from '../services/lastfm';
import { CollageGenerator } from '../services/collageGenerator';

interface GenerationStepProps {
  authMethod: AuthMethod;
  username: string;
  gridSize: GridSize;
  timePeriod: TimePeriod;
  showBandName: boolean;
  showAlbumName: boolean;
  showUsername: boolean;
  hideAlbumsWithoutCover: boolean;
  onGenerated: (albums: any[], collageUrl: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function GenerationStep({
  authMethod,
  username,
  gridSize,
  timePeriod,
  showBandName,
  showAlbumName,
  showUsername,
  hideAlbumsWithoutCover,
  onGenerated,
  onNext,
  onBack
}: GenerationStepProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Conectando...');
  const [error, setError] = useState<string | null>(null);

  const spotifyService = SpotifyService.getInstance();
  const lastfmService = LastFmService.getInstance();
  const collageGenerator = new CollageGenerator();

  useEffect(() => {
    generateRealCollage();
  }, [gridSize, timePeriod, authMethod, username, hideAlbumsWithoutCover, onGenerated, onNext]);

  // Focar no topo da tela quando o componente for montado
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Função auxiliar para verificar se uma imagem é válida
  const checkImageValid = async (imageUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000); // 5 segundos timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      
      img.src = imageUrl;
    });
  };

  const generateRealCollage = async () => {
    try {
      setError(null);
      setProgress(0);
      setCurrentStep('Conectando à API...');

      // Step 1: Connect to API (20%)
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(20);

      // Step 2: Fetch albums (40%)
      setCurrentStep('Buscando seus álbuns favoritos...');
      const gridCount = parseInt(gridSize.split('x')[0]);
      const totalAlbums = gridCount * gridCount;
      
      // Se devemos ocultar álbuns sem capa, buscar mais álbuns para ter margem de segurança
      const fetchLimit = hideAlbumsWithoutCover ? totalAlbums * 3 : totalAlbums;
      
      let albums;
      if (authMethod === 'spotify') {
        const timeRange = SpotifyService.convertTimePeriod(timePeriod);
        albums = await spotifyService.getTopAlbums(timeRange, fetchLimit);
      } else {
        albums = await lastfmService.getTopAlbums(username, timePeriod, fetchLimit);
      }

      setProgress(50);

      // Se devemos ocultar álbuns sem capa, filtrar apenas os que têm imagem válida
      if (hideAlbumsWithoutCover) {
        setCurrentStep('Verificando capas dos álbuns...');
        
        // Verificar álbuns em lotes para melhor performance
        const validatedAlbums = [];
        for (let i = 0; i < albums.length && validatedAlbums.length < totalAlbums; i++) {
          const album = albums[i];
          if (album.image && album.image !== '') {
            const isValid = await checkImageValid(album.image);
            if (isValid) {
              validatedAlbums.push(album);
            }
          }
        }
        
        // Se não tivermos álbuns suficientes com capa válida, usar todos os validados
        albums = validatedAlbums.slice(0, totalAlbums);
        
        console.log(`Álbuns com capa válida: ${albums.length} de ${totalAlbums} necessários`);
      } else {
        // Usar apenas a quantidade necessária
        albums = albums.slice(0, totalAlbums);
      }

      setProgress(60);

      // Step 3: Generate collage (80%)
      setCurrentStep('Gerando colagem...');
      const collageUrl = await collageGenerator.generateCollage(albums, gridSize, {
        canvasSize: 1200,
        showBandName,
        showAlbumName,
        showUsername,
        backgroundColor: '#1a1a1a',
        period: timePeriod,
        username: username
      });

      setProgress(90);

      // Step 4: Finalize (100%)
      setCurrentStep('Finalizando...');
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(100);

      onGenerated(albums, collageUrl);
      setTimeout(onNext, 500);

    } catch (error: any) {
      console.error('Error generating collage:', error);
      setError(error.message || 'Erro ao gerar colagem');
      setCurrentStep('Erro na geração');
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white mb-2">Gerando sua colagem</h2>
      <p className="text-white/70 mb-8">
        Buscando seus álbuns mais tocados {timePeriod === '7day' ? 'dos últimos 7 dias' :
        timePeriod === '1month' ? 'do último mês' :
        timePeriod === '3month' ? 'dos últimos 3 meses' : 'do último ano'}
      </p>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center max-w-md mx-auto">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
          <span className="text-red-200">{error}</span>
        </div>
      )}

      <div className="max-w-md mx-auto mb-8">
        {/* Progress Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-32 h-32 border-8 border-slate-600 rounded-full"></div>
            <div 
              className="absolute top-0 left-0 w-32 h-32 border-8 border-emerald-500 border-t-transparent rounded-full animate-spin"
              style={{
                animationDuration: '1s'
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{Math.round(progress)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-600 rounded-full h-3 mb-4 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Current Step */}
        <div className="flex items-center justify-center text-white mb-4">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span>{currentStep}</span>
        </div>

        {/* Retry Button on Error */}
        {error && (
          <button
            onClick={generateRealCollage}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Tentar Novamente
          </button>
        )}
      </div>

      {/* Configuration Summary */}
      <div className="bg-slate-700/50 rounded-xl p-4 mb-6 max-w-md mx-auto">
        <div className="text-white/70 text-sm space-y-1">
          <div>Usuário: <span className="text-white font-medium">{username}</span></div>
          <div>Tamanho: <span className="text-white font-medium">{gridSize}</span></div>
          <div>Período: <span className="text-white font-medium">
            {timePeriod === '7day' ? '7 dias' :
             timePeriod === '1month' ? '1 mês' :
             timePeriod === '3month' ? '3 meses' : '1 ano'}
          </span></div>
        </div>
      </div>

      {!error && (
        <button
          onClick={onBack}
          className="bg-slate-600 text-white hover:bg-slate-500 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center mx-auto"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar
        </button>
      )}
    </div>
  );
}