'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard, GlassPill, EmberButton } from '@/components/ui';
import { color, typography, radius } from '@/styles/tokens';

// ─── Types ──────────────────────────────────────────────────────

interface VaultFile {
  id: string;
  title: string;
  filename: string;
  category: string;
  path: string;
  createdAt: string;
  modifiedAt: string;
  size: number;
  excerpt: string;
}

// ─── Category Config ────────────────────────────────────────────

const CATEGORY_META: Record<string, { icon: string; label: string; color: string }> = {
  briefs: { icon: '☀️', label: 'Briefs', color: '#f59e0b' },
  reports: { icon: '📊', label: 'Reports', color: '#60a5fa' },
  docs: { icon: '📄', label: 'Docs', color: '#a78bfa' },
  sops: { icon: '📋', label: 'SOPs', color: '#34d399' },
  research: { icon: '🔬', label: 'Research', color: '#f472b6' },
  proposals: { icon: '💼', label: 'Proposals', color: '#fb923c' },
};

function getCategoryMeta(cat: string) {
  return CATEGORY_META[cat] || { icon: '📁', label: cat, color: color.text.secondary };
}

// ─── Markdown Renderer (simple) ─────────────────────────────────

function renderMarkdown(md: string): string {
  let html = md
    // Frontmatter removal
    .replace(/^---\s*\n[\s\S]*?---\s*\n/, '')
    // Headers
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```[\s\S]*?```/g, (match) => {
      const content = match.replace(/```\w*\n?/, '').replace(/```$/, '');
      return `<pre><code>${content}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr />')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Line breaks → paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');

  // Wrap loose li tags
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  return `<p>${html}</p>`;
}

// ─── File Card ──────────────────────────────────────────────────

function FileCard({
  file,
  isSelected,
  onClick,
}: {
  file: VaultFile;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meta = getCategoryMeta(file.category);
  const modified = new Date(file.modifiedAt);
  const daysAgo = Math.floor((Date.now() - modified.getTime()) / (1000 * 60 * 60 * 24));
  const timeLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px',
        background: isSelected ? `${meta.color}12` : color.bg.surface,
        border: `1px solid ${isSelected ? `${meta.color}50` : color.glass.border}`,
        borderRadius: radius.lg,
        cursor: 'pointer',
        transition: 'all 0.2s',
        borderLeft: isSelected ? `3px solid ${meta.color}` : `3px solid transparent`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>{meta.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600,
            fontSize: '0.78rem',
            color: isSelected ? meta.color : color.text.primary,
            marginBottom: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const,
          }}>
            {file.title}
          </div>
          <div style={{
            fontSize: '0.65rem',
            color: color.text.dim,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const,
          }}>
            {file.excerpt}
          </div>
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '4px',
            fontSize: '0.6rem',
            color: color.text.dim,
          }}>
            <span style={{ color: meta.color, fontWeight: 500 }}>{meta.label}</span>
            <span>{timeLabel}</span>
            <span>{(file.size / 1024).toFixed(1)}KB</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── File Viewer ────────────────────────────────────────────────

// System file categories that should NOT be editable
const SYSTEM_CATEGORIES = ['system'];

function FileViewer({ file, onSaved, recentFiles, onSelectFile }: { file: VaultFile | null; onSaved?: () => void; recentFiles?: VaultFile[]; onSelectFile?: (f: VaultFile) => void }) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!file) { setContent(null); setIsEditing(false); return; }
    setIsLoading(true);
    setIsEditing(false);
    fetch(`/api/vault?id=${file.id}`)
      .then((r) => r.json())
      .then((data) => setContent(data.content || ''))
      .catch(() => setContent('Error loading file'))
      .finally(() => setIsLoading(false));
  }, [file]);

  const isSystemFile = file ? SYSTEM_CATEGORIES.includes(file.category) : false;

  const handleEdit = () => {
    if (content) {
      setEditContent(content);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const handleSave = async () => {
    if (!file) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/vault', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: file.id, content: editContent }),
      });
      if (!res.ok) throw new Error('Save failed');
      setContent(editContent);
      setIsEditing(false);
      onSaved?.();
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!file) {
    const recent = recentFiles?.slice(0, 5) || [];
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '400px',
        color: color.text.dim,
        gap: '12px',
        padding: '24px',
      }}>
        <span style={{ fontSize: '2.5rem' }}>📚</span>
        <span style={{ fontSize: '0.85rem' }}>Select a document to view</span>
        {recent.length > 0 && (
          <div style={{ marginTop: '16px', width: '100%', maxWidth: '320px' }}>
            <div style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: color.text.dim,
              marginBottom: '8px',
              textAlign: 'center',
            }}>
              Recently Modified
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {recent.map((f) => {
                const meta = getCategoryMeta(f.category);
                return (
                  <button
                    key={f.id}
                    onClick={() => onSelectFile?.(f)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'transparent',
                      border: `1px solid ${color.glass.border}`,
                      borderRadius: radius.md,
                      color: color.text.secondary,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${meta.color}12`;
                      e.currentTarget.style.borderColor = `${meta.color}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = color.glass.border;
                    }}
                  >
                    <span>{meta.icon}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{f.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  const meta = getCategoryMeta(file.category);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${color.glass.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: color.text.primary }}>
            {meta.icon} {file.title}
          </div>
          <div style={{ fontSize: '0.65rem', color: color.text.dim, marginTop: '2px' }}>
            {meta.label} · Modified {new Date(file.modifiedAt).toLocaleDateString()} · {(file.size / 1024).toFixed(1)}KB
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {!isSystemFile && !isEditing && content && (
            <button
              onClick={handleEdit}
              style={{
                background: `${color.ember.flame}18`,
                border: `1px solid ${color.ember.flame}40`,
                borderRadius: radius.md,
                color: color.ember.flame,
                padding: '5px 12px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${color.ember.flame}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${color.ember.flame}18`;
              }}
            >
              ✏️ Edit
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={handleCancel}
                style={{
                  background: color.bg.surface,
                  border: `1px solid ${color.glass.border}`,
                  borderRadius: radius.md,
                  color: color.text.secondary,
                  padding: '5px 12px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  background: isSaving ? color.text.dim : color.ember.flame,
                  border: 'none',
                  borderRadius: radius.md,
                  color: '#000',
                  padding: '5px 14px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: isSaving ? 'wait' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {isSaving ? 'Saving...' : '💾 Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px',
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', color: color.text.dim, padding: '40px' }}>Loading...</div>
        ) : isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={{
              width: '100%',
              height: '100%',
              minHeight: '400px',
              background: `${color.bg.base}cc`,
              border: `1px solid ${color.glass.border}`,
              borderRadius: radius.md,
              color: color.text.primary,
              padding: '16px',
              fontSize: '0.8rem',
              lineHeight: 1.7,
              fontFamily: 'monospace',
              resize: 'vertical',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = `${color.ember.flame}60`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = color.glass.border;
            }}
          />
        ) : content ? (
          <div
            className="vault-markdown"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            style={{
              fontSize: '0.82rem',
              lineHeight: 1.7,
              color: color.text.secondary,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function VaultPage(): React.ReactElement {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/vault');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setFiles(data.files || []);
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Vault fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  // Filtering
  let filtered = files;
  if (categoryFilter !== 'all') {
    filtered = filtered.filter((f) => f.category === categoryFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((f) =>
      f.title.toLowerCase().includes(q) ||
      f.excerpt.toLowerCase().includes(q) ||
      f.filename.toLowerCase().includes(q)
    );
  }

  // Stats
  const totalDocs = files.length;
  const catCounts: Record<string, number> = {};
  files.forEach((f) => { catCounts[f.category] = (catCounts[f.category] || 0) + 1; });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Vault" subtitle="Knowledge base — docs, reports, and reference" />
        <div style={{ padding: '60px', textAlign: 'center', color: color.text.dim }}>Loading vault...</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Vault"
        subtitle={`${totalDocs} documents across ${categories.length} categories`}
      />

      {/* Category Filter + Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <GlassPill
            variant="default"
            size="sm"
            active={categoryFilter === 'all'}
            onClick={() => setCategoryFilter('all')}
          >
            All <span style={{ opacity: 0.5, marginLeft: '4px' }}>{totalDocs}</span>
          </GlassPill>
          {categories.map((cat) => {
            const meta = getCategoryMeta(cat);
            return (
              <GlassPill
                key={cat}
                variant="default"
                size="sm"
                active={categoryFilter === cat}
                onClick={() => setCategoryFilter(cat)}
              >
                {meta.icon} {meta.label}
                <span style={{ opacity: 0.5, marginLeft: '4px' }}>{catCounts[cat] || 0}</span>
              </GlassPill>
            );
          })}
        </div>
        <input
          type="text"
          placeholder="Search vault..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: color.bg.surface,
            border: `1px solid ${color.glass.border}`,
            borderRadius: radius.lg,
            color: color.text.primary,
            padding: '6px 12px',
            fontSize: '0.75rem',
            outline: 'none',
            width: '180px',
          }}
        />
      </div>

      {/* Split View: Viewer + File List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '12px', minHeight: '500px' }}>
        {/* Viewer */}
        <GlassCard padding="none" hover={false}>
          <FileViewer
            file={selectedFile}
            onSaved={fetchFiles}
            recentFiles={[...files].sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())}
            onSelectFile={setSelectedFile}
          />
        </GlassCard>

        {/* File List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          maxHeight: '70vh',
          overflowY: 'auto',
          paddingRight: '4px',
        }}>
          {filtered.length > 0 ? (
            filtered.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                isSelected={selectedFile?.id === file.id}
                onClick={() => setSelectedFile(file)}
              />
            ))
          ) : (
            <div style={{
              padding: '30px',
              textAlign: 'center',
              color: color.text.dim,
              fontSize: '0.78rem',
            }}>
              No documents found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
