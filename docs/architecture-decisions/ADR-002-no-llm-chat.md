# ADR-002: Rezygnacja z chatbota LLM na rzecz AI Insight Engine + Platformy Edukacyjnej

## Status: Zaakceptowane

## Kontekst

Chatbot odpowiadający na pytania podatkowe może zostać zakwalifikowany jako
świadczenie usług doradztwa podatkowego w rozumieniu Ustawy o doradztwie
podatkowym (Dz.U. 1996 nr 102 poz. 475), co wymaga licencji doradcy podatkowego.

Oryginalne założenie Fazy 2 (moduł 7 PRD) przewidywało budowę Konsjerża
Podatkowego — chatbota opartego na RAG odpowiadającego swobodnie na pytania
prawno-podatkowe użytkowników.

Analiza ryzyk prawnych i operacyjnych wykazała:
1. **Ryzyko prawne**: Swobodne Q&A na tematy podatkowe może stanowić doradztwo podatkowe bez licencji (KN doradców podatkowych KIDP)
2. **Ryzyko halucynacji**: LLM może generować niepoprawne interpretacje przepisów, co naraża użytkowników na błędne decyzje podatkowe
3. **Ryzyko kosztowe**: Nielimitowane Q&A generuje nieprzewidywalne koszty Claude API
4. **Ryzyko compliance**: Brak mechanizmu weryfikacji aktualności cytowanych przepisów

## Decyzja

AI w aplikacji FINERA operuje WYŁĄCZNIE na danych numerycznych użytkownika
(przychody, koszty, faktury) i generuje wnioski analityczne — nie interpretuje
przepisów prawa i nie odpowiada na pytania użytkownika.

**Chatbot LLM (Q&A)** → **zastąpiony przez dwa nowe moduły:**

### Moduł 7A: AI Insight Engine
- Analizuje dane finansowe użytkownika z bazy (faktury, koszty)
- Oblicza metryki w TypeScript (zero AI do obliczeń)
- Claude generuje wyłącznie narrację opisującą gotowe liczby
- Nie interpretuje przepisów, nie używa słów "podatek/VAT/ZUS"
- Wynik cachowany na 24h — kontrolowane koszty API

### Moduł 7B: Platforma Edukacyjna
- Redakcyjne treści pisane przez ekspertów podatkowych
- Wyraźny disclaimer "charakter edukacyjny, nie stanowi porady prawnej"
- Linki do oficjalnych źródeł (ISAP, podatki.gov.pl)
- Quiz sprawdzający zrozumienie (nie generowany przez AI)

### Moduł OCR + Pre-Audyt (pozostaje z Fazy 1, rozszerzony)
- AI kategoryzuje ryzyko wydatku (GREEN/YELLOW/RED) — nie "doradza"
- Każda odpowiedź zawiera mandatory disclaimer
- System prompt z explicit prohibited statements

## Konsekwencje

### Pozytywne
- Eliminacja ryzyka prawnego związanego z ustawą o doradztwie podatkowym
- Eliminacja ryzyka halucynacji LLM w kontekście prawa podatkowego
- Przewidywalne koszty operacyjne Claude API (cache + rate limiting)
- Treści edukacyjne mogą być aktualizowane bez deploymentu (CMS)

### Negatywne
- Konieczność budowy systemu CMS dla treści edukacyjnych (jednorazowy koszt)
- Użytkownik nie może zadać dowolnego pytania podatkowego w aplikacji
- Konieczność redakcji 20+ lekcji startowych przed wdrożeniem

## Zakres obowiązywania

Wszystkie przyszłe integracje AI w FINERA muszą respektować tę decyzję:
- AI operuje wyłącznie na danych użytkownika, nie na przepisach prawa
- Wszelkie odniesienia do prawa podatkowego pochodzą z redakcyjnych treści
- Każda funkcja AI musi przejść review pod kątem ryzyka kwalifikacji jako doradztwo

## Referencje

- Ustawa z dnia 5 lipca 1996 r. o doradztwie podatkowym (Dz.U. 1996 nr 102 poz. 475)
- Interpretacja KIDP dot. oprogramowania doradczego (2023)
- ADR-001: Wybór stosu technologicznego (Faza 1)
