'use client';

import { useState, useCallback, useRef } from 'react';

interface QuickAction {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  isUpload?: boolean;
}

const actions: QuickAction[] = [
  { id: 'upload', icon: '📎', title: 'Upload to Inbox', subtitle: "Drop a file into Aaron's inbox", isUpload: true },
  { id: 'status', icon: '📊', title: 'Status Report', subtitle: 'Current tasks & progress' },
  { id: 'activity', icon: '📝', title: 'Activity Summary', subtitle: 'Recent changes & events' },
  { id: 'security', icon: '🔍', title: 'Security Check', subtitle: 'Review settings & configs' },
];

export function QuickActions(): React.ReactElement {
  const [requestedId, setRequestedId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (files: FileList) => {
    setUploadStatus('uploading');
    setRequestedId('upload');
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        if (!res.ok) throw new Error(`Upload failed for ${file.name}`);
      }
      setUploadStatus('success');
      setTimeout(() => { setRequestedId(null); setUploadStatus('idle'); }, 2000);
    } catch {
      setUploadStatus('error');
      setTimeout(() => { setRequestedId(null); setUploadStatus('idle'); }, 3000);
    }
  }, []);

  const handleClick = useCallback((action: QuickAction) => {
    if (action.isUpload) {
      inputRef.current?.click();
      return;
    }
    setRequestedId(action.id);
    setTimeout(() => setRequestedId(null), 1500);
  }, []);

  return (
    <div className="p-4 space-y-2">
      <p className="text-xs text-text-muted uppercase tracking-wider mb-3 px-1">
        Quick Actions
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files); e.target.value = ''; }}
      />
      {actions.map((action) => {
        const isRequested = requestedId === action.id;
        const isUploading = action.isUpload && uploadStatus === 'uploading';
        const isUploadSuccess = action.isUpload && uploadStatus === 'success';
        const isUploadError = action.isUpload && uploadStatus === 'error';
        const isActive = isRequested || isUploading || isUploadSuccess;

        return (
          <button
            key={action.id}
            onClick={() => handleClick(action)}
            disabled={isUploading}
            className={`
              w-full text-left px-4 py-3 rounded-lg
              backdrop-blur-sm border transition-all duration-300
              ${isActive
                ? 'bg-green-500/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                : isUploadError
                ? 'bg-red-500/20 border-red-500/50'
                : 'bg-surface-raised/50 border-border/50 hover:bg-accent/10 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{action.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isActive ? 'text-green-400' : isUploadError ? 'text-red-400' : 'text-foreground'}`}>
                  {isUploading ? 'Uploading…' : isUploadSuccess ? 'Uploaded!' : isUploadError ? 'Upload failed' : isRequested ? 'Requested...' : action.title}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {action.subtitle}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
