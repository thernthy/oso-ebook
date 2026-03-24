USE oso_ebook;

-- Add 2FA and settings columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS nickname VARCHAR(50) NULL;

-- Add is_favorite column to bookmarks table for favorites feature
ALTER TABLE bookmarks
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Create index for favorites
CREATE INDEX IF NOT EXISTS idx_bookmarks_favorite ON bookmarks(reader_id, is_favorite) WHERE is_favorite = TRUE;
