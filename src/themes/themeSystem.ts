/**
 * Multi-theme system for AnyDL Pro Ultra (Windows Desktop Ready)
 */

export type ThemeId =
  | 'cyber-dark'
  | 'midnight-purple'
  | 'emerald-matrix'
  | 'sunset-blaze'
  | 'arctic-frost'
  | 'rose-gold'
  | 'windows-fluent'
  | 'oled-black';

export interface AppTheme {
  id: ThemeId;
  name: string;
  description: string;
  preview: [string, string, string];
  vars: Record<string, string>;
}

export const THEMES: AppTheme[] = [
  {
    id: 'cyber-dark',
    name: 'Cyber Dark',
    description: 'Default neon cyan/blue command center',
    preview: ['#06b6d4', '#3b82f6', '#080b11'],
    vars: {
      '--bg-primary': '#080b11',
      '--bg-secondary': '#0f172a',
      '--bg-card': 'rgba(15, 23, 42, 0.9)',
      '--bg-elevated': '#1e293b',
      '--border-color': 'rgba(51, 65, 85, 0.8)',
      '--text-primary': '#e2e8f0',
      '--text-secondary': '#94a3b8',
      '--accent': '#06b6d4',
      '--accent-2': '#3b82f6',
      '--accent-3': '#10b981',
      '--accent-glow': 'rgba(6, 182, 212, 0.35)',
      '--success': '#10b981',
      '--warning': '#f59e0b',
      '--danger': '#ef4444',
      '--gradient-from': '#06b6d4',
      '--gradient-via': '#3b82f6',
      '--gradient-to': '#8b5cf6'
    }
  },
  {
    id: 'midnight-purple',
    name: 'Midnight Purple',
    description: 'Deep violet AI agent aesthetic',
    preview: ['#a855f7', '#7c3aed', '#0c0614'],
    vars: {
      '--bg-primary': '#0c0614',
      '--bg-secondary': '#1a0b2e',
      '--bg-card': 'rgba(26, 11, 46, 0.92)',
      '--bg-elevated': '#2e1065',
      '--border-color': 'rgba(126, 34, 206, 0.35)',
      '--text-primary': '#f3e8ff',
      '--text-secondary': '#c4b5fd',
      '--accent': '#a855f7',
      '--accent-2': '#c084fc',
      '--accent-3': '#e879f9',
      '--accent-glow': 'rgba(168, 85, 247, 0.4)',
      '--success': '#34d399',
      '--warning': '#fbbf24',
      '--danger': '#f87171',
      '--gradient-from': '#a855f7',
      '--gradient-via': '#7c3aed',
      '--gradient-to': '#db2777'
    }
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    description: 'Hacker green terminal vibe',
    preview: ['#10b981', '#059669', '#02140f'],
    vars: {
      '--bg-primary': '#02140f',
      '--bg-secondary': '#052e1c',
      '--bg-card': 'rgba(5, 46, 28, 0.9)',
      '--bg-elevated': '#064e3b',
      '--border-color': 'rgba(16, 185, 129, 0.3)',
      '--text-primary': '#d1fae5',
      '--text-secondary': '#6ee7b7',
      '--accent': '#10b981',
      '--accent-2': '#34d399',
      '--accent-3': '#6ee7b7',
      '--accent-glow': 'rgba(16, 185, 129, 0.4)',
      '--success': '#4ade80',
      '--warning': '#facc15',
      '--danger': '#f87171',
      '--gradient-from': '#10b981',
      '--gradient-via': '#059669',
      '--gradient-to': '#14b8a6'
    }
  },
  {
    id: 'sunset-blaze',
    name: 'Sunset Blaze',
    description: 'Warm orange/red energy theme',
    preview: ['#f97316', '#ef4444', '#1a0a05'],
    vars: {
      '--bg-primary': '#1a0a05',
      '--bg-secondary': '#2a1208',
      '--bg-card': 'rgba(42, 18, 8, 0.92)',
      '--bg-elevated': '#431407',
      '--border-color': 'rgba(249, 115, 22, 0.3)',
      '--text-primary': '#ffedd5',
      '--text-secondary': '#fdba74',
      '--accent': '#f97316',
      '--accent-2': '#fb923c',
      '--accent-3': '#ef4444',
      '--accent-glow': 'rgba(249, 115, 22, 0.4)',
      '--success': '#4ade80',
      '--warning': '#fbbf24',
      '--danger': '#f87171',
      '--gradient-from': '#f97316',
      '--gradient-via': '#ef4444',
      '--gradient-to': '#ec4899'
    }
  },
  {
    id: 'arctic-frost',
    name: 'Arctic Frost',
    description: 'Cool icy blue light-dark hybrid',
    preview: ['#38bdf8', '#0ea5e9', '#0b1220'],
    vars: {
      '--bg-primary': '#0b1220',
      '--bg-secondary': '#0f1c2e',
      '--bg-card': 'rgba(15, 28, 46, 0.92)',
      '--bg-elevated': '#1e3a5f',
      '--border-color': 'rgba(56, 189, 248, 0.28)',
      '--text-primary': '#e0f2fe',
      '--text-secondary': '#7dd3fc',
      '--accent': '#38bdf8',
      '--accent-2': '#0ea5e9',
      '--accent-3': '#67e8f9',
      '--accent-glow': 'rgba(56, 189, 248, 0.4)',
      '--success': '#4ade80',
      '--warning': '#fbbf24',
      '--danger': '#f87171',
      '--gradient-from': '#38bdf8',
      '--gradient-via': '#0ea5e9',
      '--gradient-to': '#818cf8'
    }
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    description: 'Elegant pink/gold premium look',
    preview: ['#f472b6', '#eab308', '#14080f'],
    vars: {
      '--bg-primary': '#14080f',
      '--bg-secondary': '#1f0f18',
      '--bg-card': 'rgba(31, 15, 24, 0.92)',
      '--bg-elevated': '#3b1528',
      '--border-color': 'rgba(244, 114, 182, 0.3)',
      '--text-primary': '#fce7f3',
      '--text-secondary': '#f9a8d4',
      '--accent': '#f472b6',
      '--accent-2': '#fb7185',
      '--accent-3': '#eab308',
      '--accent-glow': 'rgba(244, 114, 182, 0.4)',
      '--success': '#4ade80',
      '--warning': '#fbbf24',
      '--danger': '#f87171',
      '--gradient-from': '#f472b6',
      '--gradient-via': '#fb7185',
      '--gradient-to': '#eab308'
    }
  },
  {
    id: 'windows-fluent',
    name: 'Windows Fluent',
    description: 'Native Windows 11 Mica-inspired UI',
    preview: ['#60a5fa', '#3b82f6', '#0a0e17'],
    vars: {
      '--bg-primary': '#0a0e17',
      '--bg-secondary': '#111827',
      '--bg-card': 'rgba(17, 24, 39, 0.85)',
      '--bg-elevated': '#1f2937',
      '--border-color': 'rgba(96, 165, 250, 0.22)',
      '--text-primary': '#f1f5f9',
      '--text-secondary': '#94a3b8',
      '--accent': '#60a5fa',
      '--accent-2': '#3b82f6',
      '--accent-3': '#93c5fd',
      '--accent-glow': 'rgba(96, 165, 250, 0.35)',
      '--success': '#22c55e',
      '--warning': '#eab308',
      '--danger': '#ef4444',
      '--gradient-from': '#60a5fa',
      '--gradient-via': '#3b82f6',
      '--gradient-to': '#2563eb'
    }
  },
  {
    id: 'oled-black',
    name: 'OLED Black',
    description: 'True black OLED-friendly minimal theme',
    preview: ['#22d3ee', '#a3e635', '#000000'],
    vars: {
      '--bg-primary': '#000000',
      '--bg-secondary': '#0a0a0a',
      '--bg-card': 'rgba(10, 10, 10, 0.95)',
      '--bg-elevated': '#141414',
      '--border-color': 'rgba(255, 255, 255, 0.08)',
      '--text-primary': '#fafafa',
      '--text-secondary': '#a3a3a3',
      '--accent': '#22d3ee',
      '--accent-2': '#a3e635',
      '--accent-3': '#f472b6',
      '--accent-glow': 'rgba(34, 211, 238, 0.3)',
      '--success': '#a3e635',
      '--warning': '#facc15',
      '--danger': '#f87171',
      '--gradient-from': '#22d3ee',
      '--gradient-via': '#a3e635',
      '--gradient-to': '#f472b6'
    }
  }
];

export function applyTheme(themeId: ThemeId): void {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.setAttribute('data-theme', theme.id);
  try {
    localStorage.setItem('anydl-theme', theme.id);
  } catch { /* ignore */ }
}

export function loadSavedTheme(): ThemeId {
  try {
    const saved = localStorage.getItem('anydl-theme') as ThemeId | null;
    if (saved && THEMES.some(t => t.id === saved)) return saved;
  } catch { /* ignore */ }
  return 'cyber-dark';
}

export function getTheme(id: ThemeId): AppTheme {
  return THEMES.find(t => t.id === id) || THEMES[0];
}
