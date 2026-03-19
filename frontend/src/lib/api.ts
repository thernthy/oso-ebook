// ============================================
// API Client for OSO E-Book Platform
// ============================================

import { ApiResponse, AuthResponse, User } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // ============================================
  // AUTH
  // ============================================

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(userData: {
    email: string;
    password: string;
    display_name: string;
    username: string;
    role?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me');
  }

  // ============================================
  // OSO ADMIN
  // ============================================

  async getOsoStats() {
    return this.request('/oso/stats');
  }

  async getAllUsers(params?: { page?: number; limit?: number; role?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/oso/users?${query}`);
  }

  async getPendingVerifications() {
    return this.request('/oso/pending-verifications');
  }

  async verifyPartner(partnerId: number) {
    return this.request(`/oso/verify-partner/${partnerId}`, { method: 'POST' });
  }

  async verifyAuthor(authorId: number) {
    return this.request(`/oso/verify-author/${authorId}`, { method: 'POST' });
  }

  // ============================================
  // PARTNERS
  // ============================================

  async getPartnerStats() {
    return this.request('/partners/stats');
  }

  async getPartnerAuthors() {
    return this.request('/partners/authors');
  }

  async createAuthor(authorData: {
    email: string;
    password: string;
    display_name: string;
    username: string;
    pen_name?: string;
  }) {
    return this.request('/partners/authors', {
      method: 'POST',
      body: JSON.stringify(authorData),
    });
  }

  // ============================================
  // AUTHORS
  // ============================================

  async getAuthorStats() {
    return this.request('/authors/stats');
  }

  async getAuthorBooks() {
    return this.request('/authors/books');
  }

  async createBook(bookData: {
    title: string;
    summary?: string;
    genre_id?: number;
    tags?: string[];
    language?: string;
    content_rating?: string;
  }) {
    return this.request('/authors/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    });
  }

  async updateBook(bookId: number, bookData: Partial<{
    title: string;
    summary: string;
    genre_id: number;
    tags: string[];
    status: string;
  }>) {
    return this.request(`/authors/books/${bookId}`, {
      method: 'PATCH',
      body: JSON.stringify(bookData),
    });
  }

  async getBookChapters(bookId: number) {
    return this.request(`/authors/books/${bookId}/chapters`);
  }

  async createChapter(bookId: number, chapterData: {
    title?: string;
    content: string;
    chapter_number?: number;
    is_published?: boolean;
  }) {
    return this.request(`/authors/books/${bookId}/chapters`, {
      method: 'POST',
      body: JSON.stringify(chapterData),
    });
  }

  async updateChapter(bookId: number, chapterId: number, chapterData: {
    title?: string;
    content?: string;
    is_published?: boolean;
  }) {
    return this.request(`/authors/books/${bookId}/chapters/${chapterId}`, {
      method: 'PATCH',
      body: JSON.stringify(chapterData),
    });
  }

  // ============================================
  // READERS
  // ============================================

  async getReaderStats() {
    return this.request('/readers/stats');
  }

  async getLibrary() {
    return this.request('/readers/library');
  }

  async getBookmarks() {
    return this.request('/readers/bookmarks');
  }

  async addBookmark(bookId: number, chapterId?: number, note?: string) {
    return this.request('/readers/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ book_id: bookId, chapter_id: chapterId, note }),
    });
  }

  async getFollowing() {
    return this.request('/readers/following');
  }

  async followAuthor(authorId: number) {
    return this.request('/readers/follow', {
      method: 'POST',
      body: JSON.stringify({ author_id: authorId }),
    });
  }

  async unfollowAuthor(authorId: number) {
    return this.request(`/readers/follow/${authorId}`, { method: 'DELETE' });
  }

  // ============================================
  // PUBLIC / BOOKS
  // ============================================

  async getBooks(params?: { 
    page?: number; 
    limit?: number; 
    genre?: string; 
    search?: string;
    sort?: string;
  }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/books?${query}`);
  }

  async getBook(slug: string) {
    return this.request(`/books/${slug}`);
  }

  async getBookChaptersPublic(bookId: number) {
    return this.request(`/books/${bookId}/chapters`);
  }

  async getChapter(bookId: number, chapterNumber: number) {
    return this.request(`/books/${bookId}/chapters/${chapterNumber}`);
  }

  async updateReadingProgress(bookId: number, progress: {
    chapter_id?: number;
    progress_percentage?: number;
    is_completed?: boolean;
  }) {
    return this.request(`/readers/progress/${bookId}`, {
      method: 'POST',
      body: JSON.stringify(progress),
    });
  }
}

export const api = new ApiClient();
