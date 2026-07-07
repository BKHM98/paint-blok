// Sound Manager for Paint Blok using expo-audio
// Optimized for rapid sound playback during painting

export type SoundType = 'tap' | 'success' | 'error' | 'click' | 'levelComplete';

// Sound file imports
const soundFiles = {
  tap: require('../../assets/sounds/tap.mp3'),
  success: require('../../assets/sounds/success.mp3'),
  error: require('../../assets/sounds/error.mp3'),
  click: require('../../assets/sounds/click.mp3'),
  levelComplete: require('../../assets/sounds/success.mp3'),
};

const backgroundMusicFile = require('../../assets/sounds/background-music.mp3');

class SoundManager {
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = false;
  private backgroundMusic: any = null;
  private initialized: boolean = false;
  private createAudioPlayer: any = null;

  // Pool of tap players for rapid playback
  private tapPlayers: any[] = [];
  private tapPlayerIndex: number = 0;
  private readonly TAP_POOL_SIZE = 5;

  // Cached players for other sounds
  private cachedPlayers: Map<SoundType, any> = new Map();

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const audioModule = await import('expo-audio');
      this.createAudioPlayer = audioModule.createAudioPlayer;

      // Pre-create tap sound pool for rapid painting
      for (let i = 0; i < this.TAP_POOL_SIZE; i++) {
        try {
          const player = this.createAudioPlayer(soundFiles.tap);
          this.tapPlayers.push(player);
        } catch (e) {
          console.warn('Failed to create tap player:', e);
        }
      }

      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize sounds:', error);
    }
  }

  async playSound(type: SoundType): Promise<void> {
    if (!this.soundEnabled) return;

    try {
      if (!this.createAudioPlayer) {
        const audioModule = await import('expo-audio');
        this.createAudioPlayer = audioModule.createAudioPlayer;
      }

      const player = this.createAudioPlayer(soundFiles[type]);
      await player.play();
    } catch (error) {
      console.warn(`Failed to play sound ${type}:`, error);
    }
  }

  playTap(): void {
    if (!this.soundEnabled) return;

    // Use pooled tap players for rapid playback
    if (this.tapPlayers.length > 0) {
      const player = this.tapPlayers[this.tapPlayerIndex];
      this.tapPlayerIndex = (this.tapPlayerIndex + 1) % this.tapPlayers.length;

      try {
        // Seek to start and play (non-blocking)
        player.seekTo(0);
        player.play();
      } catch (e) {
        // Silently fail for performance
      }
    } else {
      // Fallback if pool not ready
      this.playSound('tap');
    }
  }

  async playSuccess(): Promise<void> {
    await this.playSound('success');
  }

  async playError(): Promise<void> {
    await this.playSound('error');
  }

  async playClick(): Promise<void> {
    await this.playSound('click');
  }

  async playLevelComplete(): Promise<void> {
    await this.playSound('levelComplete');
  }

  async playBackgroundMusic(): Promise<void> {
    if (!this.musicEnabled) return;

    try {
      if (!this.createAudioPlayer) {
        const audioModule = await import('expo-audio');
        this.createAudioPlayer = audioModule.createAudioPlayer;
      }

      this.backgroundMusic = this.createAudioPlayer(backgroundMusicFile);
      this.backgroundMusic.loop = true;
      await this.backgroundMusic.play();
    } catch (error) {
      console.warn('Failed to play background music:', error);
    }
  }

  async stopBackgroundMusic(): Promise<void> {
    if (this.backgroundMusic) {
      try {
        this.backgroundMusic.remove();
      } catch (e) {
        // Ignore
      }
      this.backgroundMusic = null;
    }
  }

  async pauseBackgroundMusic(): Promise<void> {
    if (this.backgroundMusic) {
      try {
        this.backgroundMusic.pause();
      } catch (e) {
        // Ignore
      }
    }
  }

  async resumeBackgroundMusic(): Promise<void> {
    if (this.backgroundMusic && this.musicEnabled) {
      try {
        await this.backgroundMusic.play();
      } catch (e) {
        // Ignore
      }
    }
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    }
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  async cleanup(): Promise<void> {
    await this.stopBackgroundMusic();

    // Clean up tap player pool
    for (const player of this.tapPlayers) {
      try {
        player.remove();
      } catch (e) {
        // Ignore
      }
    }
    this.tapPlayers = [];
    this.cachedPlayers.clear();
  }
}

export const soundManager = new SoundManager();
