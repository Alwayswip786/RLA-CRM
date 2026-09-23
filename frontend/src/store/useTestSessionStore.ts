import { create } from 'zustand';
import type { ActiveTestSession } from '../types/testEngine.types';
import { updateSessionProgress } from '../services/testEngine.service';
import { updateLiveAnswerProgress } from '../services/liveTest.service';

interface TestSessionState {
  session: ActiveTestSession | null;
  currentIndex: number;
  answers: Record<number, number | null>;
  markedForReview: Record<number, boolean>;
  visited: Record<number, boolean>;
  timeRemainingSeconds: number;
  isSubmitting: boolean;
  isSaving: boolean;

  // Actions
  initSession: (session: ActiveTestSession) => void;
  selectOption: (questionIndex: number, optionIndex: number | null) => Promise<void>;
  toggleMarkForReview: (questionIndex: number) => Promise<void>;
  clearResponse: (questionIndex: number) => Promise<void>;
  jumpToQuestion: (index: number) => void;
  tickTimer: () => void;
  setTimeRemaining: (seconds: number) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  clearSession: () => void;
}

export const useTestSessionStore = create<TestSessionState>((set, get) => ({
  session: null,
  currentIndex: 0,
  answers: {},
  markedForReview: {},
  visited: {},
  timeRemainingSeconds: 0,
  isSubmitting: false,
  isSaving: false,

  initSession: (session: ActiveTestSession) => {
    const answers: Record<number, number | null> = {};
    const markedForReview: Record<number, boolean> = {};
    const visited: Record<number, boolean> = {};

    session.questions.forEach((q, idx) => {
      answers[idx] = q.selectedOption;
      markedForReview[idx] = q.isMarkedForReview;
      visited[idx] = q.isVisited;
    });

    visited[session.currentIndex] = true;

    set({
      session,
      currentIndex: session.currentIndex || 0,
      answers,
      markedForReview,
      visited,
      timeRemainingSeconds: Math.max(0, session.timeRemainingSeconds),
      isSubmitting: false,
      isSaving: false,
    });
  },

  selectOption: async (questionIndex: number, optionIndex: number | null) => {
    const { session, answers, isSaving } = get();
    if (!session || isSaving) return;

    // Optimistic local update
    set({
      answers: { ...answers, [questionIndex]: optionIndex },
      isSaving: true,
    });

    try {
      const syncFn = session.isLive ? updateLiveAnswerProgress : updateSessionProgress;
      await syncFn(session.id, {
        questionIndex,
        selectedOption: optionIndex,
        isVisited: true,
      });
    } catch (err) {
      console.error('Failed to sync option selection:', err);
    } finally {
      set({ isSaving: false });
    }
  },

  toggleMarkForReview: async (questionIndex: number) => {
    const { session, markedForReview } = get();
    if (!session) return;

    const currentFlag = Boolean(markedForReview[questionIndex]);
    const nextFlag = !currentFlag;

    set({
      markedForReview: { ...markedForReview, [questionIndex]: nextFlag },
    });

    try {
      const syncFn = session.isLive ? updateLiveAnswerProgress : updateSessionProgress;
      await syncFn(session.id, {
        questionIndex,
        isMarkedForReview: nextFlag,
      });
    } catch (err) {
      console.error('Failed to sync review flag:', err);
    }
  },

  clearResponse: async (questionIndex: number) => {
    const { session, answers } = get();
    if (!session) return;

    set({
      answers: { ...answers, [questionIndex]: null },
    });

    try {
      const syncFn = session.isLive ? updateLiveAnswerProgress : updateSessionProgress;
      await syncFn(session.id, {
        questionIndex,
        selectedOption: null,
      });
    } catch (err) {
      console.error('Failed to clear response:', err);
    }
  },

  jumpToQuestion: (index: number) => {
    const { session, visited } = get();
    if (!session || index < 0 || index >= session.questions.length) return;

    set({
      currentIndex: index,
      visited: { ...visited, [index]: true },
    });
  },

  tickTimer: () => {
    const { timeRemainingSeconds } = get();
    if (timeRemainingSeconds <= 0) return;
    set({ timeRemainingSeconds: timeRemainingSeconds - 1 });
  },

  setTimeRemaining: (seconds: number) => {
    set({ timeRemainingSeconds: seconds });
  },

  setIsSubmitting: (isSubmitting: boolean) => {
    set({ isSubmitting });
  },

  clearSession: () => {
    set({
      session: null,
      currentIndex: 0,
      answers: {},
      markedForReview: {},
      visited: {},
      timeRemainingSeconds: 0,
      isSubmitting: false,
      isSaving: false,
    });
  },
}));
