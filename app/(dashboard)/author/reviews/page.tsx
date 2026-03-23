'use client'

import { useEffect, useState } from 'react'
import StarRating, { RatingDisplay } from '@/components/ui/StarRating'
import { useLanguage } from '@/lib/i18n/LanguageContext'

type Review = {
  id: string
  partner_name: string
  partner_email: string
  communication_rating: number
  quality_rating: number
  reliability_rating: number
  professionalism_rating: number
  overall_rating: number
  review_title: string
  review_text: string
  author_response: string
  author_responded_at: string
  created_at: string
  relationship_status: string
  termination_reason: string
}

type AvgRatings = {
  communication: number
  quality: number
  reliability: number
  professionalism: number
  overall: number
}

export default function AuthorReviewsPage() {
  const { t } = useLanguage()
  const [reviews, setReviews] = useState<Review[]>([])
  const [averages, setAverages] = useState<AvgRatings | null>(null)
  const [loading, setLoading] = useState(true)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/authors/reviews')
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
        setAverages(data.averages || null)
      }
    } catch (e) {
      console.error('Failed to fetch reviews', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitResponse = async (reviewId: string) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/authors/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response_text: responseText })
      })
      if (res.ok) {
        setRespondingTo(null)
        setResponseText('')
        fetchReviews()
      }
    } catch (e) {
      console.error('Failed to submit response', e)
    } finally {
      setSubmitting(false)
    }
  }

  const statusColors: Record<string, { bg: string; color: string }> = {
    active: { bg: 'rgba(52,211,153,0.15)', color: '#34d399' },
    paused: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
    terminated: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: '#0a0a0f', color: '#fff' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>
          {t('partnerReviews')}
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
          See what your partners say about your work
        </p>
      </div>

      {/* Average Ratings */}
      {averages && reviews.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>{t('averageRatings')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
            {[
              { key: 'communication', label: t('communicationRating'), value: averages.communication },
              { key: 'quality', label: t('qualityRating'), value: averages.quality },
              { key: 'reliability', label: t('reliabilityRating'), value: averages.reliability },
              { key: 'professionalism', label: t('professionalismRating'), value: averages.professionalism },
              { key: 'overall', label: t('overallRating'), value: averages.overall }
            ].map((item) => (
              <div key={item.key} style={{
                textAlign: 'center',
                padding: '16px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#a855f7', marginBottom: '8px' }}>
                  {item.value > 0 ? item.value.toFixed(1) : '-'}
                </div>
                <StarRating value={Math.round(item.value)} readonly size="sm" />
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>
          Loading...
        </div>
      ) : reviews.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: '60px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No Reviews Yet</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>
            Partner reviews will appear here once your partners evaluate your work
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reviews.map((review) => {
            const status = statusColors[review.relationship_status] || statusColors.active
            return (
              <div key={review.id} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '24px'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981, #34d399)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 800
                    }}>
                      {review.partner_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '2px' }}>
                        {review.partner_name}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(review.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', month: 'long', day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: status.bg,
                      color: status.color
                    }}>
                      {review.relationship_status}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#a855f7' }}>
                        {Number(review.overall_rating).toFixed(1)}
                      </div>
                      <StarRating value={Math.round(Number(review.overall_rating))} readonly size="sm" />
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                {review.review_title && (
                  <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
                    "{review.review_title}"
                  </h4>
                )}
                {review.review_text && (
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '20px' }}>
                    {review.review_text}
                  </p>
                )}

                {/* Rating Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'Communication', value: review.communication_rating },
                    { label: 'Quality', value: review.quality_rating },
                    { label: 'Reliability', value: review.reliability_rating },
                    { label: 'Professionalism', value: review.professionalism_rating }
                  ].map((item) => (
                    <div key={item.label} style={{
                      padding: '12px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#fbbf24' }}>
                        {item.value || '-'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{item.label}</div>
                    </div>
                  ))}
                </div>

                {/* Termination Reason */}
                {review.relationship_status === 'terminated' && review.termination_reason && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    fontSize: '13px',
                    color: '#ef4444'
                  }}>
                    <strong>⚠️ Partnership Ended:</strong> {review.termination_reason}
                  </div>
                )}

                {/* Author Response */}
                {review.author_response ? (
                  <div style={{
                    padding: '16px',
                    background: 'rgba(168,85,247,0.1)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    borderRadius: '10px'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#a855f7', marginBottom: '8px' }}>
                      YOUR RESPONSE {review.author_responded_at && `- ${new Date(review.author_responded_at).toLocaleDateString()}`}
                    </div>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                      {review.author_response}
                    </p>
                  </div>
                ) : respondingTo === review.id ? (
                  <div>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Write your response..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(168,85,247,0.3)',
                        borderRadius: '10px',
                        fontSize: '14px',
                        color: '#fff',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        marginBottom: '12px'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => { setRespondingTo(null); setResponseText('') }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmitResponse(review.id)}
                        disabled={submitting || !responseText.trim()}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: submitting || !responseText.trim() ? 'wait' : 'pointer',
                          opacity: submitting || !responseText.trim() ? 0.6 : 1
                        }}
                      >
                        {submitting ? 'Sending...' : `${t('sendResponse')}`}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setRespondingTo(review.id)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      background: 'rgba(168,85,247,0.15)',
                      border: '1px solid rgba(168,85,247,0.3)',
                      color: '#a855f7',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    💬 {t('respondToReview')}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
