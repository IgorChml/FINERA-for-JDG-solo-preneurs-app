import { create } from 'zustand';

type Plan = 'free' | 'premium';

interface SubscriptionState {
  plan: Plan;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  trialDaysLeft: number | null;
  currentPeriodEnd: Date | null;

  setPlan: (plan: Plan, status: SubscriptionState['status'], periodEnd?: Date) => void;
  isPremium: () => boolean;
  canAccess: (feature: PremiumFeature) => boolean;
}

export type PremiumFeature =
  | 'ai_tax_advisor'
  | 'ocr_scanner'
  | 'open_banking'
  | 'cashflow_ai'
  | 'factoring'
  | 'tax_simulator'
  | 'swipe_to_tax'
  | 'pdf_export';

const PREMIUM_FEATURES: PremiumFeature[] = [
  'ai_tax_advisor',
  'ocr_scanner',
  'open_banking',
  'cashflow_ai',
  'factoring',
  'tax_simulator',
  'swipe_to_tax',
  'pdf_export',
];

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  plan: 'free',
  status: 'active',
  trialDaysLeft: null,
  currentPeriodEnd: null,

  setPlan: (plan, status, periodEnd) => {
    const trialDaysLeft =
      status === 'trialing' && periodEnd
        ? Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;
    set({ plan, status, trialDaysLeft, currentPeriodEnd: periodEnd ?? null });
  },

  isPremium: () => {
    const { plan, status } = get();
    return plan === 'premium' && (status === 'active' || status === 'trialing');
  },

  canAccess: (feature) => {
    if (!PREMIUM_FEATURES.includes(feature)) return true;
    return get().isPremium();
  },
}));
