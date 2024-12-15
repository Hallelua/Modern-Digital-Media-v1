import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Post, MediaClip } from '../types';
import AnswerForm from '../components/AnswerForm';
import MediaUpload from '../components/MediaUpload';
import MediaPlayer from '../components/MediaPlayer';

const ViewPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [mediaClips, setMediaClips] = useState<MediaClip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();

        if (postError) throw postError;
        setPost(postData);

        const { data: clipsData, error: clipsError } = await supabase
          .from('media_clips')
          .select('*')
          .eq('post_id', id);

        if (clipsError) throw clipsError;
        setMediaClips(clipsData || []);
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleCorrectAnswer = () => {
    setShowMediaUpload(true);
  };

  const handleUploadComplete = async (url: string, type: 'audio' | 'video') => {
    try {
      const { data, error } = await supabase
        .from('media_clips')
        .insert([
          {
            post_id: id,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            url,
            type,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setMediaClips([...mediaClips, data]);
    } catch (error) {
      console.error('Error saving media clip:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <p className="text-gray-700 mb-6">{post.body}</p>
        
        {!showMediaUpload && (
          <AnswerForm
            postId={post.id}
            correctAnswer={post.passage}
            onCorrectAnswer={handleCorrectAnswer}
          />
        )}

        {showMediaUpload && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Upload Media</h2>
            <MediaUpload
              postId={post.id}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        )}
      </div>

      {mediaClips.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Media Submissions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediaClips.map((clip) => (
              <MediaPlayer key={clip.id} clip={clip} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPost;