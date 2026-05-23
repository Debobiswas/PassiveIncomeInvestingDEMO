export default function BentoCard({ children, className = '', accent = false }) {
  return (
    <div
      className={`card rounded-2xl p-5 flex flex-col ${className}`}
      style={accent
        ? { boxShadow: '0 4px 20px rgba(245,166,35,0.14), 0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(245,166,35,0.18)' }
        : undefined}
    >
      {children}
    </div>
  );
}
