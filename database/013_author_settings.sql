-- Add author settings columns (IP blocking, announcements)
-- Migration: 013_author_settings

ALTER TABLE authors 
ADD COLUMN IF NOT EXISTS ip_block_list JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS announcements JSONB DEFAULT '[]';