import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface MediaPreviewProps {
  url: string;
  type: 'audio' | 'video';
}

const MediaPreview = ({ url, type }: MediaPreviewProps) => {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const mediaRef = React.useRef<HTMLVideoElement | HTMLAudioElement>(null);

  const togglePlay = () => {
    if (mediaRef.current) {
      if (playing) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="relative">
        {type === 'video' ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={url}
            className="w-full rounded"
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={url}
            className="w-full"
            onEnded={() => setPlaying(false)}
          />
        )}

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black bg-opacity-50 rounded-lg px-4 py-2">
          <button
            onClick={togglePlay}
            className="text-white hover:text-indigo-200"
          >
            {playing ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="text-white hover:text-indigo-200"
          >
            {muted ? (
              <VolumeX className="h-6 w-6" />
            ) : (
              <Volume2 className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaPreview;