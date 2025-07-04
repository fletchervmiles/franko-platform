-- Add column to allow modals to request name/email on direct link
ALTER TABLE modals
  ADD COLUMN IF NOT EXISTS ask_name_email_on_direct_link BOOLEAN DEFAULT FALSE NOT NULL; 