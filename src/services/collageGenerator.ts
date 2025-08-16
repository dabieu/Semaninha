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
    } = {}
  ): Promise<string> {
    const {
      canvasSize = 1200,
      showBandName = false,
      showAlbumName = false,
      backgroundColor = '#1a1a1a'
    } = options;

    const gridCount = parseInt(gridSize.split('x')[0]);
    const imageSize = canvasSize / gridCount;
    
    this.canvas.width = canvasSize;
    this.canvas.height = canvasSize;

    // Fill background
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Load and draw images
    const promises = albums.slice(0, gridCount * gridCount).map(async (album, index) => {
      const row = Math.floor(index / gridCount);
      const col = index % gridCount;
      const x = col * imageSize;
      const y = row * imageSize;

      try {
        const img = await this.loadImage(album.image);
        this.ctx.drawImage(img, x, y, imageSize, imageSize);

        // Add subtle border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, imageSize, imageSize);

        // Add labels if requested
        if ((showBandName || showAlbumName) && imageSize > 100) {
          this.addLabels(album, x, y, imageSize, showBandName, showAlbumName);
        }
      } catch (error) {
        console.warn(`Failed to load image for ${album.name}:`, error);
        // Draw placeholder
        this.drawPlaceholder(x, y, imageSize, album);
      }
    });

    await Promise.all(promises);

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

  private drawPlaceholder(x: number, y: number, size: number, album: Album): void {
    // Draw colored background
    const colors = ['#8B5CF6', '#EC4899', '#F97316', '#10B981', '#3B82F6', '#EF4444'];
    const colorIndex = album.name.charCodeAt(0) % colors.length;
    
    this.ctx.fillStyle = colors[colorIndex];
    this.ctx.fillRect(x, y, size, size);

    // Add text
    this.ctx.fillStyle = 'white';
    this.ctx.font = `${Math.max(12, size / 15)}px Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Album name
    const albumName = album.name.length > 15 ? album.name.substring(0, 15) + '...' : album.name;
    this.ctx.fillText(albumName, x + size / 2, y + size / 2 - 10);

    // Artist name
    this.ctx.font = `${Math.max(10, size / 20)}px Arial, sans-serif`;
    const artistName = album.artist.length > 20 ? album.artist.substring(0, 20) + '...' : album.artist;
    this.ctx.fillText(artistName, x + size / 2, y + size / 2 + 10);
  }

  private addLabels(album: Album, x: number, y: number, size: number, showBandName: boolean, showAlbumName: boolean): void {
    const padding = size * 0.02;
    const fontSize = Math.max(8, size / 25);
    const lineHeight = fontSize * 1.1;
    
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    let currentY = y + padding;
    
    // Add band name
    if (showBandName) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      this.ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      
      const bandName = album.artist.length > 15 ? album.artist.substring(0, 15) + '...' : album.artist;
      const bandMetrics = this.ctx.measureText(bandName);
      
      // Background for band name
      this.ctx.fillRect(x + padding - 1, currentY - 1, bandMetrics.width + 2, fontSize + 2);
      
      // Band name text
      this.ctx.fillStyle = 'white';
      this.ctx.fillText(bandName, x + padding, currentY);
      
      currentY += lineHeight + 1;
    }
    
    // Add album name
    if (showAlbumName) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      this.ctx.font = `${fontSize}px Arial, sans-serif`;
      
      const albumName = album.name.length > 20 ? album.name.substring(0, 20) + '...' : album.name;
      const albumMetrics = this.ctx.measureText(albumName);
      
      // Background for album name
      this.ctx.fillRect(x + padding - 1, currentY - 1, albumMetrics.width + 2, fontSize + 2);
      
      // Album name text
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      this.ctx.fillText(albumName, x + padding, currentY);
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
}