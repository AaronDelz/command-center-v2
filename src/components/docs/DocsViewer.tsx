'use client';

import { useMemo } from 'react';
import { marked } from 'marked';
import { GlassCard } from '@/components/ui';

interface DocsViewerProps {
  content: string | null;
  filename: string;
  isLoading: boolean;
  error?: string | null;
}

// Configure marked for security
marked.setOptions({
  gfm: true,
  breaks: true,
});

export function DocsViewer({
  content,
  filename,
  isLoading,
  error,
}: DocsViewerProps): React.ReactElement {
  const htmlContent = useMemo(() => {
    if (!content) return '';
    try {
      return marked.parse(content) as string;
    } catch (err) {
      console.error('Markdown parsing error:', err);
      return '<p class="text-red-400">Error parsing markdown</p>';
    }
  }, [content]);

  if (isLoading) {
    return (
      <GlassCard padding="none">
        <div className="p-4 md:p-8">
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </GlassCard>
    );
  }

  if (error || content === null) {
    return (
      <GlassCard padding="none">
        <div className="p-4 md:p-8">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              File Not Found
            </h3>
            <p className="text-text-muted text-sm">
              {filename} doesn&apos;t exist in the workspace yet.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard padding="none" className="overflow-hidden">
      {/* File header */}
      <div className="px-4 md:px-6 py-3 border-b border-border bg-surface-raised/50">
        <code className="text-xs md:text-sm text-text-muted break-all">{filename}</code>
      </div>

      {/* Markdown content */}
      <div
        className="prose-dark p-4 md:p-6 overflow-auto max-h-[calc(100vh-300px)] text-sm md:text-base"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </GlassCard>
  );
}
