# FINERA — Faza 1 Complete ✅

**Data zakończenia:** 2026-05-19  
**Status testów:** 34/34 ✅  
**Stack:** Turborepo + Expo SDK 52 + Fastify + Prisma + PostgreSQL

---

## Zaimplementowane funkcje

### 1.1 Projekt i Setup ✅
- Monorepo Turborepo z `apps/mobile`, `apps/api`, `packages/shared`
- pnpm workspace z pełną izolacją pakietów
- ESLint + Prettier + Husky (pre-commit hooks)
- Schemat Prisma: `User`, `RefreshToken`, `JDGProfile`, `Subscription`, `Invoice`, `InvoiceItem`, `Cost`, `TaxReserve`, `KSeFToken`, `KSeFSyncJob`, `PushToken`
- Środowiska: `.env.example` dla mobile i API
- Turborepo tasks: `build`, `dev`, `lint`, `test`, `typecheck`

### 1.2 Autentykacja i Onboarding ✅
- Rejestracja + logowanie email/hasło z weryfikacją emailem
- JWT access token (15 min) + Refresh Token (30 dni) w httpOnly cookie
- Bezpieczne przechowywanie tokenów w `expo-secure-store` (iOS Keychain / Android Keystore)
- Onboarding 3-slajdowy z animacją FlatList + PagerView
- Formularz profilu JDG: NIP (z walidacją sumy kontrolnej), forma opodatkowania, stawka VAT, adres
- Ekran połączenia z KSeF: instrukcja + walidacja tokenu przez test API call

### 1.3 Moduł KSeF HUB ✅
- Backend adapter KSeF REST API (środowisko DEMO: `ksef-demo.mf.gov.pl`)
- BullMQ job: sync faktur w tle z paginacją po 100 rekordów
- Automatyczne parowanie: subject1 = przychody, subject2 = koszty
- Historia synchronizacji (tabela `KSeFSyncJob`)
- Ekran listy faktur: zakładki Przychody/Koszty, wyszukiwanie, pull-to-refresh
- Ekran szczegółu faktury: wszystkie pola, pozycje, status, oznaczanie jako opłaconą
- Push notification hook (infrastruktura gotowa)

### 1.4 Podstawowe Fakturowanie ✅
- Kreator faktury: kontrahent, pozycje, VAT, termin płatności
- Numeracja faktur: `FV/2026/05/0001` (sprzedaż) / `FK/2026/05/0001` (koszty)
- Obliczenia: netto, VAT, brutto per pozycja i suma
- Aktualizacja statusu faktury (DRAFT → SENT → PAID)
- Integracja KSeF send endpoint (gotowe do wysyłki)

### 1.5 Pakiet Freemium "Podatek Podstawowy" ✅
- Dashboard: przychody, koszty, czysty zysk, rezerwa podatkowa
- Widżet "Do zapłaty do US/ZUS" z terminem i kwotą
- Ekran Rezerwy Podatkowej z pełnym breakdown (VAT + PIT + ZUS zdrowotna + ZUS społeczna)
- Generowanie kodu QR do przelewu (standard KIR BLIK)
- Efektywna stopa podatkowa z progress bar

### AI Moduły (przygotowane do Fazy 2) ✅
- `CostAiService`: OCR paragonów przez Claude claude-sonnet-4-20250514 Vision + AI Pre-Audyt ryzyka podatkowego
- `TaxChatService`: Konsjerż podatkowy RAG z system promptem anty-halucynacyjnym
- Fallback na wypadek niedostępności Claude API (aplikacja nie crashuje)
- Confidence score → rekomendacja konsultacji z księgowym przy score < 0.75

---

## Architektura plików

```
finera/
├── packages/shared/src/
│   ├── types/          # User, Invoice, Cost, Tax, KSeF
│   ├── schemas/        # Zod: auth, user, invoice, cost, ksef
│   ├── constants/      # TAX_CONSTANTS, KSEF_URLS, COST_CATEGORY_LABELS
│   └── utils/tax.ts    # calculatePitAdvance, calculateVat, calculateZus, validateNip
│
├── apps/api/src/
│   ├── routes/         # auth, invoice, ksef, tax, profile, cost, chat
│   ├── services/       # AuthService, InvoiceService, TaxService
│   ├── ai/             # CostAiService (OCR+Audit), TaxChatService (RAG)
│   ├── integrations/   # KSeFAdapter (DEMO/PROD)
│   ├── jobs/           # KSeFSyncJob (BullMQ Worker)
│   └── plugins/        # Prisma, Redis
│
└── apps/mobile/app/
    ├── (auth)/         # onboarding, login, register, setup-profile, connect-ksef
    └── (tabs)/
        ├── dashboard/  # Kokpit główny z czystym zyskiem i rezerwamiPodatkowymi
        ├── invoices/   # Lista + szczegół + kreator faktury
        ├── costs/      # Lista kosztów + skaner AI
        └── chat/       # Konsjerż podatkowy
```

---

## Testy jednostkowe

**Wynik: 34/34 ✅ (100%)**

```
packages/shared/utils/tax.ts:
  ✓ calculatePitAdvance — Skala podatkowa (4 testy)
  ✓ calculatePitAdvance — Podatek liniowy 19% (3 testy)
  ✓ calculatePitAdvance — Ryczałt (3 testy)
  ✓ calculateVat (4 testy)
  ✓ calculateZusHealth (5 testów — w tym 3 progi ryczałtu)
  ✓ calculateZusSocialMonthly (2 testy)
  ✓ calculateTaxes — pełna kalkulacja (5 testów edge cases)
  ✓ validateNip (5 testów — suma kontrolna)
  ✓ formatPln (3 testy)
```

---

## Instrukcja uruchomienia

### Wymagania
- Node.js 20+
- pnpm 11+
- PostgreSQL 15+ (lub Docker)
- Redis 7+ (lub Docker)

### Krok 1: Środowisko API
```bash
cp apps/api/.env.example apps/api/.env
# Uzupełnij DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
```

### Krok 2: Baza danych
```bash
cd apps/api
pnpm db:push          # Pushuje schemat bez migracji (dev)
# lub
pnpm db:migrate       # Tworzy migrację (zalecane w produkcji)
```

### Krok 3: Uruchomienie API
```bash
pnpm --filter @finera/api dev
# API dostępne pod: http://localhost:3001
# Swagger docs: http://localhost:3001/docs
```

### Krok 4: Środowisko Mobile
```bash
cp apps/mobile/.env.example apps/mobile/.env
# EXPO_PUBLIC_API_URL=http://localhost:3001
```

### Krok 5: Uruchomienie Mobile
```bash
pnpm --filter @finera/mobile dev
# Otwórz Expo Go lub symulator iOS/Android
```

### Testy
```bash
pnpm --filter @finera/api test
```

---

## Bezpieczeństwo — spełnione wymagania
- ✅ JWT access token 15 min + Refresh Token 30 dni httpOnly cookie
- ✅ expo-secure-store (NIE AsyncStorage) dla wszystkich tokenów mobile
- ✅ Zod validation na wszystkich endpointach API (front ↔ back shared schemas)
- ✅ bcrypt (SALT_ROUNDS=12) dla haseł
- ✅ Rate limiting (100 req/min produkcja, 1000/min dev)
- ✅ Helmet (security headers)
- ✅ CORS skonfigurowany per środowisko
- ✅ .env w .gitignore, .env.example jako template
- ✅ AI fallback — aplikacja NIE crashuje przy niedostępności Claude API
- ✅ Disclaimer UI na odpowiedziach AI ("nie stanowi porady podatkowej")
- ✅ accessibilityLabel na wszystkich interaktywnych elementach UI

---

## Następny krok: Faza 2 — Integracja AI

Gotowe do implementacji:
- Pełny RAG pipeline (pgvector + embeddingi ustaw podatkowych)
- RevenueCat subskrypcje (iOS App Store + Google Play)
- Feature flags w Zustand (Premium paywall)
- Rozbudowany OCR z pełnym interfejsem korekty
