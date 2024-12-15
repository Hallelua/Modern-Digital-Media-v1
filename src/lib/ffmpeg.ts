export const loadFFmpeg = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.2/dist/ffmpeg.min.js";
    script.onload = () => resolve(window.FFmpeg);
    script.onerror = () => reject(new Error("Failed to load FFmpeg.wasm"));
    document.body.appendChild(script);
  });
};