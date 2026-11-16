import React from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, Sparkles, VolumeX, Volume2 } from 'lucide-react';
import { PRESET_PROFILES, DEFAULT_SETTINGS } from './matrix';

export default function SettingsDrawer({
  isOpen,
  onToggle,
  category,
  format,
  settings,
  onChange,
  onReset
}) {
  const profiles = PRESET_PROFILES[category] || [];
  const isGif = format?.id === 'gif-video';
  const isProRes = format?.id === 'mov-prores';
  const supportsQuality = format?.id === 'jpg-std' || format?.id === 'webp-opt' || format?.id === 'avif-next';

  const updateField = (field, value) => {
    onChange({
      ...settings,
      [field]: value
    });
  };

  const applyProfile = (profileValues) => {
    onChange({
      ...settings,
      ...profileValues
    });
  };

  return (
    <div className="w-full mt-3 border border-c-sky/20 bg-c-dark/80 rounded-sm overflow-hidden transition-all">
      {/* Header bar / Toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-c-sky" />
          <span className="mono-ui text-c-sky font-bold text-[0.65rem] tracking-wider">
            TUNE PARAMETERS
          </span>
          <span className="mono-ui text-c-steel opacity-50 text-[0.55rem]">
            // {format?.label || category.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="mono-ui text-c-steel text-[0.55rem]">
            {isOpen ? 'COLLAPSE' : 'EXPAND'}
          </span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-c-sky" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-c-steel" />
          )}
        </div>
      </button>

      {/* Drawer Body */}
      {isOpen && (
        <div className="p-4 md:p-5 border-t border-c-sky/15 bg-black/20 space-y-5 animate-in fade-in duration-200">
          {/* Quick Preset Profiles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="mono-ui text-c-steel opacity-70 text-[0.55rem] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-c-sky" />
                OPTIMIZATION PRESETS
              </label>
              <button
                type="button"
                onClick={onReset}
                className="mono-ui text-c-steel hover:text-c-sky text-[0.55rem] flex items-center gap-1 transition-colors"
                title="Reset to default matrix parameters"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                RESET DEFAULTS
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyProfile(p.values)}
                  className="p-2 text-left border border-c-steel/20 bg-white/[0.02] hover:border-c-sky/50 hover:bg-c-sky/5 rounded-sm transition-all group"
                >
                  <p className="mono-ui text-[0.6rem] text-c-ice font-bold group-hover:text-c-sky transition-colors">
                    {p.label}
                  </p>
                  <p className="text-[0.5rem] text-c-steel truncate mt-0.5 opacity-60">
                    {p.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Category Controls */}
          {category === 'video' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-white/5">
              {/* Resolution Scaling */}
              <div>
                <label className="mono-ui text-c-steel text-[0.55rem] block mb-1.5">
                  RESOLUTION SCALING
                </label>
                <select
                  value={settings.scale || 'original'}
                  onChange={(e) => updateField('scale', e.target.value)}
                  className="w-full bg-c-dark border border-c-steel/30 text-c-ice p-2 text-xs font-mono focus:border-c-sky focus:outline-none rounded-sm"
                >
                  <option value="original">Original (Pass-through)</option>
                  <option value="1080p">1080p Full HD (scale=-2:1080)</option>
                  <option value="720p">720p HD (scale=-2:720)</option>
                  <option value="480p">480p SD (scale=-2:480)</option>
                </select>
              </div>

              {/* Speed Preset */}
              {!isGif && (
                <div>
                  <label className="mono-ui text-c-steel text-[0.55rem] block mb-1.5">
                    ENCODING PRESET (SPEED/EFFICIENCY)
                  </label>
                  <select
                    value={settings.preset || 'ultrafast'}
                    onChange={(e) => updateField('preset', e.target.value)}
                    className="w-full bg-c-dark border border-c-steel/30 text-c-ice p-2 text-xs font-mono focus:border-c-sky focus:outline-none rounded-sm"
                  >
                    <option value="ultrafast">ultrafast (Lowest WASM Latency)</option>
                    <option value="veryfast">veryfast (Balanced)</option>
                    <option value="medium">medium (Higher Compression)</option>
                  </select>
                </div>
              )}

              {/* Constant Rate Factor (CRF) */}
              {!isGif && !isProRes && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="mono-ui text-c-steel text-[0.55rem]">
                      QUALITY (CRF: {settings.crf ?? 23})
                    </label>
                    <span className="mono-ui text-c-sky text-[0.5rem]">
                      {(settings.crf ?? 23) <= 20 ? 'Near Lossless' : (settings.crf ?? 23) <= 26 ? 'Standard' : 'Compact'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="35"
                    step="1"
                    value={settings.crf ?? 23}
                    onChange={(e) => updateField('crf', Number(e.target.value))}
                    className="w-full accent-[#AAC7D8] cursor-pointer"
                  />
                  <div className="flex justify-between text-[0.5rem] mono-ui text-c-steel opacity-40 mt-1">
                    <span>18 (Lossless)</span>
                    <span>23 (Default)</span>
                    <span>35 (Low)</span>
                  </div>
                </div>
              )}

              {/* ProRes Profile */}
              {isProRes && (
                <div>
                  <label className="mono-ui text-c-steel text-[0.55rem] block mb-1.5">
                    PRORES PROFILE
                  </label>
                  <select
                    value={settings.proresProfile ?? '2'}
                    onChange={(e) => updateField('proresProfile', e.target.value)}
                    className="w-full bg-c-dark border border-c-steel/30 text-c-ice p-2 text-xs font-mono focus:border-c-sky focus:outline-none rounded-sm"
                  >
                    <option value="0">Profile 0 - Proxy (Lightweight)</option>
                    <option value="1">Profile 1 - LT (Balanced)</option>
                    <option value="2">Profile 2 - Standard 422</option>
                    <option value="3">Profile 3 - HQ (High Bitrate)</option>
                  </select>
                </div>
              )}

              {/* GIF Specifics */}
              {isGif && (
                <div>
                  <label className="mono-ui text-c-steel text-[0.55rem] block mb-1.5">
                    GIF FRAME RATE
                  </label>
                  <select
                    value={settings.fps || 15}
                    onChange={(e) => updateField('fps', Number(e.target.value))}
                    className="w-full bg-c-dark border border-c-steel/30 text-c-ice p-2 text-xs font-mono focus:border-c-sky focus:outline-none rounded-sm"
                  >
                    <option value="10">10 FPS (Low Size)</option>
                    <option value="15">15 FPS (Standard Web)</option>
                    <option value="24">24 FPS (Cinematic)</option>
                    <option value="30">30 FPS (Smooth)</option>
                  </select>
                </div>
              )}

              {/* Mute Audio Option */}
              <div className="flex items-center gap-3 self-end py-2">
                <button
                  type="button"
                  onClick={() => updateField('mute', !settings.mute)}
                  className={`px-3 py-2 flex items-center gap-2 border text-xs font-mono transition-all rounded-sm ${
                    settings.mute
                      ? 'bg-red-950/40 border-red-500/60 text-red-300'
                      : 'bg-white/[0.02] border-c-steel/30 text-c-steel hover:text-c-ice'
                  }`}
                >
                  {settings.mute ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-c-sky" />}
                  <span>{settings.mute ? 'AUDIO STRIPPED (-an)' : 'KEEP AUDIO STREAM'}</span>
                </button>
              </div>
            </div>
          )}

          {category === 'audio' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-white/5">
              {/* Audio Bitrate */}
              <div>
                <label className="mono-ui text-c-steel text-[0.55rem] block mb-1.5">
                  AUDIO BITRATE (-b:a)
                </label>
                <select
                  value={settings.bitrate || '320k'}
                  onChange={(e) => updateField('bitrate', e.target.value)}
                  className="w-full bg-c-dark border border-c-steel/30 text-c-ice p-2 text-xs font-mono focus:border-c-sky focus:outline-none rounded-sm"
                >
                  <option value="128k">128 kbps (Speech/Podcast)</option>
                  <option value="192k">192 kbps (Standard Web)</option>
                  <option value="256k">256 kbps (High Quality)</option>
                  <option value="320k">320 kbps (Maximum Studio)</option>
                </select>
              </div>

              {/* Sample Rate */}
              <div>
                <label className="mono-ui text-c-steel text-[0.55rem] block mb-1.5">
                  SAMPLE RATE (-ar)
                </label>
                <select
                  value={settings.sampleRate || 'original'}
                  onChange={(e) => updateField('sampleRate', e.target.value)}
                  className="w-full bg-c-dark border border-c-steel/30 text-c-ice p-2 text-xs font-mono focus:border-c-sky focus:outline-none rounded-sm"
                >
                  <option value="original">Original (Pass-through)</option>
                  <option value="44100">44.1 kHz (CD Standard)</option>
                  <option value="48000">48.0 kHz (Cinema / Broadcast)</option>
                  <option value="96000">96.0 kHz (High-Res Master)</option>
                </select>
              </div>

              {/* Channels */}
              <div>
                <label className="mono-ui text-c-steel text-[0.55rem] block mb-1.5">
                  CHANNELS (-ac)
                </label>
                <select
                  value={settings.channels || 'original'}
                  onChange={(e) => updateField('channels', e.target.value)}
                  className="w-full bg-c-dark border border-c-steel/30 text-c-ice p-2 text-xs font-mono focus:border-c-sky focus:outline-none rounded-sm"
                >
                  <option value="original">Original Channel Count</option>
                  <option value="stereo">Stereo (2 Channels)</option>
                  <option value="mono">Mono Downmix (1 Channel)</option>
                </select>
              </div>

              {/* Volume dB */}
              <div>
                <label className="mono-ui text-c-steel text-[0.55rem] block mb-1.5">
                  GAIN / VOLUME (-filter:a)
                </label>
                <select
                  value={settings.volume || '0'}
                  onChange={(e) => updateField('volume', e.target.value)}
                  className="w-full bg-c-dark border border-c-steel/30 text-c-ice p-2 text-xs font-mono focus:border-c-sky focus:outline-none rounded-sm"
                >
                  <option value="-6">-6 dB (Attenuate Loud)</option>
                  <option value="-3">-3 dB (Gentle Reduction)</option>
                  <option value="0">0 dB (Baseline Unity Gain)</option>
                  <option value="3">+3 dB (Gentle Boost)</option>
                  <option value="6">+6 dB (Loudness Boost)</option>
                </select>
              </div>
            </div>
          )}

          {category === 'image' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
              {/* Image Dimension Scaling */}
              <div>
                <label className="mono-ui text-c-steel text-[0.55rem] block mb-1.5">
                  DIMENSION SCALING
                </label>
                <select
                  value={settings.scale || 'original'}
                  onChange={(e) => updateField('scale', e.target.value)}
                  className="w-full bg-c-dark border border-c-steel/30 text-c-ice p-2 text-xs font-mono focus:border-c-sky focus:outline-none rounded-sm"
                >
                  <option value="original">Original Dimensions</option>
                  <option value="320">320px Width</option>
                  <option value="480">480px Width</option>
                  <option value="640">640px Width</option>
                  <option value="1080">1080px Width</option>
                </select>
              </div>

              {/* Compression Quality */}
              {supportsQuality && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="mono-ui text-c-steel text-[0.55rem]">
                      QUALITY ({settings.quality ?? 80}%)
                    </label>
                    <span className="mono-ui text-c-sky text-[0.5rem]">
                      {(settings.quality ?? 80) >= 90 ? 'High Fidelity' : (settings.quality ?? 80) >= 70 ? 'Balanced' : 'Compact'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={settings.quality ?? 80}
                    onChange={(e) => updateField('quality', Number(e.target.value))}
                    className="w-full accent-[#AAC7D8] cursor-pointer"
                  />
                  <div className="flex justify-between text-[0.5rem] mono-ui text-c-steel opacity-40 mt-1">
                    <span>10% (Smallest)</span>
                    <span>80% (Default)</span>
                    <span>100% (Lossless)</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
