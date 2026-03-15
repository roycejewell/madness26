'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PlayerAvatar from '@/components/PlayerAvatar';
import { useRealtimeTeams } from '@/hooks/useRealtimeTeams';
import { useRealtimeGames } from '@/hooks/useRealtimeGames';
import type { Player } from '@/lib/supabase/types';

function teamDisplayName(team: { name: string; abbr: string; is_first_four: boolean; ff_winner: string | null }): string {
  if (team.is_first_four && !team.ff_winner) return team.abbr;
  return team.name;
}

export default function DraftPage() {
  const { teams } = useRealtimeTeams();
  const { games } = useRealtimeGames();
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    createClient().from('players').select('*').order('draft_position').then(({ data }) => {
      if (data) setPlayers(data);
    });
  }, []);

  const eliminatedIds = useMemo(() => {
    const set = new Set<string>();
    for (const g of games) {
      if (!g.winner_id) continue;
      if (g.top_team_id && g.top_team_id !== g.winner_id) set.add(g.top_team_id);
      if (g.bottom_team_id && g.bottom_team_id !== g.winner_id) set.add(g.bottom_team_id);
    }
    return set;
  }, [games]);

  const rosters = useMemo(() => {
    const byPlayer = new Map<string, typeof teams>();
    for (const t of teams) {
      if (!t.owner_id) continue;
      if (!byPlayer.has(t.owner_id)) byPlayer.set(t.owner_id, []);
      byPlayer.get(t.owner_id)!.push(t);
    }
    for (const arr of byPlayer.values()) arr.sort((a, b) => a.seed - b.seed || a.name.localeCompare(b.name));
    return byPlayer;
  }, [teams]);

  return (
    <div className="page-padding" style={{ fontFamily: 'var(--font-press-start), monospace' }}>
      <h1 className="text-xs py-4 text-[var(--text-primary)]">ROSTERS</h1>
      <div className="space-y-4">
        {players.map((player) => {
          const list = rosters.get(player.id) ?? [];
          return (
            <div key={player.id} className="pixel-border bg-[var(--card)] p-3">
              <h2 className="text-sm text-[var(--accent-yellow)] mb-2 flex items-center gap-2">
                <PlayerAvatar name={player.name} size="md" />
                {player.name}
              </h2>
              <ul className="space-y-1 text-xl" style={{ fontFamily: 'var(--font-vt323), monospace' }}>
                {list.map((t) => (
                  <li
                    key={t.id}
                    className={eliminatedIds.has(t.id) ? 'eliminated-team' : ''}
                  >
                    [{t.seed}] {teamDisplayName(t)}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
