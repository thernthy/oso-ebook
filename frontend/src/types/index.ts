// ============================================
// OSO E-BOOK PLATFORM - TypeScript Types
// ============================================

export type UserRole = 'oso_admin' | 'partner' | 'author' | 'reader';
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'banned';
export type BookStatus = 'draft' | 'published' | 'archived' | 'suspended';
export type ContentRating = 'everyone' | 'teen' | 'mature' | 'adult';

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: number;
  uuid: string;
  email: string;
  display_name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  role: UserRole;
  status: AccountStatus;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface Partner {
  id: number;
  user_id: number;
  user?: User;
  company_name?: string;
  business_registration?: string;
  tax_id?: string;
  contact_phone?: string;
  contact_address?: Record<string, string>;
  contract_start_date?: string;
  contract_end_date?: string;
  commission_rate: number;
  is_active: boolean;
  verified_by?: number;
  verified_at?: string;
  created_at: string;
}

export interface Author {
  id: number;
  user_id: number;
  user?: User;
  pen_name?: string;
  signature?: string;
  website_url?: string;
  social_links?: Record<string, string>;
  partner_id?: number;
  partner?: Partner;
  total_books: number;
  total_reads: number;
  total_followers: number;
  is_verified: boolean;
  created_at: string;
}

export interface Reader {
  id: number;
  user_id: number;
  user?: User;
  preferred_languages?: string[];
  preferred_genres?: number[];
  books_read: number;
  chapters_read: number;
  reading_time_minutes: number;
  subscription_tier?: string;
  subscription_expires_at?: string;
  created_at: string;
}

// ============================================
// CONTENT TYPES
// ============================================

export interface Genre {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  sort_order: number;
  is_active: boolean;
}

export interface Book {
  id: number;
  uuid: string;
  author_id: number;
  author?: Author;
  partner_id?: number;
  partner?: Partner;
  title: string;
  slug: string;
  summary?: string;
  cover_image_url?: string;
  genre_id?: number;
  genre?: Genre;
  tags?: string[];
  language: string;
  content_rating: ContentRating;
  status: BookStatus;
  published_at?: string;
  total_chapters: number;
  total_words: number;
  total_views: number;
  total_likes: number;
  total_bookmarks: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: number;
  book_id: number;
  book?: Book;
  chapter_number: number;
  title?: string;
  slug?: string;
  content?: string;
  word_count: number;
  is_published: boolean;
  published_at?: string;
  is_free: boolean;
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// ENGAGEMENT TYPES
// ============================================

export interface ReadingProgress {
  id: number;
  reader_id: number;
  book_id: number;
  book?: Book;
  current_chapter_id?: number;
  current_chapter?: Chapter;
  progress_percentage: number;
  is_completed: boolean;
  completed_at?: string;
  last_read_at: string;
  reading_time_seconds: number;
}

export interface Bookmark {
  id: number;
  reader_id: number;
  book_id: number;
  book?: Book;
  chapter_id?: number;
  chapter?: Chapter;
  note?: string;
  created_at: string;
}

export interface Follow {
  id: number;
  follower_id: number;
  follower?: User;
  following_id: number;
  following?: User;
  created_at: string;
}

export interface Review {
  id: number;
  book_id: number;
  book?: Book;
  reader_id: number;
  reader?: Reader;
  rating: number;
  review_text?: string;
  likes: number;
  is_spam: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_at: string;
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface OsoStats {
  totalUsers: number;
  totalPartners: number;
  totalAuthors: number;
  totalReaders: number;
  totalBooks: number;
  totalChapters: number;
  pendingVerifications: number;
  recentSignups: User[];
}

export interface PartnerStats {
  totalAuthors: number;
  totalBooks: number;
  totalReads: number;
  commissionEarned: number;
  recentAuthors: Author[];
}

export interface AuthorStats {
  totalBooks: number;
  totalChapters: number;
  totalReads: number;
  totalFollowers: number;
  totalLikes: number;
  recentBooks: Book[];
}

export interface ReaderStats {
  booksRead: number;
  chaptersRead: number;
  readingTimeHours: number;
  bookmarksCount: number;
  followingCount: number;
  currentReads: ReadingProgress[];
}
