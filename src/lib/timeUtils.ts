import type { TimeEntry } from './types';

/**
 * Utility functions for time tracking calculations and exports
 */

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function calculateEntryValue(entry: TimeEntry): number {
  if (!entry.billable || !entry.rate || !entry.duration) return 0;
  const hours = entry.duration / 60;
  return hours * entry.rate;
}

export function exportTimeEntriesToCSV(entries: TimeEntry[]): string {
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
  
  const rows = entries
    .filter(e => !e.isRunning && e.duration)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .map(entry => {
      const startTime = new Date(entry.startTime);
      const endTime = entry.endTime ? new Date(entry.endTime) : null;
      const hours = (entry.duration || 0) / 60;
      const value = calculateEntryValue(entry);
      
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
  
  return csvContent;
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getWeekStart(date: Date = new Date()): Date {
  const weekStart = new Date(date);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

export function isToday(date: string): boolean {
  return new Date(date).toDateString() === new Date().toDateString();
}

export function isThisWeek(date: string): boolean {
  const entryDate = new Date(date);
  const weekStart = getWeekStart();
  return entryDate >= weekStart;
}