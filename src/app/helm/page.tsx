import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';

export default function HelmPage(): React.ReactElement {
  return (
    <div>
      <PageHeader title="The Helm" subtitle="Navigate with purpose — every ring tells a story" date="Q1 2026 Goals" />
      <GlassCard>
        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
          <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🎯</p>
          <p>Coming soon — The Helm is being forged</p>
        </div>
      </GlassCard>
    </div>
  );
}
