export function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-2.5 mb-4">
      {message}
    </div>
  );
}

export function SuccessAlert({ message }) {
  if (!message) return null;
  return (
    <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl px-4 py-2.5 mb-4">
      {message}
    </div>
  );
}

export function EmptyState({ text }) {
  return <div className="text-center text-ink-400 text-sm py-10">{text}</div>;
}
