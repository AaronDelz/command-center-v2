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
        borderRadius: radius.lg,
        padding: '16px 20px',
        borderLeft: `3px solid ${color.ember.DEFAULT}`,
        overflow: 'hidden',
      }}
    >
      {/* Ember pulse on left border */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          background: `linear-gradient(180deg, ${color.ember.DEFAULT}, ${color.ember.flame})`,
          animation: `glow-breathe ${animation.duration.ambient} ${animation.easing.inOut} infinite`,
        }}
      />

      <p
        style={{
          fontSize: typography.fontSize.body,
          fontStyle: 'italic',
          color: color.text.primary,
          margin: 0,
          lineHeight: typography.lineHeight.relaxed,
        }}
      >
        &ldquo;{quote.text}&rdquo;
      </p>
      <span
        style={{
          fontSize: typography.fontSize.caption,
          color: color.text.dim,
          marginTop: '4px',
          display: 'block',
        }}
      >
        — {quote.author}
      </span>
    </div>
  );
}
