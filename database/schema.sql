-- =============================================
-- OSO E-BOOK PLATFORM - Database Schema v1.0
-- =============================================

-- Core Entity: OSO (System Owner)
-- Partners (ATH) are linked to OSO
-- Authors and Users are platform users with different roles

-- =============================================
-- 1. CORE SYSTEM TABLES
-- =============================================

CREATE TABLE oso_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSON,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform settings, features toggles, etc.
INSERT INTO oso_config (key, value, description) VALUES
('platform_name', '"OSO E-Book"', 'Platform display name'),
('features', '{"payments": false, "ads": false, "subscriptions": false}', 'Enabled features'),
('version', '"1.0.0"', 'Platform version');

-- =============================================
-- 2. USER ROLES & ACCOUNTS
-- =============================================

CREATE TYPE user_role AS ENUM ('oso_admin', 'partner', 'author', 'reader');
CREATE TYPE account_status AS ENUM ('pending', 'active', 'suspended', 'banned');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile
    display_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    
    -- Role & Status
    role user_role DEFAULT 'reader',
    status account_status DEFAULT 'pending',
    
    -- Verification
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    
    -- Deletion (soft delete)
    deleted_at TIMESTAMP,
    deleted_by INTEGER REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- =============================================
-- 3. HIERARCHY: PARTNERS (ATH)
-- =============================================

CREATE TABLE partners (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Partner Details
    company_name VARCHAR(255),
    business_registration VARCHAR(100),
    tax_id VARCHAR(100),
    
    -- Contact
    contact_phone VARCHAR(50),
    contact_address JSON, -- {street, city, country, postal}
    
    -- Contract
    contract_start_date DATE,
    contract_end_date DATE,
    commission_rate DECIMAL(5,2) DEFAULT 0.00, -- percentage
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    verified_by INTEGER REFERENCES users(id), -- OSO admin who verified
    verified_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. HIERARCHY: AUTHORS
-- =============================================

CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Author Profile
    pen_name VARCHAR(100), -- Can be different from display_name
    signature TEXT, -- Author bio/signature
    website_url TEXT,
    social_links JSON, -- {twitter, facebook, instagram, etc}
    
    -- Partner Relationship (optional - author can be independent or under partner)
    partner_id INTEGER REFERENCES partners(id),
    partner_contract JSON, -- custom terms if under partner
    
    -- Stats
    total_books INTEGER DEFAULT 0,
    total_reads INTEGER DEFAULT 0,
    total_followers INTEGER DEFAULT 0,
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by INTEGER REFERENCES users(id),
    verified_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Author can be managed by partner or OSO directly
CREATE INDEX idx_authors_partner ON authors(partner_id);

-- =============================================
-- 5. HIERARCHY: READERS
-- =============================================

CREATE TABLE readers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Preferences
    preferred_languages TEXT[], -- ['en', 'kh', 'th']
    preferred_genres INTEGER[], -- array of genre_ids
    
    -- Activity Stats
    books_read INTEGER DEFAULT 0,
    chapters_read INTEGER DEFAULT 0,
    reading_time_minutes INTEGER DEFAULT 0,
    
    -- Subscription (for later)
    subscription_tier VARCHAR(50), -- free, basic, premium
    subscription_expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 6. BOOKS & CONTENT
-- =============================================

CREATE TYPE book_status AS ENUM ('draft', 'published', 'archived', 'suspended');
CREATE TYPE content_rating AS ENUM ('everyone', 'teen', 'mature', 'adult');

CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES genres(id), -- for sub-genres
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    
    -- Ownership
    author_id INTEGER NOT NULL REFERENCES authors(id),
    partner_id INTEGER REFERENCES partners(id), -- if published under partner
    
    -- Content
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary TEXT,
    cover_image_url TEXT,
    
    -- Metadata
    genre_id INTEGER REFERENCES genres(id),
    tags TEXT[], -- array of tags
    language VARCHAR(10) DEFAULT 'en', -- ISO 639-1
    content_rating content_rating DEFAULT 'everyone',
    
    -- Status
    status book_status DEFAULT 'draft',
    published_at TIMESTAMP,
    
    -- Stats
    total_chapters INTEGER DEFAULT 0,
    total_words INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_bookmarks INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Soft delete
    deleted_at TIMESTAMP,
    deleted_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_books_author ON books(author_id);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_genre ON books(genre_id);
CREATE INDEX idx_books_published ON books(published_at) WHERE status = 'published';

-- =============================================
-- 7. CHAPTERS
-- =============================================

CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    
    -- Content
    title VARCHAR(255),
    slug VARCHAR(255),
    content TEXT NOT NULL, -- HTML or Markdown
    word_count INTEGER DEFAULT 0,
    
    -- Status
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    is_free BOOLEAN DEFAULT TRUE, -- false = requires unlock/payment later
    
    -- Stats
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(book_id, chapter_number)
);

CREATE INDEX idx_chapters_book ON chapters(book_id);
CREATE INDEX idx_chapters_published ON chapters(book_id, is_published, chapter_number) WHERE is_published = TRUE;

-- =============================================
-- 8. READING PROGRESS & BOOKMARKS
-- =============================================

CREATE TABLE reading_progress (
    id SERIAL PRIMARY KEY,
    reader_id INTEGER NOT NULL REFERENCES readers(id),
    book_id INTEGER NOT NULL REFERENCES books(id),
    
    current_chapter_id INTEGER REFERENCES chapters(id),
    progress_percentage DECIMAL(5,2) DEFAULT 0.00, -- 0-100
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reading_time_seconds INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(reader_id, book_id)
);

CREATE TABLE bookmarks (
    id SERIAL PRIMARY KEY,
    reader_id INTEGER NOT NULL REFERENCES readers(id),
    book_id INTEGER NOT NULL REFERENCES books(id),
    chapter_id INTEGER REFERENCES chapters(id),
    note TEXT, -- optional note on bookmark
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(reader_id, book_id)
);

-- =============================================
-- 9. FOLLOWERS & SOCIAL
-- =============================================

CREATE TABLE follows (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER NOT NULL REFERENCES users(id), -- reader or anyone
    following_id INTEGER NOT NULL REFERENCES users(id), -- author they follow
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- =============================================
-- 10. REVIEWS & COMMENTS
-- =============================================

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    reader_id INTEGER NOT NULL REFERENCES readers(id),
    
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    
    likes INTEGER DEFAULT 0,
    is_spam BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(book_id, reader_id)
);

CREATE INDEX idx_reviews_book ON reviews(book_id);

-- =============================================
-- 11. AUDIT LOG (for OSO management)
-- =============================================

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    
    actor_id INTEGER REFERENCES users(id), -- who did it
    target_type VARCHAR(50), -- 'user', 'book', 'chapter', etc.
    target_id INTEGER,
    
    action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'deleted', 'banned', etc.
    old_value JSON,
    new_value JSON,
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- =============================================
-- SEED DATA
-- =============================================

-- Genres
INSERT INTO genres (name, slug, description) VALUES
('Fiction', 'fiction', 'General fiction'),
('Romance', 'romance', 'Love stories'),
('Fantasy', 'fantasy', 'Magical worlds'),
('Science Fiction', 'sci-fi', 'Future tech and space'),
('Mystery', 'mystery', 'Crime and detective'),
('Thriller', 'thriller', 'Suspense and tension'),
('Horror', 'horror', 'Scary stories'),
('Historical', 'historical', 'Based on history'),
('Non-Fiction', 'non-fiction', 'Real stories and knowledge'),
('Biography', 'biography', 'Life stories'),
('Self-Help', 'self-help', 'Personal improvement'),
('Business', 'business', 'Business and entrepreneurship');
