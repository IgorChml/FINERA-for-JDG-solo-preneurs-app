import Anthropic from '@anthropic-ai/sdk';
import type { FastifyInstance } from 'fastify';
import { env } from '../config.js';

const SYSTEM_PROMPT = `Jesteś polskim doradcą podatkowym specjalizującym się w Jednoosobowych Działalnościach Gospodarczych (JDG).

ZASADY BEZWZGLĘDNE:
1. Odpowiadaj WYŁĄCZNIE na pytania dotyczące polskiego prawa podatkowego, ZUS, VAT, PIT i kosztów firmowych
2. Zawsze podawaj podstawę prawną (artykuł ustawy) jako przypis
3. Używaj języka korzyści, nie żargonu — "możesz odliczyć" zamiast "masz prawo do odliczenia"
4. NIGDY nie halucynuj przepisów — jeśli nie jesteś pewien, przyznaj to
5. Gdy temat jest złożony lub przepisy są niejasne — rekomenduj konsultację z księgowym
6. Zawsze dodaj na końcu: "⚠️ To informacja edukacyjna, nie porada podatkowa."

FORMAT ODPOWIEDZI:
- Krótka odpowiedź (2-4 zdania) — bezpośrednio odpowiadająca na pytanie
- Praktyczna wskazówka jeśli dotyczy
- Podstawa prawna w przypisie: 📎 [Podstawa: Art. X Ustawy o PIT/VAT]

Jeśli pytanie nie dotyczy podatków, ZUS ani działalności gospodarczej — grzecznie odmów.`;

export class TaxChatService {
  private client: Anthropic | null = null;

  constructor(private readonly fastify: FastifyInstance) {
    if (env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    }
  }

  async chat(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    profile?: { taxForm: string; isVatPayer: boolean } | null
  ): Promise<{ answer: string; sources: string[]; confidence: number }> {
    if (!this.client) {
      return {
        answer:
          'Usługa AI jest tymczasowo niedostępna. Skonsultuj pytanie z księgowym lub zadzwoń na infolinię KAS: 801 055 055.',
        sources: [],
        confidence: 0,
      };
    }

    const userContext = profile
      ? `\n\nKontekst użytkownika: forma opodatkowania = ${profile.taxForm}, płatnik VAT = ${profile.isVatPayer}`
      : '';

    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-8).map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      {
        role: 'user' as const,
        content: message + (history.length === 0 ? userContext : ''),
      },
    ];

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      });

      const answer = response.content[0].type === 'text' ? response.content[0].text : '';

      // Extract legal sources from response
      const sourceMatches = answer.match(/📎\s*\[([^\]]+)\]/g) ?? [];
      const sources = sourceMatches.map((s) => s.replace(/📎\s*\[/, '').replace(']', ''));

      // Estimate confidence based on response patterns
      const lowConfidenceIndicators = [
        'skonsultuj',
        'trudno jednoznacznie',
        'zależy od',
        'nie jest pewne',
        'może być różnie',
      ];
      const hasLowConfidence = lowConfidenceIndicators.some((i) =>
        answer.toLowerCase().includes(i)
      );

      return {
        answer,
        sources,
        confidence: hasLowConfidence ? 0.6 : 0.85,
      };
    } catch (error) {
      this.fastify.log.error({ error }, 'Chat AI error — using fallback');
      return {
        answer:
          'Przepraszam, wystąpił błąd systemu. Spróbuj ponownie za chwilę.\n\nW nagłych przypadkach zadzwoń na infolinię KAS: 801 055 055.',
        sources: [],
        confidence: 0,
      };
    }
  }
}
