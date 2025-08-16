import React, { useRef, useState, useEffect } from 'react';
import { Download, Copy, Instagram, MessageCircle, RefreshCw, ArrowLeft, Check, X, Crown, Lock, Music, Eraser } from 'lucide-react';
import { GridSize, TimePeriod } from '../App';
import { CollageGenerator } from '../services/collageGenerator';
import { Tooltip } from './Tooltip';
import { useMobile } from '../hooks/useMobile';

interface ResultStepProps {
  collageUrl: string;
  albums: any[];
  gridSize: GridSize;
  timePeriod: TimePeriod;
  onReset: () => void;
  onBack: () => void;
}

export function ResultStep({
  collageUrl,
  albums,
  gridSize,
  timePeriod,
  onReset,
  onBack
}: ResultStepProps) {
  const [copied, setCopied] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const collageGenerator = new CollageGenerator();
  const isMobile = useMobile();

  // Focar no topo da tela quando o componente for montado
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDownload = () => {
    setDownloading(true);
    
    // Create download link from the collage URL
    const a = document.createElement('a');
    a.href = collageUrl;
    a.download = `semaninha-colagem-${gridSize}-${timePeriod}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setDownloading(false);
  };

  const handleCopyToClipboard = async () => {
    console.log('Iniciando cópia, dispositivo móvel:', isMobile);
    
    try {
      if (isMobile) {
        // Para dispositivos móveis, usar uma abordagem diferente
        console.log('Usando método mobile para cópia');
        await handleMobileCopy();
      } else {
        // Para desktop, usar a API Clipboard padrão
        console.log('Usando método desktop para cópia');
        await handleDesktopCopy();
      }
    } catch (err) {
      console.error('Erro ao copiar imagem:', err);
      // Fallback: tentar copiar a URL
      try {
        await navigator.clipboard.writeText(collageUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Erro ao copiar URL:', fallbackErr);
      }
    }
  };

  const handleDesktopCopy = async () => {
    // Convert data URL to blob
    const response = await fetch(collageUrl);
    const blob = await response.blob();
    
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMobileCopy = async () => {
    try {
      // Para dispositivos móveis, tentar usar a API Clipboard se disponível
      if (navigator.clipboard && navigator.clipboard.write) {
        try {
          const response = await fetch(collageUrl);
          const blob = await response.blob();
          
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return;
        } catch (clipboardErr) {
          console.log('Erro na API Clipboard, tentando alternativa...', clipboardErr);
        }
      }
    } catch (err) {
      console.log('API Clipboard não disponível no mobile, tentando alternativa...');
    }

    // Fallback para dispositivos móveis: usar canvas para gerar blob
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Adicionar timeout para evitar travamentos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao carregar imagem')), 10000);
      });
      
      const imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      });
      
      // Race entre timeout e carregamento da imagem
      await Promise.race([imageLoadPromise, timeoutPromise]);
      
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Não foi possível criar contexto do canvas');
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Tentar copiar usando o canvas
        canvas.toBlob(async (blob) => {
          if (blob && navigator.clipboard && navigator.clipboard.write) {
            try {
              const item = new ClipboardItem({ 'image/png': blob });
              await navigator.clipboard.write([item]);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
              return;
            } catch (writeErr) {
              console.log('Erro ao escrever no clipboard:', writeErr);
              // Fallback: copiar a URL
              await fallbackCopyUrl();
            }
          } else {
            // Fallback: copiar a URL
            await fallbackCopyUrl();
          }
        }, 'image/png');
      } catch (canvasErr) {
        console.log('Erro no canvas:', canvasErr);
        // Fallback: copiar a URL
        await fallbackCopyUrl();
      }
      
      img.src = collageUrl;
    } catch (mobileErr) {
      console.error('Erro na cópia mobile:', mobileErr);
      // Fallback final: copiar a URL
      await fallbackCopyUrl();
    }
  };

  const fallbackCopyUrl = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(collageUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback para navegadores muito antigos
        const textArea = document.createElement('textarea');
        textArea.value = collageUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (finalErr) {
      console.error('Erro final ao copiar:', finalErr);
      // Mostrar mensagem de erro para o usuário
      alert('Não foi possível copiar a imagem. Tente fazer o download.');
    }
  };

  const handleShare = (platform: string) => {
    const text = `Minha colagem musical do Semaninha! 🎵 #semaninha #música`;
    const url = window.location.href;
    
    switch (platform) {
      case 'instagram':
        // Instagram doesn't support direct URL sharing, just copy image
        handleCopyToClipboard();
        break;
      case 'x':
        window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
    }
  };

  const openModal = () => {
    console.log('openModal chamada, estado atual:', isModalOpen);
    setIsModalOpen(true);
    console.log('Modal aberto, novo estado:', true);
  };
  const closeModal = () => setIsModalOpen(false);

  // Close modal on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen]);

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white mb-2">Sua colagem está pronta! 🎉</h2>
      <p className="text-white/70 mb-8">
        Seus álbuns mais tocados em uma linda colagem {gridSize}
      </p>

      {/* Collage Display */}
      <div className="flex justify-center mb-8 px-4">
        <div className="bg-slate-700/50 p-4 sm:p-6 rounded-xl backdrop-blur-sm w-full max-w-md">
          <div 
            className="relative group cursor-pointer" 
            onClick={() => {
              console.log('Clique na imagem detectado');
              openModal();
            }}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={collageUrl}
              alt="Sua colagem musical"
              className="rounded-lg shadow-lg w-full h-auto hover:scale-105 transition-transform duration-200"
              style={{ maxWidth: 'min(450px, 90vw)', maxHeight: 'min(450px, 90vw)' }}
              onClick={() => {
                console.log('Clique direto na imagem');
                openModal();
              }}
            />
            {/* Click indicator */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg flex items-center justify-center pointer-events-none">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 text-black px-3 py-1 rounded-full text-sm font-medium">
                Clique para ampliar
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 max-w-2xl mx-auto">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-600/50 text-white p-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center h-12"
        >
          {downloading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              <Download className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Download</span>
            </>
          )}
        </button>

        <button
          onClick={handleCopyToClipboard}
          className={`${copied ? 'bg-emerald-500' : 'bg-slate-600 hover:bg-slate-500'} text-white p-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center h-12`}
        >
          {copied ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Copiar</span>
            </>
          )}
        </button>

        <button
          onClick={() => handleShare('instagram')}
          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white p-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center h-12"
        >
          <Instagram className="h-5 w-5 mr-2" />
          <span className="hidden sm:inline">Instagram</span>
        </button>

        <button
          onClick={() => handleShare('x')}
          className="bg-black hover:bg-gray-900 text-white p-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center h-12"
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <span className="hidden sm:inline">X</span>
        </button>
      </div>

      {/* WhatsApp Share and Premium Features */}
      <div className="flex flex-col md:flex-row gap-3 mb-8 max-w-2xl mx-auto">
        <button
          onClick={() => handleShare('whatsapp')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center h-12 flex-1"
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          <span className="text-xs sm:text-sm">WhatsApp</span>
        </button>
        
        <Tooltip content="Gera uma playlist no spotify baseada na sua colagem, inclua recomendações de bandas novas, e muito mais" position="top">
          <button
            disabled
            className="bg-slate-600/50 border border-slate-500 cursor-not-allowed opacity-60 text-white p-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center h-12 flex-1"
          >
            <div className="flex items-center">
              <Crown className="h-4 w-4 text-yellow-400 mr-2" />
              <Music className="h-5 w-5 mr-2" />
              <span className="text-xs sm:text-sm">Gerar playlist</span>
            </div>
          </button>
        </Tooltip>

        <Tooltip content="Remove nosso nome da sua colagem 💔, a gente entende" position="top">
          <button
            disabled
            className="bg-slate-600/50 border border-slate-500 cursor-not-allowed opacity-60 text-white p-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center h-12 flex-1"
          >
            <div className="flex items-center">
              <Crown className="h-4 w-4 text-yellow-400 mr-2" />
              <Eraser className="h-5 w-5 mr-2" />
              <span className="text-xs sm:text-sm">Remover marca d'água</span>
            </div>
          </button>
        </Tooltip>
      </div>

      {/* Album List Preview */}
      <div className="bg-slate-700/50 rounded-xl p-4 mb-8 backdrop-blur-sm max-w-lg mx-auto">
        <h3 className="text-white font-semibold mb-3">Seus top álbuns:</h3>
        <div className="text-left text-white/80 text-sm space-y-2 max-h-40 overflow-y-auto">
          {albums.slice(0, 10).map((album, index) => (
            <div key={album.id} className="flex items-center justify-between py-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <span className="text-white/60 font-medium mr-2">{index + 1}.</span>
                  <div className="truncate">
                    <div className="text-white font-medium truncate">{album.artist}</div>
                    <div className="text-white/70 text-xs truncate">{album.name}</div>
                  </div>
                </div>
              </div>
              {album.playCount && (
                <div className="text-white/50 text-xs ml-4 mr-2 flex-shrink-0">
                  {album.playCount} plays
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Button */}
      <div className="flex justify-center">
        <button
          onClick={onReset}
          className="bg-emerald-500 text-white hover:bg-emerald-600 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Nova Colagem
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-slate-800 rounded-xl p-6 max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Sua Colagem</h3>
              <button
                onClick={closeModal}
                className="text-white/70 hover:text-white transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Image */}
            <div className="flex justify-center mb-6">
              <img
                src={collageUrl}
                alt="Sua colagem musical"
                className="rounded-lg shadow-lg max-w-full h-auto"
                style={{ maxHeight: '75vh', maxWidth: '100%' }}
              />
            </div>

            {/* Modal Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 max-w-2xl mx-auto">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-600/50 text-white p-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center h-12"
              >
                {downloading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">Download</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopyToClipboard}
                className={`${copied ? 'bg-emerald-500' : 'bg-slate-600 hover:bg-slate-500'} text-white p-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center h-12`}
              >
                {copied ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">Copiar</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleShare('instagram')}
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white p-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center h-12"
              >
                <Instagram className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Instagram</span>
              </button>

              <button
                onClick={() => handleShare('x')}
                className="bg-black hover:bg-gray-900 text-white p-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center h-12"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="hidden sm:inline">X</span>
              </button>
            </div>

            {/* Modal WhatsApp Share and Premium Features */}
            <div className="flex flex-col md:flex-row gap-3 max-w-2xl mx-auto">
              <button
                onClick={() => handleShare('whatsapp')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center h-12 flex-1"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                <span className="text-xs sm:text-sm">WhatsApp</span>
              </button>
              
              <Tooltip content="Gera uma playlist no spotify baseada na sua colagem, inclua recomendações de bandas novas, e muito mais" position="top">
                <button
                  disabled
                  className="bg-slate-600/50 border border-slate-500 cursor-not-allowed opacity-60 text-white p-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center h-12 flex-1"
                >
                  <div className="flex items-center">
                    <Crown className="h-4 w-4 text-yellow-400 mr-2" />
                    <Music className="h-5 w-5 mr-2" />
                    <span className="text-xs sm:text-sm">Gerar playlist</span>
                  </div>
                </button>
              </Tooltip>

              <Tooltip content="Remove nosso nome da sua colagem 💔, a gente entende" position="top">
                <button
                  disabled
                  className="bg-slate-600/50 border border-slate-500 cursor-not-allowed opacity-60 text-white p-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center h-12 flex-1"
                >
                  <div className="flex items-center">
                    <Crown className="h-4 w-4 text-yellow-400 mr-2" />
                    <Eraser className="h-5 w-5 mr-2" />
                    <span className="text-xs sm:text-sm">Remover marca d'água</span>
                  </div>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}