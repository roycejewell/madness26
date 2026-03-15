'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeTeams } from '@/hooks/useRealtimeTeams';
import { playerPositionForPick, currentPickNumberFromCount } from '@/lib/snake-draft';
import TeamAutocomplete from '@/components/TeamAutocomplete';
import type { Team, Player, DraftPick } from '@/lib/supabase/types';

export default function AdminDraftAdminPage() {
  const { teams } = useRealtimeTeams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    supabase.from('players').select('*').order('draft_position').then(({ data }) => {
      if (data) setPlayers(data);
    });
    supabase.from('draft_picks').select('*').order('pick_number').then(({ data }) => {
      if (data) setPicks(data);
      setLoading(false);
    });
  }, [supabase]);

  useEffect(() => {
    const channel = supabase
      .channel('draft-admin-picks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_picks' }, () => {
        supabase.from('draft_picks').select('*').order('pick_number').then(({ data }) => {
          if (data) setPicks(data);
        });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const pickCount = picks.length;
  const currentPickNum = currentPickNumberFromCount(pickCount);
  const currentPosition = playerPositionForPick(currentPickNum);
  const currentPlayer = players.find((p) => p.draft_position === currentPosition);
  const availableTeams = useMemo(() => teams.filter((t) => !t.owner_id), [teams]);
  const draftComplete = pickCount >= 64;

  const confirmPick = async (team: Team) => {
    if (!currentPlayer || draftComplete) return;
    await supabase.from('draft_picks').insert({
      pick_number: currentPickNum,
      player_id: currentPlayer.id,
      team_id: team.id,
    });
    await supabase.from('teams').update({ owner_id: currentPlayer.id }).eq('id', team.id);
  };

  const undoPick = async (pick: DraftPick) => {
    const isLast = picks.length > 0 && picks[picks.length - 1].id === pick.id;
    if (!isLast) return;
    await supabase.from('teams').update({ owner_id: null }).eq('id', pick.team_id);
    await supabase.from('draft_picks').delete().eq('id', pick.id);
  };

  const playersByPosition = useMemo(() => new Map(players.map((p) => [p.draft_position, p])), [players]);
  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  if (loading) {
    return (
      <div className="page-padding" style={{ fontFamily: 'var(--font-press-start), monospace' }}>
        <p className="text-xs text-[var(--text-muted)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="page-padding max-w-[600px] mx-auto" style={{ fontFamily: 'var(--font-press-start), monospace' }}>
      <h1 className="text-xs py-4 text-[var(--text-primary)]">DRAFT ADMIN</h1>

      {draftComplete ? (
        <div className="pixel-border bg-[var(--accent-green)] text-black p-4 text-center text-xs mb-4">
          DRAFT COMPLETE
        </div>
      ) : (
        <>
          <div className="pixel-border bg-[var(--card)] p-3 mb-4 text-center">
            <p className="text-[10px] text-[var(--text-muted)]">CURRENT PICK</p>
            <p className="text-sm text-[var(--accent-yellow)]">
              PICK {currentPickNum} — {currentPlayer?.name ?? '…'}
            </p>
          </div>
          <div className="mb-4">
            <TeamAutocomplete teams={availableTeams} onSelect={confirmPick} placeholder="Team name or abbr..." />
          </div>
          <button
            type="button"
            disabled
            className="pixel-btn w-full py-3 text-xs bg-[var(--card)] text-[var(--text-muted)] cursor-not-allowed"
          >
            CONFIRM PICK (select team above)
          </button>
        </>
      )}

      <h2 className="text-[10px] text-[var(--text-muted)] mt-6 mb-2">PICK HISTORY</h2>
      <div className="max-h-64 overflow-y-auto pixel-border bg-[var(--surface)] p-2 space-y-1">
        {[...picks].reverse().map((pick) => {
          const player = playersByPosition.get(playerPositionForPick(pick.pick_number));
          const team = teamsById.get(pick.team_id);
          const isLast = picks[picks.length - 1]?.id === pick.id;
          return (
            <div key={pick.id} className="flex items-center justify-between gap-2 text-[10px] py-1" style={{ fontFamily: 'var(--font-vt323), monospace' }}>
              <span>
                #{pick.pick_number} {player?.name} — [{team?.seed}] {team?.is_first_four ? team.abbr : team?.name}
              </span>
              {isLast && (
                <button
                  type="button"
                  onClick={() => undoPick(pick)}
                  className="text-[var(--accent-red)] shrink-0"
                  aria-label="Undo pick"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
