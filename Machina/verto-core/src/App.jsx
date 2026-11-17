import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, Download, RefreshCw, AlertCircle, 
  FileAudio, FileVideo, Zap, Image as ImageIcon, 
  Search, Check, X, Activity, HardDrive, Maximize2, Info, Power,
  ShieldCheck, Coffee, Infinity as InfinityIcon,
  Archive, Trash2, Plus, Clock, Gauge, Play
} from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import JSZip from 'jszip';
import { FORMAT_MATRIX, DEFAULT_SETTINGS } from './matrix';
import SettingsDrawer from './SettingsDrawer';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  const [ffmpeg] = useState(new FFmpeg());
  const [isLoaded, setIsLoaded] = useState(false);
  const [appState, setAppState] = useState('loading'); 
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Fundamentum...');
  const [error, setError] = useState('');
  
  // Batch Queue Pipeline
  const [fileQueue, setFileQueue] = useState([]);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);

  // Telemetry HUD
  const [liveTelemetry, setLiveTelemetry] = useState({
    fps: null,
    speed: null,
    time: null,
    size: null
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedTimerRef = useRef(null);

  const [activeCategory, setActiveCategory] = useState('video');
  const [selectedFormat, setSelectedFormat] = useState(FORMAT_MATRIX.video[0]);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [systemSpecs, setSystemSpecs] = useState({ core: 'LOCAL_HARDWARE: VERIFIED', gpu: 'GENERIC RENDERING CORE' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showTuneDrawer, setShowTuneDrawer] = useState(false);
  const [tuningSettings, setTuningSettings] = useState(DEFAULT_SETTINGS);

  const HELP_GUIDE = [
    { h: "01. BATCH INTAKE", p: "Drop multiple files or entire albums into the central buffer to stage a batch queue." },
    { h: "02. FORMAT TUNING", p: "Select your target format from the sidebar or open 'Tune Parameters' to adjust CRF, bitrates, and scaling." },
    { h: "03. SYNTHESIS", p: "Execute Synthesis to sequentially transcode items one-by-one with automated WASM RAM garbage collection." },
    { h: "04. EXPORT & ZIP", p: "Download artifacts individually or bundle all stabilized files in a single uncompressed ZIP." }
  ];
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleUnload = () => {
      try {
        navigator.sendBeacon('/api/kill');
      } catch (_) {}
    };
    window.addEventListener('beforeunload', handleUnload);

    const fetchSystemInfo = () => {
      try {
        const cores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Logical Cores` : 'Client Hardware Active';
        const memory = navigator.deviceMemory ? `~${navigator.deviceMemory}GB Device RAM` : 'RAM: In-Browser SharedBuffer';
        
        let renderer = 'Browser WebAssembly Core';
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
              const unmasked = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
              if (unmasked) {
                renderer = unmasked
                  .replace(/ANGLE \(.*\)/g, '')
                  .replace(/Direct3D.*/g, '')
                  .replace(/Intel\(R\)/g, '')
                  .replace(/NVIDIA GeForce/g, 'GeForce')
                  .trim()
                  .toUpperCase() || renderer;
              }
            }
          }
        } catch (_) {}

        setSystemSpecs({
          core: `${cores} | ${memory}`,
          gpu: renderer
        });
      } catch (e) {
        setSystemSpecs({ core: 'Client Hardware: Active', gpu: 'WebAssembly WASM Threading' });
      }
    };
    fetchSystemInfo();
    
    ffmpeg.on('log', ({ message }) => {
      const fpsMatch = message.match(/fps=\s*([\d.]+)/);
      const speedMatch = message.match(/speed=\s*([\d.]+x)/);
      const timeMatch = message.match(/time=\s*([\d:.]+)/);
      const sizeMatch = message.match(/size=\s*([\d.]+\w+)/);

      if (fpsMatch || speedMatch || timeMatch || sizeMatch) {
        setLiveTelemetry(prev => ({
          fps: fpsMatch ? fpsMatch[1] : prev.fps,
          speed: speedMatch ? speedMatch[1] : prev.speed,
          time: timeMatch ? timeMatch[1] : prev.time,
          size: sizeMatch ? sizeMatch[1] : prev.size,
        }));
      }

      if (!message.includes('frame=') && !message.includes('size=')) {
        setStatusText(`Engine: ${message.slice(0, 45)}${message.length > 45 ? '...' : ''}`);
      }
    });
    loadFundamentum();

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, []);

  const triggerKillSwitch = () => {
    navigator.sendBeacon('/api/kill');
    window.close();
    setAppState('loading');
    setStatusText('SYSTEM TERMINATED.');
  };

  const loadFundamentum = async () => {
    try {
      const baseURL = window.location.origin;
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setIsLoaded(true);
      setAppState('idle');
      setStatusText('Fundamentum Active');
    } catch (err) {
      console.error("Machina Load Error:", err);
      const detail = err instanceof Error ? err.message : JSON.stringify(err);
      setError(`Machina Failure: WASM Initialization Failed. [Telemetry: ${detail}]`);
      setAppState('error');
    }
  };

  const addFilesToQueue = (files) => {
    if (!files || files.length === 0) return;
    
    const newItems = Array.from(files).map((file, idx) => {
      let cat = 'video';
      const mime = file.type ? file.type.split('/')[0] : '';
      if (FORMAT_MATRIX[mime]) cat = mime;
      else if (file.name.match(/\.(mp3|wav|flac|m4a|ogg|aiff|wma|ac3)$/i)) cat = 'audio';
      else if (file.name.match(/\.(png|jpg|jpeg|webp|ico|bmp|tiff|tga|avif|svg)$/i)) cat = 'image';
      else if (file.name.match(/\.(mp4|mkv|webm|mov|avi|flv|wmv)$/i)) cat = 'video';

      const targetFmt = FORMAT_MATRIX[cat][0];

      return {
        id: `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        category: cat,
        targetFormat: targetFmt,
        settings: { ...DEFAULT_SETTINGS[cat] },
        status: 'queued',
        progress: 0,
        outputUrl: null,
        outputBlob: null,
        outputName: `${file.name.replace(/\.[^/.]+$/, "")}.${targetFmt.ext}`,
        outputSize: null,
        error: null
      };
    });

    setFileQueue(prev => {
      const updated = [...prev, ...newItems];
      if (prev.length === 0 && newItems.length > 0) {
        setActiveCategory(newItems[0].category);
        setSelectedFormat(newItems[0].targetFormat);
      }
      return updated;
    });
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      addFilesToQueue(e.target.files);
      e.target.value = ''; // Allow re-uploading same file name
    }
  };

  const removeFromQueue = (id) => {
    setFileQueue(prev => prev.filter(item => item.id !== id));
  };

  const clearQueue = () => {
    setFileQueue([]);
    setProgress(0);
    setAppState('idle');
  };

  const handleFormatSelect = (fmt) => {
    setSelectedFormat(fmt);
    setFileQueue(prev => prev.map(item => {
      if (item.category === activeCategory && item.status === 'queued') {
        return {
          ...item,
          targetFormat: fmt,
          outputName: `${item.name.replace(/\.[^/.]+$/, "")}.${fmt.ext}`
        };
      }
      return item;
    }));
  };

  const handleSettingsChange = (newSettings) => {
    setTuningSettings(prev => ({ ...prev, [activeCategory]: newSettings }));
    setFileQueue(prev => prev.map(item => {
      if (item.category === activeCategory && item.status === 'queued') {
        return { ...item, settings: { ...newSettings } };
      }
      return item;
    }));
  };

  const formatSeconds = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const executeBatch = async () => {
    const pendingItems = fileQueue.filter(f => f.status === 'queued');
    if (pendingItems.length === 0) return;
    
    if (!ffmpeg.loaded) {
      try { 
        await loadFundamentum(); 
      } catch (err) {
        setError(`Machina Failure: Engine not ready. ${err.message}`);
        setAppState('error');
        return;
      }
    }
    
    setAppState('processing');
    setProgress(0);
    setStatusText('Initiating Sequential Transduction...');

    // Start live elapsed timer
    setElapsedSeconds(0);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    const workingQueue = [...fileQueue];

    for (let i = 0; i < workingQueue.length; i++) {
      const item = workingQueue[i];
      if (item.status === 'complete') continue;

      setCurrentProcessingIndex(i);
      setStatusText(`Synthesizing [${i + 1}/${workingQueue.length}]: ${item.name}`);
      
      item.status = 'transcoding';
      item.progress = 0;
      setFileQueue([...workingQueue]);

      try {
        let sourceFile = item.file;
        if (sourceFile.type === 'image/svg+xml' || sourceFile.name.endsWith('.svg')) {
          sourceFile = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = Math.max(2048 / Math.max(img.width, img.height), 1);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                  if (blob) resolve(new File([blob], item.file.name + '.png', { type: 'image/png' }));
                  else reject(new Error('Canvas rasterization failed.'));
                }, 'image/png');
              };
              img.src = e.target.result;
            };
            reader.readAsDataURL(item.file);
          });
        }

        const progressListener = ({ progress: p }) => {
          const itemProg = Math.round(p * 100);
          item.progress = itemProg;
          setProgress(itemProg);
          setFileQueue([...workingQueue]);
        };
        ffmpeg.on('progress', progressListener);

        const safeBase = item.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const inputFileName = `in_${i}_${safeBase}`;
        const outputExt = item.targetFormat.ext;
        const outputFileName = `out_${i}_${item.name.replace(/\.[^/.]+$/, "")}.${outputExt}`;

        await ffmpeg.writeFile(inputFileName, await fetchFile(sourceFile));
        
        const cmdArgs = item.targetFormat.cmd(inputFileName, item.settings);
        cmdArgs[cmdArgs.length - 1] = outputFileName;

        await ffmpeg.exec(cmdArgs);
        
        const data = await ffmpeg.readFile(outputFileName);
        const blob = new Blob([data.buffer], { type: 'application/octet-stream' });
        const outputUrl = URL.createObjectURL(blob);

        item.status = 'complete';
        item.progress = 100;
        item.outputUrl = outputUrl;
        item.outputBlob = blob;
        item.outputName = `${item.name.replace(/\.[^/.]+$/, "")}.${outputExt}`;
        item.outputSize = blob.size;

        // Clean up virtual filesystem immediately to prevent memory leaks
        try {
          await ffmpeg.deleteFile(inputFileName);
          await ffmpeg.deleteFile(outputFileName);
        } catch (_) {}

        setFileQueue([...workingQueue]);
      } catch (err) {
        console.error(`Transcode failure on ${item.name}:`, err);
        item.status = 'error';
        item.error = err.message || 'Synthesis breach';
        setFileQueue([...workingQueue]);
      }
    }

    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }

    setAppState('success');
  };

  const downloadAllAsZip = async () => {
    const completed = fileQueue.filter(item => item.status === 'complete' && item.outputBlob);
    if (completed.length === 0) return;

    const zip = new JSZip();
    completed.forEach(item => {
      zip.file(item.outputName, item.outputBlob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = zipUrl;
    link.download = `Verto_Batch_${new Date().toISOString().slice(0, 10)}.zip`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(zipUrl), 2000);
  };

  const filteredFormats = useMemo(() => {
    const categoryFormats = FORMAT_MATRIX[activeCategory] || [];
    if (!searchQuery) return categoryFormats;
    return categoryFormats.filter(f => f.label.toLowerCase().includes(searchQuery.toLowerCase()) || f.ext.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [activeCategory, searchQuery]);

  const resetVerto = async () => {
    try { if (ffmpeg.loaded) await ffmpeg.terminate(); } catch (e) {}
    setAppState('idle');
    setFileQueue([]);
    setProgress(0);
    setLiveTelemetry({ fps: null, speed: null, time: null, size: null });
    loadFundamentum();
  };

  const totalQueueSizeMB = useMemo(() => {
    const totalBytes = fileQueue.reduce((acc, curr) => acc + (curr.size || 0), 0);
    return (totalBytes / 1024 / 1024).toFixed(2);
  }, [fileQueue]);

  const completedCount = useMemo(() => {
    return fileQueue.filter(f => f.status === 'complete').length;
  }, [fileQueue]);

  return (
    <div className="fixed inset-0 bg-c-dark flex items-center justify-center p-4 md:p-8">
      <div className="hud-scanline"></div>
      <div className="w-full h-full max-w-[1600px] max-h-[1000px] bg-c-dark/95 border border-c-steel/30 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-10 flex flex-col rounded-sm overflow-hidden backdrop-blur-2xl">
        
        {/* HUD Top Bar */}
        <div className="h-14 border-b border-c-steel/20 bg-c-dark/50 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Zap className="w-3 h-3 text-c-sky shrink-0" />
              <div className="flex flex-col -space-y-1 text-left">
                <span className="mono-ui text-c-sky font-black text-[0.55rem] tracking-widest uppercase">AUCTUS</span>
                <span className="mono-ui text-c-steel opacity-40 text-[0.5rem]">v2.9.2</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 border-l border-c-steel/10 pl-6 h-8">
              <Activity className="w-3 h-3 text-c-sky shrink-0" />
              <div className="flex flex-col -space-y-1 text-left">
                <span className="mono-ui text-c-sky font-black text-[0.55rem] tracking-widest uppercase">Engine</span>
                <span className="mono-ui text-c-sky opacity-50 text-[0.5rem]">Fundamentum</span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-c-steel/10 pl-6 overflow-hidden h-8">
              <HardDrive className="w-3 h-3 text-c-steel shrink-0" />
              <div className="flex flex-col -space-y-1 text-left">
                <span className="mono-ui text-c-steel text-[0.55rem] truncate">{systemSpecs.core}</span>
                <span className="mono-ui text-c-steel opacity-50 text-[0.5rem] truncate">{systemSpecs.gpu}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-l border-c-steel/10 pl-6 h-8">
            {/* Ko-fi Support Badge */}
            <a 
              href="https://ko-fi.com/elyxis" 
              target="_blank" 
              rel="noreferrer noopener"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/20 text-amber-300 rounded-sm transition-all text-[0.55rem] mono-ui font-bold"
              title="Support autonomous zero-telemetry development"
            >
              <Coffee className="w-3 h-3 text-amber-400" />
              <span>SUPPORT</span>
            </a>

            <button 
              onClick={() => setShowHelp(true)}
              className="text-c-steel hover:text-c-sky transition-colors cursor-help"
              title="Operational Manual"
            >
              <Info className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowStatus(!showStatus)}
              title="Toggle System Report"
              className={`w-2 h-2 rounded-full shrink-0 transition-all cursor-pointer ${isLoaded ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] hover:scale-150' : 'bg-red-500 animate-pulse'}`} 
            />
            <button 
              onClick={triggerKillSwitch}
              className="text-red-500/40 hover:text-red-500 transition-colors ml-2"
              title="TERMINATE SYSTEM"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* System Report Modal */}
        {showStatus && (
          <div className="absolute top-14 right-6 z-[70] w-80 bg-c-dark/95 border border-c-sky/30 shadow-2xl p-6 animate-in slide-in-from-top-2 duration-300 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="mono-ui text-c-sky font-black">SYSTEM_REPORT</span>
              <X className="w-4 h-4 text-c-steel cursor-pointer hover:text-white" onClick={() => setShowStatus(false)} />
            </div>
            <div className="space-y-4">
              <div>
                <p className="mono-ui text-c-steel text-[0.5rem] mb-1">ENGINE_STATUS</p>
                <p className={`text-xs font-bold ${isLoaded ? 'text-green-400' : 'text-red-400'}`}>{isLoaded ? 'FUNDAMENTUM // ONLINE' : 'INITIALIZING HARDWARE...'}</p>
              </div>
              <div>
                <p className="mono-ui text-c-steel text-[0.5rem] mb-1">SUBSTRATE_ANALYSIS</p>
                <p className="text-[0.65rem] text-c-ice">{systemSpecs.core}</p>
                <p className="text-[0.6rem] text-c-steel mt-1 uppercase">{systemSpecs.gpu}</p>
              </div>
              <button 
                onClick={() => { resetVerto(); setShowStatus(false); }}
                className="w-full py-2 border border-red-900/50 text-red-400 mono-ui text-[0.5rem] hover:bg-red-950/30 transition-all"
              >
                EMERGENCY_RESET
              </button>
            </div>
          </div>
        )}

        {/* Operational Manual Modal */}
        {showHelp && (
          <div className="absolute inset-0 z-[80] bg-c-dark/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-c-dark border border-c-steel/30 shadow-2xl flex flex-col">
              <div className="h-14 border-b border-white/10 flex items-center justify-between px-8 shrink-0">
                <span className="mono-ui text-white tracking-widest font-black">OPERATIONAL_MANUAL // AUCTUS</span>
                <X className="w-6 h-6 text-c-steel cursor-pointer hover:text-white" onClick={() => setShowHelp(false)} />
              </div>
              <div className="p-8 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                {HELP_GUIDE.map((section, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="mono-ui text-c-sky font-bold text-xs">{section.h}</h4>
                    <p className="text-c-ice/60 text-sm leading-relaxed">{section.p}</p>
                  </div>
                ))}
              </div>
              <div className="h-10 border-t border-white/5 bg-white/[0.02] flex items-center px-8">
                <span className="mono-ui text-[0.5rem] text-c-steel opacity-50 uppercase">Build Identity // VERTO_2.9.2_STABLE</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          
          {/* Sidebar */}
          <div className="w-full md:w-[320px] border-b md:border-b-0 md:border-r border-c-steel/20 bg-c-dark/30 p-6 md:p-8 flex flex-col shrink-0">
            <header className="mb-6 md:mb-10 w-fit">
              <div className="flex justify-between mb-1 mono-ui text-white opacity-80">
                <span>E</span><span>L</span><span>Y</span><span>X</span><span>I</span><span>S</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black leading-none flex gap-2">
                <span className="text-c-slate">V</span><span className="text-c-steel">E</span><span className="text-c-sky">R</span><span className="text-c-ice">T</span><span className="text-c-white">O</span>
              </h1>
            </header>

            {/* Category Buttons */}
            <div className="flex gap-1 mb-6 md:mb-8">
              {[
                { id: 'video', icon: FileVideo },
                { id: 'audio', icon: FileAudio },
                { id: 'image', icon: ImageIcon }
              ].map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveCategory(id); handleFormatSelect(FORMAT_MATRIX[id][0]); }}
                  title={id.toUpperCase()}
                  className={`flex-1 py-3 flex justify-center items-center transition-all border ${
                    activeCategory === id 
                    ? 'bg-c-sky text-c-dark border-c-sky font-bold' 
                    : 'bg-transparent text-c-steel border-c-steel hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Format Stream (Desktop) */}
            <div className="flex-grow flex flex-col overflow-hidden hidden md:flex">
              <div className="flex items-center justify-between mb-4">
                <label className="mono-ui text-c-steel opacity-50">Format Stream</label>
                <button onClick={() => setShowMatrix(true)} className="mono-ui text-c-sky hover:underline flex items-center gap-1"><Maximize2 className="w-3 h-3" /> Expand</button>
              </div>
              <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {FORMAT_MATRIX[activeCategory].map(fmt => (
                  <button key={fmt.id} onClick={() => handleFormatSelect(fmt)} className={`w-full text-left p-3 text-[0.65rem] font-mono border mb-1 flex items-center justify-between ${selectedFormat?.id === fmt.id ? 'bg-c-sky/10 border-c-sky text-c-sky' : 'bg-transparent border-transparent text-c-steel hover:bg-white/5'}`}>
                    <div className="flex items-center gap-2"><span className={selectedFormat?.id === fmt.id ? 'font-bold' : ''}>{fmt.label}</span><span className="opacity-40">.{fmt.ext}</span></div>
                    {selectedFormat?.id === fmt.id && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Format Quick Selector */}
            <div className="md:hidden flex flex-col gap-2 mb-4">
              <div className="flex items-center justify-between">
                <label className="mono-ui text-c-steel opacity-50 text-[0.6rem]">Target Format</label>
                <button onClick={() => setShowMatrix(true)} className="mono-ui text-c-sky text-[0.6rem] hover:underline flex items-center gap-1">All ({FORMAT_MATRIX[activeCategory].length})</button>
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
                {FORMAT_MATRIX[activeCategory].slice(0, 5).map(fmt => (
                  <button 
                    key={fmt.id} 
                    onClick={() => handleFormatSelect(fmt)} 
                    className={`px-3 py-1.5 text-[0.6rem] font-mono border whitespace-nowrap rounded-sm ${selectedFormat?.id === fmt.id ? 'bg-c-sky text-c-dark border-c-sky font-bold' : 'border-c-steel/30 text-c-steel hover:bg-white/5'}`}
                  >
                    .{fmt.ext}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Stage Viewport */}
          <div className="flex-grow p-6 md:p-10 flex flex-col relative bg-c-ice/[0.01] overflow-y-auto custom-scrollbar">
            
            {/* Loading Initializer */}
            {appState === 'loading' && (
              <div className="flex-grow flex flex-col items-center justify-center space-y-6">
                <RefreshCw className="w-16 h-16 text-c-sky animate-spin opacity-50" />
                <div className="text-center">
                  <p className="text-lg font-mono text-c-sky tracking-[0.5em] uppercase mb-2">{statusText}</p>
                </div>
              </div>
            )}

            {/* Idle & Batch Staging View */}
            {appState === 'idle' && (
              <div className="flex-grow flex flex-col">
                {/* Value Props */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 shrink-0">
                  <div className="flex items-center gap-2.5 p-3 bg-white/[0.02] border border-c-steel/20 rounded-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="text-left">
                      <p className="mono-ui text-emerald-400 font-bold text-[0.6rem] uppercase tracking-wider">100% Private</p>
                      <p className="text-[0.55rem] text-c-steel leading-tight">Zero remote uploads</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-white/[0.02] border border-c-steel/20 rounded-sm">
                    <Zap className="w-4 h-4 text-c-sky shrink-0" />
                    <div className="text-left">
                      <p className="mono-ui text-c-sky font-bold text-[0.6rem] uppercase tracking-wider">Batch Pipeline</p>
                      <p className="text-[0.55rem] text-c-steel leading-tight">Multi-artifact queue</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-white/[0.02] border border-c-steel/20 rounded-sm">
                    <InfinityIcon className="w-4 h-4 text-cyan-300 shrink-0" />
                    <div className="text-left">
                      <p className="mono-ui text-cyan-300 font-bold text-[0.6rem] uppercase tracking-wider">In-RAM Synthesis</p>
                      <p className="text-[0.55rem] text-c-steel leading-tight">Client-side WebAssembly</p>
                    </div>
                  </div>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  onChange={handleFileSelect} 
                />

                {/* Empty State Dropzone */}
                {fileQueue.length === 0 ? (
                  <div 
                    onDragOver={(e) => e.preventDefault()} 
                    onDrop={handleFileDrop} 
                    onClick={() => fileInputRef.current?.click()} 
                    className="flex-grow border-2 border-dashed border-c-steel/30 flex flex-col items-center justify-center cursor-pointer group hover:bg-c-sky/5 hover:border-c-sky transition-all rounded-sm min-h-[340px]"
                  >
                    <Upload className="w-16 md:w-20 h-16 md:h-20 text-c-sky/20 group-hover:text-c-sky mb-6 transition-colors" />
                    <h3 className="text-xl md:text-2xl font-black tracking-[0.4em] text-white uppercase mb-2">Initialize Machina</h3>
                    <p className="mono-ui text-c-steel italic">Drop files or click to stage batch queue</p>
                    <div className="mt-4 px-3 py-1 bg-white/[0.03] border border-white/10 rounded-sm mono-ui text-[0.55rem] text-c-sky">
                      Multi-file & folder intake supported
                    </div>
                  </div>
                ) : (
                  /* Staged Batch Queue Dashboard */
                  <div className="flex flex-col gap-4">
                    {/* Queue Control Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-c-sky/5 border border-c-sky/20 rounded-sm gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="mono-ui text-c-sky font-bold text-xs tracking-widest uppercase">
                            QUEUE BUFFER // {fileQueue.length} {fileQueue.length === 1 ? 'ARTIFACT' : 'ARTIFACTS'}
                          </span>
                          <span className="mono-ui text-c-steel text-[0.6rem]">
                            ({totalQueueSizeMB} MB)
                          </span>
                        </div>
                        <p className="text-[0.65rem] text-c-ice/70 mt-0.5">
                          Sequential FIFO execution with automated virtual memory recycling
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-2 border border-c-steel/30 hover:border-c-sky hover:text-c-sky text-c-steel mono-ui text-[0.6rem] flex items-center gap-1.5 transition-colors rounded-sm"
                        >
                          <Plus className="w-3 h-3" />
                          ADD FILES
                        </button>
                        <button
                          type="button"
                          onClick={clearQueue}
                          className="px-3 py-2 border border-red-900/40 hover:bg-red-950/20 text-red-400 mono-ui text-[0.6rem] flex items-center gap-1.5 transition-colors rounded-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                          CLEAR
                        </button>
                      </div>
                    </div>

                    {/* Staged Items List */}
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar border border-c-steel/20 bg-c-dark/40 rounded-sm divide-y divide-white/5">
                      {fileQueue.map((item, idx) => (
                        <div key={item.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="mono-ui text-c-steel opacity-40 text-[0.55rem] w-4 text-right shrink-0">
                              {idx + 1}
                            </span>
                            <div className="p-2 bg-c-sky/10 text-c-sky rounded-sm shrink-0">
                              {item.category === 'video' ? <FileVideo className="w-4 h-4" /> : item.category === 'audio' ? <FileAudio className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0 text-left">
                              <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[320px] md:max-w-[420px]">
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="mono-ui text-c-steel text-[0.55rem]">{(item.size / 1024 / 1024).toFixed(2)} MB</span>
                                <span className="mono-ui text-c-sky text-[0.55rem] font-bold">→ {item.targetFormat.label}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="mono-ui px-2 py-0.5 text-[0.55rem] rounded-sm bg-white/5 text-c-steel border border-c-steel/20">
                              QUEUED
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFromQueue(item.id)}
                              className="text-c-steel hover:text-red-400 p-1 transition-colors"
                              title="Remove item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Parameter Tuning Drawer */}
                    <SettingsDrawer
                      isOpen={showTuneDrawer}
                      onToggle={() => setShowTuneDrawer(!showTuneDrawer)}
                      category={activeCategory}
                      format={selectedFormat}
                      settings={tuningSettings[activeCategory] || {}}
                      onChange={handleSettingsChange}
                      onReset={() => handleSettingsChange({ ...DEFAULT_SETTINGS[activeCategory] })}
                    />

                    {/* Primary Execution Action */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-left">
                        <p className="mono-ui text-c-steel text-[0.6rem]">
                          READY TO TRANSDUCE // TARGET EXTENSION: <span className="text-c-sky font-bold">.{selectedFormat.ext.toUpperCase()}</span>
                        </p>
                        <p className="text-[0.6rem] text-c-ice/50">
                          Active settings will apply across all queued {activeCategory} artifacts
                        </p>
                      </div>

                      <button 
                        onClick={executeBatch} 
                        disabled={!isLoaded || fileQueue.length === 0} 
                        className="w-full sm:w-auto px-12 py-4 md:px-14 md:py-4.5 bg-c-sky text-c-dark text-base font-black uppercase tracking-[0.2em] hover:bg-white disabled:opacity-50 transition-colors flex items-center justify-center gap-3 rounded-sm"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Execute Synthesis ({fileQueue.length})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* High-Clarity Processing Telemetry HUD */}
            {appState === 'processing' && (
              <div className="flex-grow flex flex-col items-center justify-center p-4">
                {/* Circular HUD Wheel */}
                <div className="relative mb-6 scale-90 md:scale-100">
                  <svg width="260" height="260" className="rotate-[-90deg]">
                    <circle cx="130" cy="130" r="122" className="fill-none stroke-c-steel/20 stroke-[3]" />
                    <circle 
                      cx="130" 
                      cy="130" 
                      r="122" 
                      className="fill-none stroke-c-sky stroke-[5] transition-all duration-300" 
                      style={{ 
                        strokeDasharray: 766, 
                        strokeDashoffset: 766 - (progress / 100 * 766) 
                      }} 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl md:text-6xl font-black text-white tracking-tighter">{progress}%</span>
                    <span className="mono-ui text-c-steel tracking-[0.5em] mt-2 text-[0.65rem]">
                      ITEM {currentProcessingIndex + 1}/{fileQueue.length}
                    </span>
                  </div>
                </div>

                {/* Sub-Second Heartbeat Pulse (Freeze-Guard Indicator) */}
                <div className="w-full max-w-lg mb-6 p-2.5 bg-black/40 border border-c-sky/30 rounded-sm">
                  <div className="flex items-center justify-between text-[0.55rem] mono-ui mb-1.5 px-1">
                    <span className="flex items-center gap-1.5 text-c-sky">
                      <span className="w-2 h-2 rounded-full bg-c-sky animate-ping"></span>
                      WASM STREAM // WORKER ALIVE
                    </span>
                    <span className="text-c-steel">
                      CLOCK: {formatSeconds(elapsedSeconds)}
                    </span>
                  </div>
                  <div className="h-1 bg-c-steel/20 rounded-full overflow-hidden relative">
                    <div className="h-full bg-c-sky animate-[pulse_1s_ease-in-out_infinite]" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                {/* Telemetry Matrix Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg mb-6">
                  <div className="p-3 bg-white/[0.02] border border-c-steel/20 rounded-sm text-center">
                    <p className="mono-ui text-c-steel text-[0.5rem] mb-1 flex items-center justify-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> ELAPSED
                    </p>
                    <p className="mono-ui text-white font-bold text-xs">{formatSeconds(elapsedSeconds)}</p>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-c-steel/20 rounded-sm text-center">
                    <p className="mono-ui text-c-steel text-[0.5rem] mb-1 flex items-center justify-center gap-1">
                      <Gauge className="w-2.5 h-2.5" /> SPEED
                    </p>
                    <p className="mono-ui text-c-sky font-bold text-xs">{liveTelemetry.speed || 'CALCULATING'}</p>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-c-steel/20 rounded-sm text-center">
                    <p className="mono-ui text-c-steel text-[0.5rem] mb-1 flex items-center justify-center gap-1">
                      <Activity className="w-2.5 h-2.5" /> FPS
                    </p>
                    <p className="mono-ui text-white font-bold text-xs">{liveTelemetry.fps || '--'}</p>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-c-steel/20 rounded-sm text-center">
                    <p className="mono-ui text-c-steel text-[0.5rem] mb-1 flex items-center justify-center gap-1">
                      <HardDrive className="w-2.5 h-2.5" /> STREAM POS
                    </p>
                    <p className="mono-ui text-c-ice font-bold text-xs">{liveTelemetry.time || '--'}</p>
                  </div>
                </div>

                <p className="text-sm font-mono text-c-sky uppercase tracking-[0.3em] animate-pulse">
                  {statusText}
                </p>
              </div>
            )}

            {/* Batch Complete / Success View */}
            {appState === 'success' && (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                <Zap className="w-14 md:w-18 h-14 md:h-18 text-c-sky mb-4" />
                <h2 className="text-2xl md:text-4xl font-black tracking-[0.25em] text-white uppercase mb-2">
                  Artifacts Stabilized
                </h2>
                <p className="mono-ui text-c-steel text-xs mb-6">
                  {completedCount} OF {fileQueue.length} ARTIFACTS PROCESSED IN {formatSeconds(elapsedSeconds)}
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg mx-auto mb-6">
                  {completedCount > 1 ? (
                    <button
                      type="button"
                      onClick={downloadAllAsZip}
                      className="flex-grow flex items-center justify-center gap-2 py-4 bg-c-sky text-c-dark text-sm font-black uppercase tracking-widest hover:bg-white rounded-sm transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                      Download All as ZIP (.zip)
                    </button>
                  ) : completedCount === 1 ? (
                    <a 
                      href={fileQueue.find(f => f.status === 'complete')?.outputUrl}
                      download={fileQueue.find(f => f.status === 'complete')?.outputName}
                      className="flex-grow flex items-center justify-center gap-2 py-4 bg-c-sky text-c-dark text-sm font-black uppercase tracking-widest hover:bg-white rounded-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Retrieve File
                    </a>
                  ) : null}

                  <button 
                    onClick={resetVerto} 
                    className="px-8 py-4 border border-c-steel/50 text-c-ice text-xs font-bold uppercase tracking-widest hover:bg-white/5 rounded-sm transition-colors"
                  >
                    New Batch
                  </button>
                </div>

                {/* Itemized Output Gallery */}
                <div className="w-full max-w-lg max-h-[220px] overflow-y-auto custom-scrollbar border border-c-steel/20 bg-c-dark/40 rounded-sm divide-y divide-white/5 mb-6 text-left">
                  {fileQueue.map((item, idx) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate max-w-[280px]">
                          {item.outputName || item.name}
                        </p>
                        <p className="mono-ui text-c-steel text-[0.55rem]">
                          {item.status === 'complete' ? `STABILIZED // ${(item.outputSize / 1024 / 1024).toFixed(2)} MB` : `FAILED // ${item.error || 'Unknown error'}`}
                        </p>
                      </div>

                      {item.status === 'complete' && item.outputUrl && (
                        <a
                          href={item.outputUrl}
                          download={item.outputName}
                          className="px-3 py-1 bg-c-sky/10 border border-c-sky text-c-sky hover:bg-c-sky hover:text-c-dark text-[0.55rem] mono-ui font-bold rounded-sm transition-colors shrink-0"
                        >
                          DOWNLOAD
                        </a>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Anti-cloud Value Proposition Callout */}
                <div className="max-w-lg w-full mx-auto p-3.5 bg-white/[0.02] border border-c-steel/20 rounded-sm text-left">
                  <div className="flex items-start gap-3">
                    <Coffee className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[0.65rem] text-c-ice leading-relaxed">
                        Transcoded 100% locally on your machine with zero server uploads, no data harvesting, and no subscription paywalls.
                      </p>
                      <a 
                        href="https://ko-fi.com/elyxis" 
                        target="_blank" 
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 mono-ui text-[0.6rem] text-amber-300 hover:text-amber-200 uppercase font-bold tracking-wider hover:underline"
                      >
                        Buy the developer a coffee on Ko-fi →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error View */}
            {appState === 'error' && (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-6 md:p-12">
                <AlertCircle className="w-16 md:w-24 h-16 md:h-24 text-red-400 mb-8" />
                <h2 className="text-2xl md:text-3xl font-black text-red-200 uppercase tracking-[0.4em] mb-6">Custos Alert</h2>
                <p className="mono-ui text-red-400 mb-12 max-w-xl">{error}</p>
                <button onClick={resetVerto} className="px-12 py-4 md:px-16 md:py-5 border border-red-900/50 text-red-300 font-mono uppercase hover:bg-red-900/20">Reset Diagnostics</button>
              </div>
            )}
          </div>
        </div>

        {/* Matrix Format Modal */}
        {showMatrix && (
          <div className="absolute inset-0 z-50 bg-c-dark flex flex-col">
            <div className="h-20 md:h-24 border-b border-white/10 flex items-center justify-between px-6 md:px-12 shrink-0 bg-c-dark">
              <div className="flex items-center gap-4 md:gap-10 w-full max-w-4xl">
                <span className="text-xl md:text-3xl font-black text-white tracking-widest uppercase italic shrink-0">The Matrix</span>
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-c-steel" />
                  <input 
                    type="text" 
                    placeholder="Search Omni-Format..." 
                    className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-xs md:text-sm text-white focus:outline-none focus:border-c-sky font-mono uppercase" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    autoFocus 
                  />
                </div>
              </div>
              <button onClick={() => setShowMatrix(false)} className="p-3 md:p-4 text-c-steel hover:text-white"><X className="w-6 md:w-8 h-6 md:h-8" /></button>
            </div>
            <div className="flex-grow flex overflow-hidden">
              <div className="w-[80px] md:w-[300px] border-r border-white/5 p-4 md:p-10 flex flex-col gap-4 bg-c-dark shrink-0">
                {['video', 'audio', 'image'].map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => { setActiveCategory(cat); handleFormatSelect(FORMAT_MATRIX[cat][0]); }} 
                    className={`w-full text-left p-4 md:p-6 font-mono text-[0.6rem] md:text-sm uppercase transition-all border-l-2 md:border-l-4 ${activeCategory === cat ? 'border-c-sky bg-c-sky/10 text-c-sky' : 'border-transparent text-c-steel hover:text-white hover:bg-white/5'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex-grow p-6 md:p-12 overflow-y-auto bg-[#212B31]">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                  {filteredFormats.map(fmt => (
                    <button 
                      key={fmt.id} 
                      onClick={() => { handleFormatSelect(fmt); setShowMatrix(false); }} 
                      className={`p-6 md:p-8 text-left border relative overflow-hidden ${selectedFormat?.id === fmt.id ? 'bg-c-sky border-c-sky text-c-dark' : 'bg-white/5 border-white/10 hover:border-c-sky/50'}`}
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                          <span className={`text-lg md:text-xl font-black uppercase ${selectedFormat?.id === fmt.id ? 'text-c-dark' : 'text-white'}`}>{fmt.label}</span>
                          <div className={`font-mono text-[0.6rem] p-1 px-2 ${selectedFormat?.id === fmt.id ? 'bg-c-dark text-c-sky' : 'bg-c-sky/10 text-c-sky'}`}>.{fmt.ext}</div>
                        </div>
                        <p className={`mono-ui text-[0.5rem] md:text-[0.6rem] ${selectedFormat?.id === fmt.id ? 'text-c-dark/70' : 'text-c-steel'}`}>Class: {fmt.cat}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Analytics />
    </div>
  );
}
