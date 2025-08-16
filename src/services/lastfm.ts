import axios from 'axios';
import CryptoJS from 'crypto-js';

const API_KEY = import.meta.env.VITE_LASTFM_API_KEY || 'demo_key';
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

export interface LastFmAlbum {
  id: string;
  name: string;
  artist: string;
  image: string;
  playCount: number;
}

export class LastFmService {
  private static instance: LastFmService;

  static getInstance(): LastFmService {
    if (!LastFmService.instance) {
      LastFmService.instance = new LastFmService();
    }
    return LastFmService.instance;
  }

  // Verify if username exists
  async verifyUser(username: string): Promise<boolean> {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          method: 'user.getinfo',
          user: username,
          api_key: API_KEY,
          format: 'json'
        }
      });

      return !!response.data.user;
    } catch (error: any) {
      if (error.response?.data?.error === 6) {
        return false; // User not found
      }
      throw new Error('Failed to verify Last.fm user');
    }
  }

  // Get user's top albums
  async getTopAlbums(username: string, period: string, limit: number): Promise<LastFmAlbum[]> {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          method: 'user.gettopalbums',
          user: username,
          period: this.convertTimePeriod(period),
          limit: limit,
          api_key: API_KEY,
          format: 'json'
        }
      });

      if (response.data.error) {
        throw new Error(response.data.message || 'Last.fm API error');
      }

      const albums = response.data.topalbums?.album || [];
      
      return albums.map((album: any, index: number) => ({
        id: `${album.artist.name}-${album.name}`.replace(/[^a-zA-Z0-9]/g, '-'),
        name: album.name,
        artist: album.artist.name,
        image: this.getBestImage(album.image),
        playCount: parseInt(album.playcount) || 0
      }));
    } catch (error: any) {
      console.error('Error fetching Last.fm albums:', error);
      if (error.response?.data?.error === 6) {
        throw new Error('Usuário não encontrado no Last.fm');
      }
      throw new Error('Erro ao buscar álbuns do Last.fm');
    }
  }

  // Get best quality image from Last.fm image array
  private getBestImage(images: any[]): string {
    if (!images || !Array.isArray(images)) {
      return 'https://images.pexels.com/photos/164742/pexels-photo-164742.jpeg?auto=compress&cs=tinysrgb&w=300';
    }

    // Last.fm image sizes: small, medium, large, extralarge, mega
    const sizePreference = ['extralarge', 'large', 'medium', 'small'];
    
    for (const size of sizePreference) {
      const image = images.find(img => img.size === size);
      if (image && image['#text']) {
        return image['#text'];
      }
    }

    // Fallback to any available image
    const anyImage = images.find(img => img['#text']);
    if (anyImage) {
      return anyImage['#text'];
    }

    // Final fallback to placeholder
    return 'https://images.pexels.com/photos/164742/pexels-photo-164742.jpeg?auto=compress&cs=tinysrgb&w=300';
  }

  // Convert app time period to Last.fm format
  private convertTimePeriod(period: string): string {
    switch (period) {
      case '7day':
        return '7day';
      case '1month':
        return '1month';
      case '3month':
        return '3month';
      case '12month':
        return '12month';
      default:
        return '1month';
    }
  }
}