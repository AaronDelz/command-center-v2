import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';

export default function ContentPage(): React.ReactElement {
  return (
    <div>
      <PageHeader title="Content Hub" subtitle="Plan, create, publish, analyze — the content engine" />
      <GlassCard>
        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
          <p style={{ fontSize: '2rem', marginBottom: '8px' }}>📱</p>
          <p>Coming soon — Content Hub is being forged</p>
        </div>
      </GlassCard>
    </div>
  );
}
