// Audio notification service for new orders
export class AudioService {
  private audioContext: AudioContext | null = null;
  private notificationBuffer: AudioBuffer | null = null;
  private isEnabled: boolean = true;

  constructor() {
    this.initAudioContext();
    this.loadNotificationSettings();
  }

  private async initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.createNotificationSound();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  private async createNotificationSound() {
    if (!this.audioContext) return;

    try {
      // Load sound.mp3 from public folder
      const response = await fetch('/sound.mp3');
      const arrayBuffer = await response.arrayBuffer();
      
      // Decode audio file
      this.notificationBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      console.log('🔔 Notification sound loaded successfully');
    } catch (error) {
      console.error('Error loading notification sound:', error);
    }
  }

  public async playNotification(): Promise<void> {
    if (!this.isEnabled || !this.audioContext || !this.notificationBuffer) {
      return;
    }

    try {
      // Resume audio context if suspended (required for Chrome)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = this.notificationBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.warn('Failed to play notification:', error);
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.saveNotificationSettings();
  }

  public isNotificationEnabled(): boolean {
    return this.isEnabled;
  }

  private loadNotificationSettings(): void {
    const stored = localStorage.getItem('restaurant-notifications-enabled');
    this.isEnabled = stored !== null ? JSON.parse(stored) : true;
  }

  private saveNotificationSettings(): void {
    localStorage.setItem('restaurant-notifications-enabled', JSON.stringify(this.isEnabled));
  }

  // Test notification (for settings)
  public async testNotification(): Promise<void> {
    const wasEnabled = this.isEnabled;
    this.isEnabled = true;
    await this.playNotification();
    this.isEnabled = wasEnabled;
  }
}

// Singleton instance
export const audioService = new AudioService();
