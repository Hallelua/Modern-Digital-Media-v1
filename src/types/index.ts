export interface Post {
  id: string;
  title: string;
  body: string;
  passage: string;
  user_id: string;
  created_at: string;
}

export interface Answer {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_correct: boolean;
  attempts: number;
  created_at: string;
}

export interface MediaClip {
  id: string;
  post_id: string;
  user_id: string;
  url: string;
  type: 'audio' | 'video';
  created_at: string;
}