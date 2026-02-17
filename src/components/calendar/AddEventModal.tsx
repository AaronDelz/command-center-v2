'use client';

import { useState } from 'react';
import { GlassModal, GlassInput, GlassSelect, EmberButton } from '@/components/ui';
import { color, typography } from '@/styles/tokens';

interface AddEventModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (event: { title: string; date: string; time?: string; endTime?: string; color: string; description?: string; recurring?: string }) => Promise<void>;
  defaultDate?: string;
}

const COLOR_OPTIONS = [
  { label: '🔥 Ember', value: '#ff6b35' },
  { label: '🔵 Blue', value: '#60a5fa' },
  { label: '🟢 Green', value: '#4ade80' },
  { label: '🟡 Gold', value: '#fbbf24' },
  { label: '🔴 Red', value: '#ef4444' },
  { label: '🟣 Purple', value: '#a78bfa' },
  { label: '🩷 Pink', value: '#f472b6' },
];

export function AddEventModal({ open, onClose, onAdd, defaultDate }: AddEventModalProps): React.ReactElement {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [eventColor, setEventColor] = useState('#ff6b35');
  const [description, setDescription] = useState('');
  const [recurring, setRecurring] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !date) return;
    setSubmitting(true);
    try {
      await onAdd({
        title: title.trim(),
        date,
        time: time || undefined,
        endTime: endTime || undefined,
        color: eventColor,
        description: description.trim() || undefined,
        recurring: recurring || undefined,
      });
      // Reset
      setTitle('');
      setTime('');
      setEndTime('');
      setDescription('');
      setRecurring('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassModal open={open} onClose={onClose} title="📅 Add Event">
      <div className="flex flex-col gap-4">
        <GlassInput
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event name"
        />

        <GlassInput
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <GlassInput
            label="Start Time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <GlassInput
            label="End Time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <GlassSelect
          label="Color"
          value={eventColor}
          onChange={(e) => setEventColor(e.target.value)}
          options={COLOR_OPTIONS}
        />

        <GlassSelect
          label="Recurring"
          value={recurring}
          onChange={(e) => setRecurring(e.target.value)}
          options={[
            { label: 'None', value: '' },
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
          ]}
        />

        <GlassInput
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details..."
        />

        <div className="flex justify-end gap-2 mt-2">
          <EmberButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </EmberButton>
          <EmberButton
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
          >
            {submitting ? 'Adding...' : '📅 Add Event'}
          </EmberButton>
        </div>
      </div>
    </GlassModal>
  );
}
