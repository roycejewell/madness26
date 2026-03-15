'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeGames } from '@/hooks/useRealtimeGames';
import { useRealtimeTeams } from '@/hooks/useRealtimeTeams';
import GameCard from '@/components/GameCard';
import GameResultModal from '@/components/GameResultModal';
import { getNextRoundSlot, REGION_ORDER } from '@/lib/bracket-advancement';
import type { Game, Team, Player } from '@/lib/supabase/types';

const ROUND_LABELS: Record<number, string> = {
  1: 'R64',
  2: 'R32',
  3: 'S16',
  4: 'E8',
  5: 'F4',
  6: 'Championship',
};
const ROUND_TABS = [1, 2, 3, 4, 5, 6] as const;

function getNextGameForWinner(
  round: number,
  region: string,
  bracketSlot: number,
  allGames: Game[]
): { gameId: string; isTop: boolean } | null {
  if (round >= 6) return null;
  if (round === 4) {
    const f4Games = allGames.filter((g) => g.round === 5);
    const r = region as 'south' | 'east' | 'west' | 'midwest';
    const f4Slot = (r === 'south' || r === 'west') ? 1 : 2;
    const isTop = (r === 'south' || r === 'east');
    const f4 = f4Games.find((g) => g.bracket_slot === f4Slot);
    if (!f4) return null;
    return { gameId: f4.id, isTop };
  }
  if (round === 5) {
    const champGames = allGames.filter((g) => g.round === 6);
    const champ = champGames.find((g) => g.bracket_slot === 1);
    if (!champ) return null;
    return { gameId: champ.id, isTop: bracketSlot === 1 };
  }
  const { slot: nextSlot, isTop } = getNextRoundSlot(bracketSlot);
  const nextRound = round + 1;
  const nextGames = allGames.filter((g) => g.round === nextRound && g.region === region);
  const nextGame = nextGames.find((g) => g.bracket_slot === nextSlot);
  if (!nextGame) return null;
  return { gameId: nextGame.id, isTop };
}

export default function BracketPage() {
  const [activeRound, setActiveRound] = useState<number>(1);
  const [modalGame, setModalGame] = useState<Game | null>(null);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const { games, loading: gamesLoading, applyOptimisticUpdate } = useRealtimeGames();
  const { teams, loading: teamsLoading } = useRealtimeTeams();
  const supabase = createClient();

  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const gamesByRound = useMemo(() => {
    const byRound: Record<number, Game[]> = {};
    for (const g of games) {
      if (!byRound[g.round]) byRound[g.round] = [];
      byRound[g.round].push(g);
    }
    for (const r of ROUND_TABS) {
      if (byRound[r]) byRound[r].sort((a, b) => (a.region as string).localeCompare(b.region) || a.bracket_slot - b.bracket_slot);
    }
    return byRound;
  }, [games]);

  const [playersList, setPlayersList] = useState<Player[]>([]);
  useEffect(() => {
    const sb = createClient();
    sb.from('players').select('*').then(({ data }) => {
      if (data) setPlayersList(data);
    });
  }, []);
  const playersById = useMemo(() => new Map(playersList.map((p) => [p.id, p])), [playersList]);

  const handleSaveWinner = async () => {
    if (!modalGame || !selectedWinnerId) return;
    const prevWinnerId = modalGame.winner_id;
    const winnerTeam = teamsById.get(selectedWinnerId);
    if (!winnerTeam) {
      setModalGame(null);
      setSelectedWinnerId(null);
      return;
    }

    const next = getNextGameForWinner(modalGame.round, modalGame.region, modalGame.bracket_slot, games);
    const optimisticUpdates: (Partial<Game> & { id: string })[] = [
      { id: modalGame.id, winner_id: selectedWinnerId },
    ];
    if (next) {
      if (next.isTop) {
        optimisticUpdates.push({ id: next.gameId, top_team_id: selectedWinnerId } as Partial<Game> & { id: string });
      } else {
        optimisticUpdates.push({ id: next.gameId, bottom_team_id: selectedWinnerId } as Partial<Game> & { id: string });
      }
    }
    if (prevWinnerId && prevWinnerId !== selectedWinnerId) {
      const prevNext = getNextGameForWinner(modalGame.round, modalGame.region, modalGame.bracket_slot, games);
      if (prevNext) {
        const prevGame = games.find((g) => g.id === prevNext.gameId);
        const clearUpdate: Partial<Game> & { id: string } = { id: prevNext.gameId };
        if (prevGame?.top_team_id === prevWinnerId) clearUpdate.top_team_id = null;
        if (prevGame?.bottom_team_id === prevWinnerId) clearUpdate.bottom_team_id = null;
        if (Object.keys(clearUpdate).length > 1) optimisticUpdates.push(clearUpdate);
      }
    }

    applyOptimisticUpdate(optimisticUpdates);
    setModalGame(null);
    setSelectedWinnerId(null);

    await supabase.from('games').update({ winner_id: selectedWinnerId }).eq('id', modalGame.id);

    if (next) {
      const updates: { top_team_id?: string; bottom_team_id?: string } = {};
      if (next.isTop) updates.top_team_id = selectedWinnerId;
      else updates.bottom_team_id = selectedWinnerId;
      await supabase.from('games').update(updates).eq('id', next.gameId);
    }

    if (prevWinnerId && prevWinnerId !== selectedWinnerId) {
      const prevNext = getNextGameForWinner(modalGame.round, modalGame.region, modalGame.bracket_slot, games);
      if (prevNext) {
        const clearUpdates: { top_team_id?: null; bottom_team_id?: null } = {};
        const prevGame = games.find((g) => g.id === prevNext.gameId);
        if (prevGame?.top_team_id === prevWinnerId) clearUpdates.top_team_id = null;
        if (prevGame?.bottom_team_id === prevWinnerId) clearUpdates.bottom_team_id = null;
        if (Object.keys(clearUpdates).length) {
          await supabase.from('games').update(clearUpdates).eq('id', prevNext.gameId);
        }
      }
    }
  };

  if (gamesLoading || teamsLoading) {
    return (
      <div className="page-padding pt-4" style={{ fontFamily: 'var(--font-press-start), monospace' }}>
        <p className="text-xs text-[var(--text-muted)]">Loading bracket…</p>
      </div>
    );
  }

  const roundGames = gamesByRound[activeRound] ?? [];
  const regionOrder = activeRound >= 5 ? [] : [...REGION_ORDER];
  if (activeRound >= 5) {
    roundGames.sort((a, b) => a.bracket_slot - b.bracket_slot);
  }

  return (
    <div className="page-padding" style={{ fontFamily: 'var(--font-press-start), monospace' }}>
      <h1 className="text-xs py-4 text-[var(--text-primary)]">BRACKET</h1>

      <div className="flex gap-1 overflow-x-auto pb-2 border-b-2 border-[var(--card)]">
        {ROUND_TABS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setActiveRound(r)}
            className={`shrink-0 pixel-btn px-3 py-2 text-[10px] ${activeRound === r ? 'bg-[var(--accent-yellow)] text-black' : 'bg-[var(--card)] text-[var(--text-primary)]'}`}
          >
            {r === 6 ? '🏆' : ROUND_LABELS[r]}
          </button>
        ))}
      </div>

      <div className="pt-4 space-y-6">
        {activeRound >= 5 ? (
          roundGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              topTeam={game.top_team_id ? teamsById.get(game.top_team_id) : null}
              bottomTeam={game.bottom_team_id ? teamsById.get(game.bottom_team_id) : null}
              winnerId={game.winner_id}
              playersById={playersById}
              round={game.round}
              onTap={() => {
                setModalGame(game);
                setSelectedWinnerId(game.winner_id);
              }}
            />
          ))
        ) : (
          regionOrder.map((region) => {
            const regionGames = roundGames.filter((g) => g.region === region);
            if (regionGames.length === 0) return null;
            return (
              <div key={region}>
                <p className="text-[10px] text-[var(--text-muted)] mb-2">— {region.toUpperCase()} —</p>
                {regionGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    topTeam={game.top_team_id ? teamsById.get(game.top_team_id) : null}
                    bottomTeam={game.bottom_team_id ? teamsById.get(game.bottom_team_id) : null}
                    winnerId={game.winner_id}
                    playersById={playersById}
                    round={game.round}
                    onTap={() => {
                      setModalGame(game);
                      setSelectedWinnerId(game.winner_id);
                    }}
                  />
                ))}
              </div>
            );
          })
        )}
      </div>

      {modalGame && (
        <GameResultModal
          topTeam={modalGame.top_team_id ? teamsById.get(modalGame.top_team_id) ?? null : null}
          bottomTeam={modalGame.bottom_team_id ? teamsById.get(modalGame.bottom_team_id) ?? null : null}
          currentWinnerId={modalGame.winner_id}
          selectedWinnerId={selectedWinnerId}
          onSelect={setSelectedWinnerId}
          onSave={handleSaveWinner}
          onCancel={() => {
            setModalGame(null);
            setSelectedWinnerId(null);
          }}
        />
      )}
    </div>
  );
}
