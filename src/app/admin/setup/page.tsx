'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { parseBracketJson } from '@/lib/bracket-import';

export default function AdminSetupPage() {
  const [json, setJson] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleImport = async () => {
    setStatus('loading');
    setMessage('');
    try {
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
      const r32Rows: Array<{ round: number; region: string; bracket_slot: number; top_team_id: null; bottom_team_id: null; winner_id: null }> = [];
      for (const r of regions) {
        for (let slot = 1; slot <= 4; slot++) {
          r32Rows.push({ round: 2, region: r, bracket_slot: slot, top_team_id: null, bottom_team_id: null, winner_id: null });
        }
      }
      await supabase.from('games').insert(r32Rows);

      const s16Rows: Array<{ round: number; region: string; bracket_slot: number; top_team_id: null; bottom_team_id: null; winner_id: null }> = [];
      for (const r of regions) {
        for (let slot = 1; slot <= 2; slot++) {
          s16Rows.push({ round: 3, region: r, bracket_slot: slot, top_team_id: null, bottom_team_id: null, winner_id: null });
        }
      }
      await supabase.from('games').insert(s16Rows);

      const e8Rows = regions.map((r, i) => ({
        round: 4,
        region: r,
        bracket_slot: 1,
        top_team_id: null,
        bottom_team_id: null,
        winner_id: null,
      }));
      await supabase.from('games').insert(e8Rows);

      await supabase.from('games').insert([
        { round: 5, region: 'final_four', bracket_slot: 1, top_team_id: null, bottom_team_id: null, winner_id: null },
        { round: 5, region: 'final_four', bracket_slot: 2, top_team_id: null, bottom_team_id: null, winner_id: null },
      ]);
      await supabase.from('games').insert([
        { round: 6, region: 'final_four', bracket_slot: 1, top_team_id: null, bottom_team_id: null, winner_id: null },
      ]);

      setStatus('success');
      setMessage(`Imported ${teamRows.length} teams and created bracket games.`);
    } catch (e) {
      setStatus('error');
      setMessage(e instanceof Error ? e.message : 'Import failed');
    }
  };

  return (
    <div className="page-padding max-w-[600px] mx-auto" style={{ fontFamily: 'var(--font-press-start), monospace' }}>
      <h1 className="text-xs py-4 text-[var(--text-primary)]">LOAD BRACKET</h1>
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder='Paste bracket JSON here...'
        className="w-full h-48 pixel-border bg-[var(--card)] p-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm resize-y mb-4"
        style={{ fontFamily: 'var(--font-vt323), monospace' }}
      />
      <button
        type="button"
        onClick={handleImport}
        disabled={status === 'loading'}
        className="pixel-btn w-full py-3 text-xs bg-[var(--accent-green)] text-black disabled:opacity-50"
      >
        {status === 'loading' ? 'IMPORTING…' : 'IMPORT'}
      </button>
      {message && (
        <p className={`mt-4 text-sm ${status === 'error' ? 'text-[var(--accent-red)]' : 'text-[var(--accent-green)]'}`} style={{ fontFamily: 'var(--font-vt323), monospace' }}>
          {message}
        </p>
      )}
    </div>
  );
}
