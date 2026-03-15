'use client';

import type { Team } from '@/lib/supabase/types';

function teamDisplayName(team: Team): string {
  if (team.is_first_four && !team.ff_winner) return team.abbr;
  return team.name;
}

interface GameResultModalProps {
  topTeam: Team | null;
  bottomTeam: Team | null;
  currentWinnerId: string | null;
  selectedWinnerId: string | null;
  onSelect: (teamId: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function GameResultModal({
  topTeam,
  bottomTeam,
  currentWinnerId,
  selectedWinnerId,
  onSelect,
  onSave,
  onCancel,
}: GameResultModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Who won this game?"
    >
      <div
        className="w-full max-w-[320px] pixel-border bg-[var(--surface)] p-4"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'var(--font-press-start), monospace' }}
      >
        <h2 className="text-center text-xs mb-4 text-[var(--text-primary)]">WHO WON THIS GAME?</h2>
        <div className="space-y-2 mb-6">
          {topTeam && (
            <button
              type="button"
              onClick={() => onSelect(topTeam.id)}
              className={`w-full pixel-border py-3 px-3 text-left text-sm transition-colors ${selectedWinnerId === topTeam.id ? 'bg-[var(--accent-yellow)] text-black' : 'bg-[var(--card)] text-[var(--text-primary)]'}`}
              style={{ fontFamily: 'var(--font-vt323), monospace' }}
            >
              [{topTeam.seed}] {teamDisplayName(topTeam)}
            </button>
          )}
          {bottomTeam && (
            <button
              type="button"
              onClick={() => onSelect(bottomTeam.id)}
              className={`w-full pixel-border py-3 px-3 text-left text-sm transition-colors ${selectedWinnerId === bottomTeam.id ? 'bg-[var(--accent-yellow)] text-black' : 'bg-[var(--card)] text-[var(--text-primary)]'}`}
              style={{ fontFamily: 'var(--font-vt323), monospace' }}
            >
              [{bottomTeam.seed}] {teamDisplayName(bottomTeam)}
            </button>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="pixel-btn px-4 py-2 text-xs bg-[var(--card)] text-[var(--text-primary)]"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!selectedWinnerId}
            className="pixel-btn px-4 py-2 text-xs bg-[var(--accent-green)] text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
