'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UploadResult {
  filename: string;
  size: number;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadButtonProps {
  /** Render as a compact button (for headers) vs a drop-zone card */
  variant?: 'button' | 'zone';
  className?: string;
}

export function UploadButton({ variant = 'button', className = '' }: UploadButtonProps): React.ReactElement {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const resetTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (resetTimer.current) clearTimeout(resetTimer.current); };
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
    setDragOver(false);
  }, []);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    setStatus('uploading');
    setErrorMsg('');
    setResult(null);

    let lastResult: UploadResult | null = null;
    const fileArray = Array.from(files);

    try {
      for (const file of fileArray) {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        if (!res.ok) throw new Error(`Upload failed for ${file.name}`);
        lastResult = (await res.json()) as UploadResult;
      }

      setResult(
        fileArray.length === 1 && lastResult
          ? lastResult
          : { filename: `${fileArray.length} files`, size: fileArray.reduce((a, f) => a + f.size, 0) }
      );
      setStatus('success');
      resetTimer.current = setTimeout(reset, 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
      setStatus('error');
      resetTimer.current = setTimeout(reset, 4000);
    }
  }, [reset]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
    e.target.value = '';
  }, [uploadFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const statusIcon = status === 'uploading'
    ? <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    : status === 'success'
    ? <span>✓</span>
    : status === 'error'
    ? <span>✕</span>
    : <span>↑</span>;

  const statusText = status === 'uploading'
    ? 'Uploading…'
    : status === 'success' && result
    ? `${result.filename} (${formatSize(result.size)})`
    : status === 'error'
    ? errorMsg
    : null;

  // Hidden file input (shared)
  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      multiple
      className="hidden"
      onChange={handleFileChange}
    />
  );

  if (variant === 'zone') {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => status === 'idle' && inputRef.current?.click()}
        className={`
          relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
          flex flex-col items-center justify-center gap-2 p-6 min-h-[120px] text-center
          ${dragOver
            ? 'border-accent bg-accent/10 scale-[1.01]'
            : 'border-border hover:border-accent/50 bg-surface/80 backdrop-blur-sm hover:bg-surface-raised/80'
          }
          ${className}
        `}
      >
        {fileInput}
        <span className="text-2xl">{statusIcon}</span>
        {statusText ? (
          <p className={`text-sm ${status === 'error' ? 'text-red-400' : status === 'success' ? 'text-green-400' : 'text-text-muted'}`}>
            {statusText}
          </p>
        ) : (
          <>
            <p className="text-sm text-foreground font-medium">Drop files here</p>
            <p className="text-xs text-text-muted">or click to browse</p>
          </>
        )}
      </div>
    );
  }

  // Button variant
  return (
    <div
      className={`relative ${className}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {fileInput}
      <button
        type="button"
        onClick={() => status === 'idle' && inputRef.current?.click()}
        disabled={status === 'uploading'}
        className={`
          px-4 py-2.5 min-h-[44px] rounded-lg font-medium
          border transition-all duration-200 flex items-center gap-2 flex-shrink-0
          text-sm md:text-base
          ${dragOver
            ? 'border-accent bg-accent/20 text-accent scale-105'
            : status === 'success'
            ? 'border-green-500/50 bg-green-500/10 text-green-400'
            : status === 'error'
            ? 'border-red-500/50 bg-red-500/10 text-red-400'
            : 'border-border bg-surface-raised hover:bg-border active:scale-95 text-foreground'
          }
        `}
      >
        <span className="text-base">{statusIcon}</span>
        <span className="hidden sm:inline">
          {statusText ?? 'Upload'}
        </span>
      </button>
    </div>
  );
}
