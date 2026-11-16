import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, Download, RefreshCw, AlertCircle, 
  FileAudio, FileVideo, Cpu, Zap, Image as ImageIcon, 
  Search, Check, X, Activity, HardDrive, Maximize2, Info, Power,
  ShieldCheck, Coffee, Infinity as InfinityIcon
} from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { FORMAT_MATRIX } from './matrix';

export default function App() {
  const [ffmpeg] = useState(new FFmpeg());
  const [isLoaded, setIsLoaded] = useState(false);
  const [appState, setAppState] = useState('loading'); 
  const [currentFile, setCurrentFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Fundamentum...');
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  
  const [activeCategory, setActiveCategory] = useState('video');
  const [selectedFormat, setSelectedFormat] = useState(FORMAT_MATRIX.video[0]);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [systemSpecs, setSystemSpecs] = useState({ core: 'LOCAL_HARDWARE: VERIFIED', gpu: 'GENERIC RENDERING CORE' });
  const [searchQuery, setSearchQuery] = useState('');

  const HELP_GUIDE = [
    { h: "01. INTAKE", p: "Initialize Machina by dropping any media artifact into the central buffer." },
    { h: "02. CONFIG", p: "Select your target transduction format from the Format Stream in the sidebar." },
    { h: "03. SYNTHESIS", p: "Execute Synthesis to begin the transduction. Monitor progress in the circular HUD." },
    { h: "04. RECOVERY", p: "Use 'Reset Diagnostics' if the Fundamentum engine enters a zombie state." }
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
      if (!message.includes('frame=') && !message.includes('size=')) {
        setStatusText(`Engine: ${message.slice(0, 40)}${message.length > 40 ? '...' : ''}`);
      }
    });
    loadFundamentum();

    return () => window.removeEventListener('beforeunload', handleUnload);
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

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (file) {
      setCurrentFile(file);
      detectCategory(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCurrentFile(file);
      detectCategory(file);
    }
  };

  const detectCategory = (file) => {
    const mime = file.type.split('/')[0];
    if (FORMAT_MATRIX[mime]) {
      setActiveCategory(mime);
      setSelectedFormat(FORMAT_MATRIX[mime][0]);
    } else {
      setActiveCategory('video');
    }
  };

  const executeVerto = async () => {
    if (!currentFile || !selectedFormat) return;
    if (!ffmpeg.loaded) {
      try { await loadFundamentum(); } catch (err) {
        setError(`Machina Failure: Engine not ready. ${err.message}`);
        setAppState('error');
        return;
      }
    }
    
    setAppState('processing');
    setProgress(0);
    setStatusText('Initializing Buffer...');

    try {
      let sourceFile = currentFile;
      if (currentFile.type === 'image/svg+xml' || currentFile.name.endsWith('.svg')) {
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
                if (blob) resolve(new File([blob], currentFile.name + '.png', { type: 'image/png' }));
                else reject(new Error('Canvas rasterization failed.'));
              }, 'image/png');
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(currentFile);
        });
        setProgress(30);
      }

      ffmpeg.on('progress', ({ progress: p }) => {
        const base = (sourceFile !== currentFile) ? 30 : 0;
        const multiplier = (sourceFile !== currentFile) ? 0.7 : 1.0;
        setProgress(Math.round(base + (p * 100 * multiplier)));
      });

      const inputFileName = 'input_' + sourceFile.name;
      const outputFileName = `output.${selectedFormat.ext}`;
      await ffmpeg.writeFile(inputFileName, await fetchFile(sourceFile));
      await ffmpeg.exec(selectedFormat.cmd(inputFileName));
      const data = await ffmpeg.readFile(outputFileName);
      const blob = new Blob([data.buffer], { type: 'application/octet-stream' });
      setDownloadUrl(URL.createObjectURL(blob));
      setProgress(100);
      setAppState('success');
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch (err) {
      console.error(err);
      setError(`Synthesis Breach: ${err.message || 'Unknown Error'}`);
      setAppState('error');
    }
  };

  const filteredFormats = useMemo(() => {
    const categoryFormats = FORMAT_MATRIX[activeCategory] || [];
    if (!searchQuery) return categoryFormats;
    return categoryFormats.filter(f => f.label.toLowerCase().includes(searchQuery.toLowerCase()) || f.ext.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [activeCategory, searchQuery]);

  const resetVerto = async () => {
    try { if (ffmpeg.loaded) await ffmpeg.terminate(); } catch (e) {}
    setAppState('idle');
    setCurrentFile(null);
    setProgress(0);
    setDownloadUrl('');
    loadFundamentum();
  };

  return (
    <div className="fixed inset-0 bg-c-dark flex items-center justify-center p-4 md:p-8">
      <div className="hud-scanline"></div>
      <div className="w-full h-full max-w-[1600px] max-h-[1000px] bg-c-dark/95 border border-c-steel/30 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-10 flex flex-col rounded-sm overflow-hidden backdrop-blur-2xl">
        
        <div className="h-14 border-b border-c-steel/20 bg-c-dark/50 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Zap className="w-3 h-3 text-c-sky shrink-0" />
              <div className="flex flex-col -space-y-1 text-left">
                <span className="mono-ui text-c-sky font-black text-[0.55rem] tracking-widest uppercase">AUCTUS</span>
                <span className="mono-ui text-c-steel opacity-40 text-[0.5rem]">v2.9.1</span>
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
            <a 
              href="https://ko-fi.com/elyxis"
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 hover:border-amber-400 text-amber-300 rounded transition-all group cursor-pointer"
              title="Support independent open-source WASM development on Ko-fi"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="mono-ui font-bold text-[0.6rem] tracking-wider uppercase text-amber-300">Support on Ko-fi</span>
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
                <span className="mono-ui text-[0.5rem] text-c-steel opacity-50 uppercase">Build Identity // VERTO_2.9.1_STABLE</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-[320px] border-b md:border-b-0 md:border-r border-c-steel/20 bg-c-dark/30 p-6 md:p-8 flex flex-col shrink-0">
            <header className="mb-6 md:mb-10 w-fit">
              <div className="flex justify-between mb-1 mono-ui text-white opacity-80">
                <span>E</span><span>L</span><span>Y</span><span>X</span><span>I</span><span>S</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black leading-none flex gap-2">
                <span className="text-c-slate">V</span><span className="text-c-steel">E</span><span className="text-c-sky">R</span><span className="text-c-ice">T</span><span className="text-c-white">O</span>
              </h1>
            </header>
            <div className="flex gap-1 mb-6 md:mb-8">
              {[
                { id: 'video', icon: FileVideo },
                { id: 'audio', icon: FileAudio },
                { id: 'image', icon: ImageIcon }
              ].map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveCategory(id); setSelectedFormat(FORMAT_MATRIX[id][0]); }}
                  title={id.toUpperCase()}
                  className={`flex-1 py-3 flex justify-center items-center transition-all border ${
                    activeCategory === id 
                    ? 'bg-c-sky text-c-dark border-c-sky' 
                    : 'bg-transparent text-c-steel border-c-steel hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <div className="flex-grow flex flex-col overflow-hidden hidden md:flex">
              <div className="flex items-center justify-between mb-4">
                <label className="mono-ui text-c-steel opacity-50">Format Stream</label>
                <button onClick={() => setShowMatrix(true)} className="mono-ui text-c-sky hover:underline flex items-center gap-1"><Maximize2 className="w-3 h-3" /> Expand</button>
              </div>
              <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {FORMAT_MATRIX[activeCategory].map(fmt => (
                  <button key={fmt.id} onClick={() => setSelectedFormat(fmt)} className={`w-full text-left p-3 text-[0.65rem] font-mono border mb-1 flex items-center justify-between ${selectedFormat?.id === fmt.id ? 'bg-c-sky/10 border-c-sky text-c-sky' : 'bg-transparent border-transparent text-c-steel hover:bg-white/5'}`}>
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
                    onClick={() => setSelectedFormat(fmt)} 
                    className={`px-3 py-1.5 text-[0.6rem] font-mono border whitespace-nowrap rounded-sm ${selectedFormat?.id === fmt.id ? 'bg-c-sky text-c-dark border-c-sky font-bold' : 'border-c-steel/30 text-c-steel hover:bg-white/5'}`}
                  >
                    .{fmt.ext}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-grow p-6 md:p-12 flex flex-col relative bg-c-ice/[0.01] overflow-y-auto custom-scrollbar">
            {appState === 'loading' && <div className="flex-grow flex flex-col items-center justify-center space-y-6"><RefreshCw className="w-16 h-16 text-c-sky animate-spin opacity-50" /><div className="text-center"><p className="text-lg font-mono text-c-sky tracking-[0.5em] uppercase mb-2">{statusText}</p></div></div>}
            {appState === 'idle' && (
              <div className="flex-grow flex flex-col">
                {/* Trust Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 shrink-0">
                  <div className="flex items-center gap-2.5 p-3 bg-white/[0.02] border border-c-steel/20 rounded-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="text-left">
                      <p className="mono-ui text-emerald-400 font-bold text-[0.6rem] uppercase tracking-wider">100% Private</p>
                      <p className="text-[0.55rem] text-c-steel leading-tight">Files never leave machine</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-white/[0.02] border border-c-steel/20 rounded-sm">
                    <Zap className="w-4 h-4 text-c-sky shrink-0" />
                    <div className="text-left">
                      <p className="mono-ui text-c-sky font-bold text-[0.6rem] uppercase tracking-wider">Instant Start</p>
                      <p className="text-[0.55rem] text-c-steel leading-tight">Zero upload wait times</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-white/[0.02] border border-c-steel/20 rounded-sm">
                    <InfinityIcon className="w-4 h-4 text-cyan-300 shrink-0" />
                    <div className="text-left">
                      <p className="mono-ui text-cyan-300 font-bold text-[0.6rem] uppercase tracking-wider">No Size Caps</p>
                      <p className="text-[0.55rem] text-c-steel leading-tight">Direct RAM processing</p>
                    </div>
                  </div>
                </div>

                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                <div onDragOver={(e) => e.preventDefault()} onDrop={handleFileDrop} onClick={() => fileInputRef.current?.click()} className="flex-grow border-2 border-dashed border-c-steel/30 flex flex-col items-center justify-center cursor-pointer group hover:bg-c-sky/5 hover:border-c-sky transition-all rounded-sm min-h-[300px]">
                  <Upload className="w-16 md:w-24 h-16 md:h-24 text-c-sky/20 group-hover:text-c-sky mb-8" />
                  <h3 className="text-xl md:text-2xl font-black tracking-[0.4em] text-white uppercase mb-3">Initialize Machina</h3>
                  <p className="mono-ui text-c-steel italic">Drop local artifact or click to select</p>
                </div>
                {currentFile && (
                  <div className="mt-8 p-6 md:p-8 bg-c-sky/5 border border-c-sky/20 flex flex-col lg:flex-row items-center justify-between rounded-sm gap-6">
                    <div className="flex items-center gap-6 md:gap-8">
                      <div className="p-4 md:p-5 bg-c-sky/10 text-c-sky">{activeCategory === 'video' ? <FileVideo className="w-8 md:w-10 h-8 md:h-10" /> : activeCategory === 'audio' ? <FileAudio className="w-8 md:w-10 h-8 md:h-10" /> : <ImageIcon className="w-8 md:w-10 h-8 md:h-10" />}</div>
                      <div>
                        <p className="text-lg md:text-xl font-black text-white uppercase truncate max-w-[250px] md:max-w-[400px]">{currentFile.name}</p>
                        <div className="flex flex-wrap gap-4 mt-2"><span className="mono-ui text-c-steel">Size: {(currentFile.size / 1024 / 1024).toFixed(2)} MB</span><span className="mono-ui text-c-sky font-bold">Target: {selectedFormat.label}</span></div>
                      </div>
                    </div>
                    <button onClick={executeVerto} disabled={!isLoaded} className="w-full lg:w-auto px-12 py-5 md:px-16 md:py-6 bg-c-sky text-c-dark text-lg font-black uppercase tracking-[0.2em] hover:bg-white disabled:opacity-50">Execute Synthesis</button>
                  </div>
                )}
              </div>
            )}
            {appState === 'processing' && <div className="flex-grow flex flex-col items-center justify-center"><div className="relative mb-12 md:mb-16 scale-75 md:scale-100"><svg width="280" height="280" className="rotate-[-90deg]"><circle cx="140" cy="140" r="134" className="fill-none stroke-c-steel/20 stroke-[2]" /><circle cx="140" cy="140" r="134" className="fill-none stroke-c-sky stroke-[4] transition-all duration-300" style={{ strokeDasharray: 842, strokeDashoffset: 842 - (progress / 100 * 842) }} /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-6xl md:text-7xl font-black text-white tracking-tighter">{progress}%</span><span className="mono-ui text-c-steel tracking-[0.6em] mt-4">Active</span></div></div><p className="text-base md:text-lg font-mono text-c-sky uppercase tracking-[0.5em] animate-pulse">{statusText}</p></div>}
            {appState === 'success' && (
              <div className="flex-grow flex flex-col items-center justify-center text-center">
                <Zap className="w-16 md:w-24 h-16 md:h-24 text-c-sky mb-6" />
                <h2 className="text-3xl md:text-5xl font-black tracking-[0.3em] text-white uppercase mb-4">Artifact Stabilized</h2>
                <div className="flex flex-col md:flex-row gap-4 w-full max-w-md mx-auto mb-6">
                  <a 
                    href={downloadUrl} 
                    download={`${currentFile?.name.replace(/\.[^/.]+$/, "")}.${selectedFormat.ext}`} 
                    className="flex-grow flex items-center justify-center gap-4 py-5 md:py-6 bg-c-sky text-c-dark text-lg font-black uppercase tracking-widest hover:bg-white"
                  >
                    Retrieve
                  </a>
                  <button 
                    onClick={resetVerto} 
                    className="px-10 py-5 border border-c-steel/50 text-c-ice text-sm font-bold uppercase tracking-widest hover:bg-white/5"
                  >
                    New
                  </button>
                </div>
                
                {/* Anti-cloud value prop tip hook */}
                <div className="max-w-md mx-auto p-4 bg-white/[0.02] border border-c-steel/20 rounded-sm text-left">
                  <div className="flex items-start gap-3">
                    <Coffee className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[0.65rem] text-c-ice leading-relaxed">
                        Converted 100% locally on your machine with zero server uploads, no data harvesting, and no subscription paywalls.
                      </p>
                      <a 
                        href="https://ko-fi.com/elyxis" 
                        target="_blank" 
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 mono-ui text-[0.6rem] text-amber-300 hover:text-amber-200 uppercase font-bold tracking-wider pt-1 hover:underline"
                      >
                        Buy the developer a coffee on Ko-fi →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {appState === 'error' && <div className="flex-grow flex flex-col items-center justify-center text-center p-6 md:p-12"><AlertCircle className="w-16 md:w-24 h-16 md:h-24 text-red-400 mb-8" /><h2 className="text-2xl md:text-3xl font-black text-red-200 uppercase tracking-[0.4em] mb-6">Custos Alert</h2><p className="mono-ui text-red-400 mb-12">{error}</p><button onClick={resetVerto} className="px-12 py-4 md:px-16 md:py-5 border border-red-900/50 text-red-300 font-mono uppercase hover:bg-red-900/20">Reset Diagnostics</button></div>}
          </div>
        </div>

        {showMatrix && (
          <div className="absolute inset-0 z-50 bg-c-dark flex flex-col">
            <div className="h-20 md:h-24 border-b border-white/10 flex items-center justify-between px-6 md:px-12 shrink-0 bg-c-dark">
              <div className="flex items-center gap-4 md:gap-10 w-full max-w-4xl"><span className="text-xl md:text-3xl font-black text-white tracking-widest uppercase italic shrink-0">The Matrix</span><div className="relative flex-grow"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-c-steel" /><input type="text" placeholder="Search Omni-Format..." className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-xs md:text-sm text-white focus:outline-none focus:border-c-sky font-mono uppercase" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus /></div></div>
              <button onClick={() => setShowMatrix(false)} className="p-3 md:p-4 text-c-steel hover:text-white"><X className="w-6 md:w-8 h-6 md:h-8" /></button>
            </div>
            <div className="flex-grow flex overflow-hidden">
              <div className="w-[80px] md:w-[300px] border-r border-white/5 p-4 md:p-10 flex flex-col gap-4 bg-c-dark shrink-0">
                {['video', 'audio', 'image'].map(cat => (<button key={cat} onClick={() => setActiveCategory(cat)} className={`w-full text-left p-4 md:p-6 font-mono text-[0.6rem] md:text-sm uppercase transition-all border-l-2 md:border-l-4 ${activeCategory === cat ? 'border-c-sky bg-c-sky/10 text-c-sky' : 'border-transparent text-c-steel hover:text-white hover:bg-white/5'}`}>{cat}</button>))}
              </div>
              <div className="flex-grow p-6 md:p-12 overflow-y-auto bg-[#212B31]">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                  {filteredFormats.map(fmt => (
                    <button key={fmt.id} onClick={() => { setSelectedFormat(fmt); setShowMatrix(false); }} className={`p-6 md:p-8 text-left border relative overflow-hidden ${selectedFormat?.id === fmt.id ? 'bg-c-sky border-c-sky text-c-dark' : 'bg-white/5 border-white/10 hover:border-c-sky/50'}`}>
                      <div className="relative z-10"><div className="flex items-center justify-between mb-3 md:mb-4"><span className={`text-lg md:text-xl font-black uppercase ${selectedFormat?.id === fmt.id ? 'text-c-dark' : 'text-white'}`}>{fmt.label}</span><div className={`font-mono text-[0.6rem] p-1 px-2 ${selectedFormat?.id === fmt.id ? 'bg-c-dark text-c-sky' : 'bg-c-sky/10 text-c-sky'}`}>.{fmt.ext}</div></div><p className={`mono-ui text-[0.5rem] md:text-[0.6rem] ${selectedFormat?.id === fmt.id ? 'text-c-dark/70' : 'text-c-steel'}`}>Class: {fmt.cat}</p></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}