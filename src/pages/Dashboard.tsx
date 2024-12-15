import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Post, MediaClip } from '../types';
import { loadFFmpeg } from '../lib/ffmpeg';
import { Download, Loader } from 'lucide-react';

const Dashboard = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [mediaClips, setMediaClips] = useState<MediaClip[]>([]);
  const [merging, setMerging] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, []);

  const fetchMediaClips = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('media_clips')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMediaClips(data || []);
      setSelectedPost(posts.find(p => p.id === postId) || null);
    } catch (error) {
      console.error('Error fetching media clips:', error);
    }
  };

  const mergeClips = async () => {
    if (!mediaClips.length) return;
    setMerging(true);

    try {
      const FFmpeg = await loadFFmpeg();
      const ffmpeg = FFmpeg.createFFmpeg({ log: true });
      await ffmpeg.load();

      // Download all clips
      for (let i = 0; i < mediaClips.length; i++) {
        const response = await fetch(mediaClips[i].url);
        const buffer = await response.arrayBuffer();
        ffmpeg.FS('writeFile', `clip${i}.webm`, new Uint8Array(buffer));
      }

      // Create concat file
      const concatContent = mediaClips
        .map((_, i) => `file 'clip${i}.webm'`)
        .join('\n');
      ffmpeg.FS('writeFile', 'concat.txt', concatContent);

      // Merge clips and convert to MP4
      await ffmpeg.run(
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-c:v', 'libx264', // Use H.264 codec for video
        '-c:a', 'aac',     // Use AAC codec for audio
        '-strict', 'experimental',
        '-b:a', '192k',    // Audio bitrate
        '-movflags', '+faststart', // Enable fast start for web playback
        'output.mp4'       // Output as MP4
      );

      // Download merged file
      const data = ffmpeg.FS('readFile', 'output.mp4');
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged_${selectedPost?.id}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error merging clips:', error);
    } finally {
      setMerging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Your Posts</h2>
          <div className="space-y-2">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => fetchMediaClips(post.id)}
                className={`w-full text-left p-3 rounded-lg ${
                  selectedPost?.id === post.id
                    ? 'bg-indigo-50 border-2 border-indigo-500'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <h3 className="font-medium">{post.title}</h3>
                <p className="text-sm text-gray-500 truncate">{post.body}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-3">
          {selectedPost ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Media Clips for "{selectedPost.title}"
                </h2>
                {mediaClips.length > 0 && (
                  <button
                    onClick={mergeClips}
                    disabled={merging}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {merging ? (
                      <>
                        <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Merging...
                      </>
                    ) : (
                      <>
                        <Download className="-ml-1 mr-2 h-5 w-5" />
                        Merge & Download MP4
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mediaClips.map((clip) => (
                  <div key={clip.id} className="bg-white rounded-lg shadow-md p-4">
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
                ))}
              </div>

              {mediaClips.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg">
                  <p className="text-gray-500">No media clips uploaded yet.</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">Select a post to view its media clips.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;