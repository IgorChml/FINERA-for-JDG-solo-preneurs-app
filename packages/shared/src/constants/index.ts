export const TAX_CONSTANTS = {
  PIT_SCALE_THRESHOLD: 120000,
  PIT_SCALE_RATE_LOW: 0.12,
  PIT_SCALE_RATE_HIGH: 0.32,
  PIT_LINEAR_RATE: 0.19,
  PIT_FREE_AMOUNT: 30000,

  ZUS_HEALTH_BASE_2026: 5_194.07,
  ZUS_HEALTH_RATE_LINEAR: 0.049,
  ZUS_HEALTH_RATE_SCALE: 0.09,
  ZUS_HEALTH_MIN_2026: 381.78,

  ZUS_SOCIAL_BASE_2026: 5_194.07,
  ZUS_SOCIAL_RETIREMENT_RATE: 0.1952,
  ZUS_SOCIAL_DISABILITY_RATE: 0.08,
  ZUS_SOCIAL_SICKNESS_RATE: 0.0245,
  ZUS_SOCIAL_ACCIDENT_RATE: 0.0167,
  ZUS_LABOR_FUND_RATE: 0.0245,
  ZUS_SOLIDARITY_RATE: 0.0014,

  ZUS_PREFERENTIAL_BASE_2026: 1_273.60,

  VAT_RATES: [0, 5, 8, 23] as const,
  VAT_DECLARATION_DEADLINE_DAY: 25,
  PIT_ADVANCE_DEADLINE_DAY: 20,
  ZUS_DEADLINE_DAY: 20,
} as const;

export const KSEF_URLS = {
  DEMO: 'https://ksef-demo.mf.gov.pl/api',
  PRODUCTION: 'https://ksef.mf.gov.pl/api',
} as const;

export const COST_CATEGORY_LABELS: Record<string, string> = {
  OFFICE: 'Biuro i materiały',
  TRANSPORT: 'Transport i komunikacja',
  MARKETING: 'Marketing i reklama',
  SOFTWARE: 'Oprogramowanie',
  HARDWARE: 'Sprzęt elektroniczny',
  PROFESSIONAL_SERVICES: 'Usługi profesjonalne',
  PHONE_INTERNET: 'Telefon i internet',
  FOOD_BUSINESS: 'Posiłki biznesowe',
  TRAINING: 'Szkolenia i edukacja',
  INSURANCE: 'Ubezpieczenia',
  OTHER: 'Inne',
};

export const TAX_FORM_LABELS: Record<string, string> = {
  SCALE: 'Skala podatkowa',
  LINEAR: 'Podatek liniowy',
  LUMP_SUM: 'Ryczałt',
};

export const LUMP_SUM_RATES = [2, 3, 5, 5.5, 8.5, 10, 12, 12.5, 14, 15, 17] as const;

export const CURRENCY_DEFAULT = 'PLN';

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '30d',
} as const;
