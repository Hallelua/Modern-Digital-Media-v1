import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
      <p className="text-gray-600 mb-4 line-clamp-3">{post.body}</p>
      <Link
        to={`/post/${post.id}`}
        className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
      >
        View Post <ArrowRight className="w-4 h-4 ml-1" />
      </Link>
    </div>
  );
};

export default PostCard;