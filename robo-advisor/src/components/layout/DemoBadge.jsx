import { Eye } from 'lucide-react';

const C = { accent: 'var(--accent)' };

export default function DemoBadge() {
  return (
    <div
      className="fixed z-30 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider shadow-lg"
      style={{
        background: C.accent,
        color: '#fff',
        top: 'calc(env(safe-area-inset-top) + 10px)',
        right: '12px',
      }}>
      <Eye size={11} strokeWidth={2.5} />
      Demo mode
    </div>
  );
}
