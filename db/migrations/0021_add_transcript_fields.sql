-- Migration: Add Transcript Analysis Fields
-- This migration adds two new text fields to the chat_responses table
-- for storing user word analysis and transcript summaries

-- Add user_words field to store word analysis data
ALTER TABLE chat_responses ADD COLUMN IF NOT EXISTS user_words TEXT;

-- Add transcript_summary field to store summarized transcript content
ALTER TABLE chat_responses ADD COLUMN IF NOT EXISTS transcript_summary TEXT; 