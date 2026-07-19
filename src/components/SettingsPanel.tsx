import React from 'react';
import { motion } from 'framer-motion';
import {
  Settings, FolderOpen, Bell, Keyboard, Monitor, HardDrive,
  Download, Zap, Check, Cpu, Clipboard, History, Trash2, FileVideo, Shield, Sparkles
} from 'lucide-react';
import { api, isElectron, HistoryEntry } from '../lib/api';

interface SettingsPanelProps {
  downloadPath: string;
  setDownloadPath: (p: string) => void;
  notifications: boolean;
  setNotifications: (v: boolean) => void;
  autoStart: boolean;
  setAutoStart: (v: boolean) => void;
  maxConcurrent: number;
  setMaxConcurrent: (n: number) => void;
  isWindowsConnected: boolean;
  clipboardWatch: boolean;
  setClipboardWatch: (v: boolean) => void;
  history: HistoryEntry[];
  onClearHistory: () => void;
  globalLimitRateKBps: number;
  setGlobalLimitRateKBps: (n: number) => void;
  proxyEnabled: boolean;
  setProxyEnabled: (v: boolean) => void;
  proxyUrl: string;
  setProxyUrl: (v: string) => void;
  useAria2: boolean;
  setUseAria2: (v: boolean) => void;
  aiProvider: 'groq' | 'anthropic';
  setAiProvider: (v: 'groq' | 'anthropic') => void;
  groqApiKey: string;
  setGroqApiKey: (v: string) => void;
  anthropicApiKey: string;
  setAnthropicApiKey: (v: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  downloadPath,
  setDownloadPath,
  notifications,
  setNotifications,
  autoStart,
  setAutoStart,
  maxConcurrent,
  setMaxConcurrent,
  isWindowsConnected,
  clipboardWatch,
  setClipboardWatch,
  history,
  onClearHistory,
  globalLimitRateKBps,
  setGlobalLimitRateKBps,
  proxyEnabled,
  setProxyEnabled,
  proxyUrl,
  setProxyUrl,
  useAria2,
  setUseAria2,
  aiProvider,
  setAiProvider,
  groqApiKey,
  setGroqApiKey,
  anthropicApiKey,
  setAnthropicApiKey
}) => {
  const [aiCheckResult, setAiCheckResult] = React.useState<{ ok: boolean; message: string } | null>(null);
  const [aiChecking, setAiChecking] = React.useState(false);
  const checkAi = async () => {
    setAiChecking(true);
    setAiCheckResult(null);
    const res = await api.checkAiKey();
    setAiCheckResult(res);
    setAiChecking(false);
  };
  const chooseFolder = async () => {
    const picked = await api.chooseFolder();
    if (picked) setDownloadPath(picked);
  };
  const formatWhen = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="rounded-3xl border p-6 sm:p-8 relative overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--accent)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-3 rounded-2xl border"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' }}>
            <Settings className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Settings</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Real preferences — persisted to disk, applied instantly.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border p-6 space-y-5"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Monitor className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Preferences
          </h3>

          <div className="space-y-2">
            <label className="text-[11px] font-mono flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <FolderOpen className="w-3.5 h-3.5" /> Download Folder
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={downloadPath}
                readOnly
                className="flex-1 px-4 py-3 rounded-2xl border text-sm font-mono text-white focus:outline-none"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
              />
              <button
                onClick={chooseFolder}
                disabled={!isElectron}
                className="px-4 py-3 rounded-2xl text-xs font-bold text-black transition-all cursor-pointer disabled:opacity-40"
                style={{ background: 'linear-gradient(90deg, var(--gradient-from), var(--gradient-to))' }}
              >
                Browse...
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-mono flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Zap className="w-3.5 h-3.5" /> Max Concurrent Downloads: {maxConcurrent}
            </label>
            <input
              type="range" min={1} max={8} step={1}
              value={maxConcurrent}
              onChange={(e) => setMaxConcurrent(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>How many yt-dlp jobs can run at the same time.</p>
          </div>

          <div className="p-3 rounded-2xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
            <label className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={useAria2} onChange={(e) => setUseAria2(e.target.checked)} className="accent-cyan-500 w-4 h-4" />
              <Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> Fast Mode (aria2c, real 16-connection downloading)
            </label>
            <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Most CDNs (YouTube included) throttle a single connection well below a fast line's real speed. This bundles
              the real, open-source aria2c downloader to fetch each file over 16 real parallel connections instead of one.
              Leave this on if you're on a fast connection like 5G/fiber.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-mono flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Download className="w-3.5 h-3.5" /> Bandwidth Limit: {globalLimitRateKBps > 0 ? `${globalLimitRateKBps} KB/s` : 'Unlimited'}
            </label>
            <input
              type="range" min={0} max={20000} step={250}
              value={globalLimitRateKBps}
              onChange={(e) => setGlobalLimitRateKBps(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              Real yt-dlp --limit-rate cap applied to every new download. 0 = unlimited (uses your full connection).
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <label className="text-[11px] font-mono flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Shield className="w-3.5 h-3.5" /> Proxy / VPN Connection
            </label>
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Not a built-in VPN service — there's no free server infrastructure to honestly offer here. This routes
              the embedded browser and downloads through <strong>your own</strong> proxy or VPN endpoint (SOCKS5 or HTTP), same as any real VPN's connection details.
            </p>
            <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={proxyEnabled} onChange={(e) => setProxyEnabled(e.target.checked)} className="accent-cyan-500 w-4 h-4" />
              Enable proxy / VPN routing
            </label>
            <div className="flex gap-1.5">
              {['socks5://', 'http://', 'https://'].map(scheme => (
                <button
                  key={scheme}
                  type="button"
                  onClick={() => setProxyUrl(proxyUrl.replace(/^[a-z0-9]+:\/\//i, '') ? scheme + proxyUrl.replace(/^[a-z0-9]+:\/\//i, '') : scheme)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono border"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  {scheme}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              disabled={!proxyEnabled}
              placeholder="socks5://host:port or http://user:pass@host:port"
              className="w-full px-3 py-2.5 rounded-xl border text-xs font-mono text-white focus:outline-none disabled:opacity-40"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <label className="text-[11px] font-mono flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Sparkles className="w-3.5 h-3.5" /> Real AI Agents
            </label>
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Powers real AI parsing in the Agents Hub and AI error explanations. Bring your own key — it's stored
              locally on this PC and sent directly to the provider, never through us. <strong>Groq's free tier needs no
              credit card</strong> and is the easiest way to turn this on at zero cost.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAiProvider('groq')}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  aiProvider === 'groq' ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300' : 'bg-slate-800/50 border-slate-700 text-slate-400'
                }`}
              >
                Groq (free tier)
              </button>
              <button
                type="button"
                onClick={() => setAiProvider('anthropic')}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  aiProvider === 'anthropic' ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300' : 'bg-slate-800/50 border-slate-700 text-slate-400'
                }`}
              >
                Anthropic (paid)
              </button>
            </div>

            {aiProvider === 'groq' ? (
              <>
                <input
                  type="password"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder="gsk_... (free key from console.groq.com)"
                  className="w-full px-3 py-2.5 rounded-xl border text-xs font-mono text-white focus:outline-none"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
                />
                <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  Get a free key: sign up at <span className="font-mono">console.groq.com</span> — no credit card required.
                </p>
              </>
            ) : (
              <>
                <input
                  type="password"
                  value={anthropicApiKey}
                  onChange={(e) => setAnthropicApiKey(e.target.value)}
                  placeholder="sk-ant-... from console.anthropic.com"
                  className="w-full px-3 py-2.5 rounded-xl border text-xs font-mono text-white focus:outline-none"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
                />
                <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  Get a key: sign up at <span className="font-mono">console.anthropic.com</span> — this is a paid API (billed by Anthropic, not us).
                </p>
              </>
            )}

            <button
              type="button"
              onClick={checkAi}
              disabled={aiChecking}
              className="w-full py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            >
              {aiChecking ? 'Testing connection...' : 'Test AI Connection'}
            </button>
            {aiCheckResult && (
              <p className={`text-[10px] font-mono ${aiCheckResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {aiCheckResult.ok ? '✓ ' : '✗ '}{aiCheckResult.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setNotifications(!notifications)}
              className="p-3.5 rounded-2xl border text-left transition-all cursor-pointer"
              style={{
                background: notifications ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg-elevated)',
                borderColor: notifications ? 'var(--accent)' : 'var(--border-color)'
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-bold text-white">Notifications</span>
                {notifications && <Check className="w-3.5 h-3.5 ml-auto" style={{ color: 'var(--success)' }} />}
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Toast alerts on complete / error</p>
            </button>

            <button
              onClick={() => setAutoStart(!autoStart)}
              disabled={!isElectron}
              className="p-3.5 rounded-2xl border text-left transition-all cursor-pointer disabled:opacity-40"
              style={{
                background: autoStart ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg-elevated)',
                borderColor: autoStart ? 'var(--accent)' : 'var(--border-color)'
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Download className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-bold text-white">Launch on Windows Startup</span>
                {autoStart && <Check className="w-3.5 h-3.5 ml-auto" style={{ color: 'var(--success)' }} />}
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Real Windows login-item registration</p>
            </button>

            <button
              onClick={() => setClipboardWatch(!clipboardWatch)}
              disabled={!isElectron}
              className="p-3.5 rounded-2xl border text-left transition-all cursor-pointer disabled:opacity-40 sm:col-span-2"
              style={{
                background: clipboardWatch ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg-elevated)',
                borderColor: clipboardWatch ? 'var(--accent)' : 'var(--border-color)'
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clipboard className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-bold text-white">Clipboard Auto-Watch</span>
                {clipboardWatch && <Check className="w-3.5 h-3.5 ml-auto" style={{ color: 'var(--success)' }} />}
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                Real background clipboard poll — copy a link anywhere and it auto-analyzes + downloads, no need to switch back to the app
              </p>
            </button>
          </div>

          <div className="p-3 rounded-2xl border flex items-center gap-3"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
            <Cpu className="w-5 h-5" style={{ color: isWindowsConnected ? 'var(--success)' : 'var(--text-secondary)' }} />
            <div>
              <p className="text-xs font-bold text-white">Download Engine</p>
              <p className="text-[10px] font-mono" style={{ color: isWindowsConnected ? 'var(--success)' : 'var(--text-secondary)' }}>
                {isWindowsConnected ? '● Desktop app — yt-dlp/ffmpeg ready' : '○ Browser preview — no engine'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border p-6 space-y-4 flex flex-col"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4" style={{ color: 'var(--accent)' }} /> About This Install
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            This is a native Windows desktop app (Electron). yt-dlp and ffmpeg are bundled inside the installer —
            there's no separate script to run, no Python bridge, nothing to configure. Downloads happen directly
            on this PC and land in the folder above.
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            See the <strong>Windows Bridge</strong> tab for live yt-dlp/ffmpeg version info and an update button.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border p-6 space-y-3"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Download History
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              persisted to disk
            </span>
          </h3>
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Nothing here yet — completed downloads are recorded here automatically and survive an app restart.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 p-2.5 rounded-xl"
                style={{ background: 'var(--bg-elevated)' }}>
                <FileVideo className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{h.title}</p>
                  <p className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {formatWhen(h.completedAt)}{h.resolution ? ` · ${h.resolution}` : ''}
                  </p>
                </div>
                {h.filePath && (
                  <button
                    onClick={() => api.showInFolder(h.filePath!)}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0"
                    style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}
                  >
                    Show
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border p-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <Keyboard className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Keyboard Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ['Ctrl + V', 'Paste & download'],
            ['Ctrl + 1', 'Downloader'],
            ['Ctrl + 2', 'Browser'],
            ['Ctrl + 3', 'Agents'],
            ['Ctrl + 4', 'Windows Bridge'],
            ['Ctrl + 5', 'Settings & Themes'],
            ['Ctrl + Enter', 'Start download'],
            ['?', 'Help overlay']
          ].map(([key, action]) => (
            <div key={key} className="p-2.5 rounded-xl border flex flex-col gap-1"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
              <kbd className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded w-fit"
                style={{ background: 'var(--bg-primary)', color: 'var(--accent)' }}>{key}</kbd>
              <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{action}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
