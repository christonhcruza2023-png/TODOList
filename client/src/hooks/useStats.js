import { useCallback, useEffect, useState } from 'react';
import { tasksApi } from '../services/api';
import { dayBounds } from '../utils/dates';
import { useTaskStore } from '../context/TaskContext';

export function useStats() {
  const { revision } = useTaskStore();
  const [state, setState] = useState({ stats: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const { start, end } = dayBounds();

    setState((current) => ({ ...current, loading: true, error: null }));

    tasksApi
      .stats({ dayStart: start.toISOString(), dayEnd: end.toISOString() })
      .then((response) => {
        if (active) setState({ stats: response.data, loading: false, error: null });
      })
      .catch((error) => {
        if (active) setState({ stats: null, loading: false, error: error.message });
      });

    return () => {
      active = false;
    };
  }, [revision, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...state, retry };
}
