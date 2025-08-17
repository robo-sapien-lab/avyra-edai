import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FunctionOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export const useSupabaseFunction = () => {
  const [loading, setLoading] = useState(false);

  const invoke = async (
    functionName: string,
    body?: any,
    options?: FunctionOptions
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: body || {}
      });

      if (error) {
        throw new Error(error.message || 'Function call failed');
      }

      options?.onSuccess?.(data);
      return data;
    } catch (error) {
      const err = error as Error;
      console.error(`Error calling ${functionName}:`, err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      options?.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { invoke, loading };
};