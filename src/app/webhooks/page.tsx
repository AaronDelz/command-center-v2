'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WebhookEvent } from '@/lib/types';

export default function WebhooksPage(): React.ReactElement {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [filterUnseen, setFilterUnseen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    const url = filterUnseen ? '/api/webhooks?unseen=true' : '/api/webhooks';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events);
    }
  }, [filterUnseen]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const markSeen = async (id: string) => {
    await fetch('/api/webhooks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchEvents();
  };

  const markAllSeen = async () => {
    await fetch('/api/webhooks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllSeen: true }),
    });
    fetchEvents();
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
      hour12: true,
    });
  };

  const unseenCount = events.filter(e => !e.seen).length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-cinzel font-semibold tracking-wide" style={{ color: '#f0ece6' }}>
            <span style={{ color: '#ff6b35' }}>⚡</span> Webhook Log
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(240,236,230,0.5)' }}>
            Incoming events from Make.com, Zapier, and external services
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unseenCount > 0 && (
            <button
              onClick={markAllSeen}
              className="px-3 py-1.5 text-xs rounded-lg transition-all hover:scale-105"
              style={{
                background: 'rgba(255,107,53,0.1)',
                border: '1px solid rgba(255,107,53,0.3)',
                color: '#ffb347',
              }}
            >
              Mark all seen ({unseenCount})
            </button>
          )}
          <button
            onClick={() => setFilterUnseen(!filterUnseen)}
            className="px-3 py-1.5 text-xs rounded-lg transition-all"
            style={{
              background: filterUnseen ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${filterUnseen ? 'rgba(255,107,53,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: filterUnseen ? '#ff6b35' : 'rgba(240,236,230,0.6)',
            }}
          >
            {filterUnseen ? '● Unseen only' : '○ Show all'}
          </button>
        </div>
      </div>

      {/* Events list */}
      {events.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="text-4xl mb-3">📡</div>
          <p style={{ color: 'rgba(240,236,230,0.4)' }}>
            {filterUnseen ? 'No unseen webhook events' : 'No webhook events yet'}
          </p>
          <p className="text-xs mt-2" style={{ color: 'rgba(240,236,230,0.25)' }}>
            POST to <code className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)' }}>/api/webhooks/receive</code> to start receiving events
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="rounded-xl transition-all cursor-pointer"
              style={{
                background: evt.seen ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${evt.seen ? 'rgba(255,255,255,0.06)' : 'rgba(255,107,53,0.2)'}`,
                backdropFilter: 'blur(12px)',
              }}
              onClick={() => setExpandedId(expandedId === evt.id ? null : evt.id)}
            >
              <div className="flex items-center gap-4 px-4 py-3">
                {/* Unseen dot */}
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: evt.seen ? 'transparent' : '#ff6b35',
                    boxShadow: evt.seen ? 'none' : '0 0 6px rgba(255,107,53,0.5)',
                  }}
                />

                {/* Time */}
                <span className="text-xs flex-shrink-0 w-32 font-mono" style={{ color: 'rgba(240,236,230,0.4)' }}>
                  {formatTime(evt.receivedAt)}
                </span>

                {/* Source badge */}
                <span
                  className="px-2 py-0.5 text-xs rounded-md flex-shrink-0"
                  style={{
                    background: 'rgba(255,107,53,0.1)',
                    color: '#ffb347',
                    border: '1px solid rgba(255,107,53,0.2)',
                  }}
                >
                  {evt.source}
                </span>

                {/* Event type */}
                <span className="text-sm flex-shrink-0" style={{ color: 'rgba(240,236,230,0.7)' }}>
                  {evt.event || '—'}
                </span>

                {/* Payload preview */}
                <span className="text-xs truncate flex-1" style={{ color: 'rgba(240,236,230,0.3)' }}>
                  {JSON.stringify(evt.payload).slice(0, 80)}
                </span>

                {/* Actions */}
                {!evt.seen && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markSeen(evt.id); }}
                    className="text-xs px-2 py-1 rounded-md hover:scale-105 transition-all flex-shrink-0"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(240,236,230,0.5)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    ✓ Seen
                  </button>
                )}
              </div>

              {/* Expanded payload */}
              {expandedId === evt.id && (
                <div className="px-4 pb-3 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <pre
                    className="text-xs p-3 rounded-lg overflow-x-auto"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      color: 'rgba(240,236,230,0.6)',
                      fontFamily: 'var(--font-geist-mono)',
                    }}
                  >
                    {JSON.stringify(evt.payload, null, 2)}
                  </pre>
                  <div className="flex gap-2 mt-2 text-xs" style={{ color: 'rgba(240,236,230,0.3)' }}>
                    <span>ID: {evt.id}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
