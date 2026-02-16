'use client';

import { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmberButton } from '@/components/ui/EmberButton';
import { color, typography, radius, shadow, animation } from '@/styles/tokens';
import type { TimeEntry, TimeEntriesData, Client } from '@/lib/types';

interface QuickTimeWidgetProps {
  clients: Client[];
  onNavigateToTimeForge?: () => void;
}

// Notes Modal Component
function NotesModal({ 
  isOpen, 
  onClose, 
  onSave, 
  timeSpent,
  clientName 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string) => void;
  timeSpent: string;
  clientName: string;
}) {
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(notes);
    setNotes('');
  };

  const handleSkip = () => {
    onSave('');
    setNotes('');
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: color.bg.base,
          border: `1.5px solid ${color.glass.border}`,
          borderRadius: radius['2xl'],
          boxShadow: shadow.modal,
          padding: '24px',
          width: '400px',
          maxWidth: '90vw',
        }}
      >
        <h3 style={{
          fontSize: typography.fontSize.pageTitle,
          fontWeight: typography.fontWeight.semibold,
          color: color.text.primary,
          marginBottom: '8px',
          marginTop: 0,
        }}>
          Timer Stopped
        </h3>
        
        <div style={{
          fontSize: typography.fontSize.body,
          color: color.text.secondary,
          marginBottom: '16px',
        }}>
          <div style={{ color: color.ember.flame, fontWeight: typography.fontWeight.semibold }}>
            {timeSpent} worked on {clientName}
          </div>
        </div>

        <label style={{
          fontSize: typography.fontSize.caption,
          color: color.text.secondary,
          marginBottom: '6px',
          display: 'block',
        }}>
          What did you work on? (optional)
        </label>
        
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Brief description of what you accomplished..."
          autoFocus
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '10px 12px',
            background: color.bg.surface,
            border: `1px solid ${color.glass.border}`,
            borderRadius: radius.md,
            color: color.text.primary,
            fontSize: typography.fontSize.body,
            fontFamily: 'inherit',
            outline: 'none',
            resize: 'vertical',
            marginBottom: '16px',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSave();
            }
          }}
        />

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSkip}
            style={{
              padding: '8px 18px',
              background: 'none',
              border: `1px solid ${color.glass.border}`,
              borderRadius: radius.md,
              color: color.text.secondary,
              cursor: 'pointer',
              fontSize: typography.fontSize.body,
            }}
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 18px',
              background: color.ember.DEFAULT,
              border: 'none',
              borderRadius: radius.md,
              color: color.text.inverse,
              cursor: 'pointer',
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.body,
              boxShadow: `0 0 12px rgba(255, 107, 53, 0.3)`,
            }}
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}

// Time formatting helpers
function formatElapsedTime(startTime: string): string {
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

export function QuickTimeWidget({ 
  clients,
  onNavigateToTimeForge 
}: QuickTimeWidgetProps): React.ReactElement {
  const [timeData, setTimeData] = useState<TimeEntriesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [stoppedEntry, setStoppedEntry] = useState<{ timeSpent: string; clientName: string; entryId: string } | null>(null);
  const [showFinalTime, setShowFinalTime] = useState<{ time: string; client: string } | null>(null);

  const fetchTimeData = useCallback(async () => {
    try {
      const response = await fetch('/api/time-entries');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json() as TimeEntriesData;
      setTimeData(data);
    } catch (error) {
      console.error('Error fetching time data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Live timer update effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (timeData?.entries) {
      const activeEntry = timeData.entries.find(e => e.isRunning);
      if (activeEntry) {
        const updateElapsed = () => {
          const elapsed = formatElapsedTime(activeEntry.startTime);
          setElapsedTime(elapsed);
          
          // Update browser tab title
          document.title = `⏱ ${elapsed} — ${activeEntry.clientName} | The Forge`;
        };
        
        updateElapsed(); // Initial update
        intervalId = setInterval(updateElapsed, 1000);
      } else {
        // No active timer, restore normal title
        document.title = 'The Forge';
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timeData]);

  useEffect(() => {
    fetchTimeData();
  }, [fetchTimeData]);

  const handleQuickStart = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    // Extract numeric rate from rate string
    const rateMatch = client.rate.match(/\$(\d+)/);
    const numericRate = rateMatch ? parseFloat(rateMatch[1]) : (client.hourlyRate || undefined);

    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          clientName: client.name,
          description: 'Quick timer session',
          tags: [],
          billable: true,
          rate: numericRate,
          isRunning: true,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to start timer');
      await fetchTimeData();
    } catch (error) {
      console.error('Error starting quick timer:', error);
    }
  };

  const handleStopTimer = async () => {
    const activeEntry = timeData?.entries.find(e => e.isRunning);
    if (!activeEntry) return;
    
    const elapsed = formatElapsedTime(activeEntry.startTime);
    
    try {
      const response = await fetch('/api/time-entries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: activeEntry.id, 
          action: 'stop' 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to stop timer');
      
      // Show the final time briefly
      setShowFinalTime({ time: elapsed, client: activeEntry.clientName });
      setTimeout(() => setShowFinalTime(null), 2000);
      
      // Set up for notes modal
      setStoppedEntry({
        timeSpent: elapsed,
        clientName: activeEntry.clientName,
        entryId: activeEntry.id
      });
      setShowNotesModal(true);
      
      await fetchTimeData();
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  const handleSaveNotes = async (notes: string) => {
    if (!stoppedEntry) return;
    
    if (notes.trim()) {
      try {
        await fetch('/api/time-entries', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: stoppedEntry.entryId, 
            notes: notes.trim() 
          }),
        });
        
        await fetchTimeData();
      } catch (error) {
        console.error('Error saving notes:', error);
      }
    }
    
    setShowNotesModal(false);
    setStoppedEntry(null);
  };

  if (isLoading) {
    return (
      <GlassCard padding="sm">
        <div style={{ 
          textAlign: 'center', 
          color: color.text.dim,
          padding: '20px',
        }}>
          Loading timer...
        </div>
      </GlassCard>
    );
  }

  const activeTimer = timeData?.entries.find(e => e.isRunning);
  const todayEntries = timeData?.entries.filter(e => 
    new Date(e.startTime).toDateString() === new Date().toDateString()
  ) || [];
  
  const todayMinutes = todayEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const todayValue = todayEntries
    .filter(e => e.billable && e.rate && e.duration)
    .reduce((sum, e) => sum + ((e.duration || 0) / 60) * (e.rate || 0), 0);

  return (
    <>
      <GlassCard padding="sm">
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <h4 style={{
              margin: 0,
              color: color.text.primary,
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.semibold,
            }}>
              ⏰ Time Tracking
            </h4>
            
            {onNavigateToTimeForge && (
              <button
                onClick={onNavigateToTimeForge}
                style={{
                  background: 'none',
                  border: 'none',
                  color: color.text.secondary,
                  fontSize: typography.fontSize.caption,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                View Full →
              </button>
            )}
          </div>
        </div>

        {/* Final Time Display (brief) */}
        {showFinalTime && (
          <div style={{
            background: 'rgba(74, 222, 128, 0.1)',
            border: `1px solid rgba(74, 222, 128, 0.3)`,
            borderRadius: radius.md,
            padding: '12px',
            marginBottom: '12px',
            textAlign: 'center',
            animation: 'pulse 2s ease-out',
          }}>
            <div style={{
              color: color.status.healthy,
              fontWeight: typography.fontWeight.bold,
              fontSize: typography.fontSize.pageTitle,
              fontFamily: typography.fontFamily.mono,
            }}>
              {showFinalTime.time}
            </div>
            <div style={{
              color: color.text.secondary,
              fontSize: typography.fontSize.caption,
            }}>
              Completed • {showFinalTime.client}
            </div>
          </div>
        )}

        {/* Active Timer Status */}
        {activeTimer ? (
          <div style={{
            background: 'rgba(255, 107, 53, 0.05)',
            border: `1px solid rgba(255, 107, 53, 0.2)`,
            borderRadius: radius.md,
            padding: '12px',
            marginBottom: '12px',
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}>
              <div>
                <div style={{
                  color: color.ember.flame,
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: typography.fontSize.body,
                  marginBottom: '2px',
                }}>
                  🟢 {activeTimer.clientName}
                </div>
                <div style={{
                  color: color.text.secondary,
                  fontSize: typography.fontSize.caption,
                  marginBottom: '6px',
                }}>
                  {activeTimer.description}
                </div>
                {/* Live Timer Display */}
                <div style={{
                  color: color.ember.DEFAULT,
                  fontWeight: typography.fontWeight.bold,
                  fontSize: typography.fontSize.pageTitle,
                  fontFamily: typography.fontFamily.mono,
                  textShadow: `0 0 20px rgba(255, 107, 53, 0.4)`,
                  animation: 'glow 2s ease-in-out infinite alternate',
                }}>
                  {elapsedTime}
                </div>
              </div>
              
              <EmberButton
                size="sm"
                variant="secondary"
                onClick={handleStopTimer}
              >
                Stop
              </EmberButton>
            </div>
          </div>
        ) : (
          /* Quick Start Buttons */
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              fontSize: typography.fontSize.caption,
              color: color.text.dim,
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Quick Start
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '4px',
            }}>
              {clients
                .filter(c => c.status === 'active')
                .slice(0, 4)
                .map(client => (
                  <button
                    key={client.id}
                    onClick={() => handleQuickStart(client.id)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${color.glass.border}`,
                      borderRadius: radius.sm,
                      padding: '6px 8px',
                      color: color.text.secondary,
                      fontSize: typography.fontSize.caption,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 107, 53, 0.08)';
                      e.currentTarget.style.borderColor = color.glass.borderHover;
                      e.currentTarget.style.color = color.text.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = color.glass.border;
                      e.currentTarget.style.color = color.text.secondary;
                    }}
                  >
                    {client.name}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Today's Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          padding: '12px 0',
          borderTop: `1px solid ${color.glass.border}`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.semibold,
              color: color.ember.flame,
            }}>
              {Math.round(todayMinutes / 60 * 10) / 10}h
            </div>
            <div style={{
              fontSize: typography.fontSize.metadata,
              color: color.text.dim,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Today
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.semibold,
              color: color.status.healthy,
            }}>
              ${Math.round(todayValue)}
            </div>
            <div style={{
              fontSize: typography.fontSize.metadata,
              color: color.text.dim,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Value
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.semibold,
              color: color.text.primary,
            }}>
              {todayEntries.length}
            </div>
            <div style={{
              fontSize: typography.fontSize.metadata,
              color: color.text.dim,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Sessions
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Notes Modal */}
      {stoppedEntry && (
        <NotesModal
          isOpen={showNotesModal}
          onClose={() => {
            setShowNotesModal(false);
            setStoppedEntry(null);
          }}
          onSave={handleSaveNotes}
          timeSpent={stoppedEntry.timeSpent}
          clientName={stoppedEntry.clientName}
        />
      )}
    </>
  );
}