-- This script sets up the database schema for the chat application,
-- including support for multiple conversations.
--
-- To use this script:
-- 1. IMPORTANT: If you have an old 'messages' table, this script
--    will delete it and all its data.
-- 2. Navigate to the "SQL Editor" in your Supabase project dashboard.
-- 3. Click "New query" and paste the entire content of this file.
-- 4. Run the query.
-- 5. IMPORTANT: After the tables are created, go to Authentication -> Policies,
--    find the 'conversations' and 'messages' tables, and click "Enable RLS" for both.

-- Drop the old messages table to start fresh.
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations; -- Also drop conversations table for clean slate

-- Create a table to store conversations.
CREATE TABLE conversations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE conversations IS 'Stores a list of conversations, each with a title.';

-- Create the messages table with a link to the conversations table.
CREATE TABLE messages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  conversation_id BIGINT REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE messages IS 'Stores chat messages for all conversations.';

-- RLS Policies for conversations
-- This policy allows users to see, create, update, and delete their own conversations.
CREATE POLICY "Users can manage their own conversations"
ON conversations FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for messages
-- This policy allows users to see, create, update, and delete messages
-- that belong to conversations they own.
CREATE POLICY "Users can manage messages in their own conversations"
ON messages FOR ALL
USING ( (select auth.uid()) = user_id );
