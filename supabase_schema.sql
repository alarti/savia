-- This script sets up the 'messages' table in your Supabase project.
--
-- To use this script:
-- 1. Navigate to the "SQL Editor" in your Supabase project dashboard.
-- 2. Click "New query" and paste the entire content of this file.
-- 3. Run the query.
-- 4. IMPORTANT: After the table is created, go to Authentication -> Policies,
--    find the 'messages' table, and click "Enable RLS".

-- Creates the 'messages' table to store chat history.
CREATE TABLE messages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  sender TEXT NOT NULL,
  content TEXT NOT NULL
);

-- Adds a comment to the table for clarity in the Supabase UI.
COMMENT ON TABLE messages IS 'Stores chat messages for all users.';

-- Sets up a policy so users can only view their own messages.
-- This policy will only be enforced if Row Level Security (RLS) is enabled on the table.
CREATE POLICY "Users can read their own messages"
ON messages FOR SELECT
USING (auth.uid() = user_id);

-- Sets up a policy so users can only create messages for themselves.
-- This policy will only be enforced if Row Level Security (RLS) is enabled on the table.
CREATE POLICY "Users can create their own messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = user_id);
