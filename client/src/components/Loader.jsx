export default function Loader({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center py-16 text-ink-400 text-sm gap-2">
      <div className="h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      {label}
    </div>
  );
}
