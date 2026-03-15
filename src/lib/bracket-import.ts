import { R64_MATCHUPS } from './bracket-advancement';

export interface BracketTeamJson {
  seed: number;
  name: string;
  abbr: string;
  is_first_four?: boolean;
  ff_team1_name?: string;
  ff_team1_abbr?: string;
  ff_team2_name?: string;
  ff_team2_abbr?: string;
}

export interface BracketJson {
  south: BracketTeamJson[];
  east: BracketTeamJson[];
  west: BracketTeamJson[];
  midwest: BracketTeamJson[];
}

const REGIONS = ['south', 'east', 'west', 'midwest'] as const;

function validateBracket(data: unknown): data is BracketJson {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  for (const r of REGIONS) {
    if (!Array.isArray(d[r]) || (d[r] as unknown[]).length !== 16) return false;
  }
  return true;
}

/**
 * Parse and validate bracket JSON. Returns teams per region in display order
 * and the list of R64 games as { region, bracket_slot, top_seed, bottom_seed }.
 */
export function parseBracketJson(jsonString: string): {
  teams: Array<BracketTeamJson & { region: string }>;
  r64Games: Array<{ region: string; bracket_slot: number; top_seed: number; bottom_seed: number }>;
} {
  const data = JSON.parse(jsonString) as unknown;
  if (!validateBracket(data)) {
    throw new Error('Invalid bracket JSON: need south, east, west, midwest each with 16 teams');
  }
  const bracket = data as BracketJson;
  const teams: Array<BracketTeamJson & { region: string }> = [];
  const r64Games: Array<{ region: string; bracket_slot: number; top_seed: number; bottom_seed: number }> = [];

  for (const region of REGIONS) {
    const regionTeams = bracket[region];
    const bySeed = new Map(regionTeams.map((t) => [t.seed, t]));
    for (let i = 0; i < 16; i++) {
      teams.push({ ...regionTeams[i], region });
    }
    for (let slot = 0; slot < 8; slot++) {
      const [topSeed, bottomSeed] = R64_MATCHUPS[slot];
      const top = bySeed.get(topSeed);
      const bottom = bySeed.get(bottomSeed);
      if (top && bottom) {
        r64Games.push({
          region,
          bracket_slot: slot + 1,
          top_seed: topSeed,
          bottom_seed: bottomSeed,
        });
      }
    }
  }
  return { teams, r64Games };
}
