'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AdminDraftOrderPage() {
  const [names, setNames] = useState<string[]>(Array(8).fill(''));
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    createClient()
      .from('players')
      .select('*')
      .order('draft_position')
      .then(({ data }) => {
        if (data && data.length > 0) {
          const next = [...names];
          for (const p of data) {
            if (p.draft_position >= 1 && p.draft_position <= 8) next[p.draft_position - 1] = p.name;
          }
          setNames(next);
        }
      });
  }, []);

  const handleSave = async () => {
    setStatus('loading');
    setMessage('');
    const supabase = createClient();
    const trimmed = names.map((n) => n.trim());
    if (trimmed.some((n) => !n)) {
      setStatus('error');
      setMessage('Enter all 8 player names.');
      return;
    }
    const { data: existing } = await supabase.from('players').select('id, draft_position');
    for (let i = 0; i < 8; i++) {
      const row = existing?.find((r) => r.draft_position === i + 1);
      if (row) {
        await supabase.from('players').update({ name: trimmed[i] }).eq('id', row.id);
      } else {
        await supabase.from('players').insert({ name: trimmed[i], draft_position: i + 1 });
      }
    }
    setStatus('success');
    setMessage('Draft order saved.');
  };

  return (
    <div className="page-padding max-w-[600px] mx-auto" style={{ fontFamily: 'var(--font-press-start), monospace' }}>
      <h1 className="text-xs py-4 text-[var(--text-primary)]">DRAFT ORDER</h1>
      <div className="space-y-3 mb-6">
        {names.map((name, i) => (
          <div key={i}>
            <label className="block text-[10px] text-[var(--text-muted)] mb-1">PICK {i + 1}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                const next = [...names];
                next[i] = e.target.value;
                setNames(next);
              }}
              className="w-full pixel-border bg-[var(--card)] px-3 py-2 text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-vt323), monospace' }}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={status === 'loading'}
        className="pixel-btn w-full py-3 text-xs bg-[var(--accent-green)] text-black"
      >
        SAVE ORDER
      </button>
      {message && (
        <p className={`mt-4 text-sm ${status === 'error' ? 'text-[var(--accent-red)]' : 'text-[var(--accent-green)]'}`} style={{ fontFamily: 'var(--font-vt323), monospace' }}>
          {message}
        </p>
      )}
    </div>
  );
}
