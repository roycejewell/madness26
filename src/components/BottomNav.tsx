'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'BRACKET', href: '/bracket' },
  { label: 'SCORES', href: '/scoreboard' },
  { label: 'ROSTER', href: '/draft' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const isNavRoute = NAV_ITEMS.some(({ href }) => pathname === href || pathname?.startsWith(href + '/'));

  if (!isNavRoute) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-[600px] border-t-2 border-[var(--text-primary)] bg-[var(--card)] shadow-[4px_-4px_0_0_#000]"
      style={{ fontFamily: 'var(--font-press-start), monospace' }}
    >
      {NAV_ITEMS.map(({ label, href }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 items-center justify-center py-3 text-[10px] sm:text-xs transition-colors"
            style={{
              color: isActive ? 'var(--accent-yellow)' : 'var(--text-primary)',
              borderBottom: isActive ? '3px solid var(--accent-yellow)' : '3px solid transparent',
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
