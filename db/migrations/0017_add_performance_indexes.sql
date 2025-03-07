-- Migration: Add Performance Indexes
-- This migration adds indexes to frequently queried columns to improve query performance
-- These indexes don't change any data and can be applied safely to existing databases

-- Add index for chat_responses.chat_instance_id for faster joins and lookups
-- This improves performance when querying chat responses by chat instance
CREATE INDEX IF NOT EXISTS idx_chat_responses_chatinstanceid ON chat_responses(chat_instance_id);

-- Add index for chat_instances.user_id for faster filtering by user
-- This improves performance when getting a user's chat instances
CREATE INDEX IF NOT EXISTS idx_chat_instances_userid ON chat_instances(user_id);

-- Add index for chat_responses.user_id for faster user filtering
-- This improves performance when querying a user's chat responses
CREATE INDEX IF NOT EXISTS idx_chat_responses_userid ON chat_responses(user_id);

-- Add index for updated_at columns to improve sorting operations
-- This improves performance for time-based queries and sorting
CREATE INDEX IF NOT EXISTS idx_chat_instances_updatedat ON chat_instances(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_responses_updatedat ON chat_responses(updated_at DESC);

-- Add combined index for common filter + sort operations
-- This improves performance when getting a user's chats sorted by date
CREATE INDEX IF NOT EXISTS idx_chat_instances_user_date ON chat_instances(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_responses_user_date ON chat_responses(user_id, updated_at DESC);