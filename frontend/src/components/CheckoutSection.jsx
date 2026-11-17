
export default function CheckoutSection({ number, title, subtitle, action, children }) {
  return (
    <section className="rounded-sm border border-stone-200 bg-white">
      <header className="flex items-start justify-between gap-3 border-b border-stone-200 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-sm bg-maroon-dark text-[10px] font-semibold text-white">{number}</span>
          <div className="min-w-0">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-900 sm:text-sm">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}