import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';

export default function ClientsPage(): React.ReactElement {
  return (
    <div>
      <PageHeader title="Client Command" subtitle="Your client roster — relationships, revenue, results" />
      <GlassCard>
        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
          <p style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</p>
          <p>Coming soon — Client Command is being forged</p>
        </div>
      </GlassCard>
    </div>
  );
}
