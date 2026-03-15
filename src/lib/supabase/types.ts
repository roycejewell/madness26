export type Region = 'south' | 'east' | 'west' | 'midwest' | 'final_four';

export interface Team {
  id: string;
  region: Region | string;
  seed: number;
  name: string;
  abbr: string;
  is_first_four: boolean;
  ff_team1_name: string | null;
  ff_team1_abbr: string | null;
  ff_team2_name: string | null;
  ff_team2_abbr: string | null;
  ff_winner: string | null;
  owner_id: string | null;
  created_at: string;
}

export interface Player {
  id: string;
  name: string;
  draft_position: number;
  created_at: string;
}

export interface DraftPick {
  id: string;
  pick_number: number;
  player_id: string;
  team_id: string;
  created_at: string;
}

export interface Game {
  id: string;
  round: number;
  region: string;
  bracket_slot: number;
  top_team_id: string | null;
  bottom_team_id: string | null;
  winner_id: string | null;
  created_at: string;
}

export interface TeamWithOwner extends Team {
  owner?: Player | null;
}

export interface GameWithTeams extends Game {
  top_team?: Team | null;
  bottom_team?: Team | null;
  winner?: Team | null;
}
