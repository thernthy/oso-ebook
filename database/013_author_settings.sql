-- Add author settings columns (IP blocking, announcements)
-- Migration: 013_author_settings

ALTER TABLE authors 
ADD COLUMN ip_block_list JSON DEFAULT '[]',
ADD COLUMN announcements JSON DEFAULT '[]';