import { useCallback, useState } from 'react';

export function useAsyncAction() {
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(action: () => Promise<T>) => {
    setSubmitting(true);
    setError(null);

    try {
      return await action();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { isSubmitting, error, setError, run };
}
