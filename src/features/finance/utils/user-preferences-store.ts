'use client';

import { create } from 'zustand';

export interface UserPreferences {
  firstName: string;
  email: string;
  phone: string;
  location: string;
  language: string;
  currency: string;
  monthlyBudget: number;
  alertThreshold: number; // percentage (e.g. 80 = 80% of budget)
}

interface UserPreferencesState extends UserPreferences {
  setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  reset: () => void;
}

const DEFAULTS: UserPreferences = {
  firstName: 'Marc',
  email: 'marc.ferrer@gmail.com',
  phone: '+34 612 345 678',
  location: 'Barcelona, Spain',
  language: 'English',
  currency: 'EUR (€)',
  monthlyBudget: 5000,
  alertThreshold: 80,
};

// Load persisted preferences from sessionStorage (if available)
function loadPersistedPreferences(): Partial<UserPreferences> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = sessionStorage.getItem('fynn-user-preferences');
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore parse errors
  }
  return {};
}

function persistPreferences(prefs: UserPreferences) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem('fynn-user-preferences', JSON.stringify(prefs));
  } catch {
    // Ignore storage errors
  }
}

export const useUserPreferences = create<UserPreferencesState>((set, get) => ({
  ...DEFAULTS,
  ...loadPersistedPreferences(),

  setPreference: (key, value) => {
    set({ [key]: value });
    const state = { ...get(), [key]: value };
    persistPreferences(state);
  },

  setPreferences: (prefs) => {
    set(prefs);
    const state = { ...get(), ...prefs };
    persistPreferences(state);
  },

  reset: () => {
    set(DEFAULTS);
    persistPreferences(DEFAULTS);
  },
}));
