'use client';

import PlayerAvatar from '@/components/PlayerAvatar';
import { ROUND_BASE_POINTS } from '@/lib/scoring';
import type { Game, Team, Player } from '@/lib/supabase/types';

function teamDisplayName(team: Team | null | undefined): string {
  if (!team) return 'TBD';
  if (team.is_first_four && !team.ff_winner) return team.abbr;
  return team.name;
}

interface GameCardProps {
  game: Game;
  topTeam: Team | null | undefined;
  bottomTeam: Team | null | undefined;
  winnerId: string | null;
  playersById: Map<string, Player>;
  round: number;
  onTap: () => void;
}

export default function GameCard({
  game,
  topTeam,
  bottomTeam,
  winnerId,
  playersById,
  round,
  onTap,
}: GameCardProps) {
  const points = (team: Team | null | undefined, opponent: Team | null | undefined) => {
    if (!team) return 0;
    const base = ROUND_BASE_POINTS[round] ?? 0;
    if (!opponent) return base;
    const diff = team.seed - opponent.seed;
    const upsetBonus = diff > 0 ? diff : 0;
    return base + upsetBonus;
  };
  const topOwner = topTeam?.owner_id ? playersById.get(topTeam.owner_id) : null;
  const bottomOwner = bottomTeam?.owner_id ? playersById.get(bottomTeam.owner_id) : null;
  const topWon = winnerId && topTeam && winnerId === topTeam.id;
  const bottomWon = winnerId && bottomTeam && winnerId === bottomTeam.id;

  return (
    <button
      type="button"
      onClick={onTap}
      className="w-full text-left pixel-border rounded-none bg-[var(--card)] p-2.5 mb-2 active:translate-y-0.5 active:shadow-[2px_2px_0_0_#000]"
      style={{ fontFamily: 'var(--font-vt323), monospace' }}
    >
      {/* Top row */}
      <div
        className={`flex items-center justify-between gap-2 py-1.5 px-1 text-base ${topWon ? 'winner-glow font-bold' : ''} ${winnerId && !topWon && topTeam ? 'eliminated-team' : ''}`}
      >
        <span className="flex shrink-0 items-center gap-1.5">
          {topOwner ? <PlayerAvatar name={topOwner.name} size="md" /> : <span className="text-[var(--text-muted)] w-7 text-sm">---</span>}
        </span>
        <span className="shrink-0">{topTeam ? `[${topTeam.seed}]` : '—'}</span>
        <span className="flex-1 truncate">{teamDisplayName(topTeam)}</span>
        {topTeam && !winnerId && (
          <span className="text-[var(--accent-yellow)] shrink-0">
            +{points(topTeam, bottomTeam ?? null)}
          </span>
        )}
        {topWon && topTeam && (
          <span className="text-[var(--accent-yellow)] shrink-0">
            ★ +{points(topTeam, bottomTeam ?? null)}
          </span>
        )}
      </div>
      {/* Bottom row */}
      <div
        className={`flex items-center justify-between gap-2 py-1.5 px-1 text-base ${bottomWon ? 'winner-glow font-bold' : ''} ${winnerId && !bottomWon && bottomTeam ? 'eliminated-team' : ''}`}
      >
        <span className="flex shrink-0 items-center gap-1.5">
          {bottomOwner ? <PlayerAvatar name={bottomOwner.name} size="md" /> : <span className="text-[var(--text-muted)] w-7 text-sm">---</span>}
        </span>
        <span className="shrink-0">{bottomTeam ? `[${bottomTeam.seed}]` : '—'}</span>
        <span className="flex-1 truncate">{teamDisplayName(bottomTeam)}</span>
        {bottomTeam && !winnerId && (
          <span className="text-[var(--accent-yellow)] shrink-0">
            +{points(bottomTeam, topTeam ?? null)}
          </span>
        )}
        {bottomWon && bottomTeam && (
          <span className="text-[var(--accent-yellow)] shrink-0">
            ★ +{points(bottomTeam, topTeam ?? null)}
          </span>
        )}
      </div>
    </button>
  );
}
