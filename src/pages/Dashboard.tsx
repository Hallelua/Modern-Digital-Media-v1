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
  const [blobUrls, setBlobUrls] = useState<string[]>([]);

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

  const fetchAndStoreMediaClips = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('media_clips')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch files and store blob URLs
      const tempBlobUrls: string[] = [];
      for (const clip of data) {
        const response = await fetch(clip.url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        tempBlobUrls.push(blobUrl);
        sessionStorage.setItem(clip.id, blobUrl); // Temporary storage
      }

      setBlobUrls(tempBlobUrls);
      setMediaClips(data || []);
      setSelectedPost(posts.find(p => p.id === postId) || null);
    } catch (error) {
      console.error('Error fetching and storing media clips:', error);
    }
  };

  const enableCrossOriginIsolation = () => {
    if (!document.featurePolicy?.allowsFeature('cross-origin-isolation')) {
      document.write(
        `<script>document.domain='${window.location.hostname}';</script>`
      );
    }
  };

  const disableCrossOriginIsolation = () => {
    sessionStorage.clear();
    blobUrls.forEach(url => URL.revokeObjectURL(url));
    setBlobUrls([]);
  };

  const mergeClips = async () => {
    if (!mediaClips.length) return;
    setMerging(true);
    enableCrossOriginIsolation();

    try {
      const FFmpeg = await loadFFmpeg();
      const ffmpeg = FFmpeg.createFFmpeg({ log: true });
      await ffmpeg.load();

      // Write fetched Blob URLs to FFmpeg
      for (let i = 0; i < mediaClips.length; i++) {
        const response = await fetch(blobUrls[i]);
        const buffer = await response.arrayBuffer();
        ffmpeg.FS('writeFile', `clip${i}.webm`, new Uint8Array(buffer));
      }

      // Create concat file
      const concatContent = mediaClips
        .map((_, i) => `file 'clip${i}.webm'`)
        .join('\n');
      ffmpeg.FS('writeFile', 'concat.txt', concatContent);

      // Merge clips
      await ffmpeg.run(
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-b:a', '192k',
        'output.mp4'
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
      disableCrossOriginIsolation();
    }
  };

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
                onClick={() => fetchAndStoreMediaClips(post.id)}
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
                {mediaClips.map((clip, i) => (
                  <div key={clip.id} className="bg-white rounded-lg shadow-md p-4">
                    {clip.type === 'video' ? (
                      <video
                        src={blobUrls[i]}
                        controls
                        className="w-full rounded"
                        preload="metadata"
                      />
                    ) : (
                      <audio
                        src={blobUrls[i]}
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
