/**
 * EmptyState.tsx — Reusable empty state for lists and tables.
 */

interface Props {
  icon?: string;
  message: string;
  subtext?: string;
}

export default function EmptyState({ icon = '📋', message, subtext }: Props) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-gray-400 text-sm">{message}</div>
      {subtext && <div className="text-gray-500 text-xs mt-1">{subtext}</div>}
    </div>
  );
}
