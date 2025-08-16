export interface Album {
  id: string;
  name: string;
  artist: string;
  image: string;
  playCount?: number;
}

export class CollageGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async generateCollage(
    albums: Album[],
    gridSize: string,
    options: {
      canvasSize?: number;
      showBandName?: boolean;
      showAlbumName?: boolean;
      backgroundColor?: string;
      period?: string;
      username?: string;
    } = {}
  ): Promise<string> {
    const {
      canvasSize = 1200,
      showBandName = false,
      showAlbumName = false,
      backgroundColor = '#1a1a1a',
      period = '7day',
      username = 'Usuário'
    } = options;

    const gridCount = parseInt(gridSize.split('x')[0]);
    const imageSize = canvasSize / gridCount;
    
    // Adicionar padding para as bordas brancas (efeito Polaroid)
    const padding = Math.max(20, canvasSize * 0.025); // Reduzido de 5% para 2.5% e mínimo de 40px para 20px
    const bottomPadding = Math.max(5, canvasSize * 0.006); // Borda inferior bem menor (1/4 da lateral)
    const totalWidth = canvasSize + (padding * 2);
    const totalHeight = canvasSize + padding + bottomPadding + 50; // Borda inferior bem menor + espaço para marca d'água
    
    this.canvas.width = totalWidth;
    this.canvas.height = totalHeight;

    // Preencher o fundo com a cor das bordas
    this.ctx.fillStyle = '#fffde8'; // Cor das bordas alterada para amarelo claro/creme
    this.ctx.fillRect(0, 0, totalWidth, totalHeight);

    // Criar canvas interno para a colagem
    const innerCanvas = document.createElement('canvas');
    const innerCtx = innerCanvas.getContext('2d')!;
    innerCanvas.width = canvasSize;
    innerCanvas.height = canvasSize;

    // Preencher fundo da colagem
    innerCtx.fillStyle = backgroundColor;
    innerCtx.fillRect(0, 0, canvasSize, canvasSize);

    // Load and draw images
    const promises = albums.slice(0, gridCount * gridCount).map(async (album, index) => {
      const row = Math.floor(index / gridCount);
      const col = index % gridCount;
      const x = col * imageSize;
      const y = row * imageSize;

      try {
        const img = await this.loadImage(album.image);
        innerCtx.drawImage(img, x, y, imageSize, imageSize);

        // Add subtle border
        innerCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        innerCtx.lineWidth = 1;
        innerCtx.strokeRect(x, y, imageSize, imageSize);

        // Add labels if requested
        if ((showBandName || showAlbumName) && imageSize > 100) {
          this.addLabels(album, x, y, imageSize, showBandName, showAlbumName, innerCtx);
        }
      } catch (error) {
        console.warn(`Failed to load image for ${album.name}:`, error);
        // Draw placeholder
        this.drawPlaceholder(x, y, imageSize, album, innerCtx);
      }
    });

    await Promise.all(promises);

    // Desenhar a colagem no canvas principal com padding
    this.ctx.drawImage(innerCanvas, padding, padding);

    // Adicionar marca d'água dinâmica baseada no período
    this.ctx.fillStyle = '#000000'; // text-gray-600
    
    // Debug: verificar se a fonte está disponível
    console.log('Fontes disponíveis:', document.fonts);
    console.log('Tentando usar fonte: Bryndan Write');
    
    // Tentar usar a fonte personalizada, com fallback
    try {
      this.ctx.font = 'bold 22px "Bryndan Write"'; // Reduzido de 25px para 22px para textos mais longos
      console.log('Fonte personalizada aplicada:', this.ctx.font);
    } catch (error) {
      console.warn('Erro ao aplicar fonte personalizada, usando fallback:', error);
      this.ctx.font = 'bold 22px cursive'; // Fallback para fonte cursiva
    }
    
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Gerar marca d'água baseada no período
    const watermarkText = this.generateWatermarkText(period, username);
    console.log('Marca d\'água gerada:', watermarkText);
    
    // Ajustar posicionamento para textos mais longos
    const watermarkY = padding + canvasSize + bottomPadding + 25; // Aumentado de 20 para 25
    this.ctx.fillText(watermarkText, totalWidth / 2, watermarkY);

    return this.canvas.toDataURL('image/png', 0.9);
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      
      // Add timeout
      setTimeout(() => reject(new Error('Image load timeout')), 10000);
      
      img.src = src;
    });
  }

  private drawPlaceholder(x: number, y: number, size: number, album: Album, ctx: CanvasRenderingContext2D): void {
    // Draw colored background
    const colors = ['#8B5CF6', '#EC4899', '#F97316', '#10B981', '#3B82F6', '#EF4444'];
    const colorIndex = album.name.charCodeAt(0) % colors.length;
    
    ctx.fillStyle = colors[colorIndex];
    ctx.fillRect(x, y, size, size);

    // Add text
    ctx.fillStyle = 'white';
    ctx.font = `${Math.max(12, size / 15)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Album name
    const albumName = album.name.length > 15 ? album.name.substring(0, 15) + '...' : album.name;
    ctx.fillText(albumName, x + size / 2, y + size / 2 - 10);

    // Artist name
    ctx.font = `${Math.max(10, size / 20)}px Arial, sans-serif`;
    const artistName = album.artist.length > 20 ? album.artist.substring(0, 20) + '...' : album.artist;
    ctx.fillText(artistName, x + size / 2, y + size / 2 + 10);
  }

  private addLabels(album: Album, x: number, y: number, size: number, showBandName: boolean, showAlbumName: boolean, ctx: CanvasRenderingContext2D): void {
    const padding = size * 0.02;
    const fontSize = Math.max(8, size / 25);
    const lineHeight = fontSize * 1.1;
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    let currentY = y + padding;
    
    // Add band name
    if (showBandName) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      
      const bandName = album.artist.length > 15 ? album.artist.substring(0, 15) + '...' : album.artist;
      const bandMetrics = ctx.measureText(bandName);
      
      // Background for band name
      ctx.fillRect(x + padding - 1, currentY - 1, bandMetrics.width + 2, fontSize + 2);
      
      // Band name text
      ctx.fillStyle = 'white';
      ctx.fillText(bandName, x + padding, currentY);
      
      currentY += lineHeight + 1;
    }
    
    // Add album name
    if (showAlbumName) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.font = `${fontSize}px Arial, sans-serif`;
      
      const albumName = album.name.length > 20 ? album.name.substring(0, 20) + '...' : album.name;
      const albumMetrics = ctx.measureText(albumName);
      
      // Background for album name
      ctx.fillRect(x + padding - 1, currentY - 1, albumMetrics.width + 2, fontSize + 2);
      
      // Album name text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillText(albumName, x + padding, currentY);
    }
  }

  // Convert canvas to blob for download
  toBlob(type: string = 'image/png', quality?: number): Promise<Blob | null> {
    return new Promise(resolve => {
      this.canvas.toBlob(resolve, type, quality);
    });
  }

  // Get canvas element for direct manipulation
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  private generateWatermarkText(period: string, username: string): string {
    let watermarkText = '';
    
    // Gerar texto baseado no período
    switch (period) {
      case '7day':
        watermarkText = `Semaninha de ${username} | Feito em: semaninha.app 🩷`;
        break;
      case '1month':
        watermarkText = `Mês de ${username} | Feito em: semaninha.app 🩷`;
        break;
      case '3month':
        watermarkText = `Últimos 3 meses de ${username} | Feito em: semaninha.app 🩷`;
        break;
      case '12month':
        watermarkText = `Último ano de ${username} | Feito em: semaninha.app 🩷`;
        break;
      default:
        watermarkText = `Colagem de ${username} | Feito em: semaninha.app 🩷`;
    }
    
    return watermarkText;
  }
}