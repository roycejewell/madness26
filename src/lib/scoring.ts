import type { Game, Team } from '@/lib/supabase/types';

export const ROUND_BASE_POINTS: Record<number, number> = {
  1: 2,  // R64
  2: 4,  // R32
  3: 6,  // S16
  4: 8,  // E8
  5: 10, // F4
  6: 15, // Champ
};

const ROUND_LABELS: Record<number, string> = {
  1: 'R64',
  2: 'R32',
  3: 'S16',
  4: 'E8',
  5: 'F4',
  6: 'Champ',
};

/**
 * Compute points for a single game win, including upset bonus.
 * Upset = winner has a worse seed number than the loser (e.g. 12 beats 5).
 * Bonus = (winnerSeed - loserSeed).
 */
export function pointsForGame(
  round: number,
  winnerSeed: number,
  loserSeed: number | null
): number {
  const base = ROUND_BASE_POINTS[round] ?? 0;
  if (!loserSeed) return base;
  const diff = winnerSeed - loserSeed;
  const upsetBonus = diff > 0 ? diff : 0;
  return base + upsetBonus;
}

/**
 * Compute total score for a player from games where they own the winner.
 */
export function computePlayerScore(
  playerId: string,
  games: Array<Pick<Game, 'round' | 'winner_id' | 'top_team_id' | 'bottom_team_id'>>,
  teams: Array<Pick<Team, 'id' | 'seed' | 'owner_id'>>
): number {
  const ownerByTeamId = new Map(teams.map((t) => [t.id, t.owner_id]));
  const teamById = new Map(teams.map((t) => [t.id, t]));
  let total = 0;

  for (const g of games) {
    if (!g.winner_id) continue;
    const ownerId = ownerByTeamId.get(g.winner_id);
    if (ownerId !== playerId) continue;

    const winner = teamById.get(g.winner_id);
    if (!winner) continue;

    let loserSeed: number | null = null;
    if (g.top_team_id && g.bottom_team_id) {
      if (g.winner_id === g.top_team_id) {
        const loser = teamById.get(g.bottom_team_id);
        loserSeed = loser?.seed ?? null;
      } else if (g.winner_id === g.bottom_team_id) {
        const loser = teamById.get(g.top_team_id);
        loserSeed = loser?.seed ?? null;
      }
    }

    total += pointsForGame(g.round, winner.seed, loserSeed);
  }

  return total;
}

export type TeamScoreBreakdown = {
  teamId: string;
  seed: number;
  name: string;
  abbr: string;
  isFirstFour: boolean;
  pointsByRound: Record<number, number>;
  total: number;
};

/**
 * Get per-team, per-round points for a player (for score verification).
 */
export function getPlayerScoreBreakdown(
  playerId: string,
  games: Array<Pick<Game, 'round' | 'winner_id' | 'top_team_id' | 'bottom_team_id'>>,
  teams: Array<Pick<Team, 'id' | 'seed' | 'name' | 'abbr' | 'is_first_four' | 'owner_id'>>
): TeamScoreBreakdown[] {
  const ownerByTeamId = new Map(teams.map((t) => [t.id, t.owner_id]));
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const byTeam = new Map<string, Record<number, number>>();

  for (const g of games) {
    if (!g.winner_id) continue;
    const ownerId = ownerByTeamId.get(g.winner_id);
    if (ownerId !== playerId) continue;
    const winner = teamById.get(g.winner_id);
    if (!winner) continue;

    let loserSeed: number | null = null;
    if (g.top_team_id && g.bottom_team_id) {
      if (g.winner_id === g.top_team_id) {
        const loser = teamById.get(g.bottom_team_id);
        loserSeed = loser?.seed ?? null;
      } else if (g.winner_id === g.bottom_team_id) {
        const loser = teamById.get(g.top_team_id);
        loserSeed = loser?.seed ?? null;
      }
    }

    const pts = pointsForGame(g.round, winner.seed, loserSeed);
    if (!byTeam.has(g.winner_id)) byTeam.set(g.winner_id, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
    const row = byTeam.get(g.winner_id)!;
    row[g.round as 1 | 2 | 3 | 4 | 5 | 6] = (row[g.round as 1 | 2 | 3 | 4 | 5 | 6] ?? 0) + pts;
  }

  const playerTeams = teams.filter((t) => t.owner_id === playerId).sort((a, b) => a.seed - b.seed || a.name.localeCompare(b.name));
  return playerTeams.map((t) => {
    const pointsByRound = byTeam.get(t.id) ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const total = [1, 2, 3, 4, 5, 6].reduce((sum, r) => sum + (pointsByRound[r] ?? 0), 0);
    return {
      teamId: t.id,
      seed: t.seed,
      name: t.name,
      abbr: t.abbr,
      isFirstFour: t.is_first_four,
      pointsByRound,
      total,
    };
  });
}

export { ROUND_LABELS };

/**
 * Count teams remaining for a player (not eliminated in any completed game).
 */
export function teamsRemaining(
  playerId: string,
  games: Array<Pick<Game, 'top_team_id' | 'bottom_team_id' | 'winner_id'>>,
  teamOwnerIds: Map<string, string>
): number {
  const eliminatedTeamIds = new Set<string>();
  for (const g of games) {
    if (!g.winner_id) continue;
    if (g.top_team_id && g.top_team_id !== g.winner_id) eliminatedTeamIds.add(g.top_team_id);
    if (g.bottom_team_id && g.bottom_team_id !== g.winner_id) eliminatedTeamIds.add(g.bottom_team_id);
  }
  let count = 0;
  for (const [teamId, ownerId] of teamOwnerIds) {
    if (ownerId === playerId && !eliminatedTeamIds.has(teamId)) count++;
  }
  return count;
}
