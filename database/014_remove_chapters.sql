-- Migration: Remove chapters feature
-- Date: 2026-03-26

-- Drop chapters table
DROP TABLE IF EXISTS chapters;

-- Remove chapters_found from ai_jobs
ALTER TABLE ai_jobs DROP COLUMN IF EXISTS chapters_found;

-- Remove current_chapter_id from reading_progress
ALTER TABLE reading_progress DROP COLUMN IF EXISTS current_chapter_id;

-- Remove chapter_id from bookmarks
ALTER TABLE bookmarks DROP COLUMN IF EXISTS chapter_id;

-- Remove chapters_read from books
ALTER TABLE books DROP COLUMN IF EXISTS chapters_read;

-- Remove total_chapters from books
ALTER TABLE books DROP COLUMN IF EXISTS total_chapters;

-- Remove word_count related columns if they were chapter-based
-- (keeping total_words from ai_jobs)

SELECT 'Chapters migration completed' AS status;
