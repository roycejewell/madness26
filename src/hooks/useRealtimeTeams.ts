'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Team } from '@/lib/supabase/types';

export function useRealtimeTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const refetch = useCallback(async () => {
    const { data, error } = await supabase.from('teams').select('*').order('region').order('seed');
    if (!error) setTeams(data ?? []);
  }, [supabase]);

  useEffect(() => {
    refetch().then(() => setLoading(false));

    const channel = supabase
      .channel('teams-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refetch]);

  return { teams, loading, refetch };
}
