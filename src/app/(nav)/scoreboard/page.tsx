'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeGames } from '@/hooks/useRealtimeGames';
import { useRealtimeTeams } from '@/hooks/useRealtimeTeams';
import PlayerAvatar from '@/components/PlayerAvatar';
import {
  computePlayerScore,
  teamsRemaining,
  getPlayerScoreBreakdown,
  ROUND_LABELS,
} from '@/lib/scoring';
import type { Player } from '@/lib/supabase/types';

export default function ScoreboardPage() {
  const { games } = useRealtimeGames();
  const { teams } = useRealtimeTeams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    createClient().from('players').select('*').order('draft_position').then(({ data }) => {
      if (data) setPlayers(data);
    });
  }, []);

  const teamOwnerIds = useMemo(() => new Map(teams.map((t) => [t.id, t.owner_id]).filter(([, o]) => o != null) as [string, string][]), [teams]);

  const ranked = useMemo(() => {
    return players
      .map((p) => ({
        player: p,
        score: computePlayerScore(p.id, games, teams),
        remaining: teamsRemaining(p.id, games, teamOwnerIds),
      }))
      .sort((a, b) => b.score - a.score);
  }, [players, games, teams, teamOwnerIds]);

  return (
    <div className="page-padding" style={{ fontFamily: 'var(--font-press-start), monospace' }}>
      <h1 className="text-xs py-4 text-[var(--text-primary)]">SCOREBOARD</h1>
      <ul className="space-y-3">
        {ranked.map(({ player, score, remaining }, i) => {
          const isExpanded = expandedPlayerId === player.id;
          const breakdown = getPlayerScoreBreakdown(player.id, games, teams);
          return (
            <li
              key={player.id}
              className="pixel-border overflow-hidden bg-[var(--card)]"
            >
              <button
                type="button"
                onClick={() => setExpandedPlayerId(isExpanded ? null : player.id)}
                className="flex w-full items-center gap-3 p-3 text-left"
              >
                <span className="text-[var(--text-muted)] w-8 text-base">#{i + 1}</span>
                <PlayerAvatar name={player.name} size="md" />
                <span className="flex-1 text-base" style={{ fontFamily: 'var(--font-vt323), monospace' }}>
                  {player.name}
                </span>
                <span className="text-xl text-[var(--accent-yellow)]">{score}</span>
                <span className="text-sm text-[var(--text-muted)]">{remaining} LEFT</span>
              </button>
              {isExpanded && (() => {
                const teamHasLost = (teamId: string) =>
                  games.some(
                    (g) =>
                      g.winner_id != null &&
                      g.winner_id !== teamId &&
                      (g.top_team_id === teamId || g.bottom_team_id === teamId)
                  );
                const stillIn = breakdown.filter((t) => !teamHasLost(t.teamId)).sort((a, b) => a.seed - b.seed);
                const eliminated = breakdown.filter((t) => teamHasLost(t.teamId)).sort((a, b) => a.seed - b.seed);
                const sortedBreakdown = [...stillIn, ...eliminated];
                return (
                  <div className="border-t-2 border-[var(--surface)] bg-[var(--surface)] p-3">
                    <p className="text-xs text-[var(--text-muted)] mb-2">Points by team (verify)</p>
                    <div className="space-y-2 text-base" style={{ fontFamily: 'var(--font-vt323), monospace' }}>
                      {sortedBreakdown.map((t) => {
                        const isEliminated = teamHasLost(t.teamId);
                        const roundEntries: { round: number; label: string; pts: number | null }[] = [];
                        for (let r = 1; r <= 6; r++) {
                          const pts = t.pointsByRound[r as 1 | 2 | 3 | 4 | 5 | 6] ?? 0;
                          if (pts > 0) {
                            roundEntries.push({ round: r, label: ROUND_LABELS[r], pts });
                          } else {
                            const gameInRound = games.find(
                              (g) => g.round === r && (g.top_team_id === t.teamId || g.bottom_team_id === t.teamId)
                            );
                            const actuallyLost =
                              gameInRound?.winner_id != null && gameInRound.winner_id !== t.teamId;
                            if (actuallyLost) {
                              roundEntries.push({ round: r, label: ROUND_LABELS[r], pts: null });
                            }
                            break;
                          }
                        }
                        return (
                          <div
                            key={t.teamId}
                            className={`rounded border border-[var(--card)] p-2.5 text-base ${isEliminated ? 'bg-[var(--bg)]' : 'bg-[var(--card)]'}`}
                          >
                            <div
                              className={`font-semibold text-[var(--text-primary)] ${isEliminated ? 'line-through opacity-90' : ''}`}
                            >
                              [{t.seed}] {t.isFirstFour ? t.abbr : t.name}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0 text-[var(--text-muted)]">
                              {roundEntries.map(({ round, label, pts }) => (
                                <span key={round}>
                                  {label}: {pts !== null ? pts : 'Lost'}
                                </span>
                              ))}
                            </div>
                            <div className="mt-1 text-[var(--accent-yellow)]">
                              Total: {t.total}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 border-t border-[var(--card)] pt-2 text-right text-base text-[var(--accent-yellow)]">
                      Grand total: {score}
                    </div>
                  </div>
                );
              })()}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
