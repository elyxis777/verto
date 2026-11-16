// Verto Transduction Matrix: Parameterized Argument Builders

export const DEFAULT_SETTINGS = {
  video: {
    scale: 'original',       // 'original' | '1080p' | '720p' | '480p'
    preset: 'ultrafast',     // 'ultrafast' | 'veryfast' | 'medium'
    crf: 23,                 // 18 - 35
    proresProfile: '2',      // '0' (Proxy) | '1' (LT) | '2' (Standard) | '3' (HQ)
    mute: false,
  },
  audio: {
    bitrate: '320k',         // '128k' | '192k' | '256k' | '320k'
    sampleRate: 'original',  // 'original' | '44100' | '48000' | '96000'
    channels: 'original',    // 'original' | 'stereo' | 'mono'
    volume: '0',             // '-6' | '-3' | '0' | '3' | '6' (dB)
  },
  image: {
    fps: 15,                 // 10 | 15 | 24 | 30 (for GIF)
    scale: 'original',       // 'original' | '320' | '480' | '640'
    quality: 80,             // 10 - 100 (for JPG/WebP/AVIF)
  }
};

export const PRESET_PROFILES = {
  video: [
    {
      id: 'fast',
      label: 'Fast Delivery',
      desc: 'Low CRF 28, ultrafast speed, lightweight',
      values: { scale: '720p', preset: 'ultrafast', crf: 28, mute: false, proresProfile: '0' }
    },
    {
      id: 'web',
      label: 'Web Optimized',
      desc: 'Balanced 1080p, standard web fidelity',
      values: { scale: '1080p', preset: 'veryfast', crf: 23, mute: false, proresProfile: '2' }
    },
    {
      id: 'archival',
      label: 'Archival Master',
      desc: 'Near-lossless CRF 18, pristine preservation',
      values: { scale: 'original', preset: 'medium', crf: 18, mute: false, proresProfile: '3' }
    }
  ],
  audio: [
    {
      id: 'speech',
      label: 'Speech / Podcast',
      desc: 'Compact 128kbps, mono downmix',
      values: { bitrate: '128k', sampleRate: '44100', channels: 'mono', volume: '0' }
    },
    {
      id: 'standard',
      label: 'Standard Music',
      desc: 'Standard 256kbps stereo',
      values: { bitrate: '256k', sampleRate: '44100', channels: 'stereo', volume: '0' }
    },
    {
      id: 'hifi',
      label: 'Hi-Fi Master',
      desc: 'Uncompromised 320kbps / 48kHz stereo',
      values: { bitrate: '320k', sampleRate: '48000', channels: 'stereo', volume: '0' }
    }
  ],
  image: [
    {
      id: 'thumbnail',
      label: 'Thumbnail / Fast',
      desc: 'Low footprint, 480px scale',
      values: { fps: 12, scale: '480', quality: 65 }
    },
    {
      id: 'balanced',
      label: 'Web Standard',
      desc: 'Balanced compression at 80% quality',
      values: { fps: 15, scale: 'original', quality: 80 }
    },
    {
      id: 'hq',
      label: 'Max Fidelity',
      desc: 'Full original resolution, 95% quality',
      values: { fps: 24, scale: 'original', quality: 95 }
    }
  ]
};

// Video Argument Builder
function buildVideoArgs(input, ext, formatId, userOpts = {}) {
  const opts = { ...DEFAULT_SETTINGS.video, ...userOpts };
  const args = ['-i', input];
  const videoFilters = [];

  // Resolution Scaling
  if (opts.scale === '1080p') videoFilters.push('scale=-2:1080');
  else if (opts.scale === '720p') videoFilters.push('scale=-2:720');
  else if (opts.scale === '480p') videoFilters.push('scale=-2:480');

  // Format-specific flags
  if (formatId === 'mp4-h264' || formatId === 'mkv-matroska') {
    if (videoFilters.length > 0) args.push('-vf', videoFilters.join(','));
    args.push('-c:v', 'libx264', '-preset', opts.preset || 'ultrafast');
    if (opts.crf) args.push('-crf', String(opts.crf));
    if (opts.mute) args.push('-an');
    else args.push('-c:a', 'aac');
  } else if (formatId === 'mp4-h265') {
    if (videoFilters.length > 0) args.push('-vf', videoFilters.join(','));
    args.push('-c:v', 'libx265', '-preset', opts.preset || 'ultrafast');
    if (opts.crf) args.push('-crf', String(opts.crf));
    if (opts.mute) args.push('-an');
    else args.push('-c:a', 'aac');
  } else if (formatId === 'webm-vp9') {
    if (videoFilters.length > 0) args.push('-vf', videoFilters.join(','));
    args.push('-c:v', 'libvpx-vp9');
    if (opts.crf) args.push('-crf', String(opts.crf), '-b:v', '0');
    if (opts.mute) args.push('-an');
    else args.push('-c:a', 'libopus');
  } else if (formatId === 'mov-prores') {
    if (videoFilters.length > 0) args.push('-vf', videoFilters.join(','));
    args.push('-c:v', 'prores', '-profile:v', String(opts.proresProfile ?? '2'));
    if (opts.mute) args.push('-an');
  } else if (formatId === 'gif-video') {
    const fps = opts.fps || 15;
    const scaleFilter = opts.scale && opts.scale !== 'original' 
      ? `scale=${opts.scale === '1080p' ? 1080 : opts.scale === '720p' ? 720 : opts.scale === '480p' ? 480 : opts.scale}:-1:flags=lanczos`
      : 'scale=480:-1:flags=lanczos';
    args.push('-vf', `fps=${fps},${scaleFilter}`);
  } else if (formatId === 'avi-legacy' || formatId === 'flv-flash') {
    if (videoFilters.length > 0) args.push('-vf', videoFilters.join(','));
    if (opts.mute) args.push('-an');
  } else {
    if (videoFilters.length > 0) args.push('-vf', videoFilters.join(','));
    if (opts.mute) args.push('-an');
  }

  args.push(`output.${ext}`);
  return args;
}

// Audio Argument Builder
function buildAudioArgs(input, ext, formatId, userOpts = {}) {
  const opts = { ...DEFAULT_SETTINGS.audio, ...userOpts };
  const args = ['-i', input, '-vn'];
  const audioFilters = [];

  // Volume Adjustment
  if (opts.volume && opts.volume !== '0') {
    audioFilters.push(`volume=${opts.volume}dB`);
  }
  if (audioFilters.length > 0) {
    args.push('-filter:a', audioFilters.join(','));
  }

  // Sampling Rate
  if (opts.sampleRate && opts.sampleRate !== 'original') {
    args.push('-ar', String(opts.sampleRate));
  }

  // Channel Downmix
  if (opts.channels === 'mono') {
    args.push('-ac', '1');
  } else if (opts.channels === 'stereo') {
    args.push('-ac', '2');
  }

  // Format specifics
  if (formatId === 'mp3-320') {
    args.push('-b:a', opts.bitrate || '320k');
  } else if (formatId === 'm4a-aac') {
    args.push('-c:a', 'aac', '-b:a', opts.bitrate || '256k');
  } else if (formatId === 'ogg-vorbis') {
    args.push('-c:a', 'libvorbis');
    if (opts.bitrate) args.push('-b:a', opts.bitrate);
  } else if (formatId === 'ac3-dolby') {
    args.push('-c:a', 'ac3');
    if (opts.bitrate) args.push('-b:a', opts.bitrate);
  }

  args.push(`output.${ext}`);
  return args;
}

// Image Argument Builder
function buildImageArgs(input, ext, formatId, userOpts = {}) {
  const opts = { ...DEFAULT_SETTINGS.image, ...userOpts };
  const args = ['-i', input];

  if (formatId === 'ico-std') {
    args.push('-vf', 'scale=256:256');
  } else if (opts.scale && opts.scale !== 'original') {
    args.push('-vf', `scale=${opts.scale}:-1`);
  }

  if (formatId === 'jpg-std') {
    // Map quality 1-100 to ffmpeg -q:v 31-1 (1 is best quality)
    const q = Math.max(1, Math.min(31, Math.round(31 - ((opts.quality || 80) / 100) * 29)));
    args.push('-q:v', String(q));
  } else if (formatId === 'webp-opt') {
    args.push('-quality', String(opts.quality || 80));
  }

  args.push(`output.${ext}`);
  return args;
}

export const FORMAT_MATRIX = {
  video: [
    { id: 'mp4-h264', label: 'MP4 (H.264/AAC)', ext: 'mp4', cat: 'Standard', cmd: (f, opts) => buildVideoArgs(f, 'mp4', 'mp4-h264', opts) },
    { id: 'mp4-h265', label: 'MP4 (H.265/HEVC)', ext: 'mp4', cat: 'Pro', cmd: (f, opts) => buildVideoArgs(f, 'mp4', 'mp4-h265', opts) },
    { id: 'mkv-matroska', label: 'MKV (Matroska)', ext: 'mkv', cat: 'Standard', cmd: (f, opts) => buildVideoArgs(f, 'mkv', 'mkv-matroska', opts) },
    { id: 'webm-vp9', label: 'WebM (VP9/Opus)', ext: 'webm', cat: 'Web', cmd: (f, opts) => buildVideoArgs(f, 'webm', 'webm-vp9', opts) },
    { id: 'mov-prores', label: 'MOV (ProRes)', ext: 'mov', cat: 'Pro', cmd: (f, opts) => buildVideoArgs(f, 'mov', 'mov-prores', opts) },
    { id: 'avi-legacy', label: 'AVI (Legacy)', ext: 'avi', cat: 'Legacy', cmd: (f, opts) => buildVideoArgs(f, 'avi', 'avi-legacy', opts) },
    { id: 'gif-video', label: 'GIF (Animated)', ext: 'gif', cat: 'Web', cmd: (f, opts) => buildVideoArgs(f, 'gif', 'gif-video', opts) },
    { id: 'flv-flash', label: 'FLV (Flash Video)', ext: 'flv', cat: 'Legacy', cmd: (f, opts) => buildVideoArgs(f, 'flv', 'flv-flash', opts) }
  ],
  audio: [
    { id: 'mp3-320', label: 'MP3 (High 320k)', ext: 'mp3', cat: 'Standard', cmd: (f, opts) => buildAudioArgs(f, 'mp3', 'mp3-320', opts) },
    { id: 'wav-pcm', label: 'WAV (Uncompressed)', ext: 'wav', cat: 'Lossless', cmd: (f, opts) => buildAudioArgs(f, 'wav', 'wav-pcm', opts) },
    { id: 'flac-lossless', label: 'FLAC (Lossless)', ext: 'flac', cat: 'Lossless', cmd: (f, opts) => buildAudioArgs(f, 'flac', 'flac-lossless', opts) },
    { id: 'm4a-aac', label: 'M4A (AAC Engine)', ext: 'm4a', cat: 'Apple', cmd: (f, opts) => buildAudioArgs(f, 'm4a', 'm4a-aac', opts) },
    { id: 'ogg-vorbis', label: 'OGG (Vorbis)', ext: 'ogg', cat: 'Web', cmd: (f, opts) => buildAudioArgs(f, 'ogg', 'ogg-vorbis', opts) },
    { id: 'aiff-pcm', label: 'AIFF (PCM)', ext: 'aiff', cat: 'Apple', cmd: (f, opts) => buildAudioArgs(f, 'aiff', 'aiff-pcm', opts) },
    { id: 'ac3-dolby', label: 'AC3 (Dolby)', ext: 'ac3', cat: 'Cinema', cmd: (f, opts) => buildAudioArgs(f, 'ac3', 'ac3-dolby', opts) },
    { id: 'wma-v2', label: 'WMA (Windows)', ext: 'wma', cat: 'Legacy', cmd: (f, opts) => buildAudioArgs(f, 'wma', 'wma-v2', opts) }
  ],
  image: [
    { id: 'png-std', label: 'PNG (Lossless)', ext: 'png', cat: 'Standard', cmd: (f, opts) => buildImageArgs(f, 'png', 'png-std', opts) },
    { id: 'jpg-std', label: 'JPG (High Quality)', ext: 'jpg', cat: 'Standard', cmd: (f, opts) => buildImageArgs(f, 'jpg', 'jpg-std', opts) },
    { id: 'webp-opt', label: 'WebP (Optimized)', ext: 'webp', cat: 'Web', cmd: (f, opts) => buildImageArgs(f, 'webp', 'webp-opt', opts) },
    { id: 'ico-std', label: 'ICO (Favicon)', ext: 'ico', cat: 'System', cmd: (f, opts) => buildImageArgs(f, 'ico', 'ico-std', opts) },
    { id: 'bmp-win', label: 'BMP (Windows)', ext: 'bmp', cat: 'System', cmd: (f, opts) => buildImageArgs(f, 'bmp', 'bmp-win', opts) },
    { id: 'tiff-arch', label: 'TIFF (Archive)', ext: 'tiff', cat: 'Pro', cmd: (f, opts) => buildImageArgs(f, 'tiff', 'tiff-arch', opts) },
    { id: 'tga-targa', label: 'TGA (Targa)', ext: 'tga', cat: 'Pro', cmd: (f, opts) => buildImageArgs(f, 'tga', 'tga-targa', opts) },
    { id: 'avif-next', label: 'AVIF (Next-Gen)', ext: 'avif', cat: 'Web', cmd: (f, opts) => buildImageArgs(f, 'avif', 'avif-next', opts) }
  ]
};
