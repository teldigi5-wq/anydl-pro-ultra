/**
 * Realistic Download Engine with Proper Speed Management
 * Fixes hyper/insane mode errors with intelligent throttling
 */

export interface DownloadSession {
  id: string;
  url: string;
  totalSize: number;
  downloadedSize: number;
  startTime: number;
  fragments: DownloadFragment[];
  currentSpeed: number; // MB/s
  status: 'initializing' | 'downloading' | 'paused' | 'completed' | 'error';
}

export interface DownloadFragment {
  id: string;
  url: string;
  startByte: number;
  endByte: number;
  downloaded: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  retries: number;
}

interface SpeedProfile {
  name: string;
  maxConcurrentFragments: number;
  bufferSize: number;
  chunkSize: number; // bytes per chunk
  targetSpeed: number; // MB/s
  maxRetries: number;
  description: string;
}

class RealisticDownloadEngine {
  private activeSessions: Map<string, DownloadSession> = new Map();

  // Realistic speed profiles based on actual network behavior
  private speedProfiles: Record<string, SpeedProfile> = {
    'Dial-up': {
      name: 'Dial-up',
      maxConcurrentFragments: 1,
      bufferSize: 64,
      chunkSize: 4096,
      targetSpeed: 0.056, // 56K modem
      maxRetries: 8,
      description: 'Slowest, most reliable'
    },
    'Economy': {
      name: 'Economy',
      maxConcurrentFragments: 2,
      bufferSize: 256,
      chunkSize: 16384,
      targetSpeed: 0.5, // 4 Mbps
      maxRetries: 5,
      description: 'Mobile-friendly, reliable'
    },
    'Standard': {
      name: 'Standard',
      maxConcurrentFragments: 4,
      bufferSize: 512,
      chunkSize: 65536,
      targetSpeed: 5, // 40 Mbps
      maxRetries: 5,
      description: 'Balanced speed & stability'
    },
    'Turbo': {
      name: 'Turbo',
      maxConcurrentFragments: 8,
      bufferSize: 1024,
      chunkSize: 262144,
      targetSpeed: 25, // 200 Mbps
      maxRetries: 5,
      description: 'Fast, still stable'
    },
    'Hyper': {
      name: 'Hyper',
      maxConcurrentFragments: 12,
      bufferSize: 2048,
      chunkSize: 524288,
      targetSpeed: 50, // 400 Mbps
      maxRetries: 7,
      description: 'Very fast, requires good connection'
    },
    'Insane': {
      name: 'Insane',
      maxConcurrentFragments: 16,
      bufferSize: 4096,
      chunkSize: 1048576,
      targetSpeed: 100, // 800 Mbps
      maxRetries: 10,
      description: 'Max speed, excellent connection required'
    },
    'Ludicrous': {
      name: 'Ludicrous',
      maxConcurrentFragments: 20,
      bufferSize: 8192,
      chunkSize: 2097152,
      targetSpeed: 200, // Gigabit
      maxRetries: 12,
      description: 'Ultra mode, requires fiber/dedicated'
    }
  };

  /**
   * Create intelligent download session with adaptive speed
   */
  async createDownloadSession(
    url: string,
    totalSize: number,
    selectedProfile: string,
    detectedSpeed: number // User's actual measured speed in MB/s
  ): Promise<DownloadSession> {
    const profile = this.speedProfiles[selectedProfile] || this.speedProfiles['Standard'];

    // Validate user's actual speed against profile requirements
    const maxSafeFragments = this.calculateSafeFragments(detectedSpeed);
    const safeFragments = Math.min(
      profile.maxConcurrentFragments,
      maxSafeFragments
    );

    console.log(`[Download Engine] User speed: ${detectedSpeed} MB/s | Profile: ${selectedProfile}`);
    console.log(`[Download Engine] Max fragments: ${profile.maxConcurrentFragments} | Safe: ${safeFragments}`);

    // Create fragments for download
    const fragments = this.createFragments(url, totalSize, safeFragments);

    const session: DownloadSession = {
      id: `download-${Date.now()}`,
      url,
      totalSize,
      downloadedSize: 0,
      startTime: Date.now(),
      fragments,
      currentSpeed: 0,
      status: 'initializing'
    };

    this.activeSessions.set(session.id, session);

    return session;
  }

  /**
   * Calculate safe number of fragments based on actual connection speed
   * Prevents connection resets from too many simultaneous connections
   */
  private calculateSafeFragments(userSpeedMbps: number): number {
    // Formula: Max fragments = sqrt(speed in Mbps) / 2
    // This ensures we don't overwhelm the connection

    if (userSpeedMbps <= 1) return 1;      // 56K/ISDN
    if (userSpeedMbps <= 4) return 2;      // 4G LTE
    if (userSpeedMbps <= 10) return 3;     // DSL
    if (userSpeedMbps <= 25) return 4;     // Cable
    if (userSpeedMbps <= 50) return 6;     // Good cable
    if (userSpeedMbps <= 100) return 8;    // Fast broadband
    if (userSpeedMbps <= 250) return 12;   // Very fast
    if (userSpeedMbps <= 500) return 16;   // Fiber
    return 20;                             // Gigabit+
  }

  /**
   * Create fragment list for parallel download
   */
  private createFragments(url: string, totalSize: number, fragmentCount: number): DownloadFragment[] {
    const fragments: DownloadFragment[] = [];
    const fragmentSize = Math.ceil(totalSize / fragmentCount);

    for (let i = 0; i < fragmentCount; i++) {
      const startByte = i * fragmentSize;
      const endByte = Math.min((i + 1) * fragmentSize, totalSize) - 1;

      fragments.push({
        id: `fragment-${i}`,
        url: url + `&range=${startByte}-${endByte}`,
        startByte,
        endByte,
        downloaded: 0,
        status: 'pending',
        retries: 0
      });
    }

    return fragments;
  }

  /**
   * Simulate realistic download with adaptive speed
   */
  async downloadFragment(
    session: DownloadSession,
    fragment: DownloadFragment,
    profile: SpeedProfile
  ): Promise<{ success: boolean; downloaded: number; speed: number }> {
    const fragmentSize = fragment.endByte - fragment.startByte + 1;
    
    // Simulate realistic download with network fluctuations
    const simulatedSpeed = this.simulateNetworkSpeed(profile.targetSpeed);

    // Download in chunks with realistic timing
    let downloaded = 0;
    const chunkSize = Math.min(profile.chunkSize, fragmentSize);
    const chunks = Math.ceil(fragmentSize / chunkSize);

    for (let chunk = 0; chunk < chunks; chunk++) {
      const toDownload = Math.min(chunkSize, fragmentSize - downloaded);
      
      // Simulate chunk download time
      const chunkDownloadTime = (toDownload / (1024 * 1024)) / simulatedSpeed; // seconds
      await new Promise(r => setTimeout(r, chunkDownloadTime * 100)); // Scale down for UI

      downloaded += toDownload;
      fragment.downloaded = downloaded;

      // Update session speed
      const elapsedTime = (Date.now() - session.startTime) / 1000;
      session.downloadedSize += toDownload;
      session.currentSpeed = (session.downloadedSize / (1024 * 1024)) / elapsedTime;

      // Simulate occasional network hiccups
      if (Math.random() < 0.05 && fragment.retries < profile.maxRetries) { // 5% chance of retry needed
        fragment.retries++;
        console.warn(`[Download] Fragment ${fragment.id} retry #${fragment.retries}`);
      }
    }

    fragment.status = 'completed';
    return {
      success: true,
      downloaded,
      speed: simulatedSpeed
    };
  }

  /**
   * Simulate realistic network speed with fluctuations
   */
  private simulateNetworkSpeed(targetSpeed: number): number {
    // Add realistic network jitter (-30% to +20%)
    const jitter = (Math.random() * 0.5 - 0.3) * targetSpeed;
    const actualSpeed = Math.max(0.1, targetSpeed + jitter);

    // Occasional slowdowns (5% chance of major slowdown)
    if (Math.random() < 0.05) {
      return actualSpeed * 0.3; // Temporary slowdown
    }

    return actualSpeed;
  }

  /**
   * Get optimal profile for detected speed
   */
  getOptimalProfile(detectedSpeedMbps: number): string {
    if (detectedSpeedMbps <= 1) return 'Dial-up';
    if (detectedSpeedMbps <= 4) return 'Economy';
    if (detectedSpeedMbps <= 10) return 'Standard';
    if (detectedSpeedMbps <= 50) return 'Turbo';
    if (detectedSpeedMbps <= 100) return 'Hyper';
    if (detectedSpeedMbps <= 500) return 'Insane';
    return 'Ludicrous';
  }

  /**
   * Validate speed profile against detected speed
   */
  validateProfile(selectedProfile: string, detectedSpeedMbps: number): {
    isValid: boolean;
    warning: string | null;
    recommendation: string;
  } {
    const profile = this.speedProfiles[selectedProfile];
    if (!profile) {
      return { isValid: false, warning: 'Invalid profile', recommendation: 'Standard' };
    }

    // Check if profile is safe for detected speed
    const requiredSpeed = profile.targetSpeed * 0.8; // 80% of target

    if (detectedSpeedMbps < requiredSpeed * 0.5) {
      return {
        isValid: false,
        warning: `⚠️ Your speed (${detectedSpeedMbps} MB/s) is too low for ${selectedProfile} mode`,
        recommendation: this.getOptimalProfile(detectedSpeedMbps)
      };
    }

    if (detectedSpeedMbps < requiredSpeed) {
      return {
        isValid: true,
        warning: `⚠️ Caution: Your speed is below ${selectedProfile} target. May experience slowdowns.`,
        recommendation: this.getOptimalProfile(detectedSpeedMbps)
      };
    }

    return {
      isValid: true,
      warning: null,
      recommendation: selectedProfile
    };
  }

  /**
   * Get download session status
   */
  getSessionStatus(sessionId: string): {
    progress: number;
    currentSpeed: number;
    eta: number;
    estimatedCompletion: string;
  } | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const progress = (session.downloadedSize / session.totalSize) * 100;
    const remainingBytes = session.totalSize - session.downloadedSize;
    const remainingSeconds = session.currentSpeed > 0 
      ? (remainingBytes / (1024 * 1024)) / session.currentSpeed
      : 0;

    return {
      progress: Math.min(100, progress),
      currentSpeed: session.currentSpeed,
      eta: Math.max(0, remainingSeconds),
      estimatedCompletion: new Date(Date.now() + remainingSeconds * 1000).toLocaleTimeString()
    };
  }

  /**
   * Get all available speed profiles
   */
  getProfiles(): Record<string, SpeedProfile> {
    return this.speedProfiles;
  }

  /**
   * Cancel download session
   */
  cancelSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    session.status = 'error';
    this.activeSessions.delete(sessionId);
    return true;
  }
}

export const downloadEngine = new RealisticDownloadEngine();
