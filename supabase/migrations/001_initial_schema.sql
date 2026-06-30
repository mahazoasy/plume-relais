-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  reputation INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'completed')),
  max_contributions INTEGER NOT NULL,
  current_turn INTEGER DEFAULT 1,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
  turn_duration INTEGER NOT NULL, -- in minutes
  blind_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story participations
CREATE TABLE story_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  has_written_current_turn BOOLEAN DEFAULT FALSE,
  UNIQUE(story_id, user_id)
);

-- Contributions
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  turn_number INTEGER NOT NULL,
  is_canon BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contribution_id UUID REFERENCES contributions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contribution_id, user_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('turn_start', 'vote_open', 'story_completed', 'contribution_accepted')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_visibility ON stories(visibility);
CREATE INDEX idx_contributions_story_turn ON contributions(story_id, turn_number);
CREATE INDEX idx_votes_story_turn ON votes(story_id, turn_number);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contributions_updated_at
  BEFORE UPDATE ON contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Stories policies
CREATE POLICY "Anyone can view public stories" ON stories
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Participants can view private stories" ON stories
  FOR SELECT USING (
    visibility = 'private' AND
    EXISTS (
      SELECT 1 FROM story_participations
      WHERE story_id = stories.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Story creators can update stories" ON stories
  FOR UPDATE USING (created_by = auth.uid());

-- Contributions policies
CREATE POLICY "Participants can view contributions" ON contributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = contributions.story_id
      AND (
        stories.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM story_participations
          WHERE story_id = stories.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Participants can add contributions" ON contributions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM story_participations
      WHERE story_id = contributions.story_id AND user_id = auth.uid()
    )
  );

-- Votes policies
CREATE POLICY "Participants can vote" ON votes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM story_participations
      WHERE story_id = votes.story_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view votes" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM story_participations
      WHERE story_id = votes.story_id AND user_id = auth.uid()
    )
  );