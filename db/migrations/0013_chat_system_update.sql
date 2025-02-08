-- Drop old tables
DROP TABLE IF EXISTS todos;
DROP TABLE IF EXISTS creator_conversations;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS "user";

-- Modify profiles table
ALTER TABLE profiles
DROP COLUMN IF EXISTS agent_interviewer_name,
DROP COLUMN IF EXISTS voice_id;

-- Create chat_instances table
CREATE TABLE IF NOT EXISTS chat_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    messages TEXT,
    interview_guide TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create chat_responses table
CREATE TABLE IF NOT EXISTS chat_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    chat_instance_id UUID NOT NULL REFERENCES chat_instances(id) ON DELETE CASCADE,
    completion_status TEXT,
    status TEXT,
    interviewee_first_name TEXT,
    interviewee_second_name TEXT,
    interviewee_email TEXT,
    interview_start_time TIMESTAMP,
    interview_end_time TIMESTAMP,
    total_interview_minutes INTEGER,
    messages_json TEXT,
    clean_transcript TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_instances_updated_at
    BEFORE UPDATE ON chat_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_responses_updated_at
    BEFORE UPDATE ON chat_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 