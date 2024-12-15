import { loadFFmpeg } from './ffmpeg';

export const processMedia = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<Blob> => {
  const FFmpeg = await loadFFmpeg();
  const ffmpeg = FFmpeg.createFFmpeg({
    log: true,
    progress: ({ ratio }: { ratio: number }) => {
      onProgress(ratio * 100);
    },
  });

  await ffmpeg.load();

  ffmpeg.FS('writeFile', file.name, await file.arrayBuffer());

  const outputName = `processed_${file.name}`;
  const fileExt = file.name.split('.').pop()?.toLowerCase();

  if (fileExt === 'webm' || fileExt === 'mp4') {
    // Process video: compress and optimize
    await ffmpeg.run(
      '-i', file.name,
      '-c:v', 'libvpx-vp9',
      '-crf', '30',
      '-b:v', '0',
      '-c:a', 'libopus',
      outputName
    );
  } else if (fileExt === 'mp3' || fileExt === 'wav') {
    // Process audio: normalize and compress
    await ffmpeg.run(
      '-i', file.name,
      '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
      '-c:a', 'libopus',
      '-b:a', '128k',
      outputName
    );
  }

  const data = ffmpeg.FS('readFile', outputName);
  return new Blob([data.buffer], { type: `${file.type}` });
};

export const mergeMediaClips = async (
  clips: { url: string; type: 'audio' | 'video' }[],
  onProgress: (progress: number) => void
): Promise<Blob> => {
  const FFmpeg = await loadFFmpeg();
  const ffmpeg = FFmpeg.createFFmpeg({
    log: true,
    progress: ({ ratio }: { ratio: number }) => {
      onProgress(ratio * 100);
    },
  });

  await ffmpeg.load();

  // Download and write all clips
  for (let i = 0; i < clips.length; i++) {
    const response = await fetch(clips[i].url);
    const buffer = await response.arrayBuffer();
    ffmpeg.FS('writeFile', `clip${i}.webm`, new Uint8Array(buffer));
  }

  // Create concat file
  const concatContent = clips
    .map((_, i) => `file 'clip${i}.webm'`)
    .join('\n');
  ffmpeg.FS('writeFile', 'concat.txt', concatContent);

  // Merge clips
  await ffmpeg.run(
    '-f', 'concat',
    '-safe', '0',
    '-i', 'concat.txt',
    '-c', 'copy',
    'output.webm'
  );

  const data = ffmpeg.FS('readFile', 'output.webm');
  return new Blob([data.buffer], { type: 'video/webm' });
};