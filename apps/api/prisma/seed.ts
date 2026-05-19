import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: 'rejestracja-jdg', name: 'Rejestracja i start JDG', icon: 'ti-building-store', sortOrder: 1 },
  { slug: 'prawo-podatkowe', name: 'Podatki i rozliczenia', icon: 'ti-receipt-tax', sortOrder: 2 },
  { slug: 'zus-i-skladki', name: 'ZUS i składki', icon: 'ti-heart-rate-monitor', sortOrder: 3 },
  { slug: 'koszty-firmowe', name: 'Koszty firmowe', icon: 'ti-shopping-cart', sortOrder: 4 },
];

const LESSONS = [
  // ── REJESTRACJA JDG ──────────────────────────────────────────────────
  {
    categorySlug: 'rejestracja-jdg',
    slug: 'jak-zalozyc-jdg-ceidg',
    title: 'Jak założyć JDG krok po kroku — CEIDG i co dalej',
    summary: 'Kompletny przewodnik rejestracji działalności przez internet. Od wniosku CEIDG-1 do pierwszej faktury.',
    taxFormFilter: ['ALL'],
    readTimeMinutes: 5,
    legalSource: 'https://www.biznes.gov.pl/pl/firma/zakladanie-firmy/chce-zalozyc-firme-jednoosobowa-dzialalnosc/rejestracja-jednoosobowej-dzialalnosci-gospodarczej',
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Rejestracja JDG — krok po kroku

Założenie Jednoosobowej Działalności Gospodarczej w Polsce jest bezpłatne i można to zrobić w całości online przez portal **CEIDG** (Centralna Ewidencja i Informacja o Działalności Gospodarczej).

## Krok 1: Przygotuj dane przed rejestracją

Zanim otworzysz formularz, przygotuj:

- **Numer PESEL** — obowiązkowy dla obywateli polskich
- **Adres zamieszkania i adres prowadzenia działalności** (mogą być tożsame)
- **Kod PKD** — Polska Klasyfikacja Działalności, opisuje czym się zajmujesz
- **Dane banku** — numer rachunku firmowego (możesz dodać później)

## Krok 2: Wypełnij wniosek CEIDG-1

Zaloguj się na **ceidg.gov.pl** profilem zaufanym lub e-Dowodem. Wniosek CEIDG-1 to jednocześnie zgłoszenie do:

- **GUS** (nadanie numeru REGON — automatyczne)
- **ZUS** — jako płatnik składek
- **Urzędu Skarbowego** — wybierasz formę opodatkowania

Proces trwa zazwyczaj **15–30 minut**. Wpis pojawia się w systemie natychmiast po złożeniu wniosku.

## Krok 3: Wybierz formę opodatkowania

Na etapie rejestracji musisz wybrać, jak będziesz płacić podatek dochodowy:

- **Skala podatkowa** — 12% do 120 000 zł, 32% powyżej (domyślna)
- **Podatek liniowy** — stałe 19%, bez kwoty wolnej
- **Ryczałt ewidencjonowany** — stawka od 2% do 17%, zależna od PKD

**💡 Wskazówka:** Jeśli nie jesteś pewien, zostań na skali — można zmienić do 20 lutego kolejnego roku.

## Krok 4: VAT — rejestracja lub zwolnienie

Jeśli planujesz przychody powyżej **200 000 zł rocznie**, rejestracja VAT jest obowiązkowa. Poniżej tego progu możesz korzystać ze zwolnienia podmiotowego.

Rejestracja VAT: złóż formularz **VAT-R** w urzędzie skarbowym (online przez e-Deklaracje).

## Co po rejestracji?

1. Otwórz **konto bankowe firmowe** (lub wydziel prywatne)
2. Zgłoś się do ZUS w ciągu **7 dni od startu działalności**
3. Wybierz program do fakturowania lub skorzystaj z FINERA
4. Zachowaj potwierdzenie wpisu CEIDG — przyda się do banku`,
    quizQuestions: [
      {
        question: 'Ile kosztuje rejestracja JDG przez CEIDG?',
        answers: [
          { text: 'Jest bezpłatna', isCorrect: true },
          { text: '100 zł opłata skarbowa', isCorrect: false },
          { text: '250 zł w urzędzie gminy', isCorrect: false },
          { text: '50 zł online, 200 zł w urzędzie', isCorrect: false },
        ],
        explanation: 'Rejestracja JDG w CEIDG jest całkowicie bezpłatna, zarówno online jak i w urzędzie gminy.',
        sortOrder: 1,
      },
      {
        question: 'Ile masz czasu na zgłoszenie do ZUS od dnia rozpoczęcia działalności?',
        answers: [
          { text: '7 dni', isCorrect: true },
          { text: '14 dni', isCorrect: false },
          { text: '30 dni', isCorrect: false },
          { text: 'Wniosek CEIDG zgłasza automatycznie', isCorrect: false },
        ],
        explanation: 'Po rejestracji w CEIDG masz 7 dni na zgłoszenie do ZUS jako ubezpieczony (formularz ZUS ZUA lub ZUS ZZA).',
        sortOrder: 2,
      },
      {
        question: 'Jaki próg przychodów powoduje obowiązek rejestracji do VAT?',
        answers: [
          { text: '200 000 zł rocznie', isCorrect: true },
          { text: '100 000 zł rocznie', isCorrect: false },
          { text: '500 000 zł rocznie', isCorrect: false },
          { text: 'Każdy przedsiębiorca musi rejestrować VAT', isCorrect: false },
        ],
        explanation: 'Zwolnienie podmiotowe z VAT obowiązuje do 200 000 zł przychodów rocznie. Powyżej tego progu rejestracja jest obowiązkowa.',
        sortOrder: 3,
      },
    ],
  },
  {
    categorySlug: 'rejestracja-jdg',
    slug: 'wybor-formy-opodatkowania',
    title: 'Wybór formy opodatkowania — skala, liniowy czy ryczałt?',
    summary: 'Porównanie trzech form opodatkowania JDG w 2026 roku. Kiedy która się opłaca i jak zmienić wybór.',
    taxFormFilter: ['ALL'],
    readTimeMinutes: 6,
    legalSource: 'https://www.podatki.gov.pl/pit/rozliczenie-pit/formy-opodatkowania-dzialalnosci-gospodarczej/',
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Trzy formy opodatkowania JDG

Wybór formy opodatkowania to jedna z najważniejszych decyzji przy zakładaniu firmy. Wpływa na wysokość podatku, możliwość odliczania kosztów i obowiązki ewidencyjne.

## 1. Skala podatkowa (zasady ogólne)

Stawki w 2026 roku:
- **12%** — do 120 000 zł podstawy opodatkowania
- **32%** — powyżej 120 000 zł

**Kwota wolna od podatku:** 30 000 zł rocznie — przy dochodzie do 30 000 zł nie płacisz PIT.

**Zalety:**
- Można odliczać **koszty uzyskania przychodu**
- Dostęp do ulg: prorodzinna, rehabilitacyjna, B+R
- Wspólne rozliczenie z małżonkiem

**Wady:**
- Wysokie stawki przy dochodach powyżej 120 000 zł
- Obowiązek prowadzenia KPiR (Księga Przychodów i Rozchodów)

## 2. Podatek liniowy 19%

Stała stawka **19%** niezależnie od wysokości dochodu. Brak kwoty wolnej.

**Zalety:**
- Przewidywalny podatek przy wysokich dochodach
- Odliczanie kosztów jak na skali

**Wady:**
- Brak kwoty wolnej — płacisz od pierwszej złotówki
- Brak wspólnego rozliczenia z małżonkiem
- Brak większości ulg podatkowych

**Kiedy się opłaca:** Gdy dochód przekracza ok. 150 000 zł rocznie.

## 3. Ryczałt od przychodów ewidencjonowanych

Podatek od **przychodu** (nie dochodu!) według stałych stawek zależnych od PKD:

| Stawka | Przykładowe usługi |
|--------|-------------------|
| 8,5% | Usługi niematerialne, najem |
| 12% | Wolne zawody, IT (część) |
| 15% | Pośrednictwo |
| 17% | Wolne zawody (lekarze, prawnicy) |

**Zalety:**
- Uproszczona ewidencja
- Niskie stawki dla wybranych PKD

**Wady:**
- **Brak możliwości odliczania kosztów** — płacisz od całego przychodu
- Nie sprawdza się przy wysokich kosztach

**💡 Wskazówka:** Ryczałt opłaca się gdy koszty firmy są niskie (poniżej ~30% przychodu).

## Jak zmienić formę opodatkowania?

Zmianę zgłaszasz do urzędu skarbowego do **20 lutego** roku, w którym chcesz stosować nową formę. Wyjątek: przy rejestracji możesz wybrać dowolnie.`,
    quizQuestions: [
      {
        question: 'Na skali podatkowej — ile wynosi kwota wolna od podatku w 2026 r.?',
        answers: [
          { text: '30 000 zł', isCorrect: true },
          { text: '8 000 zł', isCorrect: false },
          { text: '120 000 zł', isCorrect: false },
          { text: 'Brak kwoty wolnej', isCorrect: false },
        ],
        explanation: 'Kwota wolna od podatku na skali podatkowej wynosi 30 000 zł rocznie. Oznacza to, że dochód do tej kwoty nie podlega opodatkowaniu.',
        sortOrder: 1,
      },
      {
        question: 'Ryczałt ewidencjonowany naliczany jest od:',
        answers: [
          { text: 'Przychodu (bez odliczania kosztów)', isCorrect: true },
          { text: 'Dochodu (przychód minus koszty)', isCorrect: false },
          { text: 'Zysku netto', isCorrect: false },
          { text: 'Wartości majątku firmy', isCorrect: false },
        ],
        explanation: 'Ryczałt naliczany jest od przychodu — nie możesz odliczać kosztów firmowych. To upraszcza rozliczenie, ale jest niekorzystne gdy koszty są wysokie.',
        sortOrder: 2,
      },
      {
        question: 'Do kiedy należy zgłosić zmianę formy opodatkowania na kolejny rok?',
        answers: [
          { text: 'Do 20 lutego danego roku', isCorrect: true },
          { text: 'Do 31 grudnia roku poprzedniego', isCorrect: false },
          { text: 'Do 30 kwietnia danego roku', isCorrect: false },
          { text: 'Zmiana jest możliwa w każdym momencie', isCorrect: false },
        ],
        explanation: 'Zmianę formy opodatkowania zgłaszasz do 20 lutego roku, w którym chcesz stosować nowe zasady. Po tym terminie musisz czekać do następnego roku.',
        sortOrder: 3,
      },
    ],
  },
  {
    categorySlug: 'rejestracja-jdg',
    slug: 'rejestracja-vat-kiedy-obowiazek',
    title: 'Rejestracja do VAT — kiedy obowiązek, kiedy opłacalność',
    summary: 'Kiedy musisz, a kiedy opłaca Ci się zarejestrować do VAT? Formularz VAT-R i zasady rozliczeń.',
    taxFormFilter: ['ALL'],
    readTimeMinutes: 4,
    legalSource: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20040540535',
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## VAT dla JDG — podstawy

Podatek VAT (Value Added Tax) to podatek od towarów i usług, który pobierasz od klientów i odprowadzasz do urzędu skarbowego po odliczeniu VAT zapłaconego dostawcom.

## Kiedy rejestracja do VAT jest obowiązkowa?

Rejestracja jest wymagana gdy:

1. **Przychody przekroczą 200 000 zł** rocznie (limit 2026)
2. Sprzedajesz towary lub usługi **wymienione w załączniku nr 12 do ustawy o VAT** (m.in. metale szlachetne, paliwa)
3. Świadczysz usługi dla klientów z **UE** (B2B) — od pierwszej transakcji
4. Importujesz towary z krajów spoza UE

## Kiedy warto zarejestrować się dobrowolnie?

Nawet poniżej limitu 200 000 zł rejestracja może być korzystna gdy:

- **Twoi klienci to firmy** — mogą odliczyć VAT, więc nie obciąża ich cena brutto
- **Masz wysokie koszty z VAT** — możesz odliczać VAT od zakupów (sprzęt, oprogramowanie, usługi)
- **Planujesz eksport** — możesz stosować stawkę 0%

**💡 Wskazówka:** Freelancer sprzedający wyłącznie osobom prywatnym zazwyczaj lepiej bez VAT — cena brutto = cena netto, prościej i taniej.

## Rejestracja — formularz VAT-R

Złóż formularz **VAT-R** w urzędzie skarbowym właściwym dla Twojego miejsca zamieszkania. Możesz to zrobić:
- Online przez **e-Deklaracje**
- Osobiście w urzędzie
- Przez pełnomocnika

Rejestracja jest bezpłatna. Urząd potwierdza rejestrację na piśmie.

## Rozliczanie VAT

- **VAT-7** — deklaracja miesięczna (do 25. dnia następnego miesiąca)
- **VAT-7K** — deklaracja kwartalna (do 25. dnia po końcu kwartału)

Różnica: VAT = VAT od sprzedaży — VAT od zakupów. Jeśli wynik jest dodatni, płacisz do US. Jeśli ujemny — US zwraca nadpłatę (do 60 dni).`,
    quizQuestions: [
      {
        question: 'Jaki limit przychodów powoduje obowiązek rejestracji do VAT w 2026 roku?',
        answers: [
          { text: '200 000 zł', isCorrect: true },
          { text: '150 000 zł', isCorrect: false },
          { text: '100 000 zł', isCorrect: false },
          { text: '500 000 zł', isCorrect: false },
        ],
        explanation: 'Limit zwolnienia podmiotowego z VAT wynosi 200 000 zł przychodów rocznie. Przekroczenie tego progu obliguje do rejestracji.',
        sortOrder: 1,
      },
      {
        question: 'Kiedy warto zarejestrować się do VAT nawet poniżej limitu?',
        answers: [
          { text: 'Gdy klienci to głównie firmy (B2B) z możliwością odliczenia VAT', isCorrect: true },
          { text: 'Gdy klienci to wyłącznie osoby prywatne', isCorrect: false },
          { text: 'Nigdy — rejestracja zawsze jest niekorzystna poniżej limitu', isCorrect: false },
          { text: 'Zawsze — VAT upraszcza rozliczenia', isCorrect: false },
        ],
        explanation: 'Rejestracja do VAT jest korzystna przy sprzedaży dla firm (B2B), bo klienci mogą odliczyć VAT. Przy sprzedaży dla osób prywatnych VAT podnosi cenę.',
        sortOrder: 2,
      },
      {
        question: 'Do kiedy składa się miesięczną deklarację VAT-7?',
        answers: [
          { text: 'Do 25. dnia następnego miesiąca', isCorrect: true },
          { text: 'Do 20. dnia następnego miesiąca', isCorrect: false },
          { text: 'Do ostatniego dnia miesiąca', isCorrect: false },
          { text: 'Do 15. dnia następnego miesiąca', isCorrect: false },
        ],
        explanation: 'Deklarację VAT-7 (miesięczną) składa się do 25. dnia miesiąca następującego po rozliczanym miesiącu.',
        sortOrder: 3,
      },
    ],
  },
  {
    categorySlug: 'rejestracja-jdg',
    slug: 'nip-regon-pesel-w-firmie',
    title: 'NIP, REGON, PESEL — jakich numerów używać w firmie',
    summary: 'Który numer podawać na fakturach i w kontaktach z urzędami? Praktyczny przewodnik po numerach identyfikacyjnych.',
    taxFormFilter: ['ALL'],
    readTimeMinutes: 3,
    legalSource: null,
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Numery identyfikacyjne w JDG

Prowadząc JDG posługujesz się kilkoma numerami. Oto co każdy z nich oznacza i kiedy go używać.

## NIP — Numer Identyfikacji Podatkowej

10-cyfrowy numer nadawany przez urząd skarbowy. Jako osoba fizyczna prowadząca JDG masz **jeden NIP** — ten sam dla działalności i prywatny.

**Używaj NIP na:**
- Fakturach VAT i rachunkach
- Deklaracjach podatkowych (PIT, VAT)
- Kontraktach z kontrahentami
- Pieczątce firmowej

**Format:** 1234567890 lub 123-456-78-90

## REGON — Numer Statystyczny

9-cyfrowy numer nadawany przez GUS automatycznie przy rejestracji w CEIDG.

**Gdzie jest wymagany:**
- Drukach GUS (ankiety statystyczne)
- Niektórych umowach (banki, przetargi publiczne)
- Wpisie CEIDG

W codziennej działalności JDG REGON jest rzadko potrzebny.

## PESEL — a JDG

Jako osoba fizyczna możesz używać PESEL zamiast NIP w kontaktach z urzędami, jeśli nie jesteś zarejestrowanym podatnikiem VAT. Po rejestracji do VAT — obowiązkowo NIP.

**Na fakturach:** Zawsze podawaj NIP, nie PESEL.

## Weryfikacja NIP kontrahenta

Przed wystawieniem faktury możesz sprawdzić NIP kontrahenta:
- **Biała Lista Podatników VAT** — podatki.gov.pl
- **VIES** — weryfikacja numerów UE

**💡 Wskazówka:** Zawsze weryfikuj NIP nowego kontrahenta przed pierwszą fakturą. Faktura wystawiona na błędny NIP może być zakwestionowana przez US.`,
    quizQuestions: [
      {
        question: 'Ile numerów NIP ma osoba fizyczna prowadząca JDG?',
        answers: [
          { text: 'Jeden — ten sam prywatny i firmowy', isCorrect: true },
          { text: 'Dwa — osobny prywatny i firmowy', isCorrect: false },
          { text: 'Trzy — NIP, PESEL i REGON', isCorrect: false },
          { text: 'Żaden — JDG używa tylko PESEL', isCorrect: false },
        ],
        explanation: 'Osoba fizyczna prowadząca JDG ma jeden NIP — używany zarówno prywatnie jak i w działalności. Nie ma odrębnego "firmowego NIP".',
        sortOrder: 1,
      },
      {
        question: 'Gdzie można sprawdzić czy NIP kontrahenta jest aktywnym podatnikiem VAT?',
        answers: [
          { text: 'Biała Lista Podatników VAT (podatki.gov.pl)', isCorrect: true },
          { text: 'W CEIDG', isCorrect: false },
          { text: 'W GUS', isCorrect: false },
          { text: 'W ZUS', isCorrect: false },
        ],
        explanation: 'Biała Lista Podatników VAT (podatki.gov.pl) umożliwia weryfikację statusu VAT kontrahenta. Warto sprawdzać przed pierwszą transakcją.',
        sortOrder: 2,
      },
      {
        question: 'Który numer należy podawać na wystawianych fakturach?',
        answers: [
          { text: 'NIP', isCorrect: true },
          { text: 'PESEL', isCorrect: false },
          { text: 'REGON', isCorrect: false },
          { text: 'Dowolny z powyższych', isCorrect: false },
        ],
        explanation: 'Na fakturach zawsze podajesz NIP — zarówno swój jak i nabywcy. Używanie PESEL na fakturze jest nieprawidłowe.',
        sortOrder: 3,
      },
    ],
  },
  {
    categorySlug: 'rejestracja-jdg',
    slug: 'pierwsze-miesiace-jdg-preferencyjna-zus',
    title: 'Pierwsze miesiące JDG — preferencyjny ZUS i ulgi na start',
    summary: 'Ulga na start, mały ZUS — jak legalnie płacić niższe składki w pierwszych latach działalności.',
    taxFormFilter: ['ALL'],
    readTimeMinutes: 5,
    legalSource: 'https://www.zus.pl/firmy/przedsiebiorca-w-zus/ulgi-dla-przedsiebiorcow/ulga-na-start',
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Ulgi ZUS dla nowych przedsiębiorców

Polskie prawo przewiduje specjalne zasady dla osób, które dopiero zaczynają przygodę z JDG. Możesz legalnie płacić znacznie niższe składki przez pierwsze lata.

## Ulga na start — pierwsze 6 miesięcy

Jeśli zaczynasz pierwszą działalność gospodarczą (lub mija 60 miesięcy od zawieszenia poprzedniej), możesz przez **6 miesięcy** nie płacić składek społecznych ZUS.

**Co obowiązuje nadal:**
- Składka zdrowotna — obowiązkowa od pierwszego dnia
- Fundusz Pracy — brak obowiązku

**Warunki ulgi na start:**
- Pierwsza działalność gospodarcza w życiu LUB po 60 miesiącach przerwy
- Nie możesz wykonywać działalności na rzecz byłego pracodawcy (z ostatnich 3 lat)

## Preferencyjny ZUS — kolejne 24 miesiące

Po zakończeniu ulgi na start (lub od razu, jeśli z niej nie korzystałeś) przysługuje **mały ZUS** przez 24 miesiące.

Podstawa wymiaru składek to **30% minimalnego wynagrodzenia** (zamiast standardowych ~5 194 zł).

W 2026 roku preferencyjne składki społeczne to ok. **250–350 zł miesięcznie** (vs. ~1 700 zł pełnych składek).

## Mały ZUS Plus — po 2 latach

Po 24 miesiącach preferencyjnego ZUS możesz skorzystać z **Małego ZUS Plus** (jeśli przychody nie przekraczają 120 000 zł rocznie). Składki naliczane od faktycznego dochodu.

## Harmonogram ulg

| Okres | Składki |
|-------|---------|
| Miesiące 1–6 | Ulga na start — brak składek społecznych |
| Miesiące 7–30 | Preferencyjny ZUS (30% min. wynagrodzenia) |
| Od miesiąca 31 | Pełny ZUS lub Mały ZUS Plus |

**💡 Wskazówka:** Zgłoś ulgę na start przy pierwszym zgłoszeniu do ZUS. Użyj kodu tytułu ubezpieczenia **05 40** w formularzu ZUS ZZA.`,
    quizQuestions: [
      {
        question: 'Jak długo trwa ulga na start (brak składek społecznych)?',
        answers: [
          { text: '6 miesięcy', isCorrect: true },
          { text: '12 miesięcy', isCorrect: false },
          { text: '24 miesiące', isCorrect: false },
          { text: '3 miesiące', isCorrect: false },
        ],
        explanation: 'Ulga na start trwa 6 miesięcy kalendarzowych od dnia podjęcia działalności. W tym czasie nie płacisz składek społecznych, ale nadal musisz opłacać składkę zdrowotną.',
        sortOrder: 1,
      },
      {
        question: 'Jaki procent minimalnego wynagrodzenia stanowi podstawa preferencyjnego ZUS?',
        answers: [
          { text: '30%', isCorrect: true },
          { text: '50%', isCorrect: false },
          { text: '60%', isCorrect: false },
          { text: '100%', isCorrect: false },
        ],
        explanation: 'Preferencyjne składki ZUS naliczane są od 30% minimalnego wynagrodzenia brutto, co znacząco obniża miesięczne obciążenie w pierwszych dwóch latach.',
        sortOrder: 2,
      },
      {
        question: 'Czy z ulgi na start może skorzystać osoba, która zamknęła poprzednią działalność rok temu?',
        answers: [
          { text: 'Nie — wymagana jest 60-miesięczna przerwa', isCorrect: true },
          { text: 'Tak — wystarczy jakkolwiek zakończyć poprzednią działalność', isCorrect: false },
          { text: 'Tak — ale tylko jeśli poprzednia działalność trwała krócej niż rok', isCorrect: false },
          { text: 'Nie — ulga na start przysługuje tylko raz w życiu', isCorrect: false },
        ],
        explanation: 'Ulga na start przysługuje przy pierwszej działalności LUB jeśli od poprzedniej minęło co najmniej 60 miesięcy (5 lat). Roczna przerwa nie jest wystarczająca.',
        sortOrder: 3,
      },
    ],
  },
  // ── PRAWO PODATKOWE ───────────────────────────────────────────────────
  {
    categorySlug: 'prawo-podatkowe',
    slug: 'zaliczki-pit-kiedy-ile',
    title: 'Zaliczki na PIT — kiedy i ile płacić',
    summary: 'Terminy i zasady obliczania miesięcznych zaliczek na podatek dochodowy dla JDG na skali i podatku liniowym.',
    taxFormFilter: ['SKALA', 'LINIOWY'],
    readTimeMinutes: 5,
    legalSource: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19910800350',
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Zaliczki na PIT dla przedsiębiorców

Jeśli prowadzisz JDG i rozliczasz się na skali podatkowej lub podatku liniowym, musisz samodzielnie obliczać i wpłacać zaliczki na podatek dochodowy (PIT) w ciągu roku.

## Terminy wpłat zaliczek

Zaliczkę za dany miesiąc wpłacasz do **20. dnia następnego miesiąca**:

- Zaliczka za styczeń → do 20 lutego
- Zaliczka za luty → do 20 marca
- ...i tak dalej przez cały rok

**Wyjątek:** Jeśli zaliczka za dany miesiąc nie przekracza 1 000 zł, możesz jej nie wpłacać — zostanie uwzględniona w rozliczeniu rocznym.

## Jak obliczyć zaliczkę?

### Skala podatkowa (narastająco od początku roku):

1. Zsumuj **przychody** od początku roku
2. Odejmij **koszty uzyskania** od początku roku
3. Odejmij **zapłacone składki ZUS społeczne**
4. Oblicz podatek według skali (12% / 32%)
5. Odejmij **połowę składki zdrowotnej** (do wysokości limitu)
6. Odejmij zaliczki wpłacone w poprzednich miesiącach

### Podatek liniowy (19%):

Analogicznie, ale zawsze stosując stawkę 19%.

## Mikrorachunek podatkowy

Zaliczki wpłacasz na swój **indywidualny mikrorachunek podatkowy** (26-cyfrowy numer). Wygenerujesz go na podatki.gov.pl podając swój PESEL lub NIP.

**💡 Wskazówka:** Kwartalna forma zaliczek jest możliwa dla małych podatników (przychody do 2 mln EUR). Termin: 20. dzień po zakończeniu kwartału.`,
    quizQuestions: [
      {
        question: 'Do kiedy należy wpłacić zaliczkę na PIT za styczeń?',
        answers: [
          { text: 'Do 20 lutego', isCorrect: true },
          { text: 'Do 31 stycznia', isCorrect: false },
          { text: 'Do 25 lutego', isCorrect: false },
          { text: 'Do 30 kwietnia', isCorrect: false },
        ],
        explanation: 'Zaliczkę na PIT za dany miesiąc wpłacasz do 20. dnia miesiąca następnego. Za styczeń — do 20 lutego.',
        sortOrder: 1,
      },
      {
        question: 'Poniżej jakiej kwoty miesięcznej zaliczki można jej nie wpłacać?',
        answers: [
          { text: '1 000 zł', isCorrect: true },
          { text: '500 zł', isCorrect: false },
          { text: '2 000 zł', isCorrect: false },
          { text: 'Zawsze trzeba wpłacać', isCorrect: false },
        ],
        explanation: 'Jeśli obliczona zaliczka miesięczna nie przekracza 1 000 zł, możesz jej nie wpłacać — zostanie rozliczona w zeznaniu rocznym PIT.',
        sortOrder: 2,
      },
      {
        question: 'Na jaki rachunek wpłacasz zaliczki na PIT?',
        answers: [
          { text: 'Indywidualny mikrorachunek podatkowy', isCorrect: true },
          { text: 'Rachunek urzędu skarbowego', isCorrect: false },
          { text: 'Rachunek ZUS', isCorrect: false },
          { text: 'Rachunek NBP', isCorrect: false },
        ],
        explanation: 'Wszystkie zaliczki na PIT wpłacasz na swój indywidualny mikrorachunek podatkowy (26-cyfrowy numer generowany na podatki.gov.pl).',
        sortOrder: 3,
      },
    ],
  },
  {
    categorySlug: 'prawo-podatkowe',
    slug: 'vat7-miesieczny-vs-kwartalny',
    title: 'VAT-7 miesięczny vs VAT-7K kwartalny — co wybrać',
    summary: 'Porównanie miesięcznych i kwartalnych rozliczeń VAT. Kiedy kwartalna forma jest korzystniejsza dla małej firmy.',
    taxFormFilter: ['ALL'],
    readTimeMinutes: 4,
    legalSource: null,
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Dwa rytmy rozliczania VAT

Jako podatnik VAT masz wybór między rozliczaniem się co miesiąc (VAT-7) lub co kwartał (VAT-7K).

## VAT-7 — deklaracja miesięczna

**Termin:** Do 25. dnia następnego miesiąca.

**Zalety:**
- Szybszy zwrot nadpłaty VAT (max 60 dni)
- Lepszy przepływ gotówki przy dużych zakupach

**Wady:**
- 12 deklaracji rocznie — więcej pracy administracyjnej
- Częstsze wpłaty na rachunek US

## VAT-7K — deklaracja kwartalna

**Termin:** Do 25. dnia miesiąca po zakończeniu kwartału (kwiecień, lipiec, październik, styczeń).

**Warunek:** Dostępna tylko dla **małych podatników** — przychody do 2 mln EUR rocznie (ok. 9,6 mln zł w 2026).

**Zalety:**
- 4 deklaracje rocznie — mniej biurokracji
- Więcej czasu na zgromadzenie środków na VAT

**Wady:**
- Dłuższe oczekiwanie na zwrot nadpłaty
- Konieczność wpłat zaliczkowych (metoda kasowa lub rachunkowa)

## Metody zaliczkowe przy VAT-7K

Przy rozliczeniu kwartalnym musisz wpłacać zaliczki za pierwsze dwa miesiące kwartału:

- **Metoda podstawowa:** 1/3 VAT z poprzedniego kwartału
- **Metoda obliczonego VAT:** faktyczny VAT za dany miesiąc

Trzeci miesiąc kwartału jest rozliczany w deklaracji VAT-7K.

**💡 Wskazówka:** Dla freelancerów z regularnymi, miesięcznymi przychodami VAT-7K jest zazwyczaj wygodniejszy — mniej papierkowej roboty.`,
    quizQuestions: [
      {
        question: 'Jaki jest limit przychodów uprawniający do kwartalnego VAT-7K?',
        answers: [
          { text: '2 mln EUR rocznie', isCorrect: true },
          { text: '200 000 zł rocznie', isCorrect: false },
          { text: '1 mln PLN rocznie', isCorrect: false },
          { text: 'Brak limitu — każdy może wybrać VAT-7K', isCorrect: false },
        ],
        explanation: 'Kwartalne rozliczenie VAT (VAT-7K) dostępne jest dla małych podatników — tych, których przychody nie przekraczają 2 mln EUR rocznie.',
        sortOrder: 1,
      },
      {
        question: 'Do kiedy składa się deklarację VAT-7K za I kwartał (styczeń–marzec)?',
        answers: [
          { text: 'Do 25 kwietnia', isCorrect: true },
          { text: 'Do 31 marca', isCorrect: false },
          { text: 'Do 20 kwietnia', isCorrect: false },
          { text: 'Do 30 kwietnia', isCorrect: false },
        ],
        explanation: 'Deklarację VAT-7K za I kwartał (styczeń-marzec) składa się do 25 kwietnia.',
        sortOrder: 2,
      },
      {
        question: 'Ile deklaracji VAT składa rocznie podatnik na VAT-7K?',
        answers: [
          { text: '4', isCorrect: true },
          { text: '12', isCorrect: false },
          { text: '6', isCorrect: false },
          { text: '1', isCorrect: false },
        ],
        explanation: 'Podatnik korzystający z VAT-7K składa 4 deklaracje rocznie — po jednej za każdy kwartał.',
        sortOrder: 3,
      },
    ],
  },
  {
    categorySlug: 'prawo-podatkowe',
    slug: 'ryczalt-stawki-pkd',
    title: 'Ryczałt ewidencjonowany — stawki i zasady dla popularnych PKD',
    summary: 'Przegląd stawek ryczałtu dla IT, usług, handlu i wolnych zawodów. Jak sprawdzić swoją stawkę.',
    taxFormFilter: ['RYCZALT'],
    readTimeMinutes: 5,
    legalSource: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19981440993',
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Ryczałt — zasady ogólne

Ryczałt od przychodów ewidencjonowanych to forma opodatkowania, w której płacisz stały procent od **przychodu** (bez odliczania kosztów). Stawka zależy od rodzaju działalności określonej kodem PKD.

## Stawki ryczałtu w 2026 roku

| Stawka | Rodzaj działalności |
|--------|-------------------|
| **2%** | Sprzedaż przetworzonych produktów roślinnych i zwierzęcych |
| **3%** | Działalność gastronomiczna, handel detaliczny artykułami spożywczymi |
| **5,5%** | Działalność wytwórcza, roboty budowlane |
| **8,5%** | Usługi (większość), najem prywatny do 100 000 zł |
| **10%** | Najem powyżej 100 000 zł |
| **12%** | Usługi IT (programowanie, systemy komputerowe) |
| **12%** | Pośrednictwo w sprzedaży hurtowej |
| **14%** | Wolne zawody: lekarze, dentyści, weterynarz, fizjoterapeuci |
| **15%** | Pośrednictwo handlowe i finansowe |
| **17%** | Wolne zawody: adwokaci, notariusze, radcy prawni, doradcy podatkowi |

## Popularne PKD i ich stawki

**Programiści i IT:**
- 62.01.Z (Oprogramowanie) → **12%**
- 62.02.Z (Doradztwo IT) → **12%**
- 63.11.Z (Hosting) → **8,5%**

**Freelancerzy i twórcy:**
- 73.11.Z (Agencja reklamowa) → **8,5%**
- 74.10.Z (Projektowanie graficzne) → **8,5%**
- 59.11.Z (Produkcja filmowa) → **8,5%**

**Handel:**
- 47.xx (Handel detaliczny) → **3%** lub **5,5%**

## Jak sprawdzić swoją stawkę?

1. Znajdź swój kod PKD w CEIDG
2. Sprawdź w Załączniku nr 2 do Ustawy o ryczałcie (lub na podatki.gov.pl)
3. Jeśli prowadzisz różne rodzaje działalności — każda może mieć inną stawkę

**💡 Wskazówka:** Ryczałt nie opłaca się gdy koszty firmowe przekraczają 30-40% przychodu. Przy niskich kosztach (usługi intelektualne) bywa bardzo korzystny.`,
    quizQuestions: [
      {
        question: 'Jaka stawka ryczałtu obowiązuje typowo programistę (PKD 62.01.Z)?',
        answers: [
          { text: '12%', isCorrect: true },
          { text: '8,5%', isCorrect: false },
          { text: '17%', isCorrect: false },
          { text: '5,5%', isCorrect: false },
        ],
        explanation: 'Działalność związana z oprogramowaniem (PKD 62.01.Z) objęta jest stawką ryczałtu 12%.',
        sortOrder: 1,
      },
      {
        question: 'Ryczałt naliczany jest od:',
        answers: [
          { text: 'Przychodu — bez możliwości odliczania kosztów', isCorrect: true },
          { text: 'Dochodu po odliczeniu kosztów', isCorrect: false },
          { text: 'Zysku netto po opodatkowaniu', isCorrect: false },
          { text: 'Wartości sprzedanych towarów', isCorrect: false },
        ],
        explanation: 'W ryczałcie podstawą opodatkowania jest przychód — nie można odliczać żadnych kosztów firmowych.',
        sortOrder: 2,
      },
      {
        question: 'Kiedy ryczałt jest szczególnie korzystny?',
        answers: [
          { text: 'Gdy koszty firmowe są niskie (poniżej 20-30% przychodu)', isCorrect: true },
          { text: 'Gdy koszty firmowe są wysokie', isCorrect: false },
          { text: 'Zawsze jest najkorzystniejszy', isCorrect: false },
          { text: 'Tylko przy przychodach powyżej 500 000 zł', isCorrect: false },
        ],
        explanation: 'Ryczałt jest korzystny przy niskich kosztach — gdy nie masz dużo do odliczenia, płacenie podatku od przychodu może być tańsze niż inne formy.',
        sortOrder: 3,
      },
    ],
  },
  {
    categorySlug: 'prawo-podatkowe',
    slug: 'skala-podatkowa-2026',
    title: 'Skala podatkowa w 2026 — progi, kwota wolna, ulgi',
    summary: 'Aktualne stawki i progi podatkowe, kwota wolna 30 000 zł oraz najważniejsze ulgi dostępne na skali.',
    taxFormFilter: ['SKALA'],
    readTimeMinutes: 5,
    legalSource: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19910800350',
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Skala podatkowa 2026 — parametry

### Progi i stawki:

| Podstawa opodatkowania | Stawka |
|------------------------|--------|
| Do 120 000 zł | **12%** |
| Powyżej 120 000 zł | **32%** od nadwyżki |

### Kwota wolna od podatku: **30 000 zł**

Oznacza to, że od dochodu do 30 000 zł nie płacisz podatku. Podatek zaczyna się od 30 001 zł.

### Kwota zmniejszająca podatek: **3 600 zł** rocznie

Zamiast odliczać kwotę wolną od dochodu, od obliczonego podatku odejmuje się 3 600 zł (12% × 30 000 zł).

## Jak obliczyć podatek (przykład)?

Dochód roczny: **80 000 zł**

1. Podatek: 80 000 × 12% = 9 600 zł
2. Minus kwota zmniejszająca: -3 600 zł
3. **Podatek do zapłaty: 6 000 zł**
4. Efektywna stopa: 6 000 / 80 000 = **7,5%**

## Dostępne ulgi na skali podatkowej

- **Ulga prorodzinna** — 1 112,04 zł rocznie na pierwsze dziecko
- **Ulga rehabilitacyjna** — na osoby z niepełnosprawnością
- **Ulga internetowa** — 760 zł rocznie (przez 2 lata)
- **Ulga B+R** — odliczenie kosztów badań i rozwoju
- **Ulga na robotyzację** — 50% kosztów robotyzacji
- **Ulga dla powracających z zagranicy** — 4 lata zwolnienia

## Wspólne rozliczenie z małżonkiem

Jeśli małżonek nie pracuje lub zarabia mało, możecie rozliczyć się wspólnie — de facto podwoić kwotę wolną i uniknąć 32% podatku.

**💡 Wskazówka:** Skala podatkowa jest najkorzystniejsza przy dochodach do ok. 120 000 zł rocznie i gdy chcesz korzystać z ulg podatkowych.`,
    quizQuestions: [
      {
        question: 'Jaka stawka PIT obowiązuje na skali dla dochodu do 120 000 zł w 2026 roku?',
        answers: [
          { text: '12%', isCorrect: true },
          { text: '19%', isCorrect: false },
          { text: '32%', isCorrect: false },
          { text: '17%', isCorrect: false },
        ],
        explanation: 'Na skali podatkowej obowiązują dwie stawki: 12% do 120 000 zł i 32% od nadwyżki powyżej tego progu.',
        sortOrder: 1,
      },
      {
        question: 'Ile wynosi kwota wolna od podatku na skali w 2026 roku?',
        answers: [
          { text: '30 000 zł', isCorrect: true },
          { text: '8 000 zł', isCorrect: false },
          { text: '15 000 zł', isCorrect: false },
          { text: '50 000 zł', isCorrect: false },
        ],
        explanation: 'Kwota wolna od podatku wynosi 30 000 zł. Od dochodów do tej kwoty nie płacisz PIT.',
        sortOrder: 2,
      },
      {
        question: 'Kto może rozliczyć się wspólnie z małżonkiem na skali podatkowej?',
        answers: [
          { text: 'Podatnicy na skali podatkowej', isCorrect: true },
          { text: 'Podatnicy na podatku liniowym', isCorrect: false },
          { text: 'Podatnicy na ryczałcie', isCorrect: false },
          { text: 'Wszyscy przedsiębiorcy bez wyjątku', isCorrect: false },
        ],
        explanation: 'Wspólne rozliczenie z małżonkiem dostępne jest wyłącznie dla podatników rozliczających się na skali podatkowej. Podatek liniowy i ryczałt nie dają tej możliwości.',
        sortOrder: 3,
      },
    ],
  },
  {
    categorySlug: 'prawo-podatkowe',
    slug: 'terminy-podatkowe-jdg',
    title: 'Terminy podatkowe w kalendarzu JDG — ściągawka',
    summary: 'Wszystkie kluczowe terminy podatkowe i ZUS zebrane w jednym miejscu. Nie przegap żadnego deadlinu.',
    taxFormFilter: ['ALL'],
    readTimeMinutes: 4,
    legalSource: null,
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Kluczowe terminy dla JDG

Oto kompletna ściągawka terminów, które musisz znać prowadząc JDG. Zapisz je w kalendarzu i ustaw przypomnienia!

## Terminy miesięczne (każdego miesiąca)

| Do kiedy | Co |
|----------|----|
| **7. dnia** | Składki ZUS za poprzedni miesiąc (osoby fizyczne bez pracowników) |
| **15. dnia** | Składki ZUS za poprzedni miesiąc (z pracownikami — od wynagrodzeń) |
| **20. dnia** | Zaliczka na PIT (skala / liniowy) |
| **25. dnia** | Deklaracja i zapłata VAT-7 |
| **25. dnia** | JPK_V7M — miesięczny plik JPK dla VAT |

## Terminy kwartalne

| Do kiedy | Co |
|----------|----|
| **20 IV, 20 VII, 20 X, 20 I** | Zaliczka kwartalna na PIT |
| **25 IV, 25 VII, 25 X, 25 I** | VAT-7K — kwartalna deklaracja VAT |

## Terminy roczne

| Do kiedy | Co |
|----------|----|
| **20 lutego** | Zgłoszenie zmiany formy opodatkowania |
| **30 kwietnia** | PIT-36 (skala), PIT-36L (liniowy), PIT-28 (ryczałt) |
| **31 maja** | PIT-28 dla ryczałtu (nowy termin od 2023) |

**Uwaga:** PIT-28 składa się do 30 kwietnia. Sprawdź aktualny termin w roku rozliczenia.

## Kiedy termin wypada w weekend lub święto?

Jeśli termin przypada na sobotę, niedzielę lub dzień wolny — przesuwa się automatycznie na następny dzień roboczy.

## Jak nie przegapić terminów?

1. **FINERA** wyświetla nadchodzące terminy w widżecie "Do zapłaty"
2. Ustaw przypomnienia w kalendarzu (co miesiąc, 3 dni przed terminem)
3. Aktywuj powiadomienia push w aplikacji

**💡 Wskazówka:** Najczęstszy błąd nowych przedsiębiorców to zapomnienie o składkach ZUS (termin 7. lub 15. — inny niż podatki!).`,
    quizQuestions: [
      {
        question: 'Do kiedy osoba fizyczna bez pracowników musi zapłacić składki ZUS za dany miesiąc?',
        answers: [
          { text: 'Do 7. dnia następnego miesiąca', isCorrect: true },
          { text: 'Do 20. dnia następnego miesiąca', isCorrect: false },
          { text: 'Do 25. dnia następnego miesiąca', isCorrect: false },
          { text: 'Do ostatniego dnia miesiąca', isCorrect: false },
        ],
        explanation: 'Osoby fizyczne prowadzące JDG bez pracowników opłacają składki ZUS do 7. dnia następnego miesiąca.',
        sortOrder: 1,
      },
      {
        question: 'Do kiedy należy złożyć roczne zeznanie PIT-36 (skala podatkowa)?',
        answers: [
          { text: 'Do 30 kwietnia', isCorrect: true },
          { text: 'Do 31 marca', isCorrect: false },
          { text: 'Do 30 czerwca', isCorrect: false },
          { text: 'Do 31 maja', isCorrect: false },
        ],
        explanation: 'Roczne zeznanie PIT-36 (skala) i PIT-36L (liniowy) składa się do 30 kwietnia roku następującego po roku podatkowym.',
        sortOrder: 2,
      },
      {
        question: 'Co się dzieje gdy termin płatności podatku wypada w niedzielę?',
        answers: [
          { text: 'Przesuwa się na następny dzień roboczy (poniedziałek)', isCorrect: true },
          { text: 'Musisz zapłacić w piątek przed terminem', isCorrect: false },
          { text: 'Termin nie ulega zmianie — płacisz w sobotę', isCorrect: false },
          { text: 'Musisz złożyć wniosek o odroczenie', isCorrect: false },
        ],
        explanation: 'Gdy termin podatkowy wypada w dzień wolny od pracy, automatycznie przesuwa się na najbliższy dzień roboczy. Nie musisz składać żadnych wniosków.',
        sortOrder: 3,
      },
    ],
  },
  // ── ZUS I SKŁADKI ─────────────────────────────────────────────────────
  {
    categorySlug: 'zus-i-skladki',
    slug: 'maly-zus-plus',
    title: 'Mały ZUS Plus — kto może, jak długo, jak obliczyć',
    summary: 'Składki ZUS liczone od realnego dochodu dla małych firm. Warunki, limity i sposób obliczenia w 2026 roku.',
    taxFormFilter: ['ALL'],
    readTimeMinutes: 5,
    legalSource: 'https://www.zus.pl/firmy/przedsiebiorca-w-zus/ulgi-dla-przedsiebiorcow/maly-zus-plus',
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Mały ZUS Plus — na czym polega?

Mały ZUS Plus to ulga umożliwiająca opłacanie składek na ubezpieczenie społeczne od podstawy odpowiadającej **faktycznemu dochodowi** z działalności, a nie standardowej podstawie wymiaru (~5 194 zł w 2026).

## Kto może skorzystać?

Warunki:
1. **Przychód z działalności** w poprzednim roku **nie przekroczył 120 000 zł**
2. Prowadziłeś działalność przez **co najmniej 60 dni** w poprzednim roku
3. Nie korzystałeś z preferencyjnego ZUS (30% minimum) w poprzednim roku
4. Nie rozliczasz się w formie **karty podatkowej**

## Jak długo można korzystać?

Mały ZUS Plus można stosować przez **36 miesięcy** (3 lata) w ciągu kolejnych 60 miesięcy (5 lat). Po wyczerpaniu limitu — przerwa na min. 2 lata, potem można znowu.

## Jak obliczyć podstawę składek?

Podstawa = **50% przeciętnego miesięcznego dochodu** z działalności w poprzednim roku.

**Wzór:**
\`\`\`
Dochód roczny / liczba dni działalności × 30
\`\`\`

Wynik to miesięczny dochód. Podstawa składek = 50% tej wartości.

**Minimalna podstawa:** 30% minimalnego wynagrodzenia
**Maksymalna podstawa:** 60% prognozowanego wynagrodzenia

## Kiedy zgłosić?

- Przy wznowieniu działalności po przerwie
- W ciągu **31 dni od końca roku** poprzedniego (jeśli działalność trwała)
- Zmiana zgłoszenia: formularz ZUS ZUA lub ZUS ZZA

**💡 Wskazówka:** Przy dochodzie rocznym 60 000 zł oszczędność na składkach vs pełny ZUS może wynieść 400–600 zł miesięcznie.`,
    quizQuestions: [
      {
        question: 'Jaki był maksymalny przychód za poprzedni rok uprawniający do Małego ZUS Plus?',
        answers: [
          { text: '120 000 zł', isCorrect: true },
          { text: '200 000 zł', isCorrect: false },
          { text: '60 000 zł', isCorrect: false },
          { text: '500 000 zł', isCorrect: false },
        ],
        explanation: 'Mały ZUS Plus przysługuje gdy przychody z działalności w poprzednim roku nie przekroczyły 120 000 zł.',
        sortOrder: 1,
      },
      {
        question: 'Przez ile miesięcy można korzystać z Małego ZUS Plus?',
        answers: [
          { text: '36 miesięcy w ciągu 60 miesięcy', isCorrect: true },
          { text: '24 miesiące bez ograniczeń', isCorrect: false },
          { text: '12 miesięcy rocznie', isCorrect: false },
          { text: 'Bezterminowo przy spełnieniu warunków', isCorrect: false },
        ],
        explanation: 'Mały ZUS Plus można stosować przez 36 miesięcy (3 lata) w ramach 60-miesięcznego (5-letniego) okna. Po wyczerpaniu limitu wymagana jest przerwa.',
        sortOrder: 2,
      },
      {
        question: 'Jaki procent dochodu stanowi podstawa składek przy Małym ZUS Plus?',
        answers: [
          { text: '50% przeciętnego miesięcznego dochodu', isCorrect: true },
          { text: '30% dochodu rocznego', isCorrect: false },
          { text: '100% dochodu miesięcznego', isCorrect: false },
          { text: '60% minimalnego wynagrodzenia', isCorrect: false },
        ],
        explanation: 'Podstawę składek przy Małym ZUS Plus stanowi 50% przeciętnego miesięcznego dochodu z działalności w poprzednim roku.',
        sortOrder: 3,
      },
    ],
  },
  {
    categorySlug: 'zus-i-skladki',
    slug: 'skladka-zdrowotna-2026',
    title: 'Składka zdrowotna w 2026 — różnice między formami opodatkowania',
    summary: 'Jak liczy się składka zdrowotna ZUS na skali, liniowym i ryczałcie? Zasady i progi w 2026 roku.',
    taxFormFilter: ['ALL'],
    readTimeMinutes: 5,
    legalSource: null,
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Składka zdrowotna — przegląd 2026

Składka zdrowotna to obowiązkowa składka ZUS opłacana przez wszystkich przedsiębiorców. Od 2022 roku jej wysokość zależy od formy opodatkowania i dochodu.

## Skala podatkowa — 9% dochodu

Składka = **9% miesięcznego dochodu** z działalności.

**Minimalna składka:** ok. 381,78 zł miesięcznie (9% × 50% minimalnego wynagrodzenia — szacunek 2026).

Nie można jej odliczyć od podatku (w przeciwieństwie do składek społecznych).

## Podatek liniowy — 4,9% dochodu

Składka = **4,9% miesięcznego dochodu**.

**Minimalna składka:** ok. 381,78 zł miesięcznie.

Przy podatku liniowym możesz odliczyć część składki zdrowotnej od dochodu (do limitu ustawowego).

## Ryczałt — kwoty ryczałtowe zależne od przychodu

Trzy progi przychodów rocznych:

| Przychód roczny | Miesięczna składka zdrowotna |
|-----------------|------------------------------|
| Do 60 000 zł | **419,46 zł** |
| 60 001–300 000 zł | **699,11 zł** |
| Powyżej 300 000 zł | **1 258,39 zł** |

Na ryczałcie składka jest stała — nie zależy od faktycznego dochodu miesięcznego.

## Kiedy płacić?

Składkę zdrowotną wpłacasz do **20. dnia następnego miesiąca** na indywidualny rachunek ZUS.

## Roczne rozliczenie składki zdrowotnej

Do **30 maja** każdego roku składasz **ZUS DRA** z rocznym rozliczeniem składki zdrowotnej. Jeśli wpłaciłeś za dużo — nadpłata wraca. Za mało — dopłacasz różnicę.

**💡 Wskazówka:** Przy ryczałcie z przychodem blisko progu (60 000 lub 300 000 zł) warto planować, by nie przekroczyć progu tuż przed końcem roku.`,
    quizQuestions: [
      {
        question: 'Ile wynosi składka zdrowotna przy podatku liniowym?',
        answers: [
          { text: '4,9% dochodu miesięcznego', isCorrect: true },
          { text: '9% dochodu miesięcznego', isCorrect: false },
          { text: 'Stała kwota jak w ryczałcie', isCorrect: false },
          { text: '2% przychodu', isCorrect: false },
        ],
        explanation: 'Przy podatku liniowym składka zdrowotna wynosi 4,9% miesięcznego dochodu. Jest niższa niż na skali (9%), co jest jedną z korzyści podatku liniowego.',
        sortOrder: 1,
      },
      {
        question: 'Jaka jest miesięczna składka zdrowotna na ryczałcie przy przychodach do 60 000 zł rocznie?',
        answers: [
          { text: '419,46 zł', isCorrect: true },
          { text: '699,11 zł', isCorrect: false },
          { text: '9% dochodu', isCorrect: false },
          { text: '381,78 zł', isCorrect: false },
        ],
        explanation: 'Na ryczałcie przy przychodach do 60 000 zł rocznie składka zdrowotna wynosi 419,46 zł miesięcznie (wartość 2026).',
        sortOrder: 2,
      },
      {
        question: 'Do kiedy należy złożyć roczne rozliczenie składki zdrowotnej (ZUS DRA)?',
        answers: [
          { text: 'Do 30 maja', isCorrect: true },
          { text: 'Do 30 kwietnia', isCorrect: false },
          { text: 'Do 31 marca', isCorrect: false },
          { text: 'Do 20 lutego', isCorrect: false },
        ],
        explanation: 'Roczne rozliczenie składki zdrowotnej w formularzu ZUS DRA składa się do 30 maja.',
        sortOrder: 3,
      },
    ],
  },
  {
    categorySlug: 'zus-i-skladki',
    slug: 'zawieszenie-dzialalnosci-zus',
    title: 'Zawieszenie działalności a ZUS — co się zmienia',
    summary: 'Jak zawieszenie JDG wpływa na składki ZUS? Kiedy możesz zawiesić, jak to zrobić i co musisz wiedzieć.',
    taxFormFilter: ['ALL'],
    readTimeMinutes: 4,
    legalSource: null,
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Zawieszenie działalności — podstawy

Każdy przedsiębiorca może zawiesić JDG na okres od **30 dni do 24 miesięcy**. W tym czasie nie możesz wykonywać działalności ani osiągać przychodów z niej (możesz przyjmować należności za wcześniej wykonane usługi).

## Jak zawiesić działalność?

Zawieszenie zgłaszasz w **CEIDG online** — formularz CEIDG-1 z zaznaczeniem opcji zawieszenia. Podajesz datę zawieszenia i czas trwania (lub "bezterminowo" do 24 miesięcy).

## Składki ZUS podczas zawieszenia

**Dobre wiadomości:** Podczas zawieszenia działalności **nie płacisz składek społecznych ZUS** (emerytalnej, rentowej, chorobowej, wypadkowej).

**Składka zdrowotna:** Przez pierwsze **30 dni** zawieszenia nadal płacisz składkę zdrowotną. Powyżej 30 dni — zwolnienie ze składki zdrowotnej.

**Brak ubezpieczenia zdrowotnego:** Po przekroczeniu 30 dni zawieszenia tracisz prawo do bezpłatnej opieki zdrowotnej NFZ. Możesz:
- Ubezpieczyć się jako współmałżonek osoby ubezpieczonej
- Wykupić dobrowolne ubezpieczenie zdrowotne
- Zarejestrować się w urzędzie pracy

## Składki za miesiąc zawieszenia

ZUS nalicza składki proporcjonalnie:
- Zawieszasz 15. dnia miesiąca → płacisz za połowę miesiąca
- Zawieszasz 1. dnia → nie płacisz za ten miesiąc

## Wznowienie działalności

Wznowienie zgłaszasz w CEIDG. Możesz to zrobić w dowolnym momencie przed upływem 24 miesięcy. Po 24 miesiącach działalność jest wykreślana automatycznie.

**💡 Wskazówka:** Zawieszenie jest dobrą opcją przy dłuższym urlopie, chorobie lub przestoju w pracy. Lepsze niż wyrejestrowanie jeśli planujesz wrócić.`,
    quizQuestions: [
      {
        question: 'Jak długo można maksymalnie zawiesić JDG?',
        answers: [
          { text: '24 miesiące', isCorrect: true },
          { text: '12 miesięcy', isCorrect: false },
          { text: '6 miesięcy', isCorrect: false },
          { text: 'Bezterminowo', isCorrect: false },
        ],
        explanation: 'Maksymalny czas zawieszenia JDG wynosi 24 miesiące. Po tym czasie działalność jest automatycznie wykreślana z CEIDG.',
        sortOrder: 1,
      },
      {
        question: 'Przez ile dni zawieszenia nadal musisz płacić składkę zdrowotną?',
        answers: [
          { text: 'Przez pierwsze 30 dni', isCorrect: true },
          { text: 'Przez pierwsze 7 dni', isCorrect: false },
          { text: 'Przez cały czas zawieszenia', isCorrect: false },
          { text: 'W ogóle nie — zawieszenie zwalnia ze wszystkich składek', isCorrect: false },
        ],
        explanation: 'Przez pierwsze 30 dni zawieszenia nadal płacisz składkę zdrowotną. Po tym czasie jesteś zwolniony, ale tracisz prawo do bezpłatnej opieki zdrowotnej NFZ.',
        sortOrder: 2,
      },
      {
        question: 'Gdzie zgłasza się zawieszenie działalności?',
        answers: [
          { text: 'W CEIDG (przez internet lub osobiście)', isCorrect: true },
          { text: 'W ZUS', isCorrect: false },
          { text: 'W urzędzie skarbowym', isCorrect: false },
          { text: 'We wszystkich urzędach jednocześnie', isCorrect: false },
        ],
        explanation: 'Zawieszenie działalności zgłaszasz w CEIDG. Informacja automatycznie trafia do ZUS i urzędu skarbowego.',
        sortOrder: 3,
      },
    ],
  },
  {
    categorySlug: 'zus-i-skladki',
    slug: 'zus-etat-i-dzialalnosc',
    title: 'ZUS a etat równolegle — zasady zbiegu tytułów ubezpieczenia',
    summary: 'Pracujesz na etacie i prowadzisz JDG? Sprawdź kiedy płacisz ZUS z obu tytułów, a kiedy tylko z jednego.',
    taxFormFilter: ['ALL'],
    readTimeMinutes: 4,
    legalSource: null,
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Etat + JDG — zasada zbiegu tytułów

Jeśli pracujesz na umowie o pracę i jednocześnie prowadzisz JDG, masz dwa tytuły do ubezpieczenia. ZUS stosuje tzw. **zbieg tytułów ubezpieczenia** — zasady, które określają, z których tytułów płacisz składki.

## Kiedy możesz nie płacić składek ZUS z JDG?

Możesz być zwolniony ze składek społecznych z działalności gdy wynagrodzenie z etatu jest **co najmniej równe minimalnemu wynagrodzeniu** (4 666 zł brutto w 2026).

**Warunek:** Pracodawca odprowadza za Ciebie pełne składki ZUS od wynagrodzenia ≥ minimalne.

W takim przypadku z JDG płacisz **tylko składkę zdrowotną** — nie płacisz składek społecznych.

## Kiedy płacisz ZUS z obu tytułów?

Musisz opłacać składki z działalności gdy:
- Wynagrodzenie z etatu jest **niższe niż minimalne** wynagrodzenie
- Pracujesz na **niepełny etat** (np. 1/2 etatu) i wynagrodzenie jest proporcjonalnie niższe
- Jesteś na urlopie bezpłatnym

## Składka zdrowotna — zawsze obowiązkowa

Niezależnie od etatu, jeśli prowadzisz JDG — **zawsze płacisz składkę zdrowotną** z działalności. Nie możesz jej uniknąć poprzez wynagrodzenie z etatu.

## Jak to zgłosić?

Przy rejestracji JDG w ZUS (formularz ZUS ZZA dla ubezpieczenia tylko zdrowotnego) lub ZUS ZUA (pełne ubezpieczenie) poinformujesz o tytule z etatu.

**💡 Wskazówka:** Etat + JDG to popularne połączenie dla freelancerów budujących swoją markę. Przy wynagrodzeniu ≥ minimalne oszczędzasz 1 000–1 700 zł miesięcznie na składkach społecznych.`,
    quizQuestions: [
      {
        question: 'Kiedy pracownik na etacie prowadzący JDG nie musi płacić składek społecznych z działalności?',
        answers: [
          { text: 'Gdy wynagrodzenie z etatu jest co najmniej równe minimalnemu wynagrodzeniu', isCorrect: true },
          { text: 'Nigdy — zawsze musi płacić z obu tytułów', isCorrect: false },
          { text: 'Gdy pracuje na pełny etat (niezależnie od wynagrodzenia)', isCorrect: false },
          { text: 'Gdy JDG generuje przychody poniżej 50 000 zł rocznie', isCorrect: false },
        ],
        explanation: 'Zwolnienie ze składek społecznych ZUS z JDG przysługuje gdy wynagrodzenie z umowy o pracę wynosi co najmniej tyle, ile minimalne wynagrodzenie.',
        sortOrder: 1,
      },
      {
        question: 'Czy przy etacie z wynagrodzeniem ≥ minimalne można uniknąć składki zdrowotnej z JDG?',
        answers: [
          { text: 'Nie — składka zdrowotna z JDG jest zawsze obowiązkowa', isCorrect: true },
          { text: 'Tak — etat zwalnia z wszystkich składek ZUS', isCorrect: false },
          { text: 'Tak, jeśli pracodawca odprowadza składkę zdrowotną powyżej minimum', isCorrect: false },
          { text: 'Zależy od formy opodatkowania działalności', isCorrect: false },
        ],
        explanation: 'Składka zdrowotna z tytułu prowadzenia JDG jest zawsze obowiązkowa, niezależnie od wynagrodzenia z etatu.',
        sortOrder: 2,
      },
      {
        question: 'Który formularz ZUS składa się gdy płaci się tylko składkę zdrowotną z JDG (etat ≥ minimalne)?',
        answers: [
          { text: 'ZUS ZZA', isCorrect: true },
          { text: 'ZUS ZUA', isCorrect: false },
          { text: 'ZUS DRA', isCorrect: false },
          { text: 'ZUS RCA', isCorrect: false },
        ],
        explanation: 'Formularz ZUS ZZA służy do zgłoszenia do ubezpieczenia wyłącznie zdrowotnego. ZUS ZUA to zgłoszenie do pełnego ubezpieczenia (społeczne + zdrowotne).',
        sortOrder: 3,
      },
    ],
  },
  {
    categorySlug: 'zus-i-skladki',
    slug: 'dobrowolne-ubezpieczenie-chorobowe',
    title: 'Dobrowolne ubezpieczenie chorobowe — czy warto dla solopreneura',
    summary: 'Zasiłek chorobowy i macierzyński dla przedsiębiorców. Ile kosztuje ubezpieczenie i kiedy się opłaca.',
    taxFormFilter: ['ALL'],
    readTimeMinutes: 4,
    legalSource: null,
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Ubezpieczenie chorobowe — dobrowolne dla JDG

Przedsiębiorcy nie mają obowiązku opłacania składki chorobowej. To ubezpieczenie **dobrowolne**, ale daje ważne uprawnienia.

## Co daje ubezpieczenie chorobowe?

- **Zasiłek chorobowy** — gdy zachorujesz i nie możesz pracować
- **Zasiłek macierzyński** — dla mam i tatusiów prowadzących JDG
- **Świadczenie rehabilitacyjne** — po wyczerpaniu zasiłku chorobowego (max 182 dni)
- **Zasiłek opiekuńczy** — gdy opiekujesz się chorym dzieckiem

## Ile kosztuje składka chorobowa?

Składka chorobowa = **2,45% podstawy wymiaru składek**.

W 2026 przy standardowej podstawie (~5 194 zł): ok. **127 zł miesięcznie**.

## Jak długo czekasz na zasiłek?

Musisz być ubezpieczony przez **90 dni** zanim nabędziesz prawo do zasiłku chorobowego. Wyjątek: wypadek przy pracy — prawo od pierwszego dnia.

## Wysokość zasiłku chorobowego

Zasiłek = **80% podstawy wymiaru** za każdy dzień choroby.

Podstawa = przeciętne miesięczne wynagrodzenie z ostatnich 12 miesięcy lub krócej jeśli ubezpieczony krócej.

Przy pełnej podstawie (5 194 zł) zasiłek to ok. **138 zł dziennie** (80% × 5 194 / 30).

## Kiedy warto się ubezpieczyć?

**Zdecydowanie warto gdy:**
- Planujesz ciążę lub jesteś w ciąży
- Masz problemy zdrowotne i ryzyko dłuższej choroby
- Pracujesz w zawodzie z ryzykiem wypadku

**Mniej opłacalne gdy:**
- Rzadko chorujesz i masz oszczędności na wypadek przerwy
- Korzystasz z preferencyjnego ZUS (niższa podstawa = niższy zasiłek)

**💡 Wskazówka:** Ubezpieczenie chorobowe jest szczególnie cenne dla kobiet planujących macierzyński — zasiłek macierzyński trwa 52 tygodnie i może wynieść kilkadziesiąt tysięcy złotych.`,
    quizQuestions: [
      {
        question: 'Czy ubezpieczenie chorobowe jest obowiązkowe dla przedsiębiorcy?',
        answers: [
          { text: 'Nie — jest dobrowolne', isCorrect: true },
          { text: 'Tak — jak wszystkie inne składki ZUS', isCorrect: false },
          { text: 'Zależy od formy opodatkowania', isCorrect: false },
          { text: 'Tak, ale tylko powyżej określonego przychodu', isCorrect: false },
        ],
        explanation: 'Ubezpieczenie chorobowe dla przedsiębiorców jest dobrowolne. W odróżnieniu od składek emerytalnej, rentowej i wypadkowej — sam decydujesz czy chcesz się ubezpieczyć.',
        sortOrder: 1,
      },
      {
        question: 'Ile wynosi składka chorobowa jako procent podstawy wymiaru?',
        answers: [
          { text: '2,45%', isCorrect: true },
          { text: '9%', isCorrect: false },
          { text: '4,9%', isCorrect: false },
          { text: '8%', isCorrect: false },
        ],
        explanation: 'Składka chorobowa wynosi 2,45% podstawy wymiaru składek.',
        sortOrder: 2,
      },
      {
        question: 'Przez ile dni musisz być ubezpieczony zanim nabędziesz prawo do zasiłku chorobowego?',
        answers: [
          { text: '90 dni', isCorrect: true },
          { text: '30 dni', isCorrect: false },
          { text: '180 dni', isCorrect: false },
          { text: 'Od pierwszego dnia ubezpieczenia', isCorrect: false },
        ],
        explanation: 'Okres wyczekiwania na zasiłek chorobowy wynosi 90 dni ubezpieczenia. Wyjątkiem są wypadki przy pracy — tam prawo do zasiłku przysługuje od pierwszego dnia.',
        sortOrder: 3,
      },
    ],
  },
  // ── KOSZTY FIRMOWE ────────────────────────────────────────────────────
  {
    categorySlug: 'koszty-firmowe',
    slug: 'co-mozna-wliczyc-w-koszty',
    title: 'Co można wliczyć w koszty — ogólne zasady',
    summary: 'Definicja kosztu firmowego, kluczowe zasady i najczęstsze wydatki uznawane za koszty JDG.',
    taxFormFilter: ['SKALA', 'LINIOWY'],
    readTimeMinutes: 5,
    legalSource: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19910800350',
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Definicja kosztu uzyskania przychodu

Koszt firmowy (KUP — koszt uzyskania przychodu) to wydatek **poniesiony w celu osiągnięcia przychodów lub zachowania/zabezpieczenia źródła przychodów**, który nie jest wyraźnie wyłączony z kosztów przez przepisy.

Kluczowe pytania przy ocenie wydatku:
1. Czy jest związany z prowadzoną działalnością?
2. Czy służy osiągnięciu lub zabezpieczeniu przychodów?
3. Czy jest właściwie udokumentowany?
4. Czy nie jest wyłączony przepisami?

## Wydatki powszechnie uznawane za koszty

**Biuro i wyposażenie:**
- Czynsz i media dla biura
- Meble, sprzęt biurowy
- Materiały biurowe (papier, tonery, itp.)

**Technologia i oprogramowanie:**
- Komputer, laptop, tablet, smartfon (do pracy)
- Licencje i subskrypcje software (Adobe, MS Office, itp.)
- Hosting, domeny, serwery

**Marketing i sprzedaż:**
- Reklama (Google Ads, social media)
- Strona internetowa, logo, materiały marketingowe
- Udział w targach i konferencjach

**Szkolenia i rozwój:**
- Kursy, szkolenia związane z działalnością
- Zakup książek i materiałów edukacyjnych
- Konferencje branżowe

**Transport:**
- Paliwo i koszty eksploatacji samochodu firmowego
- Bilety na komunikację (służbowe)
- Podróże służbowe

## Czego nie możesz zaliczyć do kosztów?

- **Grzywny i kary** (mandaty, kary administracyjne)
- **Składki na ubezpieczenie zdrowotne** (oddzielna ulga)
- **Prywatne wydatki** — ubrania (poza specjalistyczną odzieżą ochronną)
- **Wydatki na reprezentację w określonych przypadkach** (alkohol na spotkaniach)
- **Darowizny** (z nielicznymi wyjątkami)

**💡 Wskazówka:** Zawsze zachowuj dokumentację potwierdzającą cel biznesowy wydatku. Przy kontroli US możesz być zapytany dlaczego dany wydatek jest kosztem.`,
    quizQuestions: [
      {
        question: 'Jaki jest podstawowy warunek uznania wydatku za koszt firmowy?',
        answers: [
          { text: 'Musi być poniesiony w celu osiągnięcia lub zachowania przychodów', isCorrect: true },
          { text: 'Musi być powyżej 500 zł wartości', isCorrect: false },
          { text: 'Musi być potwierdzony fakturą VAT', isCorrect: false },
          { text: 'Musi być zapłacony kartą firmową', isCorrect: false },
        ],
        explanation: 'Podstawowy warunek to związek wydatku z osiąganiem lub zabezpieczeniem przychodów z działalności. Musi też być właściwie udokumentowany i nie może być wyraźnie wyłączony przepisami.',
        sortOrder: 1,
      },
      {
        question: 'Czy mandat drogowy za przekroczenie prędkości można zaliczyć do kosztów?',
        answers: [
          { text: 'Nie — kary i grzywny są wyraźnie wyłączone z kosztów', isCorrect: true },
          { text: 'Tak, jeśli auto jest używane do celów firmowych', isCorrect: false },
          { text: 'Tak, jeśli kwota nie przekracza 500 zł', isCorrect: false },
          { text: 'Zależy od formy opodatkowania', isCorrect: false },
        ],
        explanation: 'Grzywny i kary (w tym mandaty) są wyraźnie wyłączone z kosztów uzyskania przychodu przepisami ustawy o PIT — niezależnie od okoliczności.',
        sortOrder: 2,
      },
      {
        question: 'Czy zakup laptopa do pracy można zaliczyć do kosztów firmy?',
        answers: [
          { text: 'Tak, pod warunkiem że jest używany do działalności', isCorrect: true },
          { text: 'Tylko jeśli kosztuje powyżej 10 000 zł', isCorrect: false },
          { text: 'Nie — sprzęt elektroniczny nie jest kosztem', isCorrect: false },
          { text: 'Tylko jeśli jest na fakturę VAT', isCorrect: false },
        ],
        explanation: 'Laptop i inny sprzęt elektroniczny używany w działalności można zaliczyć do kosztów. Przy wartości do 10 000 zł — jednorazowo, powyżej — przez amortyzację.',
        sortOrder: 3,
      },
    ],
  },
  {
    categorySlug: 'koszty-firmowe',
    slug: 'praca-z-domu-koszty',
    title: 'Praca z domu jako JDG — jak legalnie rozliczyć część mieszkania',
    summary: 'Zasady rozliczania kosztów mieszkania w JDG. Proporcja powierzchni, czynsz, media i internet.',
    taxFormFilter: ['SKALA', 'LINIOWY'],
    readTimeMinutes: 5,
    legalSource: null,
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Praca z domu — koszty firmowe

Wielu freelancerów i solopreneur'ów pracuje z domu. Część kosztów utrzymania mieszkania można legalnie zaliczyć do kosztów firmy — ale z zachowaniem odpowiednich zasad.

## Metoda proporcjonalna — jak to liczyć?

Możesz zaliczyć do kosztów część wydatków mieszkaniowych **proporcjonalną do powierzchni używanej na cele firmowe**.

**Wzór:**
\`\`\`
Koszt firmowy = Wydatek całkowity × (m² firmowe / m² łączne)
\`\`\`

**Przykład:** Mieszkanie 80 m², biuro domowe 20 m²:
- Proporcja: 20/80 = **25%**
- Miesięczny czynsz 3 000 zł → 750 zł kosztu firmowego
- Prąd 400 zł → 100 zł kosztu firmowego

## Co można wliczyć?

- **Czynsz** — proporcjonalnie
- **Energia elektryczna** — proporcjonalnie lub w całości jeśli masz osobny licznik
- **Ogrzewanie** — proporcjonalnie
- **Internet** — w całości (jeśli używany wyłącznie lub głównie do pracy)
- **Ubezpieczenie mieszkania** — proporcjonalnie
- **Sprzątanie** — proporcjonalnie

## Dokumentacja

Musisz być w stanie udowodnić, że wydzielona powierzchnia **faktycznie służy celom firmowym**. Urząd skarbowy może zapytać:

1. Czy pomieszczenie jest dedykowane (nie sypialnią)?
2. Czy jest tam sprzęt firmowy?
3. Czy tam przyjmujesz klientów?

**Rejestracja adresu w CEIDG:** Wpisz swoje mieszkanie jako adres prowadzenia działalności — to potwierdza związek z działalnością.

## Ryzyko podatkowe

Urząd skarbowy bywa sceptyczny wobec rozliczania kosztów mieszkania, szczególnie przy wysokich proporcjach (>30%). Dokumentuj regularnie: zdjęcia biura, wykaz sprzętu, harmonogram pracy.

**💡 Wskazówka:** Zamiast rozliczać koszty mieszkania, wielu freelancerów woli prostsze rozwiązanie: koworking lub wynajem biurka — 100% kosztu, bez dyskusji z US.`,
    quizQuestions: [
      {
        question: 'Jak oblicza się część czynszu zaliczaną do kosztów firmy?',
        answers: [
          { text: 'Proporcjonalnie do powierzchni używanej na cele firmowe', isCorrect: true },
          { text: 'Zawsze 50% całego czynszu', isCorrect: false },
          { text: 'Cały czynsz jeśli mieszkanie jest zarejestrowane w CEIDG', isCorrect: false },
          { text: 'Nie można zaliczyć czynszu do kosztów', isCorrect: false },
        ],
        explanation: 'Koszt czynszu rozliczany jest proporcjonalnie — stosunek powierzchni używanej do działalności do łącznej powierzchni mieszkania.',
        sortOrder: 1,
      },
      {
        question: 'Czy koszt internetu domowego można w całości zaliczyć do kosztów firmy?',
        answers: [
          { text: 'Tak, jeśli używany głównie do działalności', isCorrect: true },
          { text: 'Nie — tylko proporcjonalnie jak inne koszty mieszkania', isCorrect: false },
          { text: 'Nie — internet domowy nigdy nie jest kosztem', isCorrect: false },
          { text: 'Tylko jeśli masz osobną umowę na internet firmowy', isCorrect: false },
        ],
        explanation: 'Internet używany głównie lub wyłącznie do działalności można zaliczyć do kosztów w całości. Kluczowy jest faktyczny cel użytkowania.',
        sortOrder: 2,
      },
      {
        question: 'Co zwiększa wiarygodność rozliczania kosztów biura domowego?',
        answers: [
          { text: 'Rejestracja adresu jako miejsce prowadzenia działalności w CEIDG', isCorrect: true },
          { text: 'Posiadanie konta firmowego w banku', isCorrect: false },
          { text: 'Opłacanie pełnego ZUS', isCorrect: false },
          { text: 'Rejestracja do VAT', isCorrect: false },
        ],
        explanation: 'Wpisanie adresu mieszkania jako miejsca prowadzenia działalności w CEIDG potwierdza związek z firmą i zwiększa wiarygodność rozliczania kosztów.',
        sortOrder: 3,
      },
    ],
  },
  {
    categorySlug: 'koszty-firmowe',
    slug: 'samochod-w-firmie',
    title: 'Samochód w firmie — własny vs leasing vs kilometrówka',
    summary: 'Trzy sposoby rozliczania samochodu w JDG. Który jest najkorzystniejszy i jakie są pułapki.',
    taxFormFilter: ['SKALA', 'LINIOWY'],
    readTimeMinutes: 6,
    legalSource: null,
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Trzy modele rozliczania samochodu

Samochód to jeden z najczęstszych i najbardziej skomplikowanych kosztów w JDG. Masz trzy podstawowe opcje.

## 1. Samochód prywatny — kilometrówka

Używasz prywatnego auta do celów firmowych i rozliczasz na podstawie **ewidencji przebiegu pojazdu (kilometrówki)**.

**Limit:** 0,8358 zł za km (stawka 2026 dla samochodów o pojemności do 900 cm³) lub 1,0385 zł za km (powyżej 900 cm³).

**Procedura:**
1. Prowadź ewidencję przebiegu: data, trasa, km, cel
2. Liczba km × stawka = koszt firmy
3. Limit roczny: stawka × limit km (w zależności od obszaru gminy)

**Zalety:** Proste, bez amortyzacji, bez ubezpieczenia firmowego
**Wady:** Limit kosztów, konieczność ewidencji, brak odliczenia VAT

## 2. Samochód firmowy (wprowadzony do ewidencji)

Wprowadzasz auto do środków trwałych i amortyzujesz. Możesz odliczać pełne koszty eksploatacji.

**Amortyzacja:** Samochody osobowe — stawka 20% rocznie. Przy wartości 50 000 zł → 10 000 zł rocznie.

**Koszty eksploatacyjne (100%):**
- Paliwo, oleje, serwis, opony
- Ubezpieczenie OC/AC/NNW
- Parking, autostrady

**VAT od wydatków:** Przy auto firmowym (tylko firmowe) odliczasz 100% VAT od paliwa i kosztów. Przy mieszanym użytku — 50% VAT.

## 3. Leasing operacyjny

Popularna opcja — raty leasingowe w całości jako koszt.

**Zalety:**
- Raty leasingowe = 100% kosztu firmowego
- Przy VAT — 50% lub 100% VAT od rat (zależnie od użytku)
- Nie amortyzujesz — prostsze

**Ograniczenie:** Limit kosztu dla leasingowanych aut osobowych = 150 000 zł wartości (225 000 zł dla elektryków).

## Porównanie (przykładowe auto 80 000 zł, 15 000 km/rok firmowych)

| Model | Koszt roczny w KUP |
|-------|-------------------|
| Kilometrówka | ~12 600 zł |
| Auto firmowe | ~22 000 zł (amortyzacja + eksploatacja) |
| Leasing (rata 1 800 zł) | ~21 600 zł |

**💡 Wskazówka:** Leasing lub auto firmowe opłaca się przy intensywnym użytkowaniu. Przy sporadycznych podróżach służbowych kilometrówka jest prostsza.`,
    quizQuestions: [
      {
        question: 'Czym jest "kilometrówka" w kontekście kosztów samochodu?',
        answers: [
          { text: 'Ewidencja przebiegu pojazdu pozwalająca rozliczyć prywatne auto w kosztach', isCorrect: true },
          { text: 'Rodzaj leasingu samochodu', isCorrect: false },
          { text: 'Metoda amortyzacji samochodów firmowych', isCorrect: false },
          { text: 'Formularz ZUS dla kierowców', isCorrect: false },
        ],
        explanation: 'Kilometrówka to ewidencja przebiegu pojazdu prywatnego używanego do celów służbowych. Na jej podstawie rozliczasz koszty w stawce za kilometr.',
        sortOrder: 1,
      },
      {
        question: 'Jaki procent VAT od paliwa można odliczyć przy samochodzie używanym mieszanie (firmowo-prywatnie)?',
        answers: [
          { text: '50%', isCorrect: true },
          { text: '100%', isCorrect: false },
          { text: '0% — brak odliczenia', isCorrect: false },
          { text: '75%', isCorrect: false },
        ],
        explanation: 'Przy samochodzie używanym w sposób mieszany (firmowo i prywatnie) odliczasz 50% VAT od paliwa i innych kosztów eksploatacyjnych.',
        sortOrder: 2,
      },
      {
        question: 'Jaka jest stawka amortyzacji samochodu osobowego wprowadzonego jako środek trwały?',
        answers: [
          { text: '20% rocznie', isCorrect: true },
          { text: '30% rocznie', isCorrect: false },
          { text: '100% jednorazowo', isCorrect: false },
          { text: '10% rocznie', isCorrect: false },
        ],
        explanation: 'Samochody osobowe amortyzowane są stawką 20% rocznie metodą liniową, co oznacza pełną amortyzację po 5 latach.',
        sortOrder: 3,
      },
    ],
  },
  {
    categorySlug: 'koszty-firmowe',
    slug: 'sprzet-oprogramowanie-subskrypcje',
    title: 'Sprzęt elektroniczny, oprogramowanie i subskrypcje — zasady odliczeń',
    summary: 'Laptopy, smartfony, Adobe, Spotify premium — co jest kosztem, a co nie. Amortyzacja vs jednorazowy koszt.',
    taxFormFilter: ['SKALA', 'LINIOWY'],
    readTimeMinutes: 4,
    legalSource: null,
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Sprzęt elektroniczny w kosztach

Komputery, smartfony, tablety, aparaty — to jedne z najczęstszych wydatków freelancerów. Oto zasady ich rozliczania.

## Próg 10 000 zł — kluczowa granica

- **Sprzęt do 10 000 zł netto** → jednorazowy koszt w miesiącu zakupu
- **Sprzęt powyżej 10 000 zł netto** → środek trwały, obowiązkowa amortyzacja

### Stawki amortyzacji sprzętu IT:
- Komputery, laptopy: **30% rocznie** (amortyzacja liniowa)
- Telefony: **30% rocznie**
- Drukarki, skanery: **20–30% rocznie**

## Przykłady jednorazowych kosztów

| Zakup | Wartość | Rozliczenie |
|-------|---------|-------------|
| Laptop do pracy | 4 500 zł | Jednorazowo w KUP |
| Smartfon firmowy | 3 000 zł | Jednorazowo w KUP |
| Monitor | 2 500 zł | Jednorazowo w KUP |
| Profesjonalny aparat | 15 000 zł | Amortyzacja 30% = 4 500 zł/rok |

## Oprogramowanie i licencje

**Oprogramowanie jako koszt:**
- Licencje wieczyste (np. Windows, Office) → jednorazowo lub amortyzacja WNiP
- Subskrypcje SaaS (Adobe CC, Figma, GitHub) → miesięczny/roczny koszt
- Narzędzia do pracy zdalnej (Zoom, Slack) → koszt

## Subskrypcje — kiedy są kosztem?

**Na pewno koszt:**
- Adobe Creative Cloud — dla grafika/projektanta
- Microsoft 365 — dla freelancera używającego Office
- Hosting, domeny — zawsze
- Narzędzia analityczne (Google Workspace, Notion)

**Ryzyko zakwestionowania:**
- Spotify, Netflix — tylko jeśli udowodnisz bezpośredni związek z pracą (np. podkłady muzyczne do filmów)
- Gry — raczej nie (chyba że recenzujesz gry)

**💡 Wskazówka:** Przy każdym zakupie sprzętu zachowaj fakturę i zapisz w ewidencji środków trwałych lub bezpośrednio w KPiR. Brak dokumentacji = brak kosztu.`,
    quizQuestions: [
      {
        question: 'Laptop za 6 000 zł zakupiony do pracy — jak rozliczysz go w kosztach?',
        answers: [
          { text: 'Jednorazowo jako koszt w miesiącu zakupu', isCorrect: true },
          { text: 'Przez amortyzację 30% rocznie', isCorrect: false },
          { text: 'Przez 5 lat równymi ratami', isCorrect: false },
          { text: 'Tylko jeśli jest wyłącznie firmowy', isCorrect: false },
        ],
        explanation: 'Sprzęt o wartości do 10 000 zł netto można zaliczyć jednorazowo do kosztów w miesiącu zakupu. Amortyzacja jest obowiązkowa dopiero powyżej tego progu.',
        sortOrder: 1,
      },
      {
        question: 'Miesięczna subskrypcja Adobe Creative Cloud dla grafika — czy jest kosztem?',
        answers: [
          { text: 'Tak — subskrypcje oprogramowania używanego do pracy są kosztem', isCorrect: true },
          { text: 'Nie — subskrypcje zawsze są kosztem prywatnym', isCorrect: false },
          { text: 'Tylko połowa kwoty', isCorrect: false },
          { text: 'Tylko jeśli jest to jedyna subskrypcja Adobe', isCorrect: false },
        ],
        explanation: 'Subskrypcje oprogramowania bezpośrednio związanego z działalnością (jak Adobe CC dla grafika) są w pełni kosztem firmowym.',
        sortOrder: 2,
      },
      {
        question: 'Jaka jest stawka amortyzacji komputera wprowadzonego jako środek trwały?',
        answers: [
          { text: '30% rocznie', isCorrect: true },
          { text: '20% rocznie', isCorrect: false },
          { text: '50% rocznie', isCorrect: false },
          { text: '100% jednorazowo', isCorrect: false },
        ],
        explanation: 'Komputery i laptopy amortyzowane są stawką 30% rocznie metodą liniową, co oznacza pełną amortyzację po ok. 3,5 roku.',
        sortOrder: 3,
      },
    ],
  },
  {
    categorySlug: 'koszty-firmowe',
    slug: 'reprezentacja-i-reklama',
    title: 'Reprezentacja i reklama — gdzie jest granica',
    summary: 'Kiedy wydatek na spotkanie z klientem jest kosztem, a kiedy ryzykowną reprezentacją? Praktyczne przykłady.',
    taxFormFilter: ['SKALA', 'LINIOWY'],
    readTimeMinutes: 4,
    legalSource: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19910800350',
    contentMdx: `> ⚠️ **Treść ma charakter edukacyjny.** Nie stanowi porady prawnej ani podatkowej.

## Reklama vs reprezentacja — kluczowa różnica

Prawo podatkowe odróżnia **reklamę** (koszt firmowy) od **reprezentacji** (nie jest kosztem). Granica jest często niejasna i bywa kwestionowana przez urzędy skarbowe.

## Reklama = koszt firmowy

Reklama to działania zmierzające do **promowania firmy, produktów lub usług** szerokiemu gronu potencjalnych klientów.

**Przykłady reklamy (koszty):**
- Google Ads, Facebook Ads, LinkedIn Ads
- Plakaty, ulotki, banery
- Strona www, SEO, content marketing
- Sponsoring publicznych wydarzeń z ekspozycją marki
- Gadżety z logo przekazywane klientom (długopisy, kubki)
- Katalogi, cenniki, próbki produktów

## Reprezentacja = NIE jest kosztem

Reprezentacja to działania mające na celu **kształtowanie dobrego wizerunku** wobec konkretnych partnerów biznesowych, ponad standard.

**Przykłady reprezentacji (nie są kosztem):**
- Drogie kolacje i lunche z klientami w restauracjach (kontrowersyjne)
- Alkohol na spotkaniach biznesowych — wyraźnie wyłączony
- Drogie prezenty dla klientów (powyżej symbolicznej wartości)
- Luksusowe eventy dla wybranych klientów bez elementu promocyjnego

## Szara strefa — catering i posiłki

Posiłki biznesowe to szara strefa. Ogólna zasada US:
- **Kawa na spotkaniu w biurze** → może być kosztem
- **Lunch roboczy gdzie omawia się projekt** → ryzykowne (YELLOW)
- **Kolacja w ekskluzywnej restauracji** → wysokie ryzyko zakwestionowania (RED)

## Jak dokumentować?

Przy każdym wydanym posiłku lub spotkaniu zapisuj:
- Cel spotkania (konkretny projekt/temat)
- Listę uczestników i ich firmę
- Wynik/rezultat spotkania

**💡 Wskazówka:** Kawa, herbata i przekąski na spotkaniu w biurze z klientem są zazwyczaj akceptowane jako koszt. Restauracja — zależy od kwoty i okoliczności. Alkohol — nigdy.`,
    quizQuestions: [
      {
        question: 'Czy koszt reklamy na Google Ads jest kosztem firmowym?',
        answers: [
          { text: 'Tak — reklama jest w pełni kosztem firmowym', isCorrect: true },
          { text: 'Nie — wydatki marketingowe to reprezentacja', isCorrect: false },
          { text: 'Tylko do kwoty 1 000 zł miesięcznie', isCorrect: false },
          { text: 'Tylko jeśli reklama przyniosła przychód', isCorrect: false },
        ],
        explanation: 'Reklama (Google Ads, social media, materiały marketingowe) jest w całości kosztem uzyskania przychodu. To odróżnia ją od reprezentacji.',
        sortOrder: 1,
      },
      {
        question: 'Czy alkohol zakupiony na spotkanie biznesowe może być kosztem?',
        answers: [
          { text: 'Nie — alkohol jest wyraźnie wyłączony z kosztów przepisami', isCorrect: true },
          { text: 'Tak, jeśli spotkanie miało cel biznesowy', isCorrect: false },
          { text: 'Tak, jeśli kwota nie przekracza 100 zł', isCorrect: false },
          { text: 'Zależy od formy opodatkowania', isCorrect: false },
        ],
        explanation: 'Alkohol jest wyraźnie wyłączony z kosztów uzyskania przychodu niezależnie od kontekstu. Nawet na firmowym spotkaniu nie możesz go odliczyć.',
        sortOrder: 2,
      },
      {
        question: 'Co odróżnia reklamę (koszt) od reprezentacji (nie koszt)?',
        answers: [
          { text: 'Reklama kierowana jest do szerokiego grona, reprezentacja do wybranych partnerów', isCorrect: true },
          { text: 'Reklama jest online, reprezentacja offline', isCorrect: false },
          { text: 'Reklama kosztuje poniżej 1 000 zł, reprezentacja powyżej', isCorrect: false },
          { text: 'Nie ma różnicy — oba są kosztem', isCorrect: false },
        ],
        explanation: 'Reklama to promocja kierowana do szerokiego grona potencjalnych klientów. Reprezentacja to budowanie wizerunku wobec konkretnych, wybranych partnerów — i to właśnie nie jest kosztem.',
        sortOrder: 3,
      },
    ],
  },
];

async function main() {
  console.log('Seeding education content...');

  for (const cat of CATEGORIES) {
    await prisma.educationCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, sortOrder: cat.sortOrder },
      create: cat,
    });
  }
  console.log(`Upserted ${CATEGORIES.length} categories`);

  for (const lesson of LESSONS) {
    const category = await prisma.educationCategory.findUnique({
      where: { slug: lesson.categorySlug },
    });
    if (!category) {
      console.warn(`Category not found: ${lesson.categorySlug}`);
      continue;
    }

    const { quizQuestions, categorySlug, ...lessonData } = lesson;

    const upserted = await prisma.educationLesson.upsert({
      where: { slug: lessonData.slug },
      update: { ...lessonData, categoryId: category.id, publishedAt: lessonData.publishedAt },
      create: { ...lessonData, categoryId: category.id },
    });

    await prisma.quizQuestion.deleteMany({ where: { lessonId: upserted.id } });
    await prisma.quizQuestion.createMany({
      data: quizQuestions.map((q) => ({
        lessonId: upserted.id,
        question: q.question,
        answers: q.answers,
        explanation: q.explanation,
        sortOrder: q.sortOrder,
      })),
    });
  }

  console.log(`Seeded ${LESSONS.length} lessons with quiz questions`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
