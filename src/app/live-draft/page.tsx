'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PlayerAvatar from '@/components/PlayerAvatar';
import { useRealtimeTeams } from '@/hooks/useRealtimeTeams';
import { playerPositionForPick, currentPickNumberFromCount } from '@/lib/snake-draft';
import type { Team, Player } from '@/lib/supabase/types';

const PICK_ANIMATION_MS = 600;

export default function LiveDraftPage() {
  const { teams, refetch: refetchTeams } = useRealtimeTeams();
  const [picks, setPicks] = useState<{ pick_number: number }[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [animatingTeam, setAnimatingTeam] = useState<Team | null>(null);
  const [picking, setPicking] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  useEffect(() => {
    createClient().from('draft_picks').select('pick_number').order('pick_number').then(({ data }) => {
      if (data) setPicks(data);
    });
    createClient().from('players').select('*').order('draft_position').then(({ data }) => {
      if (data) setPlayers(data);
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('live-draft-picks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_picks' }, () => {
        supabase.from('draft_picks').select('pick_number').order('pick_number').then(({ data }) => {
          if (data) setPicks(data);
        });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const available = useMemo(() => {
    const list = teams.filter((t) => !t.owner_id);
    list.sort((a, b) => a.seed - b.seed || a.name.localeCompare(b.name));
    return list;
  }, [teams]);

  const pickCount = picks.length;
  const currentPickNum = currentPickNumberFromCount(pickCount);
  const currentPosition = playerPositionForPick(currentPickNum);
  const currentPlayer = players.find((p) => p.draft_position === currentPosition);
  const draftComplete = pickCount >= 64;

  const handlePickTeam = useCallback(
    async (team: Team) => {
      if (!currentPlayer || draftComplete || picking || animatingTeam) return;
      setPicking(true);
      try {
        const { error: pickError } = await supabase.from('draft_picks').insert({
          pick_number: currentPickNum,
          player_id: currentPlayer.id,
          team_id: team.id,
        });
        if (pickError) throw pickError;

        const { error: teamError } = await supabase.from('teams').update({ owner_id: currentPlayer.id }).eq('id', team.id);
        if (teamError) throw teamError;

        setAnimatingTeam(team);

        const { data: newPicks } = await supabase.from('draft_picks').select('pick_number').order('pick_number');
        if (newPicks) setPicks(newPicks);

        await refetchTeams();

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setAnimatingTeam(null);
          timeoutRef.current = null;
        }, PICK_ANIMATION_MS);
      } finally {
        setPicking(false);
      }
    },
    [currentPlayer, currentPickNum, draftComplete, picking, animatingTeam, refetchTeams]
  );

  return (
    <div className="page-padding max-w-[600px] mx-auto" style={{ fontFamily: 'var(--font-press-start), monospace' }}>
      <h1 className="text-xs py-4 text-[var(--text-primary)]">AVAILABLE TEAMS</h1>

      <div className="pixel-border bg-[var(--card)] p-3 mb-4 text-center">
        <p className="text-[10px] text-[var(--text-muted)]">NOW PICKING</p>
        <div className="mt-1 flex items-center justify-center gap-2">
          {currentPlayer && <PlayerAvatar name={currentPlayer.name} size="md" />}
          <p className="text-sm text-[var(--accent-yellow)]">{currentPlayer?.name ?? '—'}</p>
        </div>
        {!draftComplete && (
          <p className="text-[10px] text-[var(--text-muted)] mt-1">Tap a team below to assign</p>
        )}
      </div>

      {animatingTeam && (
        <div
          className="live-draft-picked-card mb-4"
          role="status"
          aria-live="polite"
        >
          <div className="pixel-border bg-[var(--accent-green)] text-black px-3 py-3 text-center">
            <p className="text-[10px] opacity-90">PICKED</p>
            <p className="text-lg live-draft-picked-name" style={{ fontFamily: 'var(--font-vt323), monospace' }}>
              [{animatingTeam.seed}] {animatingTeam.is_first_four ? animatingTeam.abbr : animatingTeam.name}
            </p>
          </div>
        </div>
      )}

      {draftComplete ? (
        <p className="text-sm text-[var(--accent-green)]">Draft complete!</p>
      ) : (
        <ul className="space-y-1" style={{ fontFamily: 'var(--font-vt323), monospace' }}>
          {available.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => handlePickTeam(t)}
                disabled={!!animatingTeam || picking}
                className="live-draft-team-card w-full pixel-border bg-[var(--surface)] px-3 py-2 text-lg text-left transition-transform active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-90"
              >
                [{t.seed}] {t.is_first_four ? t.abbr : t.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
