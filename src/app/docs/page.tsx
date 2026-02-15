'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { WorkspaceTabs } from '@/components/docs/WorkspaceTabs';
import { DocsViewer } from '@/components/docs/DocsViewer';
import type { Report } from '@/lib/types';

interface WorkspaceFile {
  id: string;
  label: string;
  filename: string;
  exists: boolean;
}

interface FileContent {
  id: string;
  label: string;
  filename: string;
  content: string | null;
  error?: string;
}

interface ReportWithContent extends Report {
  content?: string | null;
  error?: string;
}

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

type DocSection = 'vault' | 'workspace';

function DocsPageContent(): React.ReactElement {
  const searchParams = useSearchParams();
  const [section, setSection] = useState<DocSection>(() => {
    // Default to workspace if file param present, vault otherwise
    return 'vault';
  });
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [activeTab, setActiveTab] = useState<string>('soul');
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Vault state
  const [reports, setReports] = useState<Report[]>([]);
  const [vaultCategories, setVaultCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ReportWithContent | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingReportContent, setIsLoadingReportContent] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch file list on mount
  useEffect(() => {
    async function fetchFiles(): Promise<void> {
      try {
        const res = await fetch('/api/docs');
        if (!res.ok) throw new Error('Failed to fetch files');
        const data = await res.json() as { workspace?: WorkspaceFile[]; files?: WorkspaceFile[] };
        setFiles(data.workspace ?? data.files ?? []);

        const allFiles = data.workspace ?? data.files ?? [];
        const firstExisting = allFiles.find((f) => f.exists);
        if (firstExisting) {
          setActiveTab(firstExisting.id);
        }
      } catch (err) {
        console.error('Error fetching files:', err);
        setError('Failed to load workspace files');
      } finally {
        setIsLoadingFiles(false);
      }
    }
    fetchFiles();
  }, []);

  // Fetch vault docs on mount (default tab)
  useEffect(() => {
    if (reports.length > 0) return;
    
    async function fetchReports(): Promise<void> {
      setIsLoadingReports(true);
      try {
        const res = await fetch('/api/reports');
        if (!res.ok) throw new Error('Failed to fetch reports');
        const data = await res.json() as { files?: VaultFile[]; reports?: Report[] };
        if (data.files) {
          const cats = [...new Set(data.files.map((f) => f.category))].sort();
          setVaultCategories(cats);
          setReports(data.files.map((f) => ({
            id: f.id,
            title: f.title,
            description: f.excerpt,
            date: f.modifiedAt,
            category: f.category,
            path: f.path,
          })));
        } else if (data.reports) {
          const cats = [...new Set(data.reports.map((r) => r.category))].sort();
          setVaultCategories(cats);
          setReports(data.reports);
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setIsLoadingReports(false);
      }
    }
    fetchReports();
  }, [reports.length]);

  const fetchReportContent = useCallback(async (reportId: string): Promise<void> => {
    setIsLoadingReportContent(true);
    setIsEditing(false);
    try {
      const res = await fetch(`/api/reports?id=${reportId}`);
      if (!res.ok) throw new Error('Failed to fetch report content');
      const data = await res.json() as { id: string; content: string | null };
      const report = reports.find((r) => r.id === reportId);
      setSelectedReport({
        ...report!,
        content: data.content,
      });
    } catch (err) {
      console.error('Error fetching report content:', err);
    } finally {
      setIsLoadingReportContent(false);
    }
  }, [reports]);

  // Track last handled params to avoid re-processing the same deep link
  const lastHandledParam = useRef<string | null>(null);

  // Handle deep link from search results
  useEffect(() => {
    const fileParam = searchParams.get('file');
    const vaultParam = searchParams.get('vault');
    const currentParam = fileParam ?? vaultParam ?? null;

    // Skip if same param already handled (prevents re-trigger on re-render)
    if (currentParam && currentParam === lastHandledParam.current) return;

    if (fileParam && !isLoadingFiles && files.length > 0) {
      lastHandledParam.current = fileParam;
      setSection('workspace');
      const match = files.find(
        (f) => f.filename === fileParam || f.id === fileParam || f.id === fileParam.replace('.md', '').toLowerCase()
      );
      if (match) {
        setActiveTab(match.id);
      }
    } else if (vaultParam && !isLoadingReports && reports.length > 0) {
      lastHandledParam.current = vaultParam;
      setSection('vault');
      const match = reports.find((r) => r.id === vaultParam);
      if (match) {
        fetchReportContent(match.id);
      }
    }
  }, [searchParams, files, reports, isLoadingFiles, isLoadingReports, fetchReportContent]);

  const handleEdit = useCallback(() => {
    if (selectedReport?.content) {
      setEditContent(selectedReport.content);
      setIsEditing(true);
    }
  }, [selectedReport]);

  const handleSave = useCallback(async () => {
    if (!selectedReport) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedReport.id, content: editContent }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSelectedReport({ ...selectedReport, content: editContent });
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setIsSaving(false);
    }
  }, [selectedReport, editContent]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent('');
  }, []);

  // Fetch content when tab changes
  const fetchContent = useCallback(async (fileId: string): Promise<void> => {
    setIsLoadingContent(true);
    try {
      const res = await fetch(`/api/docs?file=${fileId}`);
      if (!res.ok) throw new Error('Failed to fetch file content');
      const data = await res.json() as FileContent;
      setFileContent(data);
    } catch (err) {
      console.error('Error fetching content:', err);
      setFileContent(null);
    } finally {
      setIsLoadingContent(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab && !isLoadingFiles) {
      fetchContent(activeTab);
    }
  }, [activeTab, isLoadingFiles, fetchContent]);

  function handleTabChange(tabId: string): void {
    setActiveTab(tabId);
  }

  if (isLoadingFiles) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    brief: 'bg-blue-500/20 text-blue-400',
    guide: 'bg-green-500/20 text-green-400',
    research: 'bg-purple-500/20 text-purple-400',
    reports: 'bg-orange-500/20 text-orange-400',
    sops: 'bg-cyan-500/20 text-cyan-400',
    docs: 'bg-yellow-500/20 text-yellow-400',
  };

  const filteredReports = activeCategory === 'all'
    ? reports
    : reports.filter((r) => r.category === activeCategory);

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">
          Workspace Docs
        </h1>
        <p className="text-text-muted mt-1 text-sm md:text-base">
          Vault documents and configuration files
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-4 border-b border-border pb-2">
        <button
          onClick={() => setSection('vault')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            section === 'vault'
              ? 'bg-accent text-white'
              : 'text-text-muted hover:text-foreground hover:bg-surface-raised'
          }`}
        >
          Vault
        </button>
        <button
          onClick={() => setSection('workspace')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            section === 'workspace'
              ? 'bg-accent text-white'
              : 'text-text-muted hover:text-foreground hover:bg-surface-raised'
          }`}
        >
          Workspace Files
        </button>
      </div>

      {section === 'workspace' ? (
        <>
          <WorkspaceTabs
            files={files}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          <DocsViewer
            content={fileContent?.content ?? null}
            filename={fileContent?.filename ?? ''}
            isLoading={isLoadingContent}
            error={fileContent?.error}
          />
        </>
      ) : (
        <>
          {/* Vault Section */}
          {isLoadingReports ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : selectedReport ? (
            <div>
              {/* Back button + Edit button */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => { setSelectedReport(null); setIsEditing(false); }}
                  className="flex items-center gap-2 text-sm text-text-muted hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Vault
                </button>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 text-sm rounded-lg border border-border text-text-muted hover:text-foreground hover:bg-surface-raised transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-3 py-1.5 text-sm rounded-lg bg-accent text-white hover:bg-accent/80 transition-colors disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-border text-text-muted hover:text-foreground hover:bg-surface-raised transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  )}
                </div>
              </div>
              
              {isEditing ? (
                <div className="bg-surface/80 backdrop-blur-sm rounded-xl border border-border overflow-hidden">
                  <div className="px-4 md:px-6 py-3 border-b border-border bg-surface-raised/50">
                    <code className="text-xs md:text-sm text-text-muted">{selectedReport.title}</code>
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-[calc(100vh-300px)] p-4 md:p-6 bg-transparent text-foreground text-sm font-mono resize-none focus:outline-none"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <DocsViewer
                  content={selectedReport.content ?? null}
                  filename={selectedReport.title}
                  isLoading={isLoadingReportContent}
                  error={selectedReport.error}
                />
              )}
            </div>
          ) : (
            <>
              {/* Filter buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    activeCategory === 'all'
                      ? 'bg-accent text-white'
                      : 'bg-surface-raised text-text-muted hover:text-foreground hover:bg-surface-raised/80'
                  }`}
                >
                  All
                </button>
                {vaultCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition-colors ${
                      activeCategory === cat
                        ? 'bg-accent text-white'
                        : 'bg-surface-raised text-text-muted hover:text-foreground hover:bg-surface-raised/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredReports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => fetchReportContent(report.id)}
                    className="text-left bg-surface-raised/60 backdrop-blur-sm border border-border rounded-xl p-4 transition-all hover:border-accent/30 hover:bg-surface-raised/80"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-foreground line-clamp-2">
                        {report.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${categoryColors[report.category] ?? 'bg-gray-500/20 text-gray-400'}`}>
                        {report.category}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted line-clamp-2 mb-2">
                      {report.description}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(report.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </button>
                ))}
                {filteredReports.length === 0 && (
                  <div className="col-span-full text-center py-8 text-text-muted">
                    No documents found
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function DocsPage(): React.ReactElement {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', color: '#94A3B8' }}>Loading docs...</div>}>
      <DocsPageContent />
    </Suspense>
  );
}
