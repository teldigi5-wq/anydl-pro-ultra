import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, ArrowLeft, ArrowRight, RotateCw, Home, Smartphone, Monitor,
  Plus, X, Download, Lock, History, RefreshCw, Radio
} from 'lucide-react';
import { browserEngine, DetectedMedia, BrowserTab } from '../utils/browserEngine';

interface AdvancedBrowserProps {
  onMediaDetected?: (media: DetectedMedia) => void;
  onDownloadMedia?: (media: DetectedMedia) => void;
}

export const AdvancedBrowser: React.FC<AdvancedBrowserProps> = ({
  onMediaDetected,
  onDownloadMedia
}) => {
  const [tabs, setTabs] = useState<BrowserTab[]>(browserEngine.getAllTabs());
  const [activeTabId, setActiveTabId] = useState<string | null>(
    browserEngine.getCurrentTab()?.id || null
  );
  const [urlInput, setUrlInput] = useState('https://www.youtube.com');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [detectedMedia, setDetectedMedia] = useState<DetectedMedia[]>([]);
  const [showMediaPanel, setShowMediaPanel] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<DetectedMedia | null>(null);
  const [browserHistory, setBrowserHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const activeTab = tabs.find(t => t.id === activeTabId);

  useEffect(() => {
    if (activeTabId) {
      browserEngine.setActiveTab(activeTabId);
      const media = browserEngine.getDetectedMedia(activeTabId);
      setDetectedMedia(media);
      onMediaDetected?.(media[0] || null);
    }
  }, [activeTabId, onMediaDetected]);

  const handleNavigate = (url: string) => {
    let finalUrl = url;
    if (!url.startsWith('http')) {
      finalUrl = `https://${url}`;
    }

    if (activeTabId) {
      browserEngine.navigateToUrl(finalUrl, activeTabId);
      
      // Update UI after navigation
      setTimeout(() => {
        const updatedTabs = browserEngine.getAllTabs();
        setTabs(updatedTabs);
        const media = browserEngine.getDetectedMedia(activeTabId);
        setDetectedMedia(media);
      }, 1500);
    }

    setUrlInput(finalUrl);
  };

  const handleNewTab = () => {
    const newTab = browserEngine.createTab();
    const updatedTabs = browserEngine.getAllTabs();
    setTabs(updatedTabs);
    setActiveTabId(newTab.id);
    setUrlInput('https://www.google.com');
  };

  const handleCloseTab = (tabId: string) => {
    browserEngine.closeTab(tabId);
    const updatedTabs = browserEngine.getAllTabs();
    setTabs(updatedTabs);
    if (activeTabId === tabId) {
      const firstTab = updatedTabs[0];
      setActiveTabId(firstTab?.id || null);
    }
  };

  const handleDownloadMedia = (media: DetectedMedia) => {
    const result = browserEngine.downloadMedia(media.id, activeTabId || undefined);
    if (result.success) {
      onDownloadMedia?.(media);
      setSelectedMedia(media);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text');
    if (text) {
      handleNavigate(text);
    }
  };

  const handleBrowserHistoryClick = () => {
    const history = browserEngine.getBrowserHistory(10);
    setBrowserHistory(history);
    setShowHistory(!showHistory);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl"
    >
      {/* Browser Top Bar */}
      <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-800 p-3 space-y-3">
        {/* Navigation & Address Bar */}
        <div className="flex items-center gap-2">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-1 p-1.5 rounded-xl bg-slate-800/60 border border-slate-800">
            <button
              onClick={() => handleNavigate(activeTab?.url || '')}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleNavigate(activeTab?.url || '')}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
              title="Forward"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => activeTabId && handleNavigate(activeTab?.url || '')}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
              title="Refresh"
            >
              <RotateCw className={`w-4 h-4 ${activeTab?.isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={() => handleNavigate('https://www.google.com')}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
              title="Home"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Address Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNavigate(urlInput);
            }}
            className="flex-1 flex items-center bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 hover:border-slate-600 transition-all"
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={handleDrop}
          >
            <Globe className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter URL or search..."
              className="flex-1 bg-transparent text-white text-sm focus:outline-none font-mono"
            />
            <Lock className="w-3.5 h-3.5 text-emerald-400 ml-2 shrink-0" />
          </form>

          {/* Device Mode & Tools */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-800/60 border border-slate-800">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-2 rounded-lg transition-all ${
                deviceMode === 'desktop'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title="Desktop"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-2 rounded-lg transition-all ${
                deviceMode === 'mobile'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title="Mobile"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-700" />
            <button
              onClick={handleBrowserHistoryClick}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              title="History"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowMediaPanel(!showMediaPanel)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all relative"
              title={`${detectedMedia.length} media detected`}
            >
              <Radio className="w-4 h-4" />
              {detectedMedia.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <AnimatePresence>
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTabId === tab.id
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tab.isLoading ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Globe className="w-3 h-3" />
                )}
                <span className="max-w-[100px] truncate">{tab.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tab.id);
                  }}
                  className="hover:bg-white/20 p-0.5 rounded transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.button>
            ))}
          </AnimatePresence>

          <button
            onClick={handleNewTab}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all shrink-0"
            title="New Tab"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Browser Content */}
      <div className="flex-1 flex gap-3 overflow-hidden p-3">
        {/* Browser Viewport */}
        <motion.div
          className={`flex-1 rounded-2xl bg-slate-800/40 border border-slate-800 overflow-hidden flex flex-col ${
            deviceMode === 'mobile' ? 'max-w-xs mx-auto' : 'w-full'
          }`}
        >
          {/* Simulated Page Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab?.isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-cyan-400 animate-spin" />
                <p className="text-slate-400 text-sm font-mono">Loading page...</p>
              </div>
            ) : (
              <>
                {/* Page Header */}
                <div className="text-center">
                  <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 mb-4">
                    <Globe className="w-8 h-8 text-cyan-400 mx-auto" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {activeTab?.title || 'Web Page'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-2 font-mono break-all">
                    {activeTab?.url}
                  </p>
                </div>

                {/* Featured Media Cards */}
                {detectedMedia.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 mb-3">
                      📺 Available Media on This Page
                    </h3>
                    <div className="grid gap-3">
                      {detectedMedia.slice(0, 2).map((media) => (
                        <motion.div
                          key={media.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedMedia(media)}
                          className="relative rounded-2xl overflow-hidden cursor-pointer group border-2 border-slate-700 hover:border-cyan-500 transition-all"
                        >
                          <img
                            src={media.thumbnail}
                            alt={media.title}
                            className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-3">
                            <h4 className="text-xs font-bold text-white">{media.title}</h4>
                            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-300 font-mono">
                              <span>{media.quality}</span>
                              <span>{media.size}</span>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadMedia(media);
                            }}
                            className="absolute top-2 right-2 p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg"
                          >
                            <Download className="w-4 h-4" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Page Info */}
                <div className="rounded-2xl bg-slate-800/60 border border-slate-800 p-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-200">🔍 Page Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-400">Device Mode:</span>
                      <p className="text-cyan-300 font-semibold capitalize">{deviceMode}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Media Detected:</span>
                      <p className="text-cyan-300 font-semibold">{detectedMedia.length} sources</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Content Type:</span>
                      <p className="text-cyan-300 font-semibold">
                        {detectedMedia[0]?.source || 'Web Media'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Security:</span>
                      <p className="text-emerald-400 font-semibold">🔒 Secure (HTTPS)</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Media Detection Panel */}
        <AnimatePresence>
          {showMediaPanel && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="w-80 rounded-2xl bg-slate-800/60 border border-slate-800 flex flex-col overflow-hidden"
            >
              {/* Panel Header */}
              <div className="border-b border-slate-800 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                    Media Sniffer
                  </h3>
                  <button
                    onClick={() => setShowMediaPanel(false)}
                    className="p-1 hover:bg-slate-700 rounded transition-all text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  {detectedMedia.length} media sources detected on this page
                </p>
              </div>

              {/* Media List */}
              <div className="flex-1 overflow-y-auto space-y-2 p-3">
                {detectedMedia.map((media) => (
                  <motion.div
                    key={media.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedMedia(media)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedMedia?.id === media.id
                        ? 'bg-cyan-950/60 border-cyan-500'
                        : 'border-slate-700 hover:border-slate-600 hover:bg-slate-700/40'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <img
                        src={media.thumbnail}
                        alt={media.title}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {media.title}
                        </h4>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                            {media.quality}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-800 text-slate-300 border border-slate-600">
                            {media.size}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1 truncate">
                          {media.source}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadMedia(media);
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <Download className="w-3 h-3" /> Download
                      </motion.button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(media.url);
                        }}
                        className="py-1.5 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-bold transition-all"
                        title="Copy URL"
                      >
                        📋
                      </button>
                    </div>
                  </motion.div>
                ))}

                {detectedMedia.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Radio className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="text-xs text-slate-500">
                      No media detected on this page
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Media Detail Popup */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-3xl"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 space-y-4 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-bold text-white">Download Media</h3>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="p-1 hover:bg-slate-800 rounded transition-all text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <img
                src={selectedMedia.thumbnail}
                alt={selectedMedia.title}
                className="w-full h-40 rounded-xl object-cover border border-slate-700"
              />

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Title</p>
                  <p className="text-white font-semibold">{selectedMedia.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Quality</p>
                    <p className="text-cyan-400 font-bold">{selectedMedia.quality}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Size</p>
                    <p className="text-cyan-400 font-bold">{selectedMedia.size}</p>
                  </div>
                </div>

                {selectedMedia.duration && (
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Duration</p>
                    <p className="text-slate-200">
                      {Math.floor(selectedMedia.duration / 60)}:{(selectedMedia.duration % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700">
                  <p className="text-slate-400 text-xs mb-1 font-mono">URL</p>
                  <p className="text-[10px] text-slate-300 break-all font-mono line-clamp-3">
                    {selectedMedia.url}
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onDownloadMedia?.(selectedMedia);
                  setSelectedMedia(null);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download This Media
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Browser History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="absolute left-0 top-0 w-64 h-full bg-slate-900 border-r border-slate-800 rounded-l-3xl p-4 space-y-3 overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between sticky top-0 bg-slate-900 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" /> History
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-slate-800 rounded transition-all text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {browserHistory.map((item, idx) => (
              <motion.button
                key={idx}
                whileHover={{ x: 5 }}
                onClick={() => {
                  handleNavigate(item.url);
                  setShowHistory(false);
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-800 transition-all text-xs group"
              >
                <p className="text-slate-200 font-semibold group-hover:text-cyan-300 line-clamp-1">
                  {item.title}
                </p>
                <p className="text-slate-500 text-[10px] font-mono line-clamp-1 mt-0.5">
                  {item.url}
                </p>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
