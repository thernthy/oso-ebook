'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StarRating, { RatingDisplay } from '@/components/ui/StarRating'

type Author = {
  author_id: string
  author_name: string
  author_email: string
  relation_id: string
  status: 'active' | 'paused' | 'terminated'
  termination_reason?: string
  started_at: string
  total_books: number
  published_books: number
  partner_rating: number
  review_count: number
}

type Review = {
  id: string
  communication_rating: number
  quality_rating: number
  reliability_rating: number
  professionalism_rating: number
  overall_rating: number
  review_title: string
  review_text: string
  created_at: string
}

export default function PartnerAuthorsManage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showTerminateModal, setShowTerminateModal] = useState(false)
  const [loading, setLoading] = useState(true)

  // Review form state
  const [reviewRatings, setReviewRatings] = useState({
    communication: 0,
    quality: 0,
    reliability: 0,
    professionalism: 0
  })
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Terminate reason
  const [terminateReason, setTerminateReason] = useState('')

  useEffect(() => {
    fetchAuthors()
  }, [])

  const fetchAuthors = async () => {
    try {
      const res = await fetch('/api/partners/authors')
      if (res.ok) {
        const data = await res.json()
        setAuthors(data.authors || [])
      }
    } catch (e) {
      console.error('Failed to fetch authors', e)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (authorId: string, action: 'pause' | 'resume' | 'terminate', reason?: string) => {
    try {
      const res = await fetch(`/api/partners/authors/${authorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason })
      })
      if (res.ok) {
        fetchAuthors()
        setShowTerminateModal(false)
        setTerminateReason('')
      }
    } catch (e) {
      console.error('Failed to update status', e)
    }
  }

  const handleSubmitReview = async () => {
    if (!selectedAuthor) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/partners/authors/${selectedAuthor.author_id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewRatings,
          review_title: reviewTitle,
          review_text: reviewText
        })
      })
      if (res.ok) {
        setShowReviewModal(false)
        setReviewRatings({ communication: 0, quality: 0, reliability: 0, professionalism: 0 })
        setReviewTitle('')
        setReviewText('')
        fetchAuthors()
      }
    } catch (e) {
      console.error('Failed to submit review', e)
    } finally {
      setSubmitting(false)
    }
  }

  const statusColors = {
    active: { bg: 'rgba(52,211,153,0.15)', color: '#34d399', label: 'Active' },
    paused: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', label: 'Paused' },
    terminated: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Terminated' }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: '#0a0a0f', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            My Authors
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
            Manage your author partnerships and reviews
          </p>
        </div>
        <Link 
          href="/partner/authors/invite"
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981, #34d399)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(52,211,153,0.3)'
          }}
        >
          + Invite Author
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>
          Loading...
        </div>
      ) : authors.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: '60px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No Authors Yet</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>
            Invite authors to join your network and start reviewing their work
          </p>
          <Link 
            href="/partner/authors/invite"
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            Invite Authors
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {authors.map((author) => {
            const status = statusColors[author.status]
            return (
              <div 
                key={author.author_id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '20px',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Author Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 800,
                    flexShrink: 0
                  }}>
                    {author.author_name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {author.author_name}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {author.author_email}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: status.bg,
                    color: status.color
                  }}>
                    {status.label}
                  </span>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#a855f7' }}>{author.total_books}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Total Books</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399' }}>{author.published_books}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Published</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24' }}>
                      {author.partner_rating ? Number(author.partner_rating).toFixed(1) : '-'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Your Rating</div>
                  </div>
                </div>

                {/* Termination Reason */}
                {author.status === 'terminated' && author.termination_reason && (
                  <div style={{
                    padding: '10px 12px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '12px',
                    color: '#ef4444'
                  }}>
                    <strong>Reason:</strong> {author.termination_reason}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => { setSelectedAuthor(author); setShowReviewModal(true) }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'rgba(168,85,247,0.15)',
                      border: '1px solid rgba(168,85,247,0.3)',
                      color: '#a855f7',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ⭐ Review
                  </button>
                  
                  {author.status === 'active' && (
                    <button
                      onClick={() => handleUpdateStatus(author.author_id, 'pause')}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(251,191,36,0.15)',
                        border: '1px solid rgba(251,191,36,0.3)',
                        color: '#fbbf24',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ⏸ Pause
                    </button>
                  )}
                  
                  {author.status === 'paused' && (
                    <button
                      onClick={() => handleUpdateStatus(author.author_id, 'resume')}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(52,211,153,0.15)',
                        border: '1px solid rgba(52,211,153,0.3)',
                        color: '#34d399',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ▶ Resume
                    </button>
                  )}
                  
                  {author.status !== 'terminated' && (
                    <button
                      onClick={() => { setSelectedAuthor(author); setShowTerminateModal(true) }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(239,68,68,0.15)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: '#ef4444',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ✕ Terminate
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedAuthor && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setShowReviewModal(false)}>
          <div style={{
            background: '#13131a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '28px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>
              Review {selectedAuthor.author_name}
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>
              Rate the author's performance
            </p>

            {/* Rating Categories */}
            {[
              { key: 'communication', label: 'Communication' },
              { key: 'quality', label: 'Quality of Work' },
              { key: 'reliability', label: 'Reliability' },
              { key: 'professionalism', label: 'Professionalism' }
            ].map((cat) => (
              <div key={cat.key} style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                  {cat.label}
                </label>
                <StarRating 
                  value={reviewRatings[cat.key as keyof typeof reviewRatings]}
                  onChange={(v) => setReviewRatings({...reviewRatings, [cat.key]: v})}
                  size="lg"
                />
              </div>
            ))}

            {/* Review Title */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Review Title
              </label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Summarize your review..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            {/* Review Text */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Detailed Review
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience working with this author..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: '#fff',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submitting || Object.values(reviewRatings).every(r => r === 0)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: submitting ? 'wait' : 'pointer',
                  opacity: submitting || Object.values(reviewRatings).every(r => r === 0) ? 0.6 : 1
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Modal */}
      {showTerminateModal && selectedAuthor && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setShowTerminateModal(false)}>
          <div style={{
            background: '#13131a',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '20px',
            padding: '28px',
            width: '100%',
            maxWidth: '420px'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>
              Terminate Partnership
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: '24px' }}>
              This will end your partnership with {selectedAuthor.author_name}. Please provide a reason.
            </p>

            <textarea
              value={terminateReason}
              onChange={(e) => setTerminateReason(e.target.value)}
              placeholder="Reason for termination (required)..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#fff',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                marginBottom: '20px'
              }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowTerminateModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedAuthor.author_id, 'terminate', terminateReason)}
                disabled={!terminateReason.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: terminateReason.trim() ? 'pointer' : 'not-allowed',
                  opacity: terminateReason.trim() ? 1 : 0.5
                }}
              >
                Terminate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
