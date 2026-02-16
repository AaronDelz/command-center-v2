'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { TimeTracker } from '@/components/time/TimeTracker';
import { TimeSummary } from '@/components/time/TimeSummary';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmberButton } from '@/components/ui/EmberButton';
import { color, typography } from '@/styles/tokens';
import type { Client, ClientsData, TimeEntriesData } from '@/lib/types';

type ViewMode = 'tracker' | 'analytics' | 'export';

export default function TimePage(): React.ReactElement {
  const [clients, setClients] = useState<Client[]>([]);
  const [timeData, setTimeData] = useState<TimeEntriesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('tracker');

  // Fetch clients and time data
  const fetchData = useCallback(async () => {
    try {
      const [clientsResponse, timeResponse] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/time-entries'),
      ]);
      
      if (!clientsResponse.ok || !timeResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const clientsData = await clientsResponse.json() as ClientsData;
      const timeEntriesData = await timeResponse.json() as TimeEntriesData;
      
      setClients(clientsData.clients);
      setTimeData(timeEntriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!timeData) return;
    
    // Prepare CSV data
    const headers = [
      'Date',
      'Client',
      'Description', 
      'Start Time',
      'End Time',
      'Duration (minutes)',
      'Duration (hours)',
      'Billable',
      'Rate',
      'Value',
      'Tags'
    ];
    
    const rows = timeData.entries
      .filter(e => !e.isRunning && e.duration)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .map(entry => {
        const startTime = new Date(entry.startTime);
        const endTime = entry.endTime ? new Date(entry.endTime) : null;
        const hours = (entry.duration || 0) / 60;
        const value = entry.billable && entry.rate ? hours * entry.rate : 0;
        
        return [
          startTime.toLocaleDateString(),
          entry.clientName,
          entry.description,
          startTime.toLocaleTimeString(),
          endTime ? endTime.toLocaleTimeString() : '',
          entry.duration || 0,
          hours.toFixed(2),
          entry.billable ? 'Yes' : 'No',
          entry.rate || '',
          value.toFixed(2),
          entry.tags.join('; ')
        ];
      });
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma
          const str = String(cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      )
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `time-entries-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader 
          title="Time Forge" 
          subtitle="Track time, measure value, optimize results" 
        />
        <div style={{ 
          padding: '60px', 
          textAlign: 'center', 
          color: color.text.dim 
        }}>
          Loading time tracking...
        </div>
      </div>
    );
  }

  const activeTimer = timeData?.entries.find(e => e.isRunning);
  
  return (
    <div>
      <PageHeader
        title="Time Forge"
        subtitle={
          activeTimer 
            ? `⏱️ Timer running: ${activeTimer.clientName} — ${activeTimer.description}`
            : "Track time, measure value, optimize results"
        }
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <EmberButton
              variant={viewMode === 'tracker' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tracker')}
            >
              Timer
            </EmberButton>
            <EmberButton
              variant={viewMode === 'analytics' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('analytics')}
            >
              Analytics
            </EmberButton>
            <EmberButton
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
            >
              📊 Export CSV
            </EmberButton>
          </div>
        }
      />

      {/* Quick Stats Bar */}
      {timeData && (
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '20px',
          padding: '16px',
          background: 'rgba(255, 107, 53, 0.05)',
          borderRadius: '12px',
          border: `1px solid rgba(255, 107, 53, 0.1)`,
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.bold,
              color: color.ember.flame,
            }}>
              {timeData.entries.filter(e => !e.isRunning).length}
            </div>
            <div style={{
              fontSize: typography.fontSize.caption,
              color: color.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Total Entries
            </div>
          </div>
          
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.bold,
              color: color.ember.flame,
            }}>
              {Math.round(timeData.entries.reduce((sum, e) => sum + (e.duration || 0), 0) / 60)}h
            </div>
            <div style={{
              fontSize: typography.fontSize.caption,
              color: color.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Hours Tracked
            </div>
          </div>
          
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.bold,
              color: color.status.healthy,
            }}>
              ${timeData.entries
                .filter(e => e.billable && e.rate && e.duration)
                .reduce((sum, e) => sum + ((e.duration || 0) / 60) * (e.rate || 0), 0)
                .toFixed(0)}
            </div>
            <div style={{
              fontSize: typography.fontSize.caption,
              color: color.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Total Value
            </div>
          </div>
          
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.bold,
              color: activeTimer ? color.status.warning : color.text.dim,
            }}>
              {activeTimer ? '🟢' : '⏸️'}
            </div>
            <div style={{
              fontSize: typography.fontSize.caption,
              color: color.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Status
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {viewMode === 'tracker' && (
        <TimeTracker clients={clients} />
      )}
      
      {viewMode === 'analytics' && timeData && (
        <TimeSummary entries={timeData.entries} />
      )}
      
      {viewMode === 'export' && (
        <GlassCard>
          <h3 style={{
            margin: '0 0 16px 0',
            color: color.text.primary,
            fontSize: typography.fontSize.pageTitle,
            fontWeight: typography.fontWeight.semibold,
          }}>
            Export Options
          </h3>
          
          <p style={{ 
            color: color.text.secondary, 
            marginBottom: '20px',
            lineHeight: 1.5,
          }}>
            Export your time tracking data for external analysis, invoicing, or backup.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <EmberButton onClick={handleExportCSV}>
              📊 Download CSV
            </EmberButton>
            
            <EmberButton 
              variant="secondary"
              onClick={() => {
                if (timeData) {
                  const json = JSON.stringify(timeData, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const link = document.createElement('a');
                  const url = URL.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute('download', `time-entries-${new Date().toISOString().split('T')[0]}.json`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
            >
              📄 Download JSON
            </EmberButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
}