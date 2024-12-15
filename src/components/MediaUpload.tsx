import React, { useState, useRef } from 'react';
import { Upload, Video, Mic } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MediaUploadProps {
  postId: string;
  onUploadComplete: (url: string, type: 'audio' | 'video') => void;
}

const MediaUpload = ({ postId, onUploadComplete }: MediaUploadProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaType, setMediaType] = useState<'audio' | 'video'>('video');
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mediaType === 'video',
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mediaType === 'video' ? 'video/webm;codecs=h264' : 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaType === 'video' ? 'video/webm' : 'audio/webm',
        });
        await processAndUploadMedia(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks in the stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processAndUploadMedia = async (blob: Blob) => {
    setUploading(true);
    try {
      // Convert to MP4 if it's a video
      if (mediaType === 'video') {
        const FFmpeg = await (await import('../lib/ffmpeg')).loadFFmpeg();
        const ffmpeg = FFmpeg.createFFmpeg({ log: true });
        await ffmpeg.load();

        const arrayBuffer = await blob.arrayBuffer();
        ffmpeg.FS('writeFile', 'input.webm', new Uint8Array(arrayBuffer));

        await ffmpeg.run(
          '-i', 'input.webm',
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-strict', 'experimental',
          '-b:a', '192k',
          '-movflags', '+faststart',
          'output.mp4'
        );

        const data = ffmpeg.FS('readFile', 'output.mp4');
        blob = new Blob([data.buffer], { type: 'video/mp4' });
      }

      const filename = `${postId}/${Date.now()}.${mediaType === 'video' ? 'mp4' : 'webm'}`;
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filename, blob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filename);

      onUploadComplete(publicUrl, mediaType);
    } catch (error) {
      console.error('Error uploading media:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <button
          onClick={() => setMediaType('video')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
            mediaType === 'video' ? 'bg-indigo-600 text-white' : 'bg-gray-100'
          }`}
        >
          <Video className="w-5 h-5" />
          <span>Video</span>
        </button>
        <button
          onClick={() => setMediaType('audio')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
            mediaType === 'audio' ? 'bg-indigo-600 text-white' : 'bg-gray-100'
          }`}
        >
          <Mic className="w-5 h-5" />
          <span>Audio</span>
        </button>
      </div>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={uploading}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
          isRecording ? 'bg-red-600' : 'bg-indigo-600'
        } text-white`}
      >
        {isRecording ? (
          <>
            <span className="animate-pulse">●</span>
            <span>Stop Recording</span>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            <span>Start Recording</span>
          </>
        )}
      </button>

      {uploading && (
        <p className="text-sm text-gray-600">
          Processing and uploading media... Please wait.
        </p>
      )}
    </div>
  );
};

export default MediaUpload;