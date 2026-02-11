import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { UploadButton } from '@/components/actions/UploadButton';

export function Home(): React.ReactElement {
  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Command Center</h1>
        <p className="text-text-muted mt-1 text-sm md:text-base">
          Task management and project tracking
        </p>
      </header>

      {/* Kanban Board */}
      <section className="mb-6 md:mb-8">
        <KanbanBoard />
      </section>

      {/* Quick Actions */}
      <section className="bg-surface/80 backdrop-blur-sm rounded-xl border border-border p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Quick Actions
        </h2>
        <div className="flex gap-2 md:gap-3 flex-wrap">
          <button
            type="button"
            className="px-4 py-2.5 min-h-[44px] bg-accent hover:bg-accent-dim active:scale-95 rounded-lg text-white transition-all duration-200 text-sm md:text-base"
          >
            Status Report
          </button>
          <button
            type="button"
            className="px-4 py-2.5 min-h-[44px] bg-surface-raised hover:bg-border active:scale-95 rounded-lg text-foreground border border-border transition-all duration-200 text-sm md:text-base"
          >
            Security Check
          </button>
          <button
            type="button"
            className="px-4 py-2.5 min-h-[44px] bg-surface-raised hover:bg-border active:scale-95 rounded-lg text-foreground border border-border transition-all duration-200 text-sm md:text-base"
          >
            Activity Summary
          </button>
        </div>
      </section>

      {/* Upload Zone */}
      <section className="mb-4 md:mb-6">
        <UploadButton variant="zone" />
      </section>
    </div>
  );
}

export default Home;
