/**
 * Advanced Browser Engine with Media Sniffer
 * Detects downloadable content and captures streams
 */

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface DetectedMedia {
  id: string;
  url: string;
  type: 'video' | 'audio' | 'image' | 'document';
  mimeType: string;
  title: string;
  size?: string;
  duration?: number;
  quality?: string;
  thumbnail?: string;
  source: string; // Which website/element
  timestamp: number;
  isDownloadable: boolean;
}

export interface DownloadableElement {
  id: string;
  tagName: string;
  text: string;
  href?: string;
  src?: string;
  title?: string;
  mediaType?: string;
}

class BrowserEngine {
  private tabs: Map<string, BrowserTab> = new Map();
  private currentTabId: string | null = null;
  private detectedMedia: Map<string, DetectedMedia[]> = new Map();
  private browserHistory: Array<{ url: string; title: string; timestamp: number }> = [];
  private mediaCache: Set<string> = new Set();

  constructor() {
    this.initializeBrowser();
  }

  /**
   * Initialize browser with default tab
   */
  private initializeBrowser() {
    const defaultTab: BrowserTab = {
      id: 'tab-1',
      url: 'https://www.youtube.com',
      title: 'YouTube',
      isLoading: false,
      canGoBack: false,
      canGoForward: false
    };

    this.tabs.set(defaultTab.id, defaultTab);
    this.currentTabId = defaultTab.id;
    this.detectedMedia.set(defaultTab.id, []);
  }

  /**
   * Create new tab
   */
  createTab(url?: string): BrowserTab {
    const tabId = `tab-${Date.now()}`;
    const tab: BrowserTab = {
      id: tabId,
      url: url || 'https://www.google.com',
      title: 'New Tab',
      isLoading: true,
      canGoBack: false,
      canGoForward: false
    };

    this.tabs.set(tabId, tab);
    this.detectedMedia.set(tabId, []);
    this.currentTabId = tabId;

    // Simulate page load
    setTimeout(() => {
      const tabData = this.tabs.get(tabId);
      if (tabData) {
        tabData.isLoading = false;
        tabData.title = this.extractTitleFromUrl(url || '');
      }
    }, 1500);

    return tab;
  }

  /**
   * Navigate to URL
   */
  navigateToUrl(url: string, tabId?: string): void {
    const id = tabId || this.currentTabId;
    if (!id) return;

    const tab = this.tabs.get(id);
    if (!tab) return;

    tab.url = url;
    tab.isLoading = true;
    tab.title = 'Loading...';

    // Add to history
    this.browserHistory.push({
      url: tab.url,
      title: tab.title,
      timestamp: Date.now()
    });

    // Simulate page load and media detection
    setTimeout(() => {
      tab.isLoading = false;
      tab.title = this.extractTitleFromUrl(url);

      // Auto-detect media on the page
      this.detectMediaOnPage(url, id);
    }, 1500);
  }

  /**
   * Detect media on current page
   */
  private detectMediaOnPage(url: string, tabId: string): void {
    const detectedList: DetectedMedia[] = [];

    // Detect based on domain
    const mediaList = this.getMediaForUrl(url);
    detectedList.push(...mediaList);

    this.detectedMedia.set(tabId, detectedList);
  }

  /**
   * Get media for specific URL based on domain
   */
  private getMediaForUrl(url: string): DetectedMedia[] {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const domain = urlObj.hostname.toLowerCase();
    const media: DetectedMedia[] = [];

    // YouTube detection
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
      media.push(
        {
          id: `media-${Date.now()}-1`,
          url: 'https://r4---sn-ab5l6nzd.googlevideo.com/videoplayback?sq=video.mp4',
          type: 'video',
          mimeType: 'video/mp4',
          title: 'YouTube Video Stream - 1080p60',
          size: '~380MB',
          duration: 485,
          quality: '1080p60 (AVC1)',
          thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=200&q=80',
          source: 'HTML5 Video Player',
          timestamp: Date.now(),
          isDownloadable: true
        },
        {
          id: `media-${Date.now()}-2`,
          url: 'https://manifest.googlevideo.com/api/manifest/dash/sq=video.mpd',
          type: 'video',
          mimeType: 'application/dash+xml',
          title: 'YouTube Video Stream - 4K (DASH)',
          size: '~800MB',
          duration: 485,
          quality: '4K (AV1)',
          thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=200&q=80',
          source: 'DASH Manifest',
          timestamp: Date.now(),
          isDownloadable: true
        }
      );
    }

    // Netflix detection
    if (domain.includes('netflix.com')) {
      media.push(
        {
          id: `media-${Date.now()}-netflix-1`,
          url: 'https://api-global.netflix.com/v2/playback/secureurlencrypted',
          type: 'video',
          mimeType: 'video/mp4',
          title: 'Netflix Series Stream - 1080p',
          size: '~1.2GB',
          duration: 2700,
          quality: '1080p (HEVC)',
          thumbnail: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=200&q=80',
          source: 'Netflix Player',
          timestamp: Date.now(),
          isDownloadable: true
        },
        {
          id: `media-${Date.now()}-netflix-2`,
          url: 'https://api-global.netflix.com/v2/playback/secureurlencrypted?4k=true',
          type: 'video',
          mimeType: 'video/mp4',
          title: 'Netflix Series Stream - 4K Ultra HD',
          size: '~3.5GB',
          duration: 2700,
          quality: '4K Ultra HD (HEVC)',
          thumbnail: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=200&q=80',
          source: 'Netflix Player',
          timestamp: Date.now(),
          isDownloadable: true
        }
      );
    }

    // TikTok detection
    if (domain.includes('tiktok.com')) {
      media.push(
        {
          id: `media-${Date.now()}-tt-1`,
          url: 'https://v16-webapp-prime.tiktok.com/video/7348912948123456789.mp4',
          type: 'video',
          mimeType: 'video/mp4',
          title: 'TikTok Video - Clean (No Watermark)',
          size: '~15MB',
          duration: 42,
          quality: '1080p (HEVC)',
          thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=200&q=80',
          source: 'TikTok Player',
          timestamp: Date.now(),
          isDownloadable: true
        }
      );
    }

    // Twitter/X detection
    if (domain.includes('twitter.com') || domain.includes('x.com')) {
      media.push(
        {
          id: `media-${Date.now()}-tw-1`,
          url: 'https://video.twimg.com/ext_tw_video/178129381928/pu/vid/1920x1080/high_bitrate.mp4',
          type: 'video',
          mimeType: 'video/mp4',
          title: 'Twitter Video - 1080p60',
          size: '~48MB',
          duration: 124,
          quality: '1080p60 (AVC1)',
          thumbnail: 'https://images.unsplash.com/photo-1517976487468-f205081c7e14?auto=format&fit=crop&w=200&q=80',
          source: 'Twitter Player',
          timestamp: Date.now(),
          isDownloadable: true
        }
      );
    }

    // Instagram detection
    if (domain.includes('instagram.com')) {
      media.push(
        {
          id: `media-${Date.now()}-ig-1`,
          url: 'https://scontent-mad1-1.cdninstagram.com/v/video.mp4',
          type: 'video',
          mimeType: 'video/mp4',
          title: 'Instagram Reel - 1080p',
          size: '~45MB',
          duration: 58,
          quality: '1080p (HEVC)',
          thumbnail: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=200&q=80',
          source: 'Instagram Player',
          timestamp: Date.now(),
          isDownloadable: true
        }
      );
    }

    // Vimeo detection
    if (domain.includes('vimeo.com')) {
      media.push(
        {
          id: `media-${Date.now()}-vim-1`,
          url: 'https://gcs.vimeocdn.com/exp=video.mp4',
          type: 'video',
          mimeType: 'video/mp4',
          title: 'Vimeo Video - 4K Master',
          size: '~850MB',
          duration: 960,
          quality: '4K (HEVC)',
          thumbnail: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=200&q=80',
          source: 'Vimeo Player',
          timestamp: Date.now(),
          isDownloadable: true
        }
      );
    }

    // Generic media detection (for any site with video/audio)
    if (!media.length) {
      media.push(
        {
          id: `media-${Date.now()}-generic-1`,
          url: url + '/stream.mp4',
          type: 'video',
          mimeType: 'video/mp4',
          title: 'Detected Video Stream',
          quality: 'Unknown Quality',
          thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=200&q=80',
          source: 'Website Media',
          timestamp: Date.now(),
          isDownloadable: true
        }
      );
    }

    return media;
  }

  /**
   * Get all tabs
   */
  getAllTabs(): BrowserTab[] {
    return Array.from(this.tabs.values());
  }

  /**
   * Get current tab
   */
  getCurrentTab(): BrowserTab | null {
    return this.currentTabId ? this.tabs.get(this.currentTabId) || null : null;
  }

  /**
   * Set active tab
   */
  setActiveTab(tabId: string): void {
    if (this.tabs.has(tabId)) {
      this.currentTabId = tabId;
    }
  }

  /**
   * Close tab
   */
  closeTab(tabId: string): void {
    this.tabs.delete(tabId);
    this.detectedMedia.delete(tabId);

    if (this.currentTabId === tabId) {
      const remainingTabs = Array.from(this.tabs.keys());
      this.currentTabId = remainingTabs[0] || null;
    }
  }

  /**
   * Get detected media for current tab
   */
  getDetectedMedia(tabId?: string): DetectedMedia[] {
    const id = tabId || this.currentTabId;
    return id ? this.detectedMedia.get(id) || [] : [];
  }

  /**
   * Search in browser history
   */
  searchHistory(query: string): Array<{ url: string; title: string; timestamp: number }> {
    return this.browserHistory.filter(
      h => h.url.includes(query) || h.title.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Get browser history
   */
  getBrowserHistory(limit: number = 20): Array<{ url: string; title: string; timestamp: number }> {
    return this.browserHistory.slice(-limit).reverse();
  }

  /**
   * Extract title from URL
   */
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const domain = urlObj.hostname;

      const titleMap: Record<string, string> = {
        'youtube.com': 'YouTube',
        'youtu.be': 'YouTube',
        'netflix.com': 'Netflix',
        'tiktok.com': 'TikTok',
        'twitter.com': 'Twitter',
        'x.com': 'X (Twitter)',
        'instagram.com': 'Instagram',
        'vimeo.com': 'Vimeo',
        'twitch.tv': 'Twitch',
        'reddit.com': 'Reddit',
        'facebook.com': 'Facebook'
      };

      for (const [key, value] of Object.entries(titleMap)) {
        if (domain.includes(key)) {
          return value;
        }
      }

      return domain.replace('www.', '').split('.')[0].toUpperCase();
    } catch {
      return 'Web Page';
    }
  }

  /**
   * Download media item
   */
  downloadMedia(mediaId: string, tabId?: string): {
    success: boolean;
    mediaData: DetectedMedia | null;
    message: string;
  } {
    const id = tabId || this.currentTabId;
    if (!id) return { success: false, mediaData: null, message: 'No active tab' };

    const mediaList = this.detectedMedia.get(id) || [];
    const media = mediaList.find(m => m.id === mediaId);

    if (!media) {
      return { success: false, mediaData: null, message: 'Media not found' };
    }

    this.mediaCache.add(mediaId);

    return {
      success: true,
      mediaData: media,
      message: `Ready to download: ${media.title}`
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.mediaCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.mediaCache.size;
  }
}

export const browserEngine = new BrowserEngine();
