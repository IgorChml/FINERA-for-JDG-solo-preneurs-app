import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'finera_onboarding_complete';

interface OnboardingState {
  isComplete: boolean;
  currentSlide: number;

  setComplete: (value: boolean) => Promise<void>;
  loadStatus: () => Promise<void>;
  nextSlide: () => void;
  prevSlide: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  isComplete: false,
  currentSlide: 0,

  setComplete: async (value) => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, value ? '1' : '0');
    set({ isComplete: value });
  },

  loadStatus: async () => {
    const stored = await SecureStore.getItemAsync(ONBOARDING_KEY);
    set({ isComplete: stored === '1' });
  },

  nextSlide: () => set((s) => ({ currentSlide: s.currentSlide + 1 })),
  prevSlide: () => set((s) => ({ currentSlide: Math.max(0, s.currentSlide - 1) })),
}));
