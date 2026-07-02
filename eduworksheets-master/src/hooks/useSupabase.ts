import { useState, useEffect } from 'react';
import { supabaseClient } from '../services/supabaseClient';

interface UseSupabaseOptions {
  table?: string;
  select?: string;
  filter?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
}

export const useSupabase = <T = any>(options: UseSupabaseOptions = {}) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!options.table) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabaseClient
        .from(options.table)
        .select(options.select || '*');

      // Apply filters
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }

      const { data: result, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      setData(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const insert = async (newData: Partial<T>) => {
    if (!options.table) return null;

    setLoading(true);
    setError(null);

    try {
      const { data: result, error: insertError } = await supabaseClient
        .from(options.table)
        .insert([newData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setData(prev => [...prev, result]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Insert failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, updates: Partial<T>) => {
    if (!options.table) return null;

    setLoading(true);
    setError(null);

    try {
      const { data: result, error: updateError } = await supabaseClient
        .from(options.table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setData(prev => prev.map(item => 
        (item as any).id === id ? result : item
      ));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!options.table) return false;

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabaseClient
        .from(options.table)
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setData(prev => prev.filter(item => (item as any).id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [options.table, JSON.stringify(options.filter), JSON.stringify(options.orderBy)]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    insert,
    update,
    remove
  };
};