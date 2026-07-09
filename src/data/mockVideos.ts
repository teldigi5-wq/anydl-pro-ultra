import { VideoAnalysisResult } from '../types';

export const SAMPLE_VIDEOS: VideoAnalysisResult[] = [
  {
    id: 'yt-4k-cyberpunk',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Cyberpunk Tokyo 2077 — 8K 60FPS Cinematic Drone & Neon Nights Walkthrough',
    creator: 'Cinematic Atmosphere HDR',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    durationSeconds: 485,
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1280&q=80',
    platform: 'YouTube',
    viewCount: '2.4M views',
    uploadDate: '3 days ago',
    subtitlesAvailable: ['en', 'ja', 'es', 'de'],
    availableFormats: [
      {
        formatId: '571+251',
        resolution: '4320p (8K)',
        fps: 60,
        videoCodec: 'av01',
        audioCodec: 'opus',
        ext: 'mkv',
        baseBitrateKbps: 38000,
        note: 'Ultra HDR 8K AV1 Master (Best Quality)'
      },
      {
        formatId: '315+251',
        resolution: '2160p (4K)',
        fps: 60,
        videoCodec: 'vp9',
        audioCodec: 'opus',
        ext: 'webm',
        baseBitrateKbps: 18500,
        note: '4K 60FPS VP9 HDR'
      },
      {
        formatId: '401+140',
        resolution: '2160p (4K)',
        fps: 60,
        videoCodec: 'av01',
        audioCodec: 'mp4a',
        ext: 'mp4',
        baseBitrateKbps: 15200,
        note: '4K AV1 + AAC (High Compatibility)'
      },
      {
        formatId: '299+140',
        resolution: '1080p60',
        fps: 60,
        videoCodec: 'avc1',
        audioCodec: 'mp4a',
        ext: 'mp4',
        baseBitrateKbps: 6800,
        note: '1080p60 H.264 High Profile (Recommended for Hardware Decode)'
      },
      {
        formatId: '137+140',
        resolution: '1080p',
        fps: 30,
        videoCodec: 'avc1',
        audioCodec: 'mp4a',
        ext: 'mp4',
        baseBitrateKbps: 4200,
        note: 'Standard 1080p MP4'
      },
      {
        formatId: '22',
        resolution: '720p',
        fps: 30,
        videoCodec: 'avc1',
        audioCodec: 'mp4a',
        ext: 'mp4',
        baseBitrateKbps: 2100,
        note: 'Combined Stream 720p Fast Download'
      },
      {
        formatId: '140',
        resolution: 'Audio Only',
        fps: 0,
        videoCodec: 'copy',
        audioCodec: 'mp4a',
        ext: 'm4a',
        baseBitrateKbps: 256,
        note: 'High Quality AAC Audio Master'
      }
    ]
  },
  {
    id: 'tt-viral-dance',
    url: 'https://www.tiktok.com/@cyber_ai/video/7348912948123',
    title: 'AI Robot Dog Learns Parkour in Downtown Shibuya #tech #futurism #viral',
    creator: '@cyber_ai_robotics',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    durationSeconds: 42,
    thumbnailUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1000&q=80',
    platform: 'TikTok',
    viewCount: '14.8M views',
    uploadDate: 'Yesterday',
    subtitlesAvailable: ['en'],
    availableFormats: [
      {
        formatId: 'nowatermark-1080p',
        resolution: '1080p60',
        fps: 60,
        videoCodec: 'hevc',
        audioCodec: 'aac',
        ext: 'mp4',
        baseBitrateKbps: 5800,
        note: 'No Watermark H.265 Master (Clean Feed)'
      },
      {
        formatId: 'nowatermark-720p',
        resolution: '720p',
        fps: 30,
        videoCodec: 'avc1',
        audioCodec: 'aac',
        ext: 'mp4',
        baseBitrateKbps: 3200,
        note: 'No Watermark H.264 Standard'
      },
      {
        formatId: 'watermark-original',
        resolution: '1080p',
        fps: 30,
        videoCodec: 'avc1',
        audioCodec: 'aac',
        ext: 'mp4',
        baseBitrateKbps: 4500,
        note: 'Original Feed with Watermark'
      }
    ]
  },
  {
    id: 'tw-spacex-starship',
    url: 'https://x.com/SpaceX/status/178129381928391823',
    title: 'Starship Orbital Flight Test 5 — Stage Separation & Super Heavy Tower Catch High Speed Camera',
    creator: '@SpaceX',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80',
    durationSeconds: 124,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517976487468-f205081c7e14?auto=format&fit=crop&w=1280&q=80',
    platform: 'Twitter/X',
    viewCount: '8.9M views',
    uploadDate: '12 hours ago',
    subtitlesAvailable: ['en'],
    availableFormats: [
      {
        formatId: 'http-1080p',
        resolution: '1080p60',
        fps: 60,
        videoCodec: 'avc1',
        audioCodec: 'mp4a',
        ext: 'mp4',
        baseBitrateKbps: 7200,
        note: 'Direct Twitter High Bitrate MP4'
      },
      {
        formatId: 'hls-720p',
        resolution: '720p',
        fps: 30,
        videoCodec: 'avc1',
        audioCodec: 'mp4a',
        ext: 'mp4',
        baseBitrateKbps: 2800,
        note: 'HLS Stream 720p'
      }
    ]
  },
  {
    id: 'ig-reels-supercar',
    url: 'https://www.instagram.com/p/C4829J1s_LK/',
    title: 'Koenigsegg Jesko Absolut 330MPH Wind Tunnel & Exhaust Flame Symphony 🔥🏁',
    creator: 'Hypercar Daily Reels',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    durationSeconds: 58,
    thumbnailUrl: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1000&q=80',
    platform: 'Instagram',
    viewCount: '920K views',
    uploadDate: '5 days ago',
    subtitlesAvailable: [],
    availableFormats: [
      {
        formatId: 'ig-hd-1080p',
        resolution: '1080p',
        fps: 60,
        videoCodec: 'avc1',
        audioCodec: 'aac',
        ext: 'mp4',
        baseBitrateKbps: 6100,
        note: 'Instagram Reel High Profile Direct Video'
      }
    ]
  },
  {
    id: 'vim-indie-docu',
    url: 'https://vimeo.com/891230491',
    title: 'Symphony of Deep Space — James Webb Telescope Visualized 4K HDR Documentary',
    creator: 'Vimeo Staff Pick / Nebula Studios',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    durationSeconds: 960,
    thumbnailUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1280&q=80',
    platform: 'Vimeo',
    viewCount: '410K views',
    uploadDate: '2 weeks ago',
    subtitlesAvailable: ['en', 'fr'],
    availableFormats: [
      {
        formatId: 'pro-4k-prores',
        resolution: '2160p (4K)',
        fps: 30,
        videoCodec: 'hevc',
        audioCodec: 'flac',
        ext: 'mkv',
        baseBitrateKbps: 24000,
        note: 'Pro 10-bit Color Depth HEVC + FLAC Lossless'
      },
      {
        formatId: 'hd-1080p',
        resolution: '1080p',
        fps: 30,
        videoCodec: 'avc1',
        audioCodec: 'aac',
        ext: 'mp4',
        baseBitrateKbps: 5500,
        note: 'Standard High Quality MP4'
      }
    ]
  },
  {
    id: 'twt-live-esports',
    url: 'https://www.twitch.tv/videos/2119830491',
    title: 'VALORANT Champions Grand Finals — MAP 5 Overtime Clutch Highlights [VOD]',
    creator: 'Riot Games Esports Live',
    creatorAvatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=100&q=80',
    durationSeconds: 3420,
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1280&q=80',
    platform: 'Twitch',
    viewCount: '1.2M views',
    uploadDate: '1 week ago',
    subtitlesAvailable: [],
    availableFormats: [
      {
        formatId: '1080p60-source',
        resolution: '1080p60',
        fps: 60,
        videoCodec: 'avc1',
        audioCodec: 'aac',
        ext: 'mp4',
        baseBitrateKbps: 8500,
        note: 'Twitch Source Stream 1080p60 8500kbps'
      },
      {
        formatId: '720p60',
        resolution: '720p',
        fps: 60,
        videoCodec: 'avc1',
        audioCodec: 'aac',
        ext: 'mp4',
        baseBitrateKbps: 4500,
        note: 'High Framerate 720p60'
      }
    ]
  }
];
