'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Digiboi Error:', error)
  }, [error])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)', padding: 24,
    }}>
      <div style={{
        background: 'linear-gradient(145deg,#0b0f1a,#0f1520)',
        border: '1px solid rgba(244,63,94,.2)',
        borderRadius: 16, padding: 32, maxWidth: 440, width: '100%',
        textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,.6)',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#e8edf5', marginBottom: 8 }}>
          Something went wrong
        </h2>
        <p style={{ color: '#8892a4', fontSize: '.82rem', marginBottom: 20, lineHeight: 1.6 }}>
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', border: 'none', borderRadius: 9,
              padding: '10px 20px', fontWeight: 600, cursor: 'pointer',
              fontSize: '.84rem', fontFamily: 'Outfit,sans-serif',
            }}
          >
            🔄 Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: 'rgba(255,255,255,.05)', color: '#8892a4',
              border: '1px solid rgba(255,255,255,.08)', borderRadius: 9,
              padding: '10px 20px', fontWeight: 600, cursor: 'pointer',
              fontSize: '.84rem', fontFamily: 'Outfit,sans-serif',
            }}
          >
            🏠 Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
