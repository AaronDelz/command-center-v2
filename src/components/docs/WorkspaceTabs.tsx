'use client';

interface WorkspaceFile {
  id: string;
  label: string;
  filename: string;
  exists: boolean;
}

interface WorkspaceTabsProps {
  files: WorkspaceFile[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function WorkspaceTabs({
  files,
  activeTab,
  onTabChange,
}: WorkspaceTabsProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-2 mb-4 md:mb-6 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto pb-2">
      {files.map((file) => {
        const isActive = activeTab === file.id;
        const isDisabled = !file.exists;

        return (
          <button
            key={file.id}
            onClick={() => !isDisabled && onTabChange(file.id)}
            disabled={isDisabled}
            className={`
              px-3 md:px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium
              transition-all duration-200 flex-shrink-0 active:scale-95
              ${isActive
                ? 'bg-accent text-background'
                : isDisabled
                  ? 'bg-surface-raised/50 text-text-muted/50 cursor-not-allowed'
                  : 'bg-surface-raised text-text-muted hover:bg-surface-raised/80 hover:text-foreground'
              }
            `}
            title={isDisabled ? `${file.filename} not found` : file.filename}
          >
            {file.label}
            {isDisabled && (
              <span className="ml-1 opacity-50">⚠</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
