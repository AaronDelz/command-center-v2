import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';

export default function VaultPage(): React.ReactElement {
  return (
    <div>
      <PageHeader title="Vault" subtitle="Knowledge base — docs, reports, and reference" />
      <GlassCard>
        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
          <p style={{ fontSize: '2rem', marginBottom: '8px' }}>📚</p>
          <p>Coming soon — Vault is being forged</p>
        </div>
      </GlassCard>
    </div>
  );
}
