'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { parseBracketJson } from '@/lib/bracket-import';

type Confirming = 'games' | 'draft' | 'players' | null;

async function runBracketImport(json: string) {
  const { teams: teamRows, r64Games } = parseBracketJson(json);
  const supabase = createClient();

  await supabase.from('draft_picks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('games').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { data: existingTeams } = await supabase.from('teams').select('id');
  const existingIds = (existingTeams ?? []).map((t) => t.id);
  if (existingIds.length > 0) {
    await supabase.from('teams').delete().in('id', existingIds);
  }

  const teamsToInsert = teamRows.map((t) => ({
    region: t.region,
    seed: t.seed,
    name: t.name,
    abbr: t.abbr,
    is_first_four: t.is_first_four ?? false,
    ff_team1_name: t.ff_team1_name ?? null,
    ff_team1_abbr: t.ff_team1_abbr ?? null,
    ff_team2_name: t.ff_team2_name ?? null,
    ff_team2_abbr: t.ff_team2_abbr ?? null,
    ff_winner: null,
    owner_id: null,
  }));

  const { data: insertedTeams, error: teamsErr } = await supabase.from('teams').insert(teamsToInsert).select('id, region, seed');
  if (teamsErr) throw teamsErr;
  const teamIdMap = new Map<string, string>();
  for (const t of insertedTeams ?? []) {
    teamIdMap.set(`${t.region}-${t.seed}`, t.id);
  }

  const r64GameRows = r64Games.map((g) => ({
    round: 1,
    region: g.region,
    bracket_slot: g.bracket_slot,
    top_team_id: teamIdMap.get(`${g.region}-${g.top_seed}`) ?? null,
    bottom_team_id: teamIdMap.get(`${g.region}-${g.bottom_seed}`) ?? null,
    winner_id: null,
  }));
  await supabase.from('games').insert(r64GameRows);

  const regions = ['south', 'east', 'west', 'midwest'];
  for (let slot = 1; slot <= 4; slot++) {
    await supabase.from('games').insert(
      regions.map((r) => ({ round: 2, region: r, bracket_slot: slot, top_team_id: null, bottom_team_id: null, winner_id: null }))
    );
  }
  for (let slot = 1; slot <= 2; slot++) {
    await supabase.from('games').insert(
      regions.map((r) => ({ round: 3, region: r, bracket_slot: slot, top_team_id: null, bottom_team_id: null, winner_id: null }))
    );
  }
  await supabase.from('games').insert(
    regions.map((r) => ({ round: 4, region: r, bracket_slot: 1, top_team_id: null, bottom_team_id: null, winner_id: null }))
  );
  await supabase.from('games').insert([
    { round: 5, region: 'final_four', bracket_slot: 1, top_team_id: null, bottom_team_id: null, winner_id: null },
    { round: 5, region: 'final_four', bracket_slot: 2, top_team_id: null, bottom_team_id: null, winner_id: null },
  ]);
  await supabase.from('games').insert([
    { round: 6, region: 'final_four', bracket_slot: 1, top_team_id: null, bottom_team_id: null, winner_id: null },
  ]);

  return teamRows.length;
}

export default function AdminResetPage() {
  const [confirming, setConfirming] = useState<Confirming>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [json, setJson] = useState('');

  const supabase = createClient();

  const resetBracketResults = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await supabase.from('games').update({ winner_id: null }).neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('games').update({ top_team_id: null, bottom_team_id: null }).gt('round', 1);
      setMessage({ type: 'success', text: 'All game results cleared. R64 matchups kept; R32+ slots cleared.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed' });
    } finally {
      setLoading(false);
      setConfirming(null);
    }
  };

  const resetDraft = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await supabase.from('draft_picks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('teams').update({ owner_id: null }).neq('id', '00000000-0000-0000-0000-000000000000');
      setMessage({ type: 'success', text: 'All draft picks removed. No teams assigned to players.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed' });
    } finally {
      setLoading(false);
      setConfirming(null);
    }
  };

  const resetPlayerOrder = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await supabase.from('draft_picks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { data: players } = await supabase.from('players').select('id');
      const ids = (players ?? []).map((p) => p.id);
      if (ids.length > 0) await supabase.from('players').delete().in('id', ids);
      await supabase.from('teams').update({ owner_id: null }).neq('id', '00000000-0000-0000-0000-000000000000');
      setMessage({ type: 'success', text: 'All players and draft picks removed. Set names again on Draft Order.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed' });
    } finally {
      setLoading(false);
      setConfirming(null);
    }
  };

  const handleLoadBracket = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const count = await runBracketImport(json);
      setMessage({ type: 'success', text: `Imported ${count} teams and created all bracket games.` });
      setJson('');
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Import failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-padding max-w-[600px] mx-auto pb-8" style={{ fontFamily: 'var(--font-press-start), monospace' }}>
      <h1 className="text-xs py-4 text-[var(--text-primary)]">ADMIN RESET</h1>
      <p className="text-[10px] text-[var(--text-muted)] mb-4" style={{ fontFamily: 'var(--font-vt323), monospace' }}>
        Reset parts of the app or reload the bracket. Each action is separate.
      </p>

      {message && (
        <div
          className={`mb-4 pixel-border p-2 text-sm ${message.type === 'error' ? 'bg-[var(--accent-red)]/20 text-[var(--accent-red)]' : 'bg-[var(--accent-green)]/20 text-[var(--accent-green)]'}`}
          style={{ fontFamily: 'var(--font-vt323), monospace' }}
        >
          {message.text}
        </div>
      )}

      {/* 1. Reset Bracket Results */}
      <section className="pixel-border bg-[var(--card)] p-3 mb-4">
        <h2 className="text-[10px] text-[var(--accent-yellow)] mb-1">RESET BRACKET RESULTS</h2>
        <p className="text-[10px] text-[var(--text-muted)] mb-2" style={{ fontFamily: 'var(--font-vt323), monospace' }}>
          Clear all game winners and advancement. R64 matchups stay; R32 and later rounds clear. No teams or draft data changed.
        </p>
        {confirming === 'games' ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetBracketResults}
              disabled={loading}
              className="pixel-btn flex-1 py-2 text-[10px] bg-[var(--accent-red)] text-white disabled:opacity-50"
            >
              YES, RESET
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={loading}
              className="pixel-btn flex-1 py-2 text-[10px] bg-[var(--card)] text-[var(--text-primary)]"
            >
              CANCEL
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming('games')}
            disabled={loading}
            className="pixel-btn w-full py-2 text-[10px] bg-[var(--card)] text-[var(--text-primary)]"
          >
            RESET BRACKET RESULTS
          </button>
        )}
      </section>

      {/* 2. Reset Draft */}
      <section className="pixel-border bg-[var(--card)] p-3 mb-4">
        <h2 className="text-[10px] text-[var(--accent-yellow)] mb-1">RESET DRAFT</h2>
        <p className="text-[10px] text-[var(--text-muted)] mb-2" style={{ fontFamily: 'var(--font-vt323), monospace' }}>
          Remove all draft picks and unassign every team. Player names and order stay. Bracket and game results stay.
        </p>
        {confirming === 'draft' ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetDraft}
              disabled={loading}
              className="pixel-btn flex-1 py-2 text-[10px] bg-[var(--accent-red)] text-white disabled:opacity-50"
            >
              YES, RESET
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={loading}
              className="pixel-btn flex-1 py-2 text-[10px] bg-[var(--card)] text-[var(--text-primary)]"
            >
              CANCEL
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming('draft')}
            disabled={loading}
            className="pixel-btn w-full py-2 text-[10px] bg-[var(--card)] text-[var(--text-primary)]"
          >
            RESET DRAFT
          </button>
        )}
      </section>

      {/* 3. Reset Player Order */}
      <section className="pixel-border bg-[var(--card)] p-3 mb-4">
        <h2 className="text-[10px] text-[var(--accent-yellow)] mb-1">RESET PLAYER ORDER</h2>
        <p className="text-[10px] text-[var(--text-muted)] mb-2" style={{ fontFamily: 'var(--font-vt323), monospace' }}>
          Delete all 8 players and their draft picks; unassign all teams. Use Draft Order to re-enter names.
        </p>
        {confirming === 'players' ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetPlayerOrder}
              disabled={loading}
              className="pixel-btn flex-1 py-2 text-[10px] bg-[var(--accent-red)] text-white disabled:opacity-50"
            >
              YES, RESET
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={loading}
              className="pixel-btn flex-1 py-2 text-[10px] bg-[var(--card)] text-[var(--text-primary)]"
            >
              CANCEL
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming('players')}
            disabled={loading}
            className="pixel-btn w-full py-2 text-[10px] bg-[var(--card)] text-[var(--text-primary)]"
          >
            RESET PLAYER ORDER
          </button>
        )}
      </section>

      {/* 4. Load Bracket JSON */}
      <section className="pixel-border bg-[var(--card)] p-3 mb-4">
        <h2 className="text-[10px] text-[var(--accent-yellow)] mb-1">LOAD BRACKET (IMPORT JSON)</h2>
        <p className="text-[10px] text-[var(--text-muted)] mb-2" style={{ fontFamily: 'var(--font-vt323), monospace' }}>
          Replace all teams and games with a new bracket. Paste JSON below (same format as Setup). This deletes draft picks, all games, and all teams, then imports from JSON.
        </p>
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder="Paste bracket JSON..."
          className="w-full h-40 pixel-border bg-[var(--surface)] p-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm resize-y mb-2"
          style={{ fontFamily: 'var(--font-vt323), monospace' }}
        />
        <button
          type="button"
          onClick={handleLoadBracket}
          disabled={loading || !json.trim()}
          className="pixel-btn w-full py-2 text-[10px] bg-[var(--accent-green)] text-black disabled:opacity-50"
        >
          {loading ? 'IMPORTING…' : 'IMPORT BRACKET'}
        </button>
      </section>
    </div>
  );
}
