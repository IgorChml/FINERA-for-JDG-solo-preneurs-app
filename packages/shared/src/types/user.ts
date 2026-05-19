export type TaxForm = 'SCALE' | 'LINEAR' | 'LUMP_SUM';
export type VatRate = 0 | 5 | 8 | 23;
export type SubscriptionPlan = 'free' | 'premium';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  profile?: JDGProfile;
  subscription?: Subscription;
}

export interface JDGProfile {
  id: string;
  userId: string;
  companyName: string;
  nip: string;
  regon?: string;
  pkdCode?: string;
  taxForm: TaxForm;
  vatRate: VatRate;
  isVatPayer: boolean;
  lumpSumRate?: number;
  address: Address;
  bankAccountNumber?: string;
  taxMicroaccountNumber?: string;
}

export interface Address {
  street: string;
  houseNumber: string;
  apartmentNumber?: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  revenuecatCustomerId?: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}
