-- Supabase WebRTC Signaling Database Schema
-- Run this in your Supabase SQL Editor

-- Create rooms table to track active call rooms
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 10
);

-- Create participants table to track who is in each room
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  peer_id TEXT UNIQUE NOT NULL,
  username TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_video_enabled BOOLEAN DEFAULT false,
  is_audio_enabled BOOLEAN DEFAULT true,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create signaling_messages table for storing WebRTC signaling data
CREATE TABLE IF NOT EXISTS signaling_messages (
  id BIGSERIAL PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  from_peer_id TEXT NOT NULL,
  to_peer_id TEXT,
  message_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE signaling_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
CREATE POLICY "Anyone can view active rooms"
  ON rooms FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Creator can update their rooms"
  ON rooms FOR UPDATE
  USING (created_by = auth.uid());

-- RLS Policies for participants
-- SECURITY NOTE: These policies allow anonymous access for demo/testing.
-- ⚠️ WARNING: Any client can update/delete any participant record.
-- This is acceptable for testing but NOT for production.
--
-- PRODUCTION OPTIONS:
-- Option 1: Add Supabase Auth and restrict to authenticated users
-- Option 2: Use service_role key in backend-only operations
-- Option 3: Add peer_id validation (requires custom claims or session variables)
--
-- For now, we allow all operations to enable testing without auth setup.

CREATE POLICY "Anyone can view participants"
  ON participants FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join as participant"
  ON participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update participants"
  ON participants FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete participants"
  ON participants FOR DELETE
  USING (true);

-- PRODUCTION RLS EXAMPLE (commented out - enable after setting up Supabase Auth):
-- DROP POLICY IF EXISTS "Anyone can update participants" ON participants;
-- DROP POLICY IF EXISTS "Anyone can delete participants" ON participants;
--
-- CREATE POLICY "Authenticated users update participants"
--   ON participants FOR UPDATE
--   TO authenticated
--   USING (true);
--
-- CREATE POLICY "Authenticated users delete participants"
--   ON participants FOR DELETE
--   TO authenticated
--   USING (true);

-- RLS Policies for signaling_messages
CREATE POLICY "Anyone can view signaling messages"
  ON signaling_messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create signaling messages"
  ON signaling_messages FOR INSERT
  WITH CHECK (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE signaling_messages;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_participants_room_id ON participants(room_id);
CREATE INDEX IF NOT EXISTS idx_participants_peer_id ON participants(peer_id);
CREATE INDEX IF NOT EXISTS idx_signaling_room_id ON signaling_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_signaling_to_peer ON signaling_messages(to_peer_id);
CREATE INDEX IF NOT EXISTS idx_signaling_created_at ON signaling_messages(created_at);

-- Function to clean up old signaling messages (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_signaling_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM signaling_messages 
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove inactive participants
CREATE OR REPLACE FUNCTION cleanup_inactive_participants()
RETURNS void AS $$
BEGIN
  DELETE FROM participants 
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete participant by peer_id (for cleanup on page unload)
CREATE OR REPLACE FUNCTION delete_participant(p_peer_id TEXT)
RETURNS void AS $$
BEGIN
  DELETE FROM participants WHERE peer_id = p_peer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create scheduled job to cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-signaling', '*/15 * * * *', 'SELECT cleanup_old_signaling_messages()');
-- SELECT cron.schedule('cleanup-participants', '*/5 * * * *', 'SELECT cleanup_inactive_participants()');
