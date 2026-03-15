'use client';

import { useCallback, useRef, useState } from 'react';
import type { Team } from '@/lib/supabase/types';

interface TeamAutocompleteProps {
  teams: Team[];
  onSelect: (team: Team) => void;
  placeholder?: string;
}

export default function TeamAutocomplete({ teams, onSelect, placeholder = 'Type team name or abbr...' }: TeamAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const available = teams.filter((t) => !t.owner_id);
  const q = query.trim().toLowerCase();
  const matches = q
    ? available.filter(
        (t) =>
          t.name.toLowerCase().includes(q) || t.abbr.toLowerCase().includes(q)
      )
    : [...available].sort((a, b) => a.seed - b.seed || a.name.localeCompare(b.name));

  const select = useCallback(
    (team: Team) => {
      onSelect(team);
      setQuery('');
      setOpen(false);
      setHighlightIndex(0);
    },
    [onSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || matches.length === 0) {
      if (e.key === 'Escape') setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % matches.length);
      listRef.current?.children[highlightIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + matches.length) % matches.length);
      listRef.current?.children[highlightIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      select(matches[highlightIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full" style={{ fontFamily: 'var(--font-vt323), monospace' }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlightIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full pixel-border bg-[var(--card)] px-3 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] text-lg"
      />
      {open && (
        <ul
          ref={listRef}
          className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto pixel-border bg-[var(--surface)]"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-[var(--text-muted)]">No matches</li>
          ) : (
            matches.map((team, i) => (
              <li key={team.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(team);
                  }}
                  className={`w-full text-left px-3 py-2 text-lg ${i === highlightIndex ? 'bg-[var(--accent-yellow)] text-black' : 'text-[var(--text-primary)]'}`}
                >
                  [{team.seed}] {team.is_first_four ? team.abbr : team.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
