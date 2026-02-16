'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmberButton } from '@/components/ui/EmberButton';
import { GlassPill } from '@/components/ui/GlassPill';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { color, animation, typography } from '@/styles/tokens';
import type { Drop, DropType } from '@/lib/types';

const DROP_TYPES: Array<{ key: DropType; label: string; icon: string }> = [
  { key: 'note', label: 'Note', icon: '📝' },
  { key: 'idea', label: 'Idea', icon: '💡' },
  { key: 'link', label: 'Link', icon: '🔗' },
  { key: 'task', label: 'Task', icon: '✅' },
  { key: 'file', label: 'File', icon: '📎' },
  { key: 'unsorted', label: 'Unsorted', icon: '❓' },
];

interface UniversalInboxProps {
  className?: string;
}

export function UniversalInbox({ className = '' }: UniversalInboxProps): React.ReactElement {
  const [content, setContent] = useState('');
  const [type, setType] = useState<DropType>('note');
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [recentDrops, setRecentDrops] = useState<Drop[]>([]);
  const [expandedDrop, setExpandedDrop] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load recent drops on mount
  useEffect(() => {
    fetchRecentDrops();
  }, []);

  // Auto-detect URLs and set type to link
  useEffect(() => {
    const trimmed = content.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      if (type !== 'link') setType('link');
    }
  }, [content, type]);

  // Auto-set type to file when files are present
  useEffect(() => {
    if (files.length > 0 && type !== 'file') {
      setType('file');
    }
  }, [files, type]);

  const fetchRecentDrops = useCallback(async () => {
    try {
      const response = await fetch('/api/drops?limit=10');
      if (response.ok) {
        const data = await response.json();
        setRecentDrops(data.drops || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent drops:', error);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if ((!trimmed && files.length === 0) || isSending) return;

    setIsSending(true);
    try {
      let uploadedFiles: string[] = [];

      // Upload files if present
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        const uploadResponse = await fetch('/api/drops/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          uploadedFiles = uploadData.files || [];
        } else {
          throw new Error('File upload failed');
        }
      }

      // Create drop
      const dropData: any = {
        type,
        content: trimmed || 'File upload',
      };

      if (uploadedFiles.length > 0) {
        dropData.files = uploadedFiles;
      }

      if (type === 'link' && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
        dropData.url = trimmed;
      }

      const response = await fetch('/api/drops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dropData),
      });

      if (response.ok) {
        // Clear form
        setContent('');
        setFiles([]);
        setType('note');
        
        // Show confirmation
        const typeData = DROP_TYPES.find(t => t.key === type);
        setConfirmation(`Dropped! ${typeData?.icon || '📥'}`);
        setTimeout(() => setConfirmation(null), 2000);

        // Auto-resize textarea
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.focus();
        }

        // Refresh recent drops
        await fetchRecentDrops();
      } else {
        throw new Error('Failed to create drop');
      }
    } catch (error) {
      console.error('Failed to submit drop:', error);
      setConfirmation('❌ Failed to drop');
      setTimeout(() => setConfirmation(null), 2000);
    } finally {
      setIsSending(false);
    }
  }, [content, type, files, isSending, fetchRecentDrops]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }, []);

  const autoResizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, []);

  useEffect(() => {
    autoResizeTextarea();
  }, [content, autoResizeTextarea]);

  return (
    <GlassCard className={className} padding="lg">
      <div className="space-y-5">
        {/* Header */}
        <SectionHeading icon="📥">Universal Inbox</SectionHeading>

        {/* Type Selector */}
        <div className="flex flex-wrap gap-2">
          {DROP_TYPES.map(({ key, label, icon }) => (
            <GlassPill
              key={key}
              variant={type === key ? 'ember' : 'ghost'}
              active={type === key}
              onClick={() => setType(key)}
              icon={<span>{icon}</span>}
              className="cursor-pointer"
            >
              {label}
            </GlassPill>
          ))}
        </div>

        {/* Input Area */}
        <div
          className={`relative transition-all duration-300 ${
            isDragging ? 'bg-opacity-20' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            borderRadius: '12px',
            border: isDragging
              ? `2px dashed ${color.ember.DEFAULT}`
              : '2px dashed transparent',
            padding: isDragging ? '12px' : '0',
          }}
        >
          <div className="space-y-3">
            {/* Main textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={autoResizeTextarea}
                placeholder={
                  type === 'link'
                    ? 'Paste a URL...'
                    : type === 'idea'
                    ? 'Drop an idea...'
                    : type === 'task'
                    ? 'Quick task...'
                    : type === 'file'
                    ? 'Drop files or describe them...'
                    : 'Drop anything...'
                }
                rows={1}
                style={{
                  width: '100%',
                  minHeight: '44px',
                  maxHeight: '120px',
                  padding: '12px 16px',
                  background: color.bg.surface,
                  border: `1.5px solid ${color.glass.border}`,
                  borderRadius: '12px',
                  color: color.text.primary,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.body,
                  outline: 'none',
                  resize: 'none',
                  transition: `all ${animation.duration.normal} ${animation.easing.default}`,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = color.glass.borderFocus;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = color.glass.border;
                }}
              />
              
              {/* Action buttons */}
              <div className="absolute right-2 bottom-2 flex gap-2">
                {/* File upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-md text-xs"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: color.text.dim,
                    transition: `all ${animation.duration.fast} ${animation.easing.default}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 107, 53, 0.1)';
                    e.currentTarget.style.color = color.ember.flame;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = color.text.dim;
                  }}
                  title="Upload files"
                >
                  📎
                </button>

                {/* Submit button */}
                {(content.trim() || files.length > 0) && (
                  <EmberButton
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isSending}
                  >
                    {isSending ? '...' : '⏎'}
                  </EmberButton>
                )}
              </div>
            </div>

            {/* File preview */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-3 p-2 rounded-lg"
                    style={{ background: 'rgba(255, 255, 255, 0.04)' }}
                  >
                    <span className="text-sm">📎</span>
                    <span
                      className="text-sm flex-1"
                      style={{ color: color.text.primary }}
                    >
                      {file.name}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: color.text.dim }}
                    >
                      {(file.size / 1024).toFixed(1)}KB
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        color: color.text.dim,
                        transition: `color ${animation.duration.fast} ${animation.easing.default}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = color.status.error;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = color.text.dim;
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Confirmation message */}
            {confirmation && (
              <div
                className="text-center text-sm font-medium"
                style={{
                  color: confirmation.includes('❌') ? color.status.error : color.status.healthy,
                }}
              >
                {confirmation}
              </div>
            )}

            {/* Hint */}
            {(content.trim() || files.length > 0) && (
              <p
                className="text-xs text-right"
                style={{ color: color.text.dim }}
              >
                ⌘+Enter to submit
              </p>
            )}
          </div>
        </div>

        {/* Recent Drops */}
        {recentDrops.length > 0 && (
          <div className="space-y-3">
            <SectionHeading size="sm">Recent Drops</SectionHeading>
            <div className="space-y-2">
              {recentDrops.map((drop) => {
                const typeData = DROP_TYPES.find(t => t.key === drop.type);
                const isExpanded = expandedDrop === drop.id;
                
                return (
                  <div
                    key={drop.id}
                    className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                    style={{
                      background: color.bg.surface,
                      border: `1px solid ${color.glass.border}`,
                    }}
                    onClick={() => setExpandedDrop(isExpanded ? null : drop.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = color.glass.borderHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = color.glass.border;
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-sm mt-0.5">{typeData?.icon || '📥'}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm truncate"
                          style={{ color: color.text.primary }}
                        >
                          {isExpanded ? drop.content : drop.content}
                        </p>
                        {drop.files && drop.files.length > 0 && (
                          <p
                            className="text-xs mt-1"
                            style={{ color: color.text.dim }}
                          >
                            📎 {drop.files.length} file{drop.files.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <span
                        className="text-xs flex-shrink-0"
                        style={{ color: color.text.dim }}
                      >
                        {formatTimestamp(drop.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
      </div>
    </GlassCard>
  );
}