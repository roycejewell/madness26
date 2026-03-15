'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Game } from '@/lib/supabase/types';

export function useRealtimeGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const applyOptimisticUpdate = useCallback((updates: Partial<Game> & { id: string }[]) => {
    if (updates.length === 0) return;
    setGames((prev) =>
      prev.map((g) => {
        const u = updates.find((u) => u.id === g.id);
        if (!u) return g;
        return { ...g, ...u };
      })
    );
  }, []);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('round')
        .order('region')
        .order('bracket_slot');
      if (!error) setGames(data ?? []);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('games-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        supabase
          .from('games')
          .select('*')
          .order('round')
          .order('region')
          .order('bracket_slot')
          .then(({ data }) => {
            if (data) setGames(data);
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { games, loading, applyOptimisticUpdate };
}
