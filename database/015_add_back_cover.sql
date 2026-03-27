USE oso_ebook;

ALTER TABLE books ADD COLUMN back_cover_url VARCHAR(500) NULL AFTER cover_url;
