import Link from 'next/link';

export default function Home() {
  return (
    <div className="page-padding flex min-h-[100dvh] flex-col items-center justify-center gap-6" style={{ fontFamily: 'var(--font-press-start), monospace' }}>
      <h1 className="text-center text-sm text-[var(--accent-yellow)]">MARCH MADNESS</h1>
      <p className="text-center text-lg text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-vt323), monospace' }}>
        Snake Draft Scorer
      </p>
      <div className="flex flex-col gap-3 w-full max-w-[280px]">
        <Link
          href="/bracket"
          className="pixel-btn block w-full py-3 text-center text-xs bg-[var(--card)] text-[var(--text-primary)]"
        >
          BRACKET
        </Link>
        <Link
          href="/scoreboard"
          className="pixel-btn block w-full py-3 text-center text-xs bg-[var(--card)] text-[var(--text-primary)]"
        >
          SCORES
        </Link>
        <Link
          href="/draft"
          className="pixel-btn block w-full py-3 text-center text-xs bg-[var(--card)] text-[var(--text-primary)]"
        >
          ROSTERS
        </Link>
        <div className="mt-4 pt-4 border-t-2 border-[var(--text-muted)]">
          <p className="text-[10px] text-[var(--text-muted)] mb-2">Admin</p>
          <Link href="/admin/reset" className="block text-xs text-[var(--text-muted)] hover:text-[var(--accent-yellow)]">Reset &amp; load bracket</Link>
          <Link href="/admin/setup" className="block text-xs text-[var(--text-muted)] hover:text-[var(--accent-yellow)]">Setup</Link>
          <Link href="/admin/draft-order" className="block text-xs text-[var(--text-muted)] hover:text-[var(--accent-yellow)]">Draft order</Link>
          <Link href="/admin/draft-admin" className="block text-xs text-[var(--text-muted)] hover:text-[var(--accent-yellow)]">Draft admin</Link>
          <Link href="/live-draft" className="block text-xs text-[var(--text-muted)] hover:text-[var(--accent-yellow)]">Live draft board</Link>
        </div>
      </div>
    </div>
  );
}
