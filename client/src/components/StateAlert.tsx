export function StateAlert({ error }: { error?: string | null }) {
  if (!error) return null;
  return <div className="alert alert-danger border-0 shadow-sm">{error}</div>;
}
