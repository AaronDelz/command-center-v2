'use client';

import { useState, useEffect } from 'react';
import { color, typography, radius, animation } from '@/styles/tokens';

interface Quote {
  text: string;
  author: string;
  category: string;
}

export function QOTDBanner(): React.ReactElement {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    // Pick quote based on day of year for consistency
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );

    fetch('/api/quotes')
      .then((r) => r.ok ? r.json() : null)
      .catch(() => null)
      .then((data) => {
        if (data?.quotes?.length) {
          const idx = dayOfYear % data.quotes.length;
          setQuote(data.quotes[idx]);
        }
      });
  }, []);

  if (!quote) return <></>;

  return (
    <div
      style={{
        position: 'relative',
        background: color.bg.surface,
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        border: `1px solid ${color.glass.border}`,
        borderRadius: '14px',
        padding: '18px 22px',
        borderLeft: `3px solid ${color.ember.DEFAULT}`,
        boxShadow: '0 6px 24px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        animation: `qotd-pulse 5s ease-in-out infinite`,
      }}
    >

      <p
        style={{
          fontSize: '0.88rem',
          fontStyle: 'italic',
          color: color.text.primary,
          margin: 0,
          lineHeight: '1.6',
        }}
      >
        &ldquo;{quote.text}&rdquo;
      </p>
      <span
        style={{
          fontSize: typography.fontSize.caption,
          color: color.text.accent,
          marginTop: '4px',
          display: 'block',
        }}
      >
        — {quote.author}
      </span>
    </div>
  );
}
