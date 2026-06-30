export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  reputation: number;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  cover_image?: string;
  created_by: string;
  status: 'open' | 'in_progress' | 'completed';
  max_contributions: number;
  current_turn: number;
  visibility: 'public' | 'private';
  created_at: string;
  updated_at: string;
  turn_duration: number; // in minutes
  blind_mode: boolean;
}

export interface Contribution {
  id: string;
  story_id: string;
  author_id: string;
  content: string;
  turn_number: number;
  is_canon: boolean;
  created_at: string;
  votes_count: number;
  author?: User;
}

export interface Vote {
  id: string;
  contribution_id: string;
  user_id: string;
  story_id: string;
  turn_number: number;
  created_at: string;
}

export interface StoryParticipation {
  id: string;
  story_id: string;
  user_id: string;
  joined_at: string;
  has_written_current_turn: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'turn_start' | 'vote_open' | 'story_completed' | 'contribution_accepted';
  title: string;
  message: string;
  story_id?: string;
  read: boolean;
  created_at: string;
}