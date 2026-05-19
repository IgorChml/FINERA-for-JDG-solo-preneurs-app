import { create } from 'zustand';
import { api } from '../utils/api';

type Status = 'FREE' | 'TRIAL' | 'PREMIUM' | 'EXPIRED' | 'LOADING';

interface SubscriptionState {
  status: Status;
  expiryDate: Date | null;
  ocrUsedThisMonth: number;

  // Feature flags — use these in components
  canUseOcrUnlimited: boolean;
  canUseInsightEngine: boolean;
  canUseFullLibrary: boolean;

  checkSubscription: () => Promise<void>;
  purchase: () => Promise<boolean>;
  restore: () => Promise<void>;
  setStatus: (status: Status, expiry?: Date | null) => void;
  incrementOcr: () => void;
}

function deriveFlags(status: Status): Pick<SubscriptionState, 'canUseOcrUnlimited' | 'canUseInsightEngine' | 'canUseFullLibrary'> {
  const isPremiumActive = status === 'PREMIUM' || status === 'TRIAL';
  return {
    canUseOcrUnlimited: isPremiumActive,
    canUseInsightEngine: isPremiumActive,
    canUseFullLibrary: true, // Free gets 2/category, Premium gets all
  };
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  status: 'LOADING',
  expiryDate: null,
  ocrUsedThisMonth: 0,
  ...deriveFlags('LOADING'),

  setStatus: (status, expiry) => {
    set({ status, expiryDate: expiry ?? null, ...deriveFlags(status) });
  },

  checkSubscription: async () => {
    try {
      const data = await api.get<{
        subscriptionStatus: Status;
        subscriptionExpiry: string | null;
        ocrUsedThisMonth: number;
      }>('/api/auth/me').then((r) => (r as { user: typeof r }).user as typeof r);

      const expiry = data.subscriptionExpiry ? new Date(data.subscriptionExpiry) : null;
      set({
        status: data.subscriptionStatus ?? 'FREE',
        expiryDate: expiry,
        ocrUsedThisMonth: data.ocrUsedThisMonth ?? 0,
        ...deriveFlags(data.subscriptionStatus ?? 'FREE'),
      });
    } catch {
      set({ status: 'FREE', ...deriveFlags('FREE') });
    }
  },

  purchase: async () => {
    // RevenueCat purchase flow — actual SDK call happens in Paywall component
    // This store only reflects the state after webhook updates it
    return true;
  },

  restore: async () => {
    await get().checkSubscription();
  },

  incrementOcr: () => {
    set((s) => ({ ocrUsedThisMonth: s.ocrUsedThisMonth + 1 }));
  },
}));
