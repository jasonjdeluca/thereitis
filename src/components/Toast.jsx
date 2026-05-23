export default function Toast({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-3 inset-x-0 z-40 flex flex-col items-center gap-2 px-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-toastIn pointer-events-auto rounded-full bg-navy-2/95 border border-gold/60 shadow-gold px-4 py-2 text-sm text-cream max-w-xs text-center"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
