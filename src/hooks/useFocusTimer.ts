import { useCallback, useEffect, useReducer } from 'react';

export type FocusStatus = 'idle' | 'running' | 'paused' | 'done';

interface FocusState {
  status: FocusStatus;
  duration: number;
  remaining: number;
  completed: number;
}

type FocusAction =
  | { type: 'setMinutes'; minutes: number }
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'tick' }
  | { type: 'reset' };

function focusReducer(state: FocusState, action: FocusAction): FocusState {
  switch (action.type) {
    case 'setMinutes':
      if (state.status !== 'idle') return state;
      return { ...state, duration: action.minutes * 60, remaining: action.minutes * 60 };
    case 'start':
      if (state.status === 'running' || state.status === 'done') return state;
      return { ...state, status: 'running' };
    case 'pause':
      return state.status === 'running' ? { ...state, status: 'paused' } : state;
    case 'tick':
      if (state.status !== 'running') return state;
      if (state.remaining <= 1) {
        return { ...state, remaining: 0, status: 'done', completed: state.completed + 1 };
      }
      return { ...state, remaining: state.remaining - 1 };
    case 'reset':
      return { ...state, status: 'idle', remaining: state.duration };
    default:
      return state;
  }
}

export function useFocusTimer(initialMinutes = 25) {
  const [state, dispatch] = useReducer(focusReducer, {
    status: 'idle',
    duration: initialMinutes * 60,
    remaining: initialMinutes * 60,
    completed: 0,
  });

  useEffect(() => {
    if (state.status !== 'running') return;
    const timer = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(timer);
  }, [state.status]);

  const setMinutes = useCallback((minutes: number) => dispatch({ type: 'setMinutes', minutes }), []);
  const start = useCallback(() => dispatch({ type: 'start' }), []);
  const pause = useCallback(() => dispatch({ type: 'pause' }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  return {
    ...state,
    progress: 1 - state.remaining / state.duration,
    setMinutes,
    start,
    pause,
    reset,
  };
}
