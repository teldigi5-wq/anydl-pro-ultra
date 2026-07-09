import React, { useEffect, useState } from 'react';
import { Terminal, Cpu, Check, HardDrive, RefreshCw, AlertTriangle, FolderCog } from 'lucide-react';
import { api, isElectron, EngineInfo } from '../lib/api';

export const WindowsBridgeModal: React.FC = () => {
  const [info, setInfo] = useState<EngineInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [useSystem, setUseSystem] = useState(false);

  const load = async () => {
    setLoading(true);
    const [engineInfo, settings] = await Promise.all([api.getEngineInfo(), api.getSettings()]);
    setInfo(engineInfo);
    if (settings) setUseSystem(!!settings.useSystemYtDlp);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    setUpdateMsg(null);
    const res = await api.updateYtDlp();
    setUpdateMsg(res.message || (res.ok ? 'Updated.' : 'Update failed.'));
    setUpdating(false);
    load();
  };

  const toggleSystem = async (val: boolean) => {
    setUseSystem(val);
    await api.setSetting('useSystemYtDlp', val);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border p-6 sm:p-8 relative overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-3 rounded-2xl border"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' }}>
            <Cpu className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Real Engine Status</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              yt-dlp + ffmpeg run natively inside this app — no separate bridge script needed.
            </p>
          </div>
        </div>
      </div>

      {!isElectron && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Running in browser preview — install the desktop app to see real engine status.
        </div>
      )}

      {isElectron && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl border p-6 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4" style={{ color: 'var(--accent)' }} /> yt-dlp
            </h3>
            {loading ? (
              <div className="text-slate-400 text-xs flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking...</div>
            ) : (
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span className="text-slate-400">Version</span><span className="text-white">{info?.ytdlpVersion || 'not found'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Source</span><span className={info?.ytdlpBundled ? 'text-emerald-400' : 'text-amber-400'}>{info?.ytdlpBundled ? 'Bundled (zero setup)' : 'System PATH'}</span></div>
                <div className="text-slate-500 break-all">{info?.ytdlpPath}</div>
              </div>
            )}
            <button
              onClick={handleUpdate}
              disabled={updating}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {updating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {updating ? 'Updating yt-dlp...' : 'Check for yt-dlp Update'}
            </button>
            {updateMsg && <p className="text-[10px] text-slate-400 font-mono break-all">{updateMsg}</p>}

            <label className="flex items-center gap-2 pt-2 border-t border-slate-800/60 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={useSystem} onChange={(e) => toggleSystem(e.target.checked)} className="accent-cyan-500 w-4 h-4" />
              <FolderCog className="w-3.5 h-3.5 text-slate-400" />
              Use system-installed yt-dlp/ffmpeg instead of the bundled copy
            </label>
          </div>

          <div className="rounded-3xl border p-6 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4" style={{ color: 'var(--accent)' }} /> ffmpeg
            </h3>
            {loading ? (
              <div className="text-slate-400 text-xs flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking...</div>
            ) : (
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span className="text-slate-400">Version</span><span className="text-white truncate max-w-[220px]">{info?.ffmpegVersion || 'not found'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Source</span><span className={info?.ffmpegBundled ? 'text-emerald-400' : 'text-amber-400'}>{info?.ffmpegBundled ? 'Bundled (zero setup)' : 'System PATH'}</span></div>
                <div className="text-slate-500 break-all">{info?.ffmpegPath}</div>
              </div>
            )}
            <p className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-slate-800/60">
              Used for merging video+audio, embedding thumbnails/subtitles/chapters, SponsorBlock cuts, audio normalize/denoise, and MP3 extraction.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
