import { useCallback, useEffect, useMemo, useState } from 'react';
import { tasksApi } from '../services/api';
import { useTaskStore } from '../context/TaskContext';

const INITIAL_STATE = { tasks: [], count: 0, loading: true, error: null };

export function useTasksQuery(params = {}) {
  const { revision } = useTaskStore();
  const [state, setState] = useState(INITIAL_STATE);
  const [attempt, setAttempt] = useState(0);
  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    tasksApi
      .list(JSON.parse(paramsKey))
      .then((response) => {
        if (!active) return;
        setState({
          tasks: response.data || [],
          count: Number.isFinite(response.count) ? response.count : (response.data || []).length,
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (!active) return;
        setState({ tasks: [], count: 0, loading: false, error: error.message });
      });

    return () => {
      active = false;
    };
  }, [paramsKey, revision, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...state, retry };
}
