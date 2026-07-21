export const FORMAT_MATRIX = {
  video: [
    { id: 'mp4-h264', label: 'MP4 (H.264/AAC)', ext: 'mp4', cat: 'Standard', cmd: (f) => ['-i', f, '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', 'output.mp4'] },
    { id: 'mp4-h265', label: 'MP4 (H.265/HEVC)', ext: 'mp4', cat: 'Pro', cmd: (f) => ['-i', f, '-c:v', 'libx265', '-preset', 'ultrafast', '-c:a', 'aac', 'output.mp4'] },
    { id: 'mkv-matroska', label: 'MKV (Matroska)', ext: 'mkv', cat: 'Standard', cmd: (f) => ['-i', f, '-c:v', 'libx264', '-c:a', 'aac', 'output.mkv'] },
    { id: 'webm-vp9', label: 'WebM (VP9/Opus)', ext: 'webm', cat: 'Web', cmd: (f) => ['-i', f, '-c:v', 'libvpx-vp9', '-c:a', 'libopus', 'output.webm'] },
    { id: 'mov-prores', label: 'MOV (ProRes)', ext: 'mov', cat: 'Pro', cmd: (f) => ['-i', f, '-c:v', 'prores', 'output.mov'] },
    { id: 'avi-legacy', label: 'AVI (Legacy)', ext: 'avi', cat: 'Legacy', cmd: (f) => ['-i', f, 'output.avi'] },
    { id: 'gif-video', label: 'GIF (Animated)', ext: 'gif', cat: 'Web', cmd: (f) => ['-i', f, '-vf', 'scale=480:-1', 'output.gif'] },
    { id: 'flv-flash', label: 'FLV (Flash Video)', ext: 'flv', cat: 'Legacy', cmd: (f) => ['-i', f, 'output.flv'] }
  ],
  audio: [
    { id: 'mp3-320', label: 'MP3 (High 320k)', ext: 'mp3', cat: 'Standard', cmd: (f) => ['-i', f, '-b:a', '320k', 'output.mp3'] },
    { id: 'wav-pcm', label: 'WAV (Uncompressed)', ext: 'wav', cat: 'Lossless', cmd: (f) => ['-i', f, 'output.wav'] },
    { id: 'flac-lossless', label: 'FLAC (Lossless)', ext: 'flac', cat: 'Lossless', cmd: (f) => ['-i', f, 'output.flac'] },
    { id: 'm4a-aac', label: 'M4A (AAC Engine)', ext: 'm4a', cat: 'Apple', cmd: (f) => ['-i', f, '-c:a', 'aac', '-b:a', '256k', 'output.m4a'] },
    { id: 'ogg-vorbis', label: 'OGG (Vorbis)', ext: 'ogg', cat: 'Web', cmd: (f) => ['-i', f, '-c:a', 'libvorbis', 'output.ogg'] },
    { id: 'aiff-pcm', label: 'AIFF (PCM)', ext: 'aiff', cat: 'Apple', cmd: (f) => ['-i', f, 'output.aiff'] },
    { id: 'ac3-dolby', label: 'AC3 (Dolby)', ext: 'ac3', cat: 'Cinema', cmd: (f) => ['-i', f, '-c:a', 'ac3', 'output.ac3'] },
    { id: 'wma-v2', label: 'WMA (Windows)', ext: 'wma', cat: 'Legacy', cmd: (f) => ['-i', f, 'output.wma'] }
  ],
  image: [
    { id: 'png-std', label: 'PNG (Lossless)', ext: 'png', cat: 'Standard', cmd: (f) => ['-i', f, 'output.png'] },
    { id: 'jpg-std', label: 'JPG (High Quality)', ext: 'jpg', cat: 'Standard', cmd: (f) => ['-i', f, '-q:v', '2', 'output.jpg'] },
    { id: 'webp-opt', label: 'WebP (Optimized)', ext: 'webp', cat: 'Web', cmd: (f) => ['-i', f, 'output.webp'] },
    { id: 'ico-std', label: 'ICO (Favicon)', ext: 'ico', cat: 'System', cmd: (f) => ['-i', f, '-vf', 'scale=256:256', 'output.ico'] },
    { id: 'bmp-win', label: 'BMP (Windows)', ext: 'bmp', cat: 'System', cmd: (f) => ['-i', f, 'output.bmp'] },
    { id: 'tiff-arch', label: 'TIFF (Archive)', ext: 'tiff', cat: 'Pro', cmd: (f) => ['-i', f, 'output.tiff'] },
    { id: 'tga-targa', label: 'TGA (Targa)', ext: 'tga', cat: 'Pro', cmd: (f) => ['-i', f, 'output.tga'] },
    { id: 'avif-next', label: 'AVIF (Next-Gen)', ext: 'avif', cat: 'Web', cmd: (f) => ['-i', f, 'output.avif'] }
  ]
};