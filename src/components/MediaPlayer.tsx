import React from 'react';
import { MediaClip } from '../types';

interface MediaPlayerProps {
  clip: MediaClip;
}

const MediaPlayer = ({ clip }: MediaPlayerProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {clip.type === 'video' ? (
        <video
          src={clip.url}
          controls
          className="w-full rounded"
          preload="metadata"
        />
      ) : (
        <audio
          src={clip.url}
          controls
          className="w-full"
          preload="metadata"
        />
      )}
      <div className="mt-2 text-sm text-gray-500">
        Uploaded {new Date(clip.created_at).toLocaleDateString()}
      </div>
    </div>
  );
};

export default MediaPlayer;