import React from 'react';
import { motion } from 'framer-motion';
import { Download, Globe, Bot, Terminal, Cpu, Activity, Wifi, Settings, Palette } from 'lucide-react';
import { ThemeId } from '../themes/themeSystem';
import { ThemeSelector } from './ThemeSelector';

export type AppTab = 'analyzer' | 'browser' | 'agents' | 'bridge' | 'settings';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isWindowsConnected: boolean;
  setIsWindowsConnected: (val: boolean) => void;
  activeDownloads: number;
  networkSpeed: number;
  activeTheme: ThemeId;
  onThemeChange: (id: ThemeId) => void;
}

const tabs: Array<{ id: AppTab; label: string; short: string; icon: React.ElementType }> = [
  { id: 'analyzer', label: 'Downloader & CRF Studio', short: 'Downloader', icon: Download },
  { id: 'browser', label: 'Built-in Sniffer Browser', short: 'Browser', icon: Globe },
  { id: 'agents', label: 'AI Agents Hub', short: 'Agents', icon: Bot },
  { id: 'bridge', label: 'Windows PC Bridge', short: 'Bridge', icon: Terminal },
  { id: 'settings', label: 'Themes & Settings', short: 'Settings', icon: Settings },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isWindowsConnected,
  setIsWindowsConnected,
  activeDownloads,
  networkSpeed,
  activeTheme,
  onThemeChange
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl border-b theme-surface"
      style={{ background: 'color-mix(in srgb, var(--bg-primary) 75%, transparent)', borderColor: 'var(--border-color)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
        {/* Brand */}
        <motion.div
          className="flex items-center gap-3 cursor-pointer shrink-0"
          onClick={() => setActiveTab('analyzer')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl p-[2px] shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-via), var(--gradient-to))', boxShadow: '0 0 20px var(--accent-glow)' }}>
            <div className="w-full h-full rounded-[14px] flex items-center justify-center"
              style={{ background: 'var(--bg-primary)' }}>
              <Download className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: 'var(--success)' }} />
              <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: 'var(--success)' }} />
            </span>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-gradient-animated">AnyDL Pro</span>
              <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded border font-bold"
                style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)', color: 'var(--accent)' }}>
                Win Ultra
              </span>
            </div>
            <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              Windows Desktop · AI Video Studio
            </p>
          </div>
        </motion.div>

        {/* Desktop tabs */}
        <nav className="hidden lg:flex items-center gap-1 p-1.5 rounded-2xl border shadow-inner"
          style={{ background: 'color-mix(in srgb, var(--bg-secondary) 90%, transparent)', borderColor: 'var(--border-color)' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer z-10 ${
                  isActive ? 'text-white' : 'nav-tab-idle'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl nav-tab-active"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">{tab.label}</span>
                  <span className="xl:hidden">{tab.short}</span>
                  {tab.id === 'agents' && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full border"
                      style={{ background: 'color-mix(in srgb, var(--accent-2) 15%, transparent)', borderColor: 'color-mix(in srgb, var(--accent-2) 40%, transparent)', color: 'var(--accent-2)' }}>
                      6
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right stats */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <div className="hidden xl:block max-w-[140px]">
            <ThemeSelector activeTheme={activeTheme} onThemeChange={onThemeChange} compact />
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border"
            style={{ background: 'color-mix(in srgb, var(--bg-secondary) 90%, transparent)', borderColor: 'var(--border-color)' }}>
            <Wifi className="w-3.5 h-3.5 animate-pulse" style={{ color: 'var(--success)' }} />
            <span className="text-[11px] font-mono font-bold" style={{ color: 'var(--success)' }}>
              {networkSpeed.toFixed(1)} MB/s
            </span>
          </div>

          {activeDownloads > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border"
              style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)' }}>
              <Activity className="w-3.5 h-3.5 animate-pulse" style={{ color: 'var(--accent)' }} />
              <span className="text-[11px] font-mono font-bold" style={{ color: 'var(--accent)' }}>
                {activeDownloads} Active
              </span>
            </div>
          )}

          <button
            onClick={() => setIsWindowsConnected(!isWindowsConnected)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer"
            style={{
              background: isWindowsConnected ? 'color-mix(in srgb, var(--success) 12%, transparent)' : 'var(--bg-secondary)',
              borderColor: isWindowsConnected ? 'color-mix(in srgb, var(--success) 45%, transparent)' : 'var(--border-color)',
              color: isWindowsConnected ? 'var(--success)' : 'var(--text-secondary)'
            }}
          >
            <Cpu className="w-4 h-4" />
            <div className="flex flex-col text-left hidden sm:flex">
              <span className="text-[9px] leading-none opacity-70">Engine</span>
              <span className="font-bold">{isWindowsConnected ? 'Windows PC' : 'Simulator'}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className="p-2 rounded-xl border transition-all cursor-pointer"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--accent)' }}
            title="Themes & Settings"
          >
            <Palette className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="lg:hidden px-3 pb-3 flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                isActive ? 'nav-tab-active text-white' : 'nav-tab-idle'
              }`}
              style={!isActive ? { background: 'var(--bg-secondary)' } : undefined}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.short}
            </button>
          );
        })}
      </div>
    </header>
  );
};
