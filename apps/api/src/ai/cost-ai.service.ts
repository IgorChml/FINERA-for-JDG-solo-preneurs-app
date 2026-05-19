import Anthropic from '@anthropic-ai/sdk';
import type { FastifyInstance } from 'fastify';
import { env } from '../config.js';
import type { OcrResult, AiAuditResult, TaxForm } from '@finera/shared';

const OCR_PROMPT = `Przeanalizuj ten paragon/fakturę i wyciągnij dane w formacie JSON.
Zwróć wyłącznie JSON bez żadnego innego tekstu:
{
  "vendor": "nazwa sprzedawcy",
  "vendorNip": "NIP sprzedawcy (10 cyfr) lub null",
  "amount": kwota brutto jako liczba,
  "vatAmount": kwota VAT jako liczba lub null,
  "date": "data w formacie YYYY-MM-DD lub null",
  "category": jedna z: OFFICE|TRANSPORT|MARKETING|SOFTWARE|HARDWARE|PROFESSIONAL_SERVICES|PHONE_INTERNET|FOOD_BUSINESS|TRAINING|INSURANCE|OTHER,
  "confidence": pewność ekstrakcji 0-1
}`;

function buildAuditPrompt(vendor: string, category: string, taxForm: string): string {
  return `Jesteś polskim doradcą podatkowym dla solopreneur'ów. Oceń ryzyko podatkowe kosztu:

Sprzedawca: ${vendor}
Kategoria: ${category}
Forma opodatkowania: ${taxForm}

Oceń czy ten koszt jest:
1. Kosztem firmowym odliczalnym od podatku
2. Ryzyko: GREEN (wyraźny koszt firmowy), YELLOW (może budzić wątpliwości), RED (prawdopodobnie nie jest kosztem firmowym)

Odpowiedz WYŁĄCZNIE w formacie JSON:
{
  "riskLevel": "GREEN|YELLOW|RED",
  "reason": "krótkie uzasadnienie po polsku (max 100 słów)",
  "legalBasis": "podstawa prawna (np. Art. 22 ust. 1 Ustawy o PIT)",
  "recommendation": "rekomendacja dla podatnika (max 50 słów)"
}

WAŻNE: Odpowiadaj z wiedzy o polskim prawie podatkowym. Jeśli nie masz pewności — użyj YELLOW.
NIE halucynuj przepisów. Jeśli podstawa prawna jest nieznana, napisz "Ustawa o PIT Art. 22 ust. 1".`;
}

export class CostAiService {
  private client: Anthropic | null = null;

  constructor(private readonly fastify: FastifyInstance) {
    if (env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    }
  }

  async scanAndAudit(
    imageBase64: string,
    imageType: string,
    taxForm: TaxForm
  ): Promise<{ ocr: OcrResult; audit: AiAuditResult }> {
    if (!this.client) {
      // Fallback when API unavailable — return safe defaults
      return {
        ocr: { confidence: 0 },
        audit: {
          riskLevel: 'YELLOW',
          reason: 'AI niedostępne — oceń koszt ręcznie',
          legalBasis: 'Art. 22 ust. 1 Ustawy o PIT',
          recommendation: 'Skonsultuj z księgowym.',
        },
      };
    }

    try {
      // Step 1: OCR
      const ocrResponse = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: `image/${imageType}` as 'image/jpeg' | 'image/png' | 'image/webp',
                  data: imageBase64,
                },
              },
              { type: 'text', text: OCR_PROMPT },
            ],
          },
        ],
      });

      const ocrText = ocrResponse.content[0].type === 'text' ? ocrResponse.content[0].text : '{}';
      let ocr: OcrResult = { confidence: 0 };

      try {
        const parsed = JSON.parse(ocrText);
        ocr = {
          vendor: parsed.vendor,
          vendorNip: parsed.vendorNip,
          amount: parsed.amount,
          vatAmount: parsed.vatAmount,
          date: parsed.date ? new Date(parsed.date) : undefined,
          category: parsed.category,
          confidence: parsed.confidence ?? 0.8,
        };
      } catch {
        this.fastify.log.warn('OCR JSON parse failed');
      }

      // Step 2: AI Audit
      const auditResponse = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system:
          'Jesteś polskim ekspertem podatkowym. Odpowiadaj TYLKO w formacie JSON. NIE halucynuj przepisów.',
        messages: [
          {
            role: 'user',
            content: buildAuditPrompt(
              ocr.vendor ?? 'Nieznany sprzedawca',
              ocr.category ?? 'OTHER',
              taxForm
            ),
          },
        ],
      });

      const auditText =
        auditResponse.content[0].type === 'text' ? auditResponse.content[0].text : '{}';

      let audit: AiAuditResult = {
        riskLevel: 'YELLOW',
        reason: 'Brak oceny AI',
        legalBasis: 'Art. 22 ust. 1 Ustawy o PIT',
        recommendation: 'Skonsultuj z księgowym.',
      };

      try {
        const parsed = JSON.parse(auditText);
        audit = {
          riskLevel: parsed.riskLevel ?? 'YELLOW',
          reason: parsed.reason ?? '',
          legalBasis: parsed.legalBasis ?? 'Art. 22 ust. 1 Ustawy o PIT',
          recommendation: parsed.recommendation ?? '',
        };
      } catch {
        this.fastify.log.warn('Audit JSON parse failed');
      }

      return { ocr, audit };
    } catch (error) {
      this.fastify.log.error({ error }, 'AI service error — using fallback');
      // Graceful degradation — app must not crash
      return {
        ocr: { confidence: 0 },
        audit: {
          riskLevel: 'YELLOW',
          reason: 'Usługa AI tymczasowo niedostępna. Oceń koszt ręcznie.',
          legalBasis: 'Art. 22 ust. 1 Ustawy o PIT',
          recommendation: 'Skonsultuj z księgowym.',
        },
      };
    }
  }
}
